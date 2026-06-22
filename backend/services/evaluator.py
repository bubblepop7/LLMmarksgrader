import os
from typing import List, Dict, Any, Optional
import httpx
from pydantic import ValidationError
from ..models.schema import LLMGradingResponse, EvalStatus

# Initialize local sentence-transformers (mocking loading if library not installed)
try:
    from sentence_transformers import SentenceTransformer, util
    SIMILARITY_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
except ImportError:
    SIMILARITY_MODEL = None
    print("[Warning] sentence-transformers not installed. Similarity calculations will use mock fallback.")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "mock_key")

class EvaluationPipeline:
    def __init__(self):
        self.model_name = "llama-3.3-70b-versatile"

    async def extract_handwriting(self, image_base64: str) -> Optional[str]:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.2-90b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Transcribe the handwritten text in this image accurately. Do not add any extra commentary, just return the text."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            "temperature": 0.1
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(GROQ_API_URL, json=payload, headers=headers, timeout=60.0)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    print(f"[Error] Groq Vision API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Exception] Error communicating with Groq Vision API: {e}")
        return None

    def compute_similarity(self, student_answer: str, reference_answer: str) -> float:
        """
        Compute cosine similarity using Sentence Transformers (all-MiniLM-L6-v2).
        Falls back to a basic token-overlap mock if the library isn't available.
        """
        if SIMILARITY_MODEL:
            emb1 = SIMILARITY_MODEL.encode(student_answer, convert_to_tensor=True)
            emb2 = SIMILARITY_MODEL.encode(reference_answer, convert_to_tensor=True)
            similarity = util.cos_sim(emb1, emb2).item()
            return float(similarity)
        
        # Simple fallback token-based Jaccard similarity if no library loaded
        w1 = set(student_answer.lower().split())
        w2 = set(reference_answer.lower().split())
        if not w1 or not w2:
            return 0.0
        return len(w1.intersection(w2)) / len(w1.union(w2))

    async def call_groq_structured(self, system_prompt: str, user_prompt: str) -> Optional[LLMGradingResponse]:
        """
        Call Groq API with structured JSON output requirements.
        """
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(GROQ_API_URL, json=payload, headers=headers, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    raw_content = data["choices"][0]["message"]["content"]
                    # Validate output using Pydantic
                    structured_response = LLMGradingResponse.model_validate_json(raw_content)
                    return structured_response
                else:
                    print(f"[Error] Groq API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[Exception] Error communicating with Groq or parsing JSON: {e}")
        
        return None

    async def evaluate_answer(
        self, 
        question_id: str,
        student_answer: str, 
        reference_answer: str, 
        rubric_criteria: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs the full multi-stage evaluation pipeline for a single question.
        """
        # Step 1: Compute Semantic Similarity
        similarity = self.compute_similarity(student_answer, reference_answer)
        
        result = {
            "question_id": question_id,
            "similarity_score": similarity,
            "status": EvalStatus.AUTO_GRADED,
            "marks_awarded": 0.0,
            "evaluation_confidence": similarity,
            "reasoning": "",
            "criteria_scores": [],
            "missing_concepts": []
        }

        # Step 2: Route based on Similarity Threshold
        if similarity < 0.25:
            # Low similarity: Auto-fail or mark as needs manual review
            result["status"] = EvalStatus.NEEDS_REVIEW
            result["reasoning"] = f"Answer similarity score ({similarity:.2f}) is below review threshold (0.25)."
            return result

        # Step 3: LLM Criterion-by-Criterion Evaluation
        rubric_str = "\n".join([
            f"- {c['name']} (Max {c['max_marks']} marks): {c.get('description', '')}"
            for c in rubric_criteria
        ])
        
        system_prompt = (
            "You are a rigorous, academic grading assistant. You must grade the student's answer based on the provided reference answer and rubric criteria.\n"
            "Format your response as a valid JSON object matching this structure:\n"
            "{\n"
            '  "question_id": "string",\n'
            '  "evaluation_confidence": float (0.0 to 1.0),\n'
            '  "criteria_scores": [\n'
            '    {"criterion_name": "string", "awarded_marks": float, "reasoning": "string"}\n'
            "  ],\n"
            '  "reasoning": "overall overview description",\n'
            '  "missing_concepts": ["concept1", "concept2"]\n'
            "}\n"
            "Only return the JSON object."
        )

        user_prompt = (
            f"Question ID: {question_id}\n"
            f"Reference Answer: {reference_answer}\n\n"
            f"Rubric Criteria:\n{rubric_str}\n\n"
            f"Student Answer:\n{student_answer}\n"
        )

        # Call Groq
        llm_response = await self.call_groq_structured(system_prompt, user_prompt)
        
        if not llm_response:
            # Fallback to Needs Review if LLM call or validation fails
            result["status"] = EvalStatus.NEEDS_REVIEW
            result["reasoning"] = "Groq evaluation failed or output validation failed. Flagged for human review."
            return result

        # Map response to output result
        result["evaluation_confidence"] = llm_response.evaluation_confidence
        result["reasoning"] = llm_response.reasoning
        result["missing_concepts"] = llm_response.missing_concepts
        
        total_awarded = 0.0
        for score in llm_response.criteria_scores:
            # Match score back to rubric criterion list
            matched_criterion = next((c for c in rubric_criteria if c["name"].lower() == score.criterion_name.lower()), None)
            if matched_criterion:
                max_m = float(matched_criterion["max_marks"])
                awarded = min(max(0.0, score.awarded_marks), max_m) # clamp marks to bounds
                total_awarded += awarded
                result["criteria_scores"].append({
                    "criterion_id": matched_criterion["id"],
                    "awarded_marks": awarded,
                    "reasoning": score.reasoning
                })
        
        result["marks_awarded"] = total_awarded
        
        # If LLM confidence is low, flag for review
        if llm_response.evaluation_confidence < 0.70:
            result["status"] = EvalStatus.NEEDS_REVIEW
            result["reasoning"] += " [Low LLM Confidence Flag]"
            
        return result
