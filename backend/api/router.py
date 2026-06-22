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
    # Mock results
    return {
        "job_id": job_id,
        "status": "COMPLETED",
        "total_marks_awarded": 18,
        "percentage": 90,
        "questions": [
            {
                "question_id": "Q1",
                "marks_awarded": 5,
                "total_marks": 5,
                "reasoning": "Excellent explanation with valid examples.",
                "missing_concepts": []
            }
        ]
    }
