import React, { useState } from 'react';
import { UploadCloud, FileText, ArrowRight, Loader2 } from 'lucide-react';

interface UploadSectionProps {
  onUpload: (answerSheets: FileList | null, markingScheme: File | null) => void;
  isLoading: boolean;
}

export default function UploadSection({ onUpload, isLoading }: UploadSectionProps) {
  const [sheets, setSheets] = useState<FileList | null>(null);
  const [scheme, setScheme] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload(sheets, scheme);
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-surface-900 mb-3 tracking-tight">Evaluate Submissions</h2>
        <p className="text-surface-500 text-sm max-w-2xl">
          Upload handwritten student answer sheets and the reference marking scheme. Our AI will automatically grade the submissions based on your rubric criteria.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-shadow p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Answer Sheets Upload */}
          <div className="border-2 border-dashed border-surface-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-brand-50 hover:border-brand-300 transition-all group relative cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-surface-800 mb-1">Answer Sheets</h3>
            <p className="text-xs text-surface-500 mb-4">Multiple PDFs or Images supported</p>
            <label className="bg-white border border-surface-200 text-surface-700 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer shadow-sm hover:bg-surface-50 transition-colors">
              {sheets && sheets.length > 0 ? `${sheets.length} files selected` : 'Browse Files'}
              <input 
                type="file" 
                multiple 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                required 
                onChange={(e) => setSheets(e.target.files)}
              />
            </label>
          </div>

          {/* Marking Scheme Upload */}
          <div className="border-2 border-dashed border-surface-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-brand-50 hover:border-brand-300 transition-all group relative cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={28} />
            </div>
            <h3 className="text-base font-bold text-surface-800 mb-1">Marking Scheme</h3>
            <p className="text-xs text-surface-500 mb-4">Single PDF or Image required</p>
            <label className="bg-white border border-surface-200 text-surface-700 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer shadow-sm hover:bg-surface-50 transition-colors">
              {scheme ? scheme.name : 'Browse Scheme'}
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                required 
                onChange={(e) => setScheme(e.target.files ? e.target.files[0] : null)}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-surface-100">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-brand-500/20 disabled:opacity-70 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Start Evaluation
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
