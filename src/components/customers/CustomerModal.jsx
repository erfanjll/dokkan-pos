import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { parseToman, formatToman, toPersianDigits } from '../../utils/formatters';
import { Phone } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, onSave, customer }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    balanceType: 'debtor', // debtor (بدهکار), creditor (بستانکار), zero (تسویه)
    balanceAmount: '',
    creditLimit: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    if (customer) {
      const bal = Number(customer.balance) || 0;
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        balanceType: bal > 0 ? 'debtor' : bal < 0 ? 'creditor' : 'zero',
        balanceAmount: bal !== 0 ? String(Math.abs(bal)) : '',
        creditLimit: customer.creditLimit ? String(customer.creditLimit) : '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        balanceType: 'zero',
        balanceAmount: '',
        creditLimit: '',
        address: '',
        notes: ''
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePriceChange = (rawValue) => {
    const num = parseToman(rawValue);
    setFormData((prev) => ({ ...prev, balanceAmount: num > 0 ? String(num) : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim()) {
      setErrors({ name: 'نام طرف‌حساب الزامی است.' });
      return;
    }

    try {
      setIsSubmitting(true);
      let finalBalance = 0;
      const rawNum = parseToman(formData.balanceAmount);
      if (formData.balanceType === 'debtor') {
        finalBalance = rawNum;
      } else if (formData.balanceType === 'creditor') {
        finalBalance = -rawNum;
      }

      onSave({
        ...(customer ? { id: customer.id } : {}),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        balance: finalBalance,
        creditLimit: parseToman(formData.creditLimit),
        address: formData.address.trim(),
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
      title={customer ? 'ویرایش مشخصات طرف‌حساب' : 'تعریف مشتری یا همکار جدید'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نام طرف‌حساب */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            نام و عنوان شخص یا فروشگاه <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="مثال: تولیدی پوشاک آریا (یا بوتیک شیک‌پوشان)"
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white text-base focus:outline-none transition-all ${
                errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
          </div>
          {errors.name && <p className="text-xs text-rose-400 font-bold mt-1">{errors.name}</p>}
        </div>

        {/* شماره تماس */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">شماره تلفن / همراه</label>
          <div className="relative">
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              className="w-full min-h-[50px] px-4 pl-10 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
            />
            <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* مانده حساب اولیه */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <label className="block text-sm font-bold text-slate-300">مانده حساب اولیه</label>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleChange('balanceType', 'debtor')}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.balanceType === 'debtor'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              بدهکار (به ما بدهکاره)
            </button>
            <button
              type="button"
              onClick={() => handleChange('balanceType', 'creditor')}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.balanceType === 'creditor'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              بستانکار (طلبکاره)
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('balanceType', 'zero');
                handleChange('balanceAmount', '');
              }}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                formData.balanceType === 'zero'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              تسویه (صفر)
            </button>
          </div>

          {formData.balanceType !== 'zero' && (
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={formData.balanceAmount ? toPersianDigits(formData.balanceAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="مبلغ مانده اولیه به تومان"
                className="w-full min-h-[48px] px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-base font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                معادل: <span className="font-bold text-white">{formatToman(formData.balanceAmount)}</span>
              </p>
            </div>
          )}
        </div>

        {/* سقف اعتبار نسیه */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1.5">
            سقف اعتبار نسیه (تومان) <span className="text-xs text-slate-400 font-normal">- اختیاری</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.creditLimit ? toPersianDigits(formData.creditLimit.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
            onChange={(e) => {
              const num = parseToman(e.target.value);
              setFormData((prev) => ({ ...prev, creditLimit: num > 0 ? String(num) : '' }));
            }}
            placeholder="مثال: ۵۰,۰۰۰,۰۰۰ تومان (خالی = بدون محدودیت)"
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base font-bold focus:outline-none focus:border-emerald-500"
          />
          {formData.creditLimit && (
            <p className="text-xs text-slate-400 mt-1 font-medium">
              حداکثر بدهی مجاز: <span className="text-amber-400 font-bold">{formatToman(formData.creditLimit)}</span>
            </p>
          )}
        </div>

        {/* آدرس */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">آدرس فروشگاه / محل کار</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="مثال: بازار بزرگ، راسته بزازها، سرای چیت‌ساز..."
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* یادداشت */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">یادداشت و توضیحات</label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="سایزبندی، بنکدار، شرایط تسویه چکی..."
            className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* دکمه‌های تایید و انصراف لمسی */}
        {errors.name && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold animate-in fade-in">
            {errors.name}
          </div>
        )}

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
              <span>{customer ? 'ثبت تغییرات' : 'افزودن طرف‌حساب'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
