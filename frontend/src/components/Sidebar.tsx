import React from 'react';
import { LayoutDashboard, FileText, CheckSquare, Settings, Users, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-surface-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-surface-200">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20">
          Q
        </div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Qorrect</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-4">
        <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 px-3">Dashboard</div>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-700 bg-brand-50 font-medium transition-colors">
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </a>
        
        <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-6 mb-2 px-3">Evaluate</div>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium transition-colors">
          <FileText size={18} />
          <span>Exams & Papers</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium transition-colors">
          <CheckSquare size={18} />
          <span>Results Review</span>
        </a>
        
        <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-6 mb-2 px-3">Manage</div>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium transition-colors">
          <Users size={18} />
          <span>Students</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium transition-colors">
          <Settings size={18} />
          <span>Settings</span>
        </a>
      </div>
      
      <div className="p-4 border-t border-surface-200">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium transition-colors">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
