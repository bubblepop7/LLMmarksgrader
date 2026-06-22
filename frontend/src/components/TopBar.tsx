import React from 'react';
import { Search } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-20 bg-white border-b border-surface-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <input 
          type="text" 
          placeholder="Search Exams, Students, Items..." 
          className="w-full bg-surface-50 border border-surface-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
        />
      </div>
    </header>
  );
}
