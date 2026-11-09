import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { db } from '../../db/db';
import { formatToman, parseToman, toPersianDigits, getTodayJalali } from '../../utils/formatters';
import { Plus, Minus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';

export default function NewInvoiceModal({ isOpen, onClose, onInvoiceCreated, onOpenNewProduct, products = [], customers = [] }) {
  const [invoiceType, setInvoiceType] = useState('فروش'); // فروش یا خرید
  const [customerId, setCustomerId] = useState('');
  const [jalaliDate, setJalaliDate] = useState(() => getTodayJalali());
  const [paymentType, setPaymentType] = useState('نقد'); // نقد، نسیه، چک، کارتخوان
  const [discount, setDiscount] = useState('');
  const [items, setItems] = useState([]);

  // فیلدهای ردیف انتخابی فعلی
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentPrice, setCurrentPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState('single'); // single یا pack
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setJalaliDate(getTodayJalali());
      if (customers.length > 0 && !customerId) {
        setCustomerId(String(customers[0].id));
      }
      setItems([]);
      setDiscount('');
      setPaymentType('نقد');
      setError('');
      setSelectedProductId('');
      setCurrentQty(1);
      setCurrentPrice('');
      setSelectedSize('');
      setSelectedColor('');
      setSelectedUnitType('single');
      setIsSubmitting(false);
    }
  }, [isOpen, customers, customerId]);

  // انتخاب کالا و مقداردهی قیمت پیش‌فرض
  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setError('');
    if (productId) {
      const prod = products.find((p) => String(p.id) === String(productId));
      if (prod) {
        const defaultPrice = invoiceType === 'فروش' ? prod.sellPrice : prod.buyPrice;
        setCurrentPrice(String(defaultPrice));
        setCurrentQty(1);

        const sizes = Array.isArray(prod.sizes) ? prod.sizes : (typeof prod.sizes === 'string' ? prod.sizes.split(',').filter(Boolean) : []);
        const colors = Array.isArray(prod.colors) ? prod.colors : (typeof prod.colors === 'string' ? prod.colors.split(',').filter(Boolean) : []);
        setSelectedSize(sizes.length > 0 ? sizes[0] : '');
        setSelectedColor(colors.length > 0 ? colors[0] : '');
        setSelectedUnitType(prod.unit === 'جین' ? 'pack' : 'single');
        return;
      }
    }
    setCurrentPrice('');
    setCurrentQty(1);
    setSelectedSize('');
    setSelectedColor('');
    setSelectedUnitType('single');
  };

  // تغییر واحد فروش بین تکی و جینی
  const handleUnitTypeToggle = (type) => {
    setSelectedUnitType(type);
    if (!selectedProductId) return;
    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const basePrice = invoiceType === 'فروش' ? prod.sellPrice : prod.buyPrice;
    const ratio = Number(prod.packRatio) || 12;

    if (type === 'pack' && prod.unit !== 'جین') {
      setCurrentPrice(String(basePrice * ratio));
    } else {
      setCurrentPrice(String(basePrice));
    }
  };

  // تغییر نوع فاکتور (خرید یا فروش)
  const handleInvoiceTypeChange = (newType) => {
    setInvoiceType(newType);
    if (selectedProductId) {
      const prod = products.find((p) => String(p.id) === String(selectedProductId));
      if (prod) {
        const basePrice = newType === 'فروش' ? prod.sellPrice : prod.buyPrice;
        const ratio = Number(prod.packRatio) || 12;
        if (selectedUnitType === 'pack' && prod.unit !== 'جین') {
          setCurrentPrice(String(basePrice * ratio));
        } else {
          setCurrentPrice(String(basePrice));
        }
      }
    }
  };

  // افزودن سطر کالا به فاکتور
  const handleAddItem = () => {
    if (!selectedProductId) {
      setError('لطفاً ابتدا یک مدل پوشاک یا کالا از لیست انتخاب کنید.');
      return;
    }
    const prod = products.find((p) => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const unitPrice = parseToman(currentPrice);
    const qty = Number(currentQty) || 1;

    if (qty <= 0) {
      setError('تعداد باید حداقل ۱ باشد.');
      return;
    }

    const isPack = selectedUnitType === 'pack';
    const ratio = Number(prod.packRatio) || 12;
    const actualQuantity = isPack && prod.unit !== 'جین' ? qty * ratio : qty;
    const itemUnit = isPack ? (prod.unit === 'جین' ? 'جین' : 'بسته') : (prod.unit || 'عدد');

    if (invoiceType === 'فروش' && Number(prod.stock) < actualQuantity) {
      if (!window.confirm(`موجودی کالا در انبار (${toPersianDigits(prod.stock)} ${prod.unit}) کمتر از تعداد درخواستی (${toPersianDigits(actualQuantity)}) است. آیا مایل به ادامه ثبت هستید؟`)) {
        return;
      }
    }

    const details = [selectedSize ? `سایز ${selectedSize}` : '', selectedColor ? `${selectedColor}` : ''].filter(Boolean).join(' - ');
    const displayName = details ? `${prod.name} (${details})` : prod.name;

    // بررسی تکراری بودن کالا در فاکتور با مشخصه یکسان
    const existingIndex = items.findIndex((it) => it.productId === prod.id && it.size === selectedSize && it.color === selectedColor && it.unit === itemUnit);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].actualQuantity = (Number(updated[existingIndex].actualQuantity) || updated[existingIndex].quantity) + actualQuantity;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: displayName,
          rawName: prod.name,
          size: selectedSize || '',
          color: selectedColor || '',
          unit: itemUnit,
          quantity: qty,
          actualQuantity,
          buyPrice: Number(prod.buyPrice) || 0,
          unitPrice,
          totalPrice: qty * unitPrice
        }
      ]);
    }

    // ریست فیلدها برای کالای بعدی
    setSelectedProductId('');
    setCurrentQty(1);
    setCurrentPrice('');
    setSelectedSize('');
    setSelectedColor('');
    setSelectedUnitType('single');
    setError('');
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      updated[index].totalPrice = newQty * updated[index].unitPrice;
      setItems(updated);
    }
  };

  // محاسبات نهایی
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = parseToman(discount);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // ثبت نهایی فاکتور در دیتابیس
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // جلوگیری از اسپم کلیک
    setError('');

    if (!customerId) {
      setError('لطفاً یک طرف‌حساب یا مشتری انتخاب نمایید.');
      return;
    }

    let finalItems = [...items];

    // اگر کاربر کالا را در کادر انتخاب کرده ولی دکمه + را نزده، خودکار اضافه‌اش کن
    if (finalItems.length === 0 && selectedProductId) {
      const prod = products.find((p) => String(p.id) === String(selectedProductId));
      if (prod) {
        const unitPrice = parseToman(currentPrice) || (invoiceType === 'فروش' ? prod.sellPrice : prod.buyPrice);
        const qty = Number(currentQty) || 1;
        const isPack = selectedUnitType === 'pack';
        const ratio = Number(prod.packRatio) || 12;
        const actualQuantity = isPack && prod.unit !== 'جین' ? qty * ratio : qty;
        const itemUnit = isPack ? (prod.unit === 'جین' ? 'جین' : 'بسته') : (prod.unit || 'عدد');
        const details = [selectedSize ? `سایز ${selectedSize}` : '', selectedColor ? `${selectedColor}` : ''].filter(Boolean).join(' - ');
        const displayName = details ? `${prod.name} (${details})` : prod.name;

        const autoItem = {
          productId: prod.id,
          productName: displayName,
          rawName: prod.name,
          size: selectedSize || '',
          color: selectedColor || '',
          unit: itemUnit,
          quantity: qty,
          actualQuantity,
          buyPrice: Number(prod.buyPrice) || 0,
          unitPrice,
          totalPrice: qty * unitPrice
        };
        finalItems = [autoItem];
        setItems(finalItems);
      }
    }

    if (finalItems.length === 0) {
      setError('هیچ کالایی به فاکتور اضافه نشده است! لطفاً ابتدا کالا را انتخاب کرده و دکمه (+) را بزنید.');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      return;
    }

    const selectedCust = customers.find((c) => String(c.id) === String(customerId));
    if (!selectedCust) {
      setError('طرف‌حساب نامعتبر است.');
      return;
    }

    try {
      setIsSubmitting(true);

      const computedTotal = finalItems.reduce((sum, it) => sum + it.totalPrice, 0);
      const computedFinal = Math.max(0, computedTotal - discountAmount);

      const lastInvoice = await db.invoices.orderBy('id').last();
      const nextNum = lastInvoice ? Number(lastInvoice.id) + 1001 : 1001;
      const invoiceNumber = String(nextNum);

      const newInvoiceRecord = {
        invoiceNumber,
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        type: invoiceType,
        totalAmount: computedTotal,
        discount: discountAmount,
        finalAmount: computedFinal,
        paymentType,
        date: new Date().toISOString(),
        jalaliDate: jalaliDate || getTodayJalali(),
        items: finalItems
      };

      await db.transaction('rw', db.invoices, db.products, db.customers, async () => {
        // ۱. ثبت فاکتور
        const invoiceId = await db.invoices.add(newInvoiceRecord);

        // ۲. به‌روزرسانی موجودی انبار
        for (const item of finalItems) {
          const currentProd = await db.products.get(item.productId);
          if (currentProd) {
            let newStock = Number(currentProd.stock);
            const delta = Number(item.actualQuantity) || Number(item.quantity);
            if (invoiceType === 'فروش') {
              newStock = Math.max(0, newStock - delta);
            } else {
              newStock = newStock + delta;
            }
            await db.products.update(item.productId, { stock: newStock });
          }
        }

        // ۳. اگر نسیه باشد، به‌روزرسانی مانده حساب طرف‌حساب
        if (paymentType === 'نسیه') {
          let newBalance = Number(selectedCust.balance) || 0;
          if (invoiceType === 'فروش') {
            newBalance += computedFinal;
          } else {
            newBalance -= computedFinal;
          }
          await db.customers.update(selectedCust.id, { balance: newBalance });
        }

        onInvoiceCreated?.({
          ...newInvoiceRecord,
          id: invoiceId
        });
      });

      onClose();
    } catch (err) {
      setError(`خطا در ثبت نهایی فاکتور: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCust = customers.find((c) => String(c.id) === String(customerId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`صدور فاکتور جدید (${invoiceType})`}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmitInvoice} className="space-y-4 sm:space-y-6">
        {/* هشدار بالای فرم */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ۱. تنظیمات عمومی فاکتور */}
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-slate-800/80 border border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع فاکتور</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInvoiceTypeChange('فروش')}
                className={`min-h-[46px] rounded-xl text-sm font-bold cursor-pointer transition-all ${
                  invoiceType === 'فروش'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                فروش به مشتری
              </button>
              <button
                type="button"
                onClick={() => handleInvoiceTypeChange('خرید')}
                className={`min-h-[46px] rounded-xl text-sm font-bold cursor-pointer transition-all ${
                  invoiceType === 'خرید'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                خرید از تأمین‌کننده
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">طرف‌حساب / مشتری</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full min-h-[46px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">انتخاب طرف‌حساب...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCust && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                مانده: <span className="font-bold text-emerald-400">{formatToman(selectedCust.balance)}</span>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">تاریخ صدور (شمسی)</label>
            <input
              type="text"
              value={jalaliDate}
              onChange={(e) => setJalaliDate(e.target.value)}
              className="w-full min-h-[46px] px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* ۲. بخش انتخاب و افزودن سریع کالا به فاکتور */}
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-slate-800/40 border border-slate-700/60 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>افزودن کالا به اقلام فاکتور</span>
            </h3>
            {items.length > 0 && (
              <span className="text-xs text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {toPersianDigits(items.length)} قلم افزوده شده
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-400">کالا / مدل پوشاک</label>
                {onOpenNewProduct && (
                  <button
                    type="button"
                    onClick={onOpenNewProduct}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    + تعریف سریع کالا
                  </button>
                )}
              </div>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">
                  {products.length === 0 ? 'انبار خالی است (ابتدا کالا تعریف کنید)...' : 'انتخاب از انبار پوشاک...'}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (موجودی: {toPersianDigits(p.stock)} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-400 mb-1">تعداد / مقدار</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full min-h-[48px] text-center rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setCurrentQty((q) => q + 1)}
                  className="w-11 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-400 mb-1">قیمت واحد (تومان)</label>
              <input
                type="text"
                inputMode="numeric"
                value={currentPrice ? toPersianDigits(currentPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
                onChange={(e) => {
                  const num = parseToman(e.target.value);
                  setCurrentPrice(num > 0 ? String(num) : '');
                }}
                placeholder="قیمت واحد"
                className="w-full min-h-[48px] px-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer font-bold text-sm"
                title="افزودن به اقلام فاکتور"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                <span className="inline sm:hidden">افزودن کالا به اقلام</span>
              </button>
            </div>
          </div>

          {/* گزینه‌های تکمیلی پوشاک: انتخاب سایز، رنگ و واحد جین */}
          {(() => {
            const prod = products.find((p) => String(p.id) === String(selectedProductId));
            if (!prod) return null;

            const sizes = Array.isArray(prod.sizes) ? prod.sizes : (typeof prod.sizes === 'string' ? prod.sizes.split(',').map(s => s.trim()).filter(Boolean) : []);
            const colors = Array.isArray(prod.colors) ? prod.colors : (typeof prod.colors === 'string' ? prod.colors.split(',').map(c => c.trim()).filter(Boolean) : []);
            const hasPack = Number(prod.packRatio) > 1 || prod.unit === 'جین';

            if (sizes.length === 0 && colors.length === 0 && !hasPack) return null;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-700/60 text-xs">
                {sizes.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">انتخاب سایز:</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full min-h-[40px] px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                    >
                      {sizes.map((sz) => (
                        <option key={sz} value={sz}>سایز {sz}</option>
                      ))}
                    </select>
                  </div>
                )}

                {colors.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">انتخاب رنگ:</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full min-h-[40px] px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                    >
                      {colors.map((col) => (
                        <option key={col} value={col}>رنگ {col}</option>
                      ))}
                    </select>
                  </div>
                )}

                {hasPack && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع بسته‌بندی:</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => handleUnitTypeToggle('single')}
                        className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedUnitType === 'single'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                      >
                        تکی ({prod.unit === 'جین' ? 'عدد' : prod.unit})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitTypeToggle('pack')}
                        className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedUnitType === 'pack'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                      >
                        {prod.unit === 'جین' ? 'جین' : `بسته (${toPersianDigits(prod.packRatio || 12)} تایی)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ۳. جدول اقلام فاکتور */}
        <div className="border border-slate-700/80 rounded-2xl overflow-x-auto bg-slate-800/40">
          <table className="w-full min-w-[520px] text-right text-sm">
            <thead className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">نام کالا</th>
                <th className="py-3 px-3 text-center w-36">تعداد</th>
                <th className="py-3 px-3 text-left">قیمت واحد</th>
                <th className="py-3 px-3 text-left">مبلغ کل سطر</th>
                <th className="py-3 px-2 w-12 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                    <p>هنوز پوشاک یا اقلامی به فاکتور اضافه نشده است.</p>
                    <p className="text-xs text-slate-500 mt-1">از کادر بالا کالا را انتخاب کرده و دکمه (+) سبز رنگ را بزنید.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30">
                    <td className="py-3 px-3 text-center text-slate-400">{toPersianDigits(idx + 1)}</td>
                    <td className="py-3 px-3 font-bold text-white">{item.productName}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-white min-w-[28px] text-center">
                          {toPersianDigits(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-left font-medium text-slate-300">
                      {formatToman(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-left font-black text-emerald-400">
                      {formatToman(item.totalPrice)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ۴. جمع‌ها، تخفیف و نحوه تسویه */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl sm:rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">روش تسویه فاکتور</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['نقد', 'نسیه', 'چک', 'کارتخوان'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentType(method)}
                  className={`min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentType === method
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                      : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {paymentType === 'نسیه' && (
              <p className="text-xs text-rose-400 mt-2 font-bold">
                * مبلغ این فاکتور به مانده بدهی مشتری اضافه خواهد شد.
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex justify-between items-center text-slate-400">
              <span>جمع ناخالص اقلام:</span>
              <span className="font-bold text-white">{formatToman(totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">تخفیف کلی (تومان):</span>
              <input
                type="text"
                inputMode="numeric"
                value={discount ? toPersianDigits(discount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
                onChange={(e) => {
                  const num = parseToman(e.target.value);
                  setDiscount(num > 0 ? String(num) : '');
                }}
                placeholder="۰"
                className="w-36 h-9 px-2 text-left rounded-lg bg-slate-800 border border-slate-700 text-rose-400 font-bold text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="h-px bg-slate-700 my-1" />

            <div className="flex justify-between items-center text-base font-black text-white">
              <span>مبلغ قابل پرداخت:</span>
              <span className="text-emerald-400 text-xl">{formatToman(finalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ۵. هشدار سقف اعتبار مشتری */}
        {(() => {
          const selectedCust = customers.find((c) => String(c.id) === String(customerId));
          const isCreditExceeded = Boolean(
            paymentType === 'نسیه' &&
            invoiceType === 'فروش' &&
            selectedCust &&
            selectedCust.creditLimit > 0 &&
            ((Number(selectedCust.balance) || 0) + finalAmount) > selectedCust.creditLimit
          );

          if (!isCreditExceeded) return null;

          return (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                هشدار سقف اعتبار: با صدور این فاکتور، بدهی مشتری ({formatToman((Number(selectedCust.balance) || 0) + finalAmount)}) از سقف اعتبار تعیین‌شده ({formatToman(selectedCust.creditLimit)}) فراتر خواهد رفت!
              </span>
            </div>
          );
        })()}

        {/* ۵. هشدار خطا در بالای دکمه ثبت (کاملاً در دید کاربر موبایل) */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* دکمه‌های پایانی لمسی با وضعیت لودینگ و ممانعت از اسپم */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 text-center sm:text-right">
            {items.length === 0 ? (
              <span className="text-amber-400 font-medium">⚠️ حداقل یک کالا با دکمه (+) اضافه کنید</span>
            ) : (
              <span className="text-emerald-400 font-medium">✓ {toPersianDigits(items.length)} قلم کالا آماده صدور</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-[50px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[50px] flex-1 sm:flex-none px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ثبت فاکتور...</span>
                </>
              ) : (
                <span>ثبت و صدور فاکتور</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
