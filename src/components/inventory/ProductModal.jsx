import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { parseToman, formatToman, toPersianDigits, toEnglishDigits } from '../../utils/formatters';
import { Barcode, Check } from 'lucide-react';

const COMMON_UNITS = ['عدد', 'جین', 'دست', 'بسته', 'ثوب', 'قواره', 'طاقه', 'جفت', 'کارتن', 'متر'];

// سایزهای متداول پوشاک برای انتخاب سریع لمسی
const PRESET_NUMERIC_SIZES = ['۳۰', '۳۲', '۳۴', '۳۶', '۳۸', '۴۰', '۴۲', '۴۴', '۴۶', '۴۸', '۵۰'];
const PRESET_ALPHA_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'فری‌سایز'];

// رنگ‌های پرطرفدار پوشاک
const PRESET_COLORS = [
  'مشکی', 'سفید', 'طوسی', 'سرمه‌ای', 'ذغالی', 
  'کرم', 'یشمی', 'آبی', 'زرشکی', 'شکلاتی', 'خاکی'
];

// تابع کمکی برای ساخت بارکد تصادفی ۱۳ رقمی استاندارد
const generateRandomBarcode = () => '626' + Math.floor(1000000000 + Math.random() * 9000000000);

export default function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    unit: 'عدد',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    minStockAlert: '5',
    packRatio: '12', // تعداد در هر جین یا بسته
    sizes: [], // آرایه سایزها
    colors: [] // آرایه رنگ‌ها
  });

  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    setCustomSizeInput('');
    setCustomColorInput('');

    if (product) {
      // تفکیک سایزها و رنگ‌ها در صورت وجود
      let parsedSizes = [];
      if (Array.isArray(product.sizes)) {
        parsedSizes = product.sizes;
      } else if (typeof product.sizes === 'string' && product.sizes.trim()) {
        parsedSizes = product.sizes.split(',').map((s) => s.trim()).filter(Boolean);
      }

      let parsedColors = [];
      if (Array.isArray(product.colors)) {
        parsedColors = product.colors;
      } else if (typeof product.colors === 'string' && product.colors.trim()) {
        parsedColors = product.colors.split(',').map((c) => c.trim()).filter(Boolean);
      }

      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        unit: product.unit || 'عدد',
        buyPrice: product.buyPrice ? String(product.buyPrice) : '',
        sellPrice: product.sellPrice ? String(product.sellPrice) : '',
        stock: product.stock !== undefined ? String(product.stock) : '',
        minStockAlert: product.minStockAlert !== undefined ? String(product.minStockAlert) : '5',
        packRatio: product.packRatio ? String(product.packRatio) : '12',
        sizes: parsedSizes,
        colors: parsedColors
      });
    } else {
      setFormData({
        name: '',
        barcode: '',
        unit: 'عدد',
        buyPrice: '',
        sellPrice: '',
        stock: '0',
        minStockAlert: '5',
        packRatio: '12',
        sizes: [],
        colors: []
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePriceChange = (field, rawValue) => {
    const num = parseToman(rawValue);
    setFormData((prev) => ({ ...prev, [field]: num > 0 ? String(num) : '' }));
  };

  const handleGenerateBarcode = () => {
    setFormData((prev) => ({ ...prev, barcode: generateRandomBarcode() }));
  };

  // تاگل کردن یک سایز
  const toggleSize = (size) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size]
      };
    });
  };

  // افزودن سایز دلخواه
  const handleAddCustomSize = (e) => {
    e.preventDefault();
    const val = customSizeInput.trim();
    if (val && !formData.sizes.includes(val)) {
      setFormData((prev) => ({ ...prev, sizes: [...prev.sizes, val] }));
      setCustomSizeInput('');
    }
  };

  // تاگل کردن یک رنگ
  const toggleColor = (color) => {
    setFormData((prev) => {
      const exists = prev.colors.includes(color);
      return {
        ...prev,
        colors: exists ? prev.colors.filter((c) => c !== color) : [...prev.colors, color]
      };
    });
  };

  // افزودن رنگ دلخواه
  const handleAddCustomColor = (e) => {
    e.preventDefault();
    const val = customColorInput.trim();
    if (val && !formData.colors.includes(val)) {
      setFormData((prev) => ({ ...prev, colors: [...prev.colors, val] }));
      setCustomColorInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام مدل یا نوع پوشاک الزامی است.';
    }

    const buyPrice = parseToman(formData.buyPrice);
    const sellPrice = parseToman(formData.sellPrice);
    const stock = Number(toEnglishDigits(formData.stock)) || 0;
    const minAlert = Number(toEnglishDigits(formData.minStockAlert)) || 0;
    const packRatio = Number(toEnglishDigits(formData.packRatio)) || 12;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const finalBarcode = formData.barcode.trim() || generateRandomBarcode();

      onSave({
        ...(product ? { id: product.id } : {}),
        name: formData.name.trim(),
        barcode: finalBarcode,
        unit: formData.unit.trim() || 'عدد',
        buyPrice,
        sellPrice,
        stock,
        minStockAlert: minAlert,
        packRatio,
        sizes: formData.sizes,
        colors: formData.colors
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
      title={product ? 'ویرایش مدل پوشاک' : 'تعریف مدل پوشاک جدید'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* ۱. نام مدل پوشاک */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            نام یا مدل پوشاک <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="مثال: شلوار جین مام استایل ترک، پیراهن آستین بلند نخی..."
              className={`w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border text-white text-base focus:outline-none transition-all ${
                errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-700 focus:border-emerald-500'
              }`}
            />
          </div>
          {errors.name && <p className="text-xs text-rose-400 font-bold mt-1.5">{errors.name}</p>}
        </div>

        {/* ۲. بارکد و واحد فروش */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-300">بارکد یا کد کالا</label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
              >
                تولید کد خودکار
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="خالی بگذارید تا خودکار تولید شود..."
                className="w-full min-h-[50px] px-4 pl-11 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-sm sm:text-base focus:outline-none focus:border-emerald-500"
              />
              <Barcode className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">واحد سنجش / فروش</label>
            <select
              value={formData.unit}
              onChange={(e) => {
                const newUnit = e.target.value;
                handleChange('unit', newUnit);
                if (newUnit === 'جین') {
                  handleChange('packRatio', '12');
                } else if (newUnit === 'بسته') {
                  handleChange('packRatio', '6');
                }
              }}
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} className="bg-slate-900 text-white">
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ۳. بخش اختصاصی پوشاک: سایزبندی (انتخاب سریع با چیپ) */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              سایزهای موجود این مدل (روی گزینه‌ها کلیک کنید):
            </span>
            {formData.sizes.length > 0 && (
              <span className="text-xs text-emerald-400 font-bold">
                {toPersianDigits(formData.sizes.length)} سایز انتخاب شده
              </span>
            )}
          </div>

          {/* سایزهای شماره‌ای */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-slate-400 ml-1">شماره‌ای:</span>
            {PRESET_NUMERIC_SIZES.map((sz) => {
              const selected = formData.sizes.includes(sz);
              return (
                <button
                  type="button"
                  key={sz}
                  onClick={() => toggleSize(sz)}
                  className={`min-h-[32px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          {/* سایزهای حروفی */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-slate-400 ml-1">حروفی:</span>
            {PRESET_ALPHA_SIZES.map((sz) => {
              const selected = formData.sizes.includes(sz);
              return (
                <button
                  type="button"
                  key={sz}
                  onClick={() => toggleSize(sz)}
                  className={`min-h-[32px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>

          {/* سایز دلخواه دستی */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              placeholder="افزودن سایز دلخواه دیگر (مثلاً 52 یا سایز 3)..."
              className="flex-1 min-h-[38px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="min-h-[38px] px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-all cursor-pointer"
            >
              + افزودن سایز
            </button>
          </div>
        </div>

        {/* ۴. بخش اختصاصی پوشاک: رنگ‌بندی */}
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              رنگ‌های موجود این مدل:
            </span>
            {formData.colors.length > 0 && (
              <span className="text-xs text-indigo-400 font-bold">
                {toPersianDigits(formData.colors.length)} رنگ انتخاب شده
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {PRESET_COLORS.map((col) => {
              const selected = formData.colors.includes(col);
              return (
                <button
                  type="button"
                  key={col}
                  onClick={() => toggleColor(col)}
                  className={`min-h-[32px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{col}</span>
                </button>
              );
            })}
          </div>

          {/* رنگ دلخواه دستی */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customColorInput}
              onChange={(e) => setCustomColorInput(e.target.value)}
              placeholder="افزودن رنگ دلخواه (مثلاً نسکافه‌ای، یخی، زیتونی)..."
              className="flex-1 min-h-[38px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddCustomColor}
              className="min-h-[38px] px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-all cursor-pointer"
            >
              + افزودن رنگ
            </button>
          </div>
        </div>

        {/* ۵. قیمت خرید و قیمت فروش */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">قیمت خرید (تومان)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.buyPrice ? toPersianDigits(formData.buyPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
              onChange={(e) => handlePriceChange('buyPrice', e.target.value)}
              placeholder="۰ تومان"
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1 font-medium">
              معادل: <span className="text-emerald-400 font-bold">{formatToman(formData.buyPrice)}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">قیمت فروش (تومان)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.sellPrice ? toPersianDigits(formData.sellPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
              onChange={(e) => handlePriceChange('sellPrice', e.target.value)}
              placeholder="۰ تومان"
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1 font-medium">
              معادل: <span className="text-emerald-400 font-bold">{formatToman(formData.sellPrice)}</span>
            </p>
          </div>
        </div>

        {/* ۶. موجودی و ضریب جین/بسته */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">موجودی انبار</label>
            <div className="relative">
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                placeholder="0"
                className="w-full min-h-[48px] px-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                {formData.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">حداقل هشدار کسری</label>
            <div className="relative">
              <input
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => handleChange('minStockAlert', e.target.value)}
                placeholder="5"
                className="w-full min-h-[48px] px-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                {formData.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تعداد در هر جین / بسته
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.packRatio}
                onChange={(e) => handleChange('packRatio', e.target.value)}
                placeholder="12"
                className="w-full min-h-[48px] px-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                عدد
              </span>
            </div>
          </div>
        </div>

        {/* دکمه‌های تایید و انصراف لمسی */}
        {errors.name && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold animate-in fade-in">
            {errors.name}
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
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <span>{product ? 'ذخیره مدل پوشاک' : 'افزودن به انبار پوشاک'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
