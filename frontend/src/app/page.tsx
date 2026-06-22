'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle, FileText, ArrowRight } from 'lucide-react';

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    // Simulate API upload and job generation
    setTimeout(() => {
      setJobId('job-uuid-1234');
      setIsEvaluating(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-100/50 blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
            AI Answer Sheet Evaluator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload student answer sheets and a marking scheme. Our semantic AI engine will automatically evaluate answers, assign step-by-step marks, and generate detailed reports.
          </p>
        </div>

        <div className="glass-panel p-8 md:p-12">
          {!jobId ? (
            <form onSubmit={handleUpload} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Answer Sheets Upload */}
                <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                  <div className="p-4 rounded-full bg-indigo-100 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Answer Sheets</h3>
                  <p className="text-sm text-slate-500 mb-4">PDF, JPG, or PNG (Multiple allowed)</p>
                  <label className="cursor-pointer bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    Browse Files
                    <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                </div>

                {/* Marking Scheme Upload */}
                <div className="border-2 border-dashed border-cyan-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-cyan-50/50 transition-colors cursor-pointer group">
                  <div className="p-4 rounded-full bg-cyan-100 text-cyan-600 mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Marking Scheme</h3>
                  <p className="text-sm text-slate-500 mb-4">PDF, JPG, or PNG (Single file)</p>
                  <label className="cursor-pointer bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    Browse File
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isEvaluating ? 'Initializing Evaluation Engine...' : 'Start Evaluation'}
                  {!isEvaluating && <ArrowRight size={20} />}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-500 mb-4">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Evaluation Job Created!</h2>
              <p className="text-slate-600">
                Your files have been successfully uploaded and the AI is evaluating the answers.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 inline-block border border-slate-100">
                <p className="text-sm font-mono text-slate-500">Job ID: {jobId}</p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => setJobId(null)}
                  className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                  Evaluate another batch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
