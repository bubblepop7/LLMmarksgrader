-- SQL schema for AI-Assisted Answer Sheet Evaluation System

CREATE TYPE job_status AS ENUM ('PENDING', 'PROCESSING', 'NEEDS_REVIEW', 'COMPLETED', 'FAILED');
CREATE TYPE doc_type AS ENUM ('ANSWER_SHEET', 'MARKING_SCHEME');
CREATE TYPE eval_status AS ENUM ('AUTO_GRADED', 'NEEDS_REVIEW');

-- Evaluation Job Table
CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status job_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_marks_awarded DECIMAL(5,2) DEFAULT 0.0
);

-- Uploaded Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES evaluation_jobs(id) ON DELETE CASCADE,
    type doc_type NOT NULL,
    file_url TEXT NOT NULL,
    ocr_confidence DECIMAL(5,2) DEFAULT 100.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rubric Table (Per Question)
CREATE TABLE IF NOT EXISTS rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES evaluation_jobs(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL, -- e.g., 'Q1'
    total_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, question_id)
);

-- Rubric Criterion Table
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Definition', 'Example'
    max_marks DECIMAL(5,2) NOT NULL,
    description TEXT
);

-- Question-wise Evaluation Results
CREATE TABLE IF NOT EXISTS evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES evaluation_jobs(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    marks_awarded DECIMAL(5,2) DEFAULT 0.0,
    evaluation_confidence DECIMAL(5,2) DEFAULT 100.0,
    reasoning TEXT,
    missing_concepts TEXT[],
    status eval_status NOT NULL DEFAULT 'AUTO_GRADED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, question_id)
);

-- Criterion Scores
CREATE TABLE IF NOT EXISTS criterion_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_result_id UUID REFERENCES evaluation_results(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    awarded_marks DECIMAL(5,2) NOT NULL,
    reasoning TEXT
);
