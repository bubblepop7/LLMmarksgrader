from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from typing import List
import uuid
import base64
import asyncio
from api.db import supabase
from services.evaluator import EvaluationPipeline

api_router = APIRouter()

async def process_evaluation(
    job_id: str,
    marking_scheme_bytes: bytes,
    marking_scheme_name: str,
    answer_sheets_data: List[tuple]
):
    pipeline = EvaluationPipeline()
    try:
        # Update job status to PROCESSING
        supabase.table("evaluation_jobs").update({"status": "PROCESSING"}).eq("id", job_id).execute()

        # Step 1: Transcribe Marking Scheme using Llama-4 Vision if PDF/image
        if marking_scheme_name.lower().endswith(".pdf"):
            ms_transcriptions = await pipeline.extract_from_pdf_bytes(marking_scheme_bytes)
            ms_text = "\n".join(ms_transcriptions)
        else:
            b64_str = base64.b64encode(marking_scheme_bytes).decode("utf-8")
            ms_text = await pipeline.extract_handwriting(b64_str) or ""

        # Insert marking scheme document
        supabase.table("documents").insert({
            "job_id": job_id,
            "type": "MARKING_SCHEME",
            "file_url": marking_scheme_name,
            "ocr_confidence": 95.0
        }).execute()

        # Step 2: Parse marking scheme into structured questions/criteria
        questions = await pipeline.parse_marking_scheme(ms_text)
        if not questions:
            raise ValueError("Could not parse any questions or criteria from marking scheme.")

        question_ids = []
        rubric_criteria_db_list = {}  # question_id -> list of criteria dicts

        for q in questions:
            q_id = q.get("question_id", "Q1")
            question_ids.append(q_id)
            total_marks = q.get("total_marks", 0.0)

            # Insert rubric record
            rubric_res = supabase.table("rubrics").insert({
                "job_id": job_id,
                "question_id": q_id,
                "total_marks": total_marks
            }).execute()

            if rubric_res.data:
                rubric_db_id = rubric_res.data[0]["id"]
                rubric_criteria_db_list[q_id] = []
                
                # Insert criteria records
                for c in q.get("criteria", []):
                    c_name = c.get("name", "")
                    max_marks = c.get("max_marks", 0.0)
                    desc = c.get("description", "")

                    c_res = supabase.table("rubric_criteria").insert({
                        "rubric_id": rubric_db_id,
                        "name": c_name,
                        "max_marks": max_marks,
                        "description": desc
                    }).execute()

                    if c_res.data:
                        c_db_id = c_res.data[0]["id"]
                        rubric_criteria_db_list[q_id].append({
                            "id": c_db_id,
                            "name": c_name,
                            "max_marks": max_marks,
                            "description": desc
                        })

        # Step 3: Transcribe student answer sheets and segment them
        student_answers_text_list = []
        for filename, file_bytes in answer_sheets_data:
            if filename.lower().endswith(".pdf"):
                ans_transcriptions = await pipeline.extract_from_pdf_bytes(file_bytes)
                ans_text = "\n".join(ans_transcriptions)
            else:
                b64_str = base64.b64encode(file_bytes).decode("utf-8")
                ans_text = await pipeline.extract_handwriting(b64_str) or ""

            student_answers_text_list.append(ans_text)

            # Insert answer sheet document
            supabase.table("documents").insert({
                "job_id": job_id,
                "type": "ANSWER_SHEET",
                "file_url": filename,
                "ocr_confidence": 92.0
            }).execute()

        combined_student_text = "\n".join(student_answers_text_list)
        segmented_answers = await pipeline.segment_student_answers(combined_student_text, question_ids)

        # Step 4: Evaluate each student answer against rubric criteria
        total_job_marks = 0.0
        job_needs_review = False

        for q_id in question_ids:
            student_ans = segmented_answers.get(q_id, "")
            matched_q = next((q for q in questions if q.get("question_id") == q_id), None)
            ref_ans = matched_q.get("reference_answer", "") if matched_q else ""
            r_criteria = rubric_criteria_db_list.get(q_id, [])

            eval_res = await pipeline.evaluate_answer(q_id, student_ans, ref_ans, r_criteria)

            # Prepend student answer to the evaluation reasoning for visibility in the UI
            formatted_reasoning = f"Student Answer: {student_ans}\n\nReasoning: {eval_res['reasoning']}"

            # Insert evaluation result
            res_insert = supabase.table("evaluation_results").insert({
                "job_id": job_id,
                "question_id": q_id,
                "marks_awarded": eval_res["marks_awarded"],
                "evaluation_confidence": eval_res["evaluation_confidence"] * 100.0,
                "reasoning": formatted_reasoning,
                "missing_concepts": eval_res["missing_concepts"],
                "status": eval_res["status"]
            }).execute()

            if res_insert.data:
                eval_res_db_id = res_insert.data[0]["id"]

                # Insert criteria scores
                for score in eval_res["criteria_scores"]:
                    supabase.table("criterion_scores").insert({
                        "evaluation_result_id": eval_res_db_id,
                        "criterion_id": score["criterion_id"],
                        "awarded_marks": score["awarded_marks"],
                        "reasoning": score["reasoning"]
                    }).execute()

            total_job_marks += float(eval_res["marks_awarded"])
            if eval_res["status"] == "NEEDS_REVIEW":
                job_needs_review = True

        # Update final job status & total marks
        final_status = "NEEDS_REVIEW" if job_needs_review else "COMPLETED"
        supabase.table("evaluation_jobs").update({
            "status": final_status,
            "total_marks_awarded": total_job_marks
        }).eq("id", job_id).execute()

    except Exception as e:
        print(f"[Error in process_evaluation] {e}")
        import traceback
        traceback.print_exc()
        # Set job status to FAILED
        supabase.table("evaluation_jobs").update({"status": "FAILED"}).eq("id", job_id).execute()


@api_router.post("/evaluate")
async def evaluate_submission(
    background_tasks: BackgroundTasks,
    answer_sheets: List[UploadFile] = File(...),
    marking_scheme: UploadFile = File(...)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection is not configured.")

    job_id = str(uuid.uuid4())

    # Create job in database
    supabase.table("evaluation_jobs").insert({
        "id": job_id,
        "status": "PENDING",
        "total_marks_awarded": 0.0
    }).execute()

    # Read file contents in-memory
    marking_scheme_bytes = await marking_scheme.read()
    marking_scheme_name = marking_scheme.filename

    answer_sheets_data = []
    for sheet in answer_sheets:
        content = await sheet.read()
        answer_sheets_data.append((sheet.filename, content))

    # Add background processing task
    background_tasks.add_task(
        process_evaluation,
        job_id,
        marking_scheme_bytes,
        marking_scheme_name,
        answer_sheets_data
    )

    return {"job_id": job_id, "status": "PENDING"}


@api_router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection is not configured.")

    res = supabase.table("evaluation_jobs").select("status").eq("id", job_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {"job_id": job_id, "status": res.data[0]["status"]}


@api_router.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection is not configured.")

    # 1. Fetch Job details
    job_res = supabase.table("evaluation_jobs").select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = job_res.data[0]

    # 2. Fetch Rubrics
    rubrics_res = supabase.table("rubrics").select("*").eq("job_id", job_id).execute()
    rubric_ids = [r["id"] for r in rubrics_res.data]

    # 3. Fetch Rubric Criteria
    criteria_res = []
    if rubric_ids:
        c_res = supabase.table("rubric_criteria").select("*").in_("rubric_id", rubric_ids).execute()
        criteria_res = c_res.data

    # 4. Fetch Evaluation Results
    results_res = supabase.table("evaluation_results").select("*").eq("job_id", job_id).execute()
    result_ids = [r["id"] for r in results_res.data]

    # 5. Fetch Criterion Scores
    scores_res = []
    if result_ids:
        s_res = supabase.table("criterion_scores").select("*").in_("evaluation_result_id", result_ids).execute()
        scores_res = s_res.data

    # 6. Fetch Documents to compute average OCR confidence
    docs_res = supabase.table("documents").select("*").eq("job_id", job_id).execute()
    ocr_confidences = [float(d["ocr_confidence"]) for d in docs_res.data if d["ocr_confidence"] is not None]
    avg_ocr_confidence = sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else 95.0

    # Build response structure
    questions_list = []
    total_max_marks = 0.0

    for res_item in results_res.data:
        q_id = res_item["question_id"]
        res_id = res_item["id"]

        # Find matching rubric
        rubric = next((r for r in rubrics_res.data if r["question_id"] == q_id), None)
        rubric_total_marks = float(rubric["total_marks"]) if rubric else 0.0
        total_max_marks += rubric_total_marks

        # Filter criteria for this rubric
        r_criteria = []
        if rubric:
            r_criteria = [c for c in criteria_res if c["rubric_id"] == rubric["id"]]

        # Build criteria score objects
        criteria_scores_list = []
        for crit in r_criteria:
            score = next((s for s in scores_res if s["evaluation_result_id"] == res_id and s["criterion_id"] == crit["id"]), None)
            criteria_scores_list.append({
                "id": crit["id"],
                "name": crit["name"],
                "max_marks": float(crit["max_marks"]),
                "awarded_marks": float(score["awarded_marks"]) if score else 0.0,
                "reasoning": score["reasoning"] if score else "Auto-graded."
            })

        similarity = float(res_item["evaluation_confidence"]) / 100.0 if res_item["evaluation_confidence"] else 1.0

        questions_list.append({
            "question_id": q_id,
            "status": res_item["status"],
            "marks_awarded": float(res_item["marks_awarded"]),
            "total_marks": rubric_total_marks,
            "ocr_confidence": int(avg_ocr_confidence),
            "similarity_score": similarity,
            "reasoning": res_item["reasoning"],
            "missing_concepts": res_item["missing_concepts"] or [],
            "criteria": criteria_scores_list
        })

    # Sort questions by question_id (e.g. Q1, Q2)
    questions_list.sort(key=lambda x: x["question_id"])

    percentage = int((float(job["total_marks_awarded"]) / total_max_marks * 100)) if total_max_marks > 0 else 0

    return {
        "job_id": job_id,
        "status": job["status"],
        "total_marks_awarded": float(job["total_marks_awarded"]),
        "percentage": percentage,
        "questions": questions_list
    }


@api_router.post("/jobs/{job_id}/results/override")
async def override_job_results(job_id: str, overrides: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection is not configured.")

    q_id = overrides.get("question_id")
    new_data = overrides.get("new_data", {})

    if not q_id or not new_data:
        raise HTTPException(status_code=400, detail="Missing question_id or new_data in overrides.")

    # 1. Fetch evaluation result for this question
    res_query = supabase.table("evaluation_results").select("id").eq("job_id", job_id).eq("question_id", q_id).execute()
    if not res_query.data:
        raise HTTPException(status_code=404, detail="Evaluation result not found for this question.")
    res_id = res_query.data[0]["id"]

    # 2. Iterate and update criteria scores
    for crit in new_data.get("criteria", []):
        crit_id = crit.get("id")
        awarded = float(crit.get("awarded_marks", 0.0))

        # Check if score exists in DB
        score_check = supabase.table("criterion_scores").select("id").eq("evaluation_result_id", res_id).eq("criterion_id", crit_id).execute()
        if score_check.data:
            # Update score
            supabase.table("criterion_scores").update({
                "awarded_marks": awarded,
                "reasoning": crit.get("reasoning", "Manual override updated by reviewer.")
            }).eq("id", score_check.data[0]["id"]).execute()
        else:
            # Insert score
            supabase.table("criterion_scores").insert({
                "evaluation_result_id": res_id,
                "criterion_id": crit_id,
                "awarded_marks": awarded,
                "reasoning": crit.get("reasoning", "Manual override created by reviewer.")
            }).execute()

    # 3. Update evaluation result status and total marks
    new_q_marks = sum(float(c.get("awarded_marks", 0.0)) for c in new_data.get("criteria", []))
    supabase.table("evaluation_results").update({
        "marks_awarded": new_q_marks,
        "status": "AUTO_GRADED"  # Mark as reviewed
    }).eq("id", res_id).execute()

    # 4. Recalculate and update total job marks and status
    all_res = supabase.table("evaluation_results").select("marks_awarded, status").eq("job_id", job_id).execute()
    total_job_marks = sum(float(r["marks_awarded"]) for r in all_res.data)
    any_needs_review = any(r["status"] == "NEEDS_REVIEW" for r in all_res.data)
    new_job_status = "NEEDS_REVIEW" if any_needs_review else "COMPLETED"

    supabase.table("evaluation_jobs").update({
        "total_marks_awarded": total_job_marks,
        "status": new_job_status
    }).eq("id", job_id).execute()

    return {
        "status": "success",
        "message": f"Overrides saved successfully for job {job_id}.",
        "updated_status": new_job_status
    }
