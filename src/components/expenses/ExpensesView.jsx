import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, toPersianDigits, getTodayJalali } from '../../utils/formatters';
import ExpenseModal from './ExpenseModal';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  PieChart, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function ExpensesView({ showToast }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // واکشی داده‌های زنده از دیتابیس
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  // ۱. محاسبات فروش و سود ناخالص
  const salesInvoices = invoices.filter((inv) => inv.type === 'فروش');
  const totalSalesRevenue = salesInvoices.reduce((sum, inv) => sum + (Number(inv.finalAmount) || 0), 0);

  // محاسبه بهای تمام شده کالاهای فروش رفته (COGS) و سود ناخالص
  let totalCostOfGoodsSold = 0;
  const productSalesMap = {}; // برای محاسبه پرفروش‌ترین‌ها

  salesInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      // پیدا کردن قیمت خرید: یا از خود قلم فاکتور یا از جدول کالا
      let buyPrice = Number(item.buyPrice);
      if (!buyPrice && buyPrice !== 0) {
        const prod = products.find((p) => p.id === item.productId);
        buyPrice = prod ? Number(prod.buyPrice) || 0 : 0;
      }
      const qty = Number(item.actualQuantity || item.quantity) || 1;
      totalCostOfGoodsSold += buyPrice * qty;

      // جمع فروش هر مدل برای گزارش پرفروش‌ترین‌ها
      const pName = item.productName || 'پوشاک';
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = { name: pName, quantity: 0, totalAmount: 0 };
      }
      productSalesMap[pName].quantity += qty;
      productSalesMap[pName].totalAmount += Number(item.totalPrice) || 0;
    });
  });

  const grossProfit = Math.max(0, totalSalesRevenue - totalCostOfGoodsSold);

  // ۲. جمع کل هزینه‌های مغازه
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // ۳. سود خالص نهایی کسب‌وکار (سود ناخالص منهای هزینه‌های جاری)
  const netProfit = grossProfit - totalExpensesAmount;

  // ۴. مرتب‌سازی پرفروش‌ترین مدل‌های پوشاک
  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // فیلتر هزینه‌ها
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategory === 'all') return true;
    return exp.category === selectedCategory;
  });

  // ثبت و ذخیره هزینه
  const handleSaveExpense = async (expData) => {
    try {
      if (expData.id) {
        await db.expenses.update(expData.id, expData);
        showToast?.({ message: 'هزینه با موفقیت ویرایش شد.', type: 'success' });
      } else {
        await db.expenses.add(expData);
        showToast?.({ message: 'هزینه جدید با موفقیت ثبت گردید.', type: 'success' });
      }
    } catch (err) {
      showToast?.({ message: `خطا در ثبت هزینه: ${err.message}`, type: 'error' });
    }
  };

  // حذف هزینه
  const handleDeleteExpense = async (exp) => {
    if (window.confirm(`آیا از حذف هزینه «${exp.title}» مطمئن هستید؟`)) {
      try {
        await db.expenses.delete(exp.id);
        showToast?.({ message: 'هزینه از دفتر حذف شد.', type: 'info' });
      } catch (err) {
        showToast?.({ message: `خطا در حذف هزینه: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش هزینه‌ها و سود */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">هزینه‌های مغازه و سود و زیان</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت هزینه‌های جاری، کرایه، حقوق، باربری و محاسبه سود واقعی
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>ثبت هزینه جدید</span>
        </button>
      </div>

      {/* کارت‌های شاخص سود و زیان */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ۱. کل فروش */}
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>کل فروش ناخالص</span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-white">{formatToman(totalSalesRevenue)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">از {toPersianDigits(salesInvoices.length)} فاکتور فروش</span>
        </div>

        {/* ۲. سود ناخالص اجناس */}
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>سود ناخالص اجناس</span>
            <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-indigo-400">{formatToman(grossProfit)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">فروش منهای بهای خرید اجناس</span>
        </div>

        {/* ۳. مجموع هزینه‌های جاری */}
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>کل هزینه‌های مغازه</span>
            <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-rose-400">{formatToman(totalExpensesAmount)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">کرایه، حقوق، باربری، قبوض...</span>
        </div>

        {/* ۴. سود خالص واقعی کسب‌وکار */}
        <div className={`p-4 rounded-3xl border shadow-lg ${
          netProfit >= 0
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold">سود خالص نهایی (دخل و خرج)</span>
            <span className={`p-1.5 rounded-xl ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black">{formatToman(netProfit)}</div>
          <span className="text-[11px] opacity-80 mt-1 block">
            {netProfit >= 0 ? 'سود خالص واقعی فروشگاه' : 'زیان موقت ناشی از هزینه‌ها'}
          </span>
        </div>
      </div>

      {/* پرفروش‌ترین مدل‌های پوشاک */}
      {topSellingProducts.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">پرفروش‌ترین مدل‌های پوشاک</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {topSellingProducts.map((p, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block truncate max-w-[140px]">{p.name}</span>
                  <span className="text-[11px] text-emerald-400 font-bold">{toPersianDigits(p.quantity)} عدد فروش</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0">
                  {toPersianDigits(idx + 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* فیلتر دسته‌بندی هزینه‌ها */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`min-h-[44px] px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-slate-700 text-white border border-slate-600'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          همه هزینه‌ها ({toPersianDigits(expenses.length)})
        </button>
        {EXPENSE_CATEGORIES.map((cat) => {
          const count = expenses.filter((e) => e.category === cat).length;
          if (count === 0 && selectedCategory !== cat) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[44px] px-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {cat} ({toPersianDigits(count)})
            </button>
          );
        })}
      </div>

      {/* لیست هزینه‌ها */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-12 text-center text-slate-400">
          <TrendingDown className="w-16 h-16 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">هنوز هزینه‌ای ثبت نشده است</h3>
          <p className="text-sm text-slate-500 mt-1">
            با ثبت کرایه، قبوض، باربری یا حقوق شاگرد، سود واقعی مغازه محاسبه خواهد شد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-3 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-base font-black text-white">{exp.title}</h4>
                  <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                    {exp.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>تاریخ: {toPersianDigits(exp.jalaliDate || getTodayJalali())}</span>
                </div>

                {exp.note && (
                  <p className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 mb-2 line-clamp-2">
                    {exp.note}
                  </p>
                )}
              </div>

              {/* مبلغ و دکمه‌های کنترل */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">مبلغ پرداختی:</span>
                  <span className="text-lg font-black text-rose-400">{formatToman(exp.amount)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingExpense(exp);
                      setIsModalOpen(true);
                    }}
                    title="ویرایش"
                    className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(exp)}
                    title="حذف"
                    className="w-9 h-9 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال ثبت و ویرایش هزینه */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
}
