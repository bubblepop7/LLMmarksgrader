'use client';

import { useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  Save, 
  Download, 
  Check, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface CriterionScore {
  id: string;
  name: string;
  max_marks: number;
  awarded_marks: number;
  reasoning: string;
}

interface QuestionEvaluation {
  question_id: string;
  status: 'AUTO_GRADED' | 'NEEDS_REVIEW';
  marks_awarded: number;
  total_marks: number;
  ocr_confidence: number;
  similarity_score: number;
  reasoning: string;
  missing_concepts: string[];
  criteria: CriterionScore[];
}

export default function Home() {
  const [step, setStep] = useState<'upload' | 'evaluating' | 'dashboard'>('upload');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('Q1');
  const [questions, setQuestions] = useState<QuestionEvaluation[]>([
    {
      question_id: 'Q1',
      status: 'AUTO_GRADED',
      marks_awarded: 5,
      total_marks: 5,
      ocr_confidence: 96,
      similarity_score: 0.84,
      reasoning: 'The student correctly defined photosynthesis and detailed the light-dependent and light-independent stages. Complete chemical formula matches the rubric.',
      missing_concepts: [],
      criteria: [
        { id: 'c1', name: 'Definition & Equation', max_marks: 2, awarded_marks: 2, reasoning: 'Equation is fully balanced and definition is accurate.' },
        { id: 'c2', name: 'Light-Dependent Stages', max_marks: 2, awarded_marks: 2, reasoning: 'Explicitly mentions chloroplast thylakoids and ATP synthesis.' },
        { id: 'c3', name: 'Examples', max_marks: 1, awarded_marks: 1, reasoning: 'Valid examples of autotrophs supplied.' }
      ]
    },
    {
      question_id: 'Q2',
      status: 'NEEDS_REVIEW',
      marks_awarded: 2.5,
      total_marks: 5,
      ocr_confidence: 72,
      similarity_score: 0.41,
      reasoning: 'Low similarity score (0.41) matched. Handwritten text indicates structural issues. Clarification needed on Cellular Respiration definition.',
      missing_concepts: ['Electron transport chain details', 'Krebs cycle ATP yield'],
      criteria: [
        { id: 'c4', name: 'Definition', max_marks: 2, awarded_marks: 1.5, reasoning: 'Definition is partially incomplete but correct in essence.' },
        { id: 'c5', name: 'Formula & Location', max_marks: 2, awarded_marks: 1, reasoning: 'Formula contains minor chemical symbol errors.' },
        { id: 'c6', name: 'ATP Yield', max_marks: 1, awarded_marks: 0, reasoning: 'Missing detailed ATP calculation.' }
      ]
    },
    {
      question_id: 'Q3',
      status: 'NEEDS_REVIEW',
      marks_awarded: 0,
      total_marks: 5,
      ocr_confidence: 90,
      similarity_score: 0.12,
      reasoning: 'Question label missing or answer similarity score is extremely low (0.12). The student appears to have answered a different question or left it blank.',
      missing_concepts: ['Entire mechanism of cell division'],
      criteria: [
        { id: 'c7', name: 'Mitosis Steps', max_marks: 2, awarded_marks: 0, reasoning: 'No stages mentioned.' },
        { id: 'c8', name: 'Interphase Description', max_marks: 2, awarded_marks: 0, reasoning: 'Missing.' },
        { id: 'c9', name: 'Significance', max_marks: 1, awarded_marks: 0, reasoning: 'Missing.' }
      ]
    }
  ]);

  const [savingOverride, setSavingOverride] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const startEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('evaluating');
    setTimeout(() => {
      setStep('dashboard');
    }, 3000);
  };

  const handleCriterionMarkChange = (qId: string, criterionId: string, newMark: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.question_id === qId) {
        const updatedCriteria = q.criteria.map(c => 
          c.id === criterionId ? { ...c, awarded_marks: newMark } : c
        );
        const newTotal = updatedCriteria.reduce((sum, c) => sum + c.awarded_marks, 0);
        return {
          ...q,
          criteria: updatedCriteria,
          marks_awarded: newTotal
        };
      }
      return q;
    }));
  };

  const saveOverride = () => {
    setSavingOverride(true);
    setTimeout(() => {
      setQuestions(prev => prev.map(q => 
        q.question_id === selectedQuestion ? { ...q, status: 'AUTO_GRADED' } : q
      ));
      setSavingOverride(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }, 1000);
  };

  const activeQ = questions.find(q => q.question_id === selectedQuestion)!;
  const grandTotalAwarded = questions.reduce((sum, q) => sum + q.marks_awarded, 0);
  const grandTotalPossible = questions.reduce((sum, q) => sum + q.total_marks, 0);
  const overallPercentage = Math.round((grandTotalAwarded / grandTotalPossible) * 100);

  return (
    <main className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Dynamic colorful blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-[700px] h-[700px] rounded-full bg-cyan-900/20 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md py-4 px-8 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            AI
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">AI MarksGrader</h1>
            <p className="text-xs text-slate-400">Production-Grade Answer Sheet Evaluation</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          System Status: Connected
        </span>
      </header>

      {step === 'upload' && (
        <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col justify-center py-16 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Evaluate Student Submissions
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Upload handwritten student files & the reference marking scheme to calculate step marks using NLP semantic analysis & Groq Llama 3.3.
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/60 rounded-3xl p-8 md:p-12 shadow-2xl">
            <form onSubmit={startEvaluation} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Answer Sheets Upload */}
                <div className="border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-900/40 hover:bg-slate-800/40 transition-all cursor-pointer group relative">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">Answer Sheets</h3>
                  <p className="text-xs text-slate-500 mb-4">PDF, JPG, PNG (Multiple files supported)</p>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 transition-colors">
                    Upload Sheets
                    <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png" required />
                  </label>
                </div>

                {/* Marking Scheme Upload */}
                <div className="border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-900/40 hover:bg-slate-800/40 transition-all cursor-pointer group relative">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">Marking Scheme</h3>
                  <p className="text-xs text-slate-500 mb-4">PDF, JPG, PNG (Single rubric document)</p>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 transition-colors">
                    Upload Scheme
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" required />
                  </label>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
                >
                  Run AI-Assisted Evaluation
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {step === 'evaluating' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <RefreshCw className="absolute text-cyan-400 animate-pulse" size={24} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">Evaluating Submission</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Processing OCR, computing all-MiniLM-L6-v2 similarity vectors, and running Groq validation...
            </p>
          </div>
        </div>
      )}

      {step === 'dashboard' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar / Question List */}
          <aside className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <div>
                <h3 className="font-bold text-white">Student Submission</h3>
                <p className="text-xs text-slate-400">Total Score Breakdown</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-400">{grandTotalAwarded}/{grandTotalPossible}</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{overallPercentage}%</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {questions.map((q) => {
                const isSelected = q.question_id === selectedQuestion;
                const isReview = q.status === 'NEEDS_REVIEW';
                
                return (
                  <button
                    key={q.question_id}
                    onClick={() => setSelectedQuestion(q.question_id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md' 
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{q.question_id}</span>
                        {isReview && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <AlertTriangle size={8} /> Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Confidence: {q.evaluation_confidence * 100}%</p>
                    </div>
                    <span className="text-sm font-semibold">{q.marks_awarded}/{q.total_marks}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => setStep('upload')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Upload New Batch
              </button>
            </div>
          </aside>

          {/* Right Panel / Question Detail View */}
          <section className="flex-1 overflow-y-auto bg-slate-950 p-8 space-y-8 relative">
            {successToast && (
              <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
                <Check size={16} /> Saved marks override successfully!
              </div>
            )}

            <div className="flex justify-between items-start border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{activeQ.question_id} Evaluation</h2>
                  {activeQ.status === 'NEEDS_REVIEW' && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      <AlertTriangle size={12} /> Human Review Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Structured evaluation scoring criteria match</p>
              </div>

              <div className="flex gap-4">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center min-w-[100px]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Similarity</p>
                  <p className="text-base font-bold text-cyan-400">{activeQ.similarity_score.toFixed(2)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center min-w-[100px]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">OCR Quality</p>
                  <p className="text-base font-bold text-indigo-400">{activeQ.ocr_confidence}%</p>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-200">Rubric Criteria Scores</h4>
                <p className="text-xs text-indigo-400">Assign/Edit points dynamically</p>
              </div>
              <div className="divide-y divide-slate-800 p-6 space-y-4">
                {activeQ.criteria.map((c) => (
                  <div key={c.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 max-w-xl">
                      <h5 className="font-semibold text-sm text-slate-200">{c.name}</h5>
                      <p className="text-xs text-slate-400">{c.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        step="0.5"
                        min="0"
                        max={c.max_marks}
                        value={c.awarded_marks}
                        onChange={(e) => handleCriterionMarkChange(activeQ.question_id, c.id, parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-800 border border-slate-700 text-center text-sm font-semibold py-1.5 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-500">/ {c.max_marks} Max</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning and Missing Concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-indigo-400" /> Evaluation Reasoning
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {activeQ.reasoning}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" /> Key Gaps & Missing Concepts
                </h4>
                {activeQ.missing_concepts.length > 0 ? (
                  <ul className="space-y-2">
                    {activeQ.missing_concepts.map((concept, index) => (
                      <li key={index} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/10 px-3 py-2 rounded-lg">
                        • {concept}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No missing concepts detected. The answer meets standard requirements.</p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-800 pt-6 flex justify-between items-center">
              <p className="text-xs text-slate-500">
                AI MarksGrader assists professors; scores should be verified before final export.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={saveOverride}
                  disabled={savingOverride}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
                >
                  <Save size={14} />
                  {savingOverride ? 'Saving...' : 'Save & Overrule Marks'}
                </button>
                <button 
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-lg text-xs font-bold transition-colors"
                >
                  <Download size={14} /> Download Report
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
