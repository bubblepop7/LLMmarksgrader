'use client';

import { useState, useEffect } from 'react';
import { evaluateSubmission, getJobStatus, getJobResults, overrideJobResults } from '@/services/api';
import UploadSection from '@/components/UploadSection';
import EvaluationDetail from '@/components/EvaluationDetail';
import { AlertTriangle, Clock } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'evaluating' | 'dashboard'>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null);

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  
  const [savingOverride, setSavingOverride] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // 1. Handle Upload to API
  const handleUpload = async (sheets: FileList | null, scheme: File | null) => {
    try {
      setIsLoading(true);
      const data = await evaluateSubmission(sheets, scheme);
      setJobId(data.job_id);
      setStep('evaluating');
      // Start polling
      const interval = setInterval(async () => {
        const statusData = await getJobStatus(data.job_id);
        if (statusData.status === 'NEEDS_REVIEW' || statusData.status === 'COMPLETED') {
          clearInterval(interval);
          const results = await getJobResults(data.job_id);
          setEvaluationData(results);
          if (results.questions && results.questions.length > 0) {
            setSelectedQuestion(results.questions[0].question_id);
          }
          setStep('dashboard');
        }
      }, 3000);
      setPollIntervalId(interval);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to start evaluation. Check console or ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  // 2. Local Mark Change
  const handleCriterionMarkChange = (qId: string, criterionId: string, newMark: number) => {
    if (!evaluationData) return;
    
    const updatedQuestions = evaluationData.questions.map((q: any) => {
      if (q.question_id === qId) {
        const updatedCriteria = q.criteria.map((c: any) => 
          c.id === criterionId ? { ...c, awarded_marks: newMark } : c
        );
        const newTotal = updatedCriteria.reduce((sum: number, c: any) => sum + c.awarded_marks, 0);
        return { ...q, criteria: updatedCriteria, marks_awarded: newTotal };
      }
      return q;
    });

    // Re-calculate grand total
    const newGrandTotal = updatedQuestions.reduce((sum: number, q: any) => sum + q.marks_awarded, 0);
    const newPercentage = Math.round((newGrandTotal / (evaluationData.questions.reduce((s:number, q:any)=> s+q.total_marks, 0))) * 100);

    setEvaluationData({
      ...evaluationData,
      questions: updatedQuestions,
      total_marks_awarded: newGrandTotal,
      percentage: newPercentage
    });
  };

  // 3. Save override to backend
  const handleSaveOverride = async () => {
    if (!jobId || !evaluationData) return;
    setSavingOverride(true);
    try {
      const activeQ = evaluationData.questions.find((q: any) => q.question_id === selectedQuestion);
      await overrideJobResults(jobId, { question_id: selectedQuestion, new_data: activeQ });
      
      setEvaluationData((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) => 
          q.question_id === selectedQuestion ? { ...q, status: 'AUTO_GRADED' } : q
        )
      }));
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to save override', err);
      alert('Failed to save overrides.');
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="h-full">
      {step === 'upload' && (
        <UploadSection onUpload={handleUpload} isLoading={isLoading} />
      )}

      {step === 'evaluating' && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-surface-200 border-t-brand-500 rounded-full animate-spin"></div>
            <Clock className="absolute text-brand-400 animate-pulse" size={24} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-surface-900">Evaluating Submission</h3>
            <p className="text-sm text-surface-500 max-w-sm mx-auto">
              Extracting handwriting, computing semantic similarity, and verifying rubric criteria using the backend pipeline...
            </p>
          </div>
        </div>
      )}

      {step === 'dashboard' && evaluationData && (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Internal Dashboard Sidebar / Question List */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="card-shadow p-6 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-bold text-surface-900 text-sm">Exam: Final Unit 6</h3>
                <p className="text-xs text-surface-500">Student: Christine Brown</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-600">{evaluationData.total_marks_awarded}</span>
                <span className="text-sm font-semibold text-surface-400"> / {evaluationData.questions.reduce((s:number, q:any)=> s+q.total_marks, 0)}</span>
                <p className="text-[10px] text-surface-400 uppercase tracking-widest font-bold mt-1">
                  {evaluationData.percentage}% SCORE
                </p>
              </div>
            </div>

            <div className="card-shadow p-4 flex flex-col gap-3 h-[calc(100vh-200px)] overflow-y-auto">
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1 px-1">Questions Breakdown</div>
              {evaluationData.questions.map((q: any) => {
                const isSelected = q.question_id === selectedQuestion;
                const isReview = q.status === 'NEEDS_REVIEW';
                
                return (
                  <button
                    key={q.question_id}
                    onClick={() => setSelectedQuestion(q.question_id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'bg-brand-50 border-brand-200 shadow-sm' 
                        : 'bg-white border-surface-200 hover:border-brand-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isSelected ? 'text-brand-900' : 'text-surface-800'}`}>
                          {q.question_id}
                        </span>
                        {isReview && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 font-bold">
                            <AlertTriangle size={8} /> Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-surface-500 font-medium">Confidence: {q.evaluation_confidence || q.ocr_confidence}%</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isSelected ? 'text-brand-600' : 'text-surface-700'}`}>
                        {q.marks_awarded}
                      </span>
                      <span className="text-xs text-surface-400 font-medium">/{q.total_marks}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Detail Panel */}
          <div className="flex-1 min-h-0">
            {selectedQuestion && (
              <EvaluationDetail
                activeQ={evaluationData.questions.find((q: any) => q.question_id === selectedQuestion)}
                onMarkChange={handleCriterionMarkChange}
                onSaveOverride={handleSaveOverride}
                savingOverride={savingOverride}
                successToast={successToast}
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
