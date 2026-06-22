from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class DocType(str, Enum):
    ANSWER_SHEET = "ANSWER_SHEET"
    MARKING_SCHEME = "MARKING_SCHEME"

class EvalStatus(str, Enum):
    AUTO_GRADED = "AUTO_GRADED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

# ----------------- DB Models -----------------

class EvaluationJobBase(BaseModel):
    status: JobStatus = JobStatus.PENDING
    total_marks_awarded: Decimal = Decimal("0.0")

class EvaluationJobCreate(EvaluationJobBase):
    pass

class EvaluationJob(EvaluationJobBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    job_id: UUID
    type: DocType
    file_url: str
    ocr_confidence: Decimal = Decimal("100.0")

class Document(DocumentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RubricCriterionBase(BaseModel):
    name: str
    max_marks: Decimal
    description: Optional[str] = None

class RubricCriterion(RubricCriterionBase):
    id: UUID
    rubric_id: UUID

    class Config:
        from_attributes = True

class RubricBase(BaseModel):
    job_id: UUID
    question_id: str
    total_marks: Decimal

class Rubric(RubricBase):
    id: UUID
    criteria: List[RubricCriterion] = []

    class Config:
        from_attributes = True

# ----------------- Structured LLM Responses -----------------

class LLMCriterionScore(BaseModel):
    criterion_name: str = Field(..., description="Name of the criterion from the rubric")
    awarded_marks: float = Field(..., description="Marks awarded for this criterion")
    reasoning: str = Field(..., description="Justification for the score awarded")

class LLMGradingResponse(BaseModel):
    question_id: str = Field(..., description="The ID of the question being evaluated, e.g. Q1")
    evaluation_confidence: float = Field(..., description="Confidence score from 0.0 to 1.0 of the evaluation")
    criteria_scores: List[LLMCriterionScore] = Field(..., description="Scores for individual rubric criteria")
    reasoning: str = Field(..., description="Overall summary of evaluation reasoning")
    missing_concepts: List[str] = Field(..., description="List of missing concepts or mistakes identified")
