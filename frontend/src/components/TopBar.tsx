import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

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
      
      <div className="flex items-center gap-6">
        <button className="relative text-surface-500 hover:text-brand-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
            <span className="text-sm font-bold text-brand-700">CB</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-surface-700 group-hover:text-surface-900 transition-colors">Christine Brown</span>
            <ChevronDown size={14} className="text-surface-400 group-hover:text-surface-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
