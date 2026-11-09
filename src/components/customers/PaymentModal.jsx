import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { parseToman, formatToman, toPersianDigits, getTodayJalali } from '../../utils/formatters';
import { db } from '../../db/db';
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, defaultCustomer = null, onComplete, customers = [] }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [type, setType] = useState('receive'); // receive (دریافت وجه), pay (پرداخت وجه)
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('کارت‌به‌کارت');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayJalali());
      if (defaultCustomer) {
        setSelectedCustomerId(String(defaultCustomer.id));
        if (defaultCustomer.balance < 0) {
          setType('pay');
        } else {
          setType('receive');
        }
      } else if (customers.length > 0) {
        setSelectedCustomerId(String(customers[0].id));
      }
      setAmount('');
      setDescription('');
      setError('');
      setIsSubmitting(false);
    }
  }, [defaultCustomer, isOpen, customers]);

  const activeCustomer = customers.find((c) => String(c.id) === String(selectedCustomerId));

  const handlePriceChange = (val) => {
    const num = parseToman(val);
    setAmount(num > 0 ? String(num) : '');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // جلوگیری از اسپم کلیک
    setError('');

    const numericAmount = parseToman(amount);

    if (!selectedCustomerId) {
      setError('لطفاً یک طرف‌حساب را انتخاب کنید.');
      return;
    }
    if (numericAmount <= 0) {
      setError('لطفاً مبلغ معتبری به تومان وارد کنید.');
      return;
    }

    try {
      setIsSubmitting(true);
      const custId = Number(selectedCustomerId);
      const customer = await db.customers.get(custId);
      if (!customer) {
        setError('طرف‌حساب مورد نظر یافت نشد.');
        return;
      }

      let newBalance = Number(customer.balance) || 0;
      if (type === 'receive') {
        newBalance -= numericAmount;
      } else {
        newBalance += numericAmount;
      }

      await db.transaction('rw', db.customers, db.invoices, async () => {
        await db.customers.update(custId, { balance: newBalance });

        await db.invoices.add({
          invoiceNumber: `PAY-${Date.now().toString().slice(-6)}`,
          customerId: custId,
          customerName: customer.name,
          type: type === 'receive' ? 'دریافت وجه' : 'پرداخت وجه',
          totalAmount: numericAmount,
          discount: 0,
          finalAmount: numericAmount,
          paymentType: method,
          date: new Date().toISOString(),
          jalaliDate: date || getTodayJalali(),
          items: [
            {
              productName: `${type === 'receive' ? 'دریافت وجه' : 'پرداخت وجه'} (${method}) - ${description || 'تسویه حساب'}`,
              quantity: 1,
              unitPrice: numericAmount,
              totalPrice: numericAmount,
              unit: 'مورد'
            }
          ]
        });
      });

      onComplete?.({
        message: `تراکنش ${formatToman(numericAmount)} با موفقیت ثبت شد.`,
        type: 'success'
      });

      onClose();
    } catch (err) {
      setError(`خطا در ثبت تراکنش: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت سریع دریافت / پرداخت وجه"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* انتخاب نوع تراکنش */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">نوع تراکنش مالی</label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setType('receive')}
              className={`min-h-[50px] px-2 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 font-black transition-all cursor-pointer text-xs sm:text-base ${
                type === 'receive'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 shrink-0" />
              <span>دریافت وجه (مشتری)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('pay')}
              className={`min-h-[50px] px-2 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 font-black transition-all cursor-pointer text-xs sm:text-base ${
                type === 'pay'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300 shrink-0" />
              <span>پرداخت وجه (همکار)</span>
            </button>
          </div>
        </div>

        {/* انتخاب طرف‌حساب */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">طرف‌حساب</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">انتخاب شخص یا فروشگاه...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name} (مانده: {formatToman(c.balance)})
              </option>
            ))}
          </select>

          {activeCustomer && (
            <div className="mt-2 text-xs flex items-center justify-between text-slate-400 px-1">
              <span>وضعیت فعلی:</span>
              <span className={`font-bold ${activeCustomer.balance > 0 ? 'text-rose-400' : activeCustomer.balance < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {activeCustomer.balance > 0 ? `بدهکار: ${formatToman(activeCustomer.balance)}` : activeCustomer.balance < 0 ? `بستانکار: ${formatToman(Math.abs(activeCustomer.balance))}` : 'تسویه کامل'}
              </span>
            </div>
          )}
        </div>

        {/* مبلغ تراکنش */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">مبلغ پرداختی / دریافتی (تومان)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount ? toPersianDigits(amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) : ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="۰ تومان"
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xl font-bold focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-slate-400 mt-1 font-medium">
            حروف/خوانا: <span className="text-emerald-400 font-bold">{formatToman(amount)}</span>
          </p>
        </div>

        {/* روش پرداخت و تاریخ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">روش تسویه</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="کارت‌به‌کارت">کارت به کارت</option>
              <option value="نقدی">وجه نقد</option>
              <option value="حواله بانکی / پایا">حواله بانکی / پایا</option>
              <option value="دستگاه پوز">دستگاه پوز فروشگاه</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">تاریخ شمسی</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="۱۴۰۳/۰۸/۱۹"
              className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* بابت / توضیحات */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">توضیحات و بابت</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: تسویه فاکتور خرید شلوار و پیراهن، بیعانه..."
            className="w-full min-h-[50px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* هشدار دوم بالای دکمه */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* دکمه‌های اکشن لمسی با لودینگ */}
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
              <span>ثبت در حساب</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
