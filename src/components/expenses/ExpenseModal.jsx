import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { parseToman, formatToman, toPersianDigits, getTodayJalali } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export default function ExpenseModal({ isOpen, onClose, onSave, expense }) {
  const [formData, setFormData] = useState({
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    jalaliDate: getTodayJalali(),
    note: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    if (expense) {
      setFormData({
        title: expense.title || '',
        category: expense.category || EXPENSE_CATEGORIES[0],
        amount: expense.amount ? String(expense.amount) : '',
        jalaliDate: expense.jalaliDate || getTodayJalali(),
        note: expense.note || ''
      });
    } else {
      setFormData({
        title: '',
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        jalaliDate: getTodayJalali(),
        note: ''
      });
    }
    setErrors({});
  }, [expense, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePriceChange = (rawValue) => {
    const num = parseToman(rawValue);
    setFormData((prev) => ({ ...prev, amount: num > 0 ? String(num) : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'شرح یا عنوان هزینه الزامی است.';
    }

    const amount = parseToman(formData.amount);
    if (!amount || amount <= 0) {
      newErrors.amount = 'مبلغ هزینه باید بزرگتر از صفر باشد.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      onSave({
        ...(expense ? { id: expense.id } : {}),
        title: formData.title.trim(),
        category: formData.category,
        amount,
        jalaliDate: formData.jalaliDate.trim() || getTodayJalali(),
        date: expense?.date || new Date().toISOString(),
        note: formData.note.trim()
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'ویرایش هزینه ثبت‌شده' : 'ثبت هزینه جدید مغازه'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* عنوان هزینه */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            عنوان یا شرح هزینه <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="مثال: کرایه مغازه آبان ماه، باربری ۲ کارتن شلوار از بازار..."
            className={`w-full min-h-[48px] px-4 rounded-2xl bg-slate-800 border text-white text-base focus:outline-none transition-all ${
              errors.title ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-700 focus:border-emerald-500'
            }`}
          />
          {errors.title && <p className="text-xs text-rose-400 font-bold mt-1">{errors.title}</p>}
        </div>

        {/* دسته‌بندی هزینه */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">دسته‌بندی هزینه</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm sm:text-base focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* مبلغ هزینه به تومان */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            مبلغ هزینه (تومان) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.amount ? toPersianDigits(formData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="۰ تومان"
            className={`w-full min-h-[48px] px-4 rounded-2xl bg-slate-800 border text-white text-lg font-bold focus:outline-none transition-all ${
              errors.amount ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-700 focus:border-emerald-500'
            }`}
          />
          <p className="text-xs text-slate-400 mt-1 font-medium">
            معادل: <span className="text-rose-400 font-bold">{formatToman(formData.amount)}</span>
          </p>
          {errors.amount && <p className="text-xs text-rose-400 font-bold mt-1">{errors.amount}</p>}
        </div>

        {/* تاریخ شمسی */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">تاریخ ثبت هزینه (شمسی)</label>
          <input
            type="text"
            value={formData.jalaliDate}
            onChange={(e) => handleChange('jalaliDate', e.target.value)}
            placeholder="1405/08/18"
            className="w-full min-h-[48px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* یادداشت اختیاری */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">توضیحات تکمیلی (اختیاری)</label>
          <textarea
            rows={2}
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="شماره فاکتور، نام شاگرد، جزئیات قبض یا بارنامه..."
            className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* خطاهای احتمالی */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold">
            لطفاً فیلدهای ستاره‌دار را به درستی تکمیل نمایید.
          </div>
        )}

        {/* دکمه‌های تایید و انصراف لمسی */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ثبت...</span>
              </>
            ) : (
              <span>{expense ? 'ذخیره تغییرات' : 'ثبت هزینه'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
