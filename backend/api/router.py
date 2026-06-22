from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from typing import List

api_router = APIRouter()

@api_router.post("/evaluate")
async def evaluate_submission(
    background_tasks: BackgroundTasks,
    answer_sheets: List[UploadFile] = File(...),
    marking_scheme: UploadFile = File(...)
):
    # Dummy job ID generation for now
    import uuid
    job_id = str(uuid.uuid4())
    
    # In a real scenario, save files to Supabase Storage
    # and enqueue a Celery task or background task
    
    return {"job_id": job_id, "status": "PENDING"}

@api_router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    # Mock status
    return {"job_id": job_id, "status": "PROCESSING"}

@api_router.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    # Mock results matching relational response architecture
    return {
        "job_id": job_id,
        "status": "NEEDS_REVIEW",
        "total_marks_awarded": 7.5,
        "percentage": 50,
        "questions": [
            {
                "question_id": "Q1",
                "status": "AUTO_GRADED",
                "marks_awarded": 5,
                "total_marks": 5,
                "ocr_confidence": 96,
                "similarity_score": 0.84,
                "reasoning": "The student correctly defined photosynthesis and detailed the light-dependent and light-independent stages.",
                "missing_concepts": [],
                "criteria": [
                    { "id": "c1", "name": "Definition & Equation", "max_marks": 2, "awarded_marks": 2, "reasoning": "Fully correct." },
                    { "id": "c2", "name": "Light-Dependent Stages", "max_marks": 2, "awarded_marks": 2, "reasoning": "Complete." },
                    { "id": "c3", "name": "Examples", "max_marks": 1, "awarded_marks": 1, "reasoning": "Valid autotroph." }
                ]
            },
            {
                "question_id": "Q2",
                "status": "NEEDS_REVIEW",
                "marks_awarded": 2.5,
                "total_marks": 5,
                "ocr_confidence": 72,
                "similarity_score": 0.41,
                "reasoning": "Low similarity score detected. Transcription indicates formatting issues.",
                "missing_concepts": ["Electron transport chain details"],
                "criteria": [
                    { "id": "c4", "name": "Definition", "max_marks": 2, "awarded_marks": 1.5, "reasoning": "Partially correct." },
                    { "id": "c5", "name": "Formula & Location", "max_marks": 2, "awarded_marks": 1, "reasoning": "Contains minor symbol errors." },
                    { "id": "c6", "name": "ATP Yield", "max_marks": 1, "awarded_marks": 0, "reasoning": "Missing calculation." }
                ]
            }
        ]
    }

@api_router.post("/jobs/{job_id}/results/override")
async def override_job_results(job_id: str, overrides: dict):
    # Simulated override update logic
    # In a production app, this would write new values to the relational tables (CriterionScore)
    # and update the EvaluationJob status to 'COMPLETED'
    return {
        "status": "success",
        "message": f"Overrides saved successfully for job {job_id}.",
        "updated_status": "COMPLETED"
    }

