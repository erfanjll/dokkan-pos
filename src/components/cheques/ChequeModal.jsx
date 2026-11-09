import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { parseToman, formatToman, toPersianDigits, getTodayJalali } from '../../utils/formatters';
// ChequeModal

const COMMON_BANKS = [
  'بانک ملت',
  'بانک ملی ایران',
  'بانک صادرات',
  'بانک تجارت',
  'بانک سپه',
  'بانک پاسارگاد',
  'بانک سامان',
  'بانک پارسیان',
  'بانک کشاورزی',
  'بانک رفاه کارگران',
  'بانک مسکن',
  'بانک آینده',
  'بانک شهر',
  'پست بانک'
];

export default function ChequeModal({ isOpen, onClose, onSave, cheque, customers = [] }) {
  const [formData, setFormData] = useState({
    chequeNumber: '',
    sayadNumber: '',
    bankName: 'بانک ملت',
    amount: '',
    jalaliDueDate: '',
    personName: '',
    type: 'دریافتی', // دریافتی یا پرداختی
    status: 'در جریان', // در جریان، پاس شد، برگشت خورد، خرج شد
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    if (cheque) {
      setFormData({
        chequeNumber: cheque.chequeNumber || '',
        sayadNumber: cheque.sayadNumber || '',
        bankName: cheque.bankName || 'بانک ملت',
        amount: cheque.amount ? String(cheque.amount) : '',
        jalaliDueDate: cheque.jalaliDueDate || getTodayJalali(),
        personName: cheque.personName || '',
        type: cheque.type || 'دریافتی',
        status: cheque.status || 'در جریان',
        notes: cheque.notes || ''
      });
    } else {
      setFormData({
        chequeNumber: '',
        sayadNumber: '',
        bankName: 'بانک ملت',
        amount: '',
        jalaliDueDate: getTodayJalali(),
        personName: '',
        type: 'دریافتی',
        status: 'در جریان',
        notes: ''
      });
    }
    setErrors({});
  }, [cheque, isOpen]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePriceChange = (val) => {
    const num = parseToman(val);
    setFormData((prev) => ({ ...prev, amount: num > 0 ? String(num) : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const newErrors = {};

    if (!formData.chequeNumber.trim()) {
      newErrors.chequeNumber = 'شماره چک الزامی است.';
    }
    if (!formData.personName.trim()) {
      newErrors.personName = 'نام طرف‌حساب الزامی است.';
    }
    const numAmount = parseToman(formData.amount);
    if (numAmount <= 0) {
      newErrors.amount = 'مبلغ چک باید بیشتر از صفر باشد.';
    }
    if (!formData.jalaliDueDate.trim()) {
      newErrors.jalaliDueDate = 'تاریخ سررسید الزامی است.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      onSave({
        ...(cheque ? { id: cheque.id } : {}),
        chequeNumber: formData.chequeNumber.trim(),
        sayadNumber: formData.sayadNumber.trim(),
        bankName: formData.bankName.trim(),
        amount: numAmount,
        dueDate: new Date().toISOString(),
        jalaliDueDate: formData.jalaliDueDate.trim(),
        personName: formData.personName.trim(),
        type: formData.type,
        status: formData.status,
        notes: formData.notes.trim()
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
      title={cheque ? 'ویرایش مشخصات چک' : 'ثبت فقره چک جدید'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نوع چک */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">نوع فقره چک</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('type', 'دریافتی')}
              className={`min-h-[50px] rounded-2xl font-black text-base cursor-pointer transition-all ${
                formData.type === 'دریافتی'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              چک دریافتی (از مشتری)
            </button>
            <button
              type="button"
              onClick={() => handleChange('type', 'پرداختی')}
              className={`min-h-[50px] rounded-2xl font-black text-base cursor-pointer transition-all ${
                formData.type === 'پرداختی'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              چک پرداختی (به تأمین‌کننده)
            </button>
          </div>
        </div>

        {/* شماره چک و شناسه صیادی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              شماره چک <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.chequeNumber}
              onChange={(e) => handleChange('chequeNumber', e.target.value)}
              placeholder="مثال: ۷۸۲۹۱۰۴"
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white font-mono text-base focus:outline-none transition-all ${
                errors.chequeNumber ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
            {errors.chequeNumber && <p className="text-xs text-rose-400 font-bold mt-1">{errors.chequeNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">شناسه ۱۶ رقمی صیاد</label>
            <input
              type="text"
              maxLength={16}
              value={formData.sayadNumber}
              onChange={(e) => handleChange('sayadNumber', e.target.value)}
              placeholder="۱۴۰۲۸۸۹۹..."
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* نام بانک و تاریخ سررسید */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">بانک صادرکننده</label>
            <select
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {COMMON_BANKS.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              تاریخ سررسید (شمسی) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.jalaliDueDate}
              onChange={(e) => handleChange('jalaliDueDate', e.target.value)}
              placeholder="۱۴۰۳/۰۸/۱۹"
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white font-mono text-base focus:outline-none transition-all ${
                errors.jalaliDueDate ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
            {errors.jalaliDueDate && <p className="text-xs text-rose-400 font-bold mt-1">{errors.jalaliDueDate}</p>}
          </div>
        </div>

        {/* طرف‌حساب و مبلغ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              صاحب چک / طرف‌حساب <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              list="customer-suggestions"
              value={formData.personName}
              onChange={(e) => handleChange('personName', e.target.value)}
              placeholder="نام طرف‌حساب، بنکدار یا خریدار..."
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white text-base focus:outline-none transition-all ${
                errors.personName ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
            <datalist id="customer-suggestions">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {errors.personName && <p className="text-xs text-rose-400 font-bold mt-1">{errors.personName}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              مبلغ چک (تومان) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.amount ? toPersianDigits(formData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="۰ تومان"
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white font-bold text-lg focus:outline-none transition-all ${
                errors.amount ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
            <p className="text-xs text-slate-400 mt-1 font-medium">
              معادل: <span className="text-emerald-400 font-bold">{formatToman(formData.amount)}</span>
            </p>
          </div>
        </div>

        {/* وضعیت اولیه چک */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">وضعیت چک</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'در جریان', label: 'در جریان', color: 'bg-amber-600' },
              { id: 'پاس شد', label: 'پاس شد', color: 'bg-emerald-600' },
              { id: 'برگشت خورد', label: 'برگشت خورد', color: 'bg-rose-600' },
              { id: 'خرج شد', label: 'خرج شد', color: 'bg-indigo-600' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleChange('status', st.id)}
                className={`min-h-[46px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.status === st.id
                    ? `${st.color} text-white shadow-md ring-2 ring-white/30`
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* توضیحات */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">توضیحات و بابت</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="مثال: بابت خرید عمده شلوار کتان و تی‌شرت، فاکتور ۱۰۴۲..."
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* دکمه‌های تایید و انصراف لمسی */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold animate-in fade-in">
            لطفاً فیلدهای ستاره‌دار الزامی را به درستی تکمیل فرمایید.
          </div>
        )}

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
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
              <span>{cheque ? 'ذخیره تغییرات' : 'ثبت چک در دفتر'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
