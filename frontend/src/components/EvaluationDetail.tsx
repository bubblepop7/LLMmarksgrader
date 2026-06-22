import React from 'react';
import { AlertTriangle, FileSpreadsheet, Save, Download, Check } from 'lucide-react';

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

interface EvaluationDetailProps {
  activeQ: QuestionEvaluation;
  onMarkChange: (qId: string, criterionId: string, newMark: number) => void;
  onSaveOverride: () => void;
  savingOverride: boolean;
  successToast: boolean;
}

export default function EvaluationDetail({
  activeQ,
  onMarkChange,
  onSaveOverride,
  savingOverride,
  successToast
}: EvaluationDetailProps) {
  return (
    <div className="space-y-6 relative max-w-5xl">
      {successToast && (
        <div className="absolute top-0 right-0 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <Check size={16} /> Saved marks successfully!
        </div>
      )}

      {/* Header Panel */}
      <div className="card-shadow p-6 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-surface-900">{activeQ.question_id} Evaluation</h2>
            {activeQ.status === 'NEEDS_REVIEW' && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                <AlertTriangle size={12} /> Human Review Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500">Structured evaluation scoring criteria match</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-surface-50 border border-surface-200 p-3 rounded-xl text-center min-w-[100px]">
            <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">Similarity</p>
            <p className="text-lg font-bold text-brand-600">{activeQ.similarity_score.toFixed(2)}</p>
          </div>
          <div className="bg-surface-50 border border-surface-200 p-3 rounded-xl text-center min-w-[100px]">
            <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">OCR Quality</p>
            <p className="text-lg font-bold text-surface-800">{activeQ.ocr_confidence}%</p>
          </div>
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="card-shadow overflow-hidden">
        <div className="p-5 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
          <h4 className="font-bold text-sm text-surface-800">Rubric Criteria Scores</h4>
          <p className="text-xs text-brand-600 font-medium">Assign or edit points dynamically</p>
        </div>
        <div className="divide-y divide-surface-100 p-6 space-y-4">
          {activeQ.criteria.map((c) => (
            <div key={c.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 max-w-xl">
                <h5 className="font-semibold text-sm text-surface-900">{c.name}</h5>
                <p className="text-xs text-surface-500">{c.reasoning}</p>
              </div>
              <div className="flex items-center gap-3 bg-surface-50 border border-surface-200 p-1.5 rounded-xl">
                <input 
                  type="number" 
                  step="0.5"
                  min="0"
                  max={c.max_marks}
                  value={c.awarded_marks}
                  onChange={(e) => onMarkChange(activeQ.question_id, c.id, parseFloat(e.target.value) || 0)}
                  className="w-16 bg-white border border-surface-300 text-center text-sm font-bold py-1.5 rounded-lg text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-xs text-surface-500 font-medium pr-2">/ {c.max_marks} Max</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning & Missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-shadow p-6 space-y-4">
          <h4 className="font-bold text-sm text-surface-900 flex items-center gap-2 border-b border-surface-100 pb-3">
            <FileSpreadsheet size={16} className="text-brand-500" /> Evaluation Reasoning
          </h4>
          <p className="text-sm text-surface-600 leading-relaxed">
            {activeQ.reasoning}
          </p>
        </div>

        <div className="card-shadow p-6 space-y-4">
          <h4 className="font-bold text-sm text-surface-900 flex items-center gap-2 border-b border-surface-100 pb-3">
            <AlertTriangle size={16} className="text-amber-500" /> Key Gaps & Missing Concepts
          </h4>
          {activeQ.missing_concepts.length > 0 ? (
            <ul className="space-y-2">
              {activeQ.missing_concepts.map((concept, index) => (
                <li key={index} className="text-xs text-amber-800 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg font-medium">
                  • {concept}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-surface-500 italic">No missing concepts detected.</p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="card-shadow p-4 flex justify-between items-center">
        <p className="text-xs text-surface-500 font-medium px-2">
          Please verify AI scores before final export.
        </p>
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Download size={14} /> Download Report
          </button>
          <button
            onClick={onSaveOverride}
            disabled={savingOverride}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md disabled:opacity-70 transition-all"
          >
            <Save size={14} />
            {savingOverride ? 'Saving...' : 'Save & Overrule Marks'}
          </button>
        </div>
      </div>
    </div>
  );
}
