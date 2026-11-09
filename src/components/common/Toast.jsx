import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />,
    info: <Info className="w-6 h-6 text-sky-400 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-100',
    info: 'bg-slate-800/95 border-sky-500/40 text-slate-100'
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${bgStyles[toast.type || 'info']}`}>
        <div className="flex items-center gap-3">
          {icons[toast.type || 'info']}
          <p className="text-base font-medium">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

