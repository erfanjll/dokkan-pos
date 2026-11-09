import React, { useState } from 'react';
import { Store, Calendar, Plus, HelpCircle } from 'lucide-react';
import { getTodayJalali, toPersianDigits } from '../../utils/formatters';

export default function Header({ onQuickNewInvoice, onOpenHelp }) {
  // تاریخ امروز بدون نیاز به setState در افکت
  const [today] = useState(() => getTodayJalali());

  return (
    <header className="no-print bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
            <Store className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">دکان</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">صندوق و حسابداری پوشاک</p>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Help Button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              type="button"
              title="راهنمای کامل برنامه"
              className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/80 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
            >
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Date */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-slate-800 border border-slate-700/60 text-slate-200 text-xs sm:text-sm font-semibold">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toPersianDigits(today)}</span>
          </div>

          {/* Quick New Invoice Button */}
          {onQuickNewInvoice && (
            <button
              onClick={onQuickNewInvoice}
              className="min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer text-xs sm:text-base"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>فاکتور جدید</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
