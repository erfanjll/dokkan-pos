import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, toPersianDigits, getDaysUntilJalali } from '../../utils/formatters';
import { exportDatabase, importDatabase, resetDatabaseToEmpty } from '../../db/backup';
import ChequeModal from './ChequeModal';
import ShareModal from '../common/ShareModal';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Download, 
  Upload, 
  RotateCcw, 
  Building2,
  HardDrive,
  MessageSquare
} from 'lucide-react';

const STATUS_CONFIG = {
  'در جریان': { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  'پاس شد': { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  'برگشت خورد': { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
  'خرج شد': { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
};

export default function ChequesView({ showToast, isNewChequeOpen, setIsNewChequeOpen }) {
  const [activeTabType, setActiveTabType] = useState('دریافتی'); // دریافتی یا پرداختی
  const [statusFilter, setStatusFilter] = useState('all'); // all, در جریان, پاس شد, برگشت خورد, خرج شد
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCheque, setEditingCheque] = useState(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [shareModalState, setShareModalState] = useState({
    isOpen: false,
    name: '',
    phone: '',
    text: ''
  });

  const fileInputRef = useRef(null);

  const cheques = useLiveQuery(() => db.cheques.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // فیلتر و جستجو
  const filteredCheques = cheques
    .filter((c) => {
      if (c.type !== activeTabType) return false;

      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      const matchSearch =
        (c.personName && c.personName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.chequeNumber && c.chequeNumber.includes(searchTerm)) ||
        (c.sayadNumber && c.sayadNumber.includes(searchTerm)) ||
        (c.bankName && c.bankName.includes(searchTerm));

      return matchSearch;
    })
    .sort((a, b) => {
      const daysA = getDaysUntilJalali(a.jalaliDueDate) ?? 9999;
      const daysB = getDaysUntilJalali(b.jalaliDueDate) ?? 9999;
      return daysA - daysB;
    });

  // مجموع مبالغ چک‌های نوع فعلی
  const totalAmount = filteredCheques.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalPendingAmount = cheques
    .filter((c) => c.type === activeTabType && c.status === 'در جریان')
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);

  // تغییر وضعیت سریع با یک کلیک
  const handleQuickStatusChange = async (cheque, newStatus) => {
    try {
      await db.cheques.update(cheque.id, { status: newStatus });
      showToast?.({ message: `وضعیت چک شماره ${toPersianDigits(cheque.chequeNumber)} به «${newStatus}» تغییر یافت.`, type: 'info' });
    } catch (err) {
      showToast?.({ message: `خطا در تغییر وضعیت چک: ${err.message}`, type: 'error' });
    }
  };

  // ذخیره چک
  const handleSaveCheque = async (data) => {
    try {
      if (data.id) {
        await db.cheques.update(data.id, data);
        showToast?.({ message: 'مشخصات چک با موفقیت به‌روزرسانی شد.', type: 'success' });
      } else {
        await db.cheques.add(data);
        showToast?.({ message: 'چک جدید با موفقیت در دفتر ثبت شد.', type: 'success' });
      }
    } catch (err) {
      showToast?.({ message: `خطا در ذخیره چک: ${err.message}`, type: 'error' });
    }
  };

  // حذف چک
  const handleDeleteCheque = async (cheque) => {
    if (window.confirm(`آیا از حذف چک شماره «${cheque.chequeNumber}» مطمئن هستید؟`)) {
      try {
        await db.cheques.delete(cheque.id);
        showToast?.({ message: 'چک از دفتر حذف گردید.', type: 'info' });
      } catch (err) {
        showToast?.({ message: `خطا در حذف چک: ${err.message}`, type: 'error' });
      }
    }
  };

  // پشتیبان‌گیری
  const handleExportBackup = async () => {
    setIsBackupLoading(true);
    const res = await exportDatabase();
    setIsBackupLoading(false);
    showToast?.({ message: res.message, type: res.success ? 'success' : 'error' });
  };

  // بازیابی فایل پشتیبان
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('توجه: با بازیابی این فایل، کلیه اطلاعات فعلی جایگزین خواهند شد. آیا ادامه می‌دهید؟')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result;
      const res = await importDatabase(content);
      showToast?.({ message: res.message, type: res.success ? 'success' : 'error' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // پاکسازی کامل دیتابیس (شروع از صفر)
  const handleResetToEmpty = async () => {
    if (window.confirm('توجه: آیا مطمئن هستید که می‌خواهید تمام اطلاعات پایگاه داده را به طور کامل پاکسازی کنید و برنامه را صفر نمایید؟')) {
      const res = await resetDatabaseToEmpty();
      showToast?.({ message: res.message, type: res.success ? 'info' : 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش چک‌ها */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">دفتر مدیریت چک و صیاد</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مجموع در جریان ({activeTabType}): <span className="text-amber-400 font-bold">{formatToman(totalPendingAmount)}</span> | کل مبالغ فیلترشده: <span className="text-slate-300 font-bold">{formatToman(totalAmount)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingCheque(null);
            setIsNewChequeOpen(true);
          }}
          className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>ثبت چک جدید</span>
        </button>
      </div>

      {/* تب‌های تفکیک دریافتی / پرداختی */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-1.5 rounded-3xl bg-slate-800/60 border border-slate-700/60">
        <button
          onClick={() => setActiveTabType('دریافتی')}
          className={`min-h-[46px] sm:min-h-[50px] rounded-2xl font-black text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTabType === 'دریافتی'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>چک‌های دریافتی</span>
          <span className="hidden sm:inline text-xs text-emerald-100">(مشتریان)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20">
            {toPersianDigits(cheques.filter((c) => c.type === 'دریافتی').length)}
          </span>
        </button>

        <button
          onClick={() => setActiveTabType('پرداختی')}
          className={`min-h-[46px] sm:min-h-[50px] rounded-2xl font-black text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeTabType === 'پرداختی'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>چک‌های پرداختی</span>
          <span className="hidden sm:inline text-xs text-indigo-100">(همکاران)</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20">
            {toPersianDigits(cheques.filter((c) => c.type === 'پرداختی').length)}
          </span>
        </button>
      </div>

      {/* جستجو و فیلترهای وضعیت چک */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو با شماره چک، نام طرف‌حساب، شناسه صیاد یا بانک..."
            className="w-full min-h-[50px] pr-12 pl-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'در جریان', 'پاس شد', 'برگشت خورد', 'خرج شد'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`min-h-[48px] px-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                statusFilter === st
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'همه وضعیت‌ها' : st}
            </button>
          ))}
        </div>
      </div>

      {/* لیست کارت‌های چک بهینه‌شده برای تبلت */}
      {filteredCheques.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-12 text-center text-slate-400">
          <CreditCard className="w-16 h-16 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">چکی در این دسته یافت نشد</h3>
          <p className="text-sm text-slate-500 mt-1">با زدن «ثبت چک جدید» اطلاعات چک را وارد نمایید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCheques.map((c) => {
            const daysRemaining = getDaysUntilJalali(c.jalaliDueDate);
            const isPending = c.status === 'در جریان';
            const isOverdue = isPending && daysRemaining !== null && daysRemaining < 0;
            const isDueSoon = isPending && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['در جریان'];

            return (
              <div
                key={c.id}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
              >
                <div>
                  {/* بالایی: نام بانک و وضعیت */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-white text-sm">{c.bankName}</span>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${cfg.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span>{c.status}</span>
                    </span>
                  </div>

                  {/* شماره چک و صیاد */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 my-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">شماره چک:</span>
                      <span className="font-mono font-bold text-white text-sm">{toPersianDigits(c.chequeNumber)}</span>
                    </div>
                    {c.sayadNumber && (
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-slate-400">شناسه صیاد:</span>
                        <span className="text-slate-300 tracking-wider">{toPersianDigits(c.sayadNumber)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{c.type === 'دریافتی' ? 'صادرکننده:' : 'گیرنده:'}</span>
                      <span className="font-bold text-emerald-300">{c.personName}</span>
                    </div>
                  </div>

                  {/* تاریخ سررسید و اخطار */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>سررسید: {toPersianDigits(c.jalaliDueDate)}</span>
                    </div>

                    {isPending && daysRemaining !== null && (
                      <span className={`font-bold ${isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                        {isOverdue
                          ? `سررسید گذشته (${toPersianDigits(Math.abs(daysRemaining))} روز)`
                          : daysRemaining === 0
                          ? 'سررسید امروز!'
                          : `${toPersianDigits(daysRemaining)} روز مانده`}
                      </span>
                    )}
                  </div>
                </div>

                {/* مبلغ و تغییر وضعیت سریع با دکمه‌های لمسی */}
                <div className="pt-3 border-t border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">مبلغ چک:</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatToman(c.amount)}
                    </span>
                  </div>

                  {/* نوار دکمه‌های وضعیت و عملیات سریع */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] text-slate-400 shrink-0">تغییر وضعیت:</span>
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                        {['در جریان', 'پاس شد', 'برگشت خورد', 'خرج شد'].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleQuickStatusChange(c, st)}
                            className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                              c.status === st
                                ? 'bg-slate-600 text-white ring-1 ring-white/20'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      {c.status === 'در جریان' ? (
                        <button
                          onClick={() => {
                            const text = `سلام جناب ${c.personName} عزیز،\nبا احترام یادآوری می‌گردد چک به شماره ${toPersianDigits(c.chequeNumber)}${c.sayadNumber ? ` (صیاد: ${toPersianDigits(c.sayadNumber)})` : ''} به مبلغ ${formatToman(c.amount)} نزد بانک ${c.bankName || 'مربوطه'}، سررسید آن تاریخ ${toPersianDigits(c.jalaliDueDate)} می‌باشد.\nخواهشمند است جهت موجودی و پاس شدن اقدام فرمایید.\nبا تشکر و احترام.`;
                            const foundCust = customers.find((cust) => cust.name === c.personName);
                            setShareModalState({
                              isOpen: true,
                              name: c.personName,
                              phone: foundCust?.phone || '',
                              text
                            });
                          }}
                          title="ارسال پیامک یادآوری سررسید چک"
                          className="min-h-[40px] flex-1 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>پیامک یادآوری سررسید</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          چک {c.status}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCheque(c);
                            setIsNewChequeOpen(true);
                          }}
                          title="ویرایش"
                          className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer active:scale-90 transition-all shrink-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCheque(c)}
                          title="حذف"
                          className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer active:scale-90 transition-all shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* بخش پشتیبان‌گیری، بازیابی و مدیریت حافظه آفلاین تبلت */}
      <div className="mt-8 p-6 rounded-3xl bg-slate-850 bg-slate-800/80 border border-slate-700/80 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">پشتیبان‌گیری و حفاظت از داده‌های تبلت</h3>
            <p className="text-xs text-slate-400">اطلاعات شما ۱۰۰٪ در حافظه داخلی این دستگاه ذخیره می‌شود. برای اطمینان دوره‌ای نسخه پشتیبان تهیه کنید.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* دکمه استخراج فایل بک‌آپ */}
          <button
            onClick={handleExportBackup}
            disabled={isBackupLoading}
            className="min-h-[50px] px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>دانلود فایل پشتیبان (JSON)</span>
          </button>

          {/* دکمه بازیابی بک‌آپ */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>بازیابی از فایل پشتیبان</span>
            </button>
          </div>

          {/* پاکسازی و صفر کردن کامل دیتابیس */}
          <button
            onClick={handleResetToEmpty}
            className="min-h-[50px] px-4 rounded-2xl bg-slate-700/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>پاکسازی کامل و شروع از صفر</span>
          </button>
        </div>
      </div>

      {/* مودال افزودن و ویرایش چک */}
      <ChequeModal
        isOpen={isNewChequeOpen}
        onClose={() => {
          setIsNewChequeOpen(false);
          setEditingCheque(null);
        }}
        onSave={handleSaveCheque}
        cheque={editingCheque}
        customers={customers}
      />

      {/* مودال ارسال پیامک یادآوری سررسید چک */}
      <ShareModal
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState((prev) => ({ ...prev, isOpen: false }))}
        title="ارسال پیامک یادآوری سررسید چک"
        recipientName={shareModalState.name}
        recipientPhone={shareModalState.phone}
        initialText={shareModalState.text}
        onFeedback={(t) => showToast?.(t)}
      />
    </div>
  );
}
