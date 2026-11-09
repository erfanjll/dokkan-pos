import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { 
  FileText, 
  Search, 
  Plus, 
  Printer, 
  Calendar, 
  User, 
  Trash2
} from 'lucide-react';

export default function InvoicesView({ showToast, onOpenNewInvoice, onSelectInvoiceForPrint }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, فروش, خرید

  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  // فیلتر و جستجو
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchSearch =
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType !== 'all') {
        return inv.type === filterType;
      }
      return true;
    })
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const totalSalesAmount = invoices
    .filter((inv) => inv.type === 'فروش')
    .reduce((s, inv) => s + (Number(inv.finalAmount) || 0), 0);

  const handleDeleteInvoice = async (inv) => {
    if (window.confirm(`آیا از حذف فاکتور شماره «${inv.invoiceNumber}» مطمئن هستید؟`)) {
      try {
        await db.invoices.delete(inv.id);
        showToast?.({ message: 'فاکتور حذف شد.', type: 'info' });
      } catch (err) {
        showToast?.({ message: `خطا در حذف فاکتور: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* هدر بخش فاکتورها */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">دفتر و صدور فاکتورها</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مجموع فروش: <span className="text-emerald-400 font-bold">{formatToman(totalSalesAmount)}</span> | {toPersianDigits(invoices.length)} فاکتور
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewInvoice}
          className="w-full sm:w-auto min-h-[46px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer text-sm sm:text-base"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>صدور فاکتور جدید</span>
        </button>
      </div>

      {/* جستجو و فیلترها */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو با شماره فاکتور یا نام خریدار..."
            className="w-full min-h-[48px] sm:min-h-[50px] pr-12 pl-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm sm:text-base focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
              filterType === 'all'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            همه ({toPersianDigits(invoices.length)})
          </button>
          <button
            onClick={() => setFilterType('فروش')}
            className={`min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 ${
              filterType === 'فروش'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            فروش ({toPersianDigits(invoices.filter((i) => i.type === 'فروش').length)})
          </button>
          <button
            onClick={() => setFilterType('خرید')}
            className={`min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 ${
              filterType === 'خرید'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            خرید ({toPersianDigits(invoices.filter((i) => i.type === 'خرید').length)})
          </button>
        </div>
      </div>

      {/* لیست فاکتورها */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-300">فاکتوری یافت نشد</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">با کلیک روی دکمه «صدور فاکتور جدید» فاکتور را ثبت کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredInvoices.map((inv) => {
            const isSale = inv.type === 'فروش';
            const isPurchase = inv.type === 'خرید';

            return (
              <div
                key={inv.id}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col justify-between gap-3 sm:gap-4 transition-all"
              >
                <div>
                  {/* ردیف بالا: شماره فاکتور و نوع */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-white px-2.5 py-1 rounded-xl bg-slate-700">
                        #{toPersianDigits(inv.invoiceNumber)}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                        isSale
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isPurchase
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {inv.type}
                      </span>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                      {inv.paymentType}
                    </span>
                  </div>

                  {/* نام طرف‌حساب و تاریخ */}
                  <div className="space-y-1 my-3">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{inv.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{toPersianDigits(inv.jalaliDate)}</span>
                    </div>
                  </div>

                  {/* اقلام فاکتور خلاصه */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>تعداد اقلام:</span>
                      <span className="font-bold text-white">{toPersianDigits((inv.items || []).length)} قلم</span>
                    </div>
                    {inv.discount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>تخفیف:</span>
                        <span>{formatToman(inv.discount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ردیف پایین: مبلغ کل و دکمه پرینت */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">مبلغ نهایی:</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">
                      {formatToman(inv.finalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectInvoiceForPrint?.(inv)}
                      className="min-h-[42px] sm:min-h-[44px] px-3.5 sm:px-4 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>چاپ</span>
                    </button>

                    <button
                      onClick={() => handleDeleteInvoice(inv)}
                      title="حذف فاکتور"
                      className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
