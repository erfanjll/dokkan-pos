import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, getTodayJalali, getDaysUntilJalali, toPersianDigits } from '../../utils/formatters';
import StatCard from '../common/StatCard';
import { 
  TrendingUp, 
  Boxes, 
  CreditCard, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  ChevronLeft,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function DashboardView({ 
  setActiveTab, 
  onOpenNewInvoice, 
  onOpenNewProduct, 
  onOpenNewCheque, 
  onOpenPaymentModal 
}) {
  const todayJalali = getTodayJalali();

  // دریافت داده‌ها به صورت زنده از Dexie
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const cheques = useLiveQuery(() => db.cheques.toArray(), []) || [];

  // ۱. محاسبات آماری
  // جمع کل طلب‌ها (مشتریان با بالانس مثبت)
  const totalReceivables = customers
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + (Number(c.balance) || 0), 0);

  // ارزش ریالی کل موجودی انبار بر اساس قیمت خرید
  const totalInventoryCost = products.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buyPrice) || 0),
    0
  );

  // چک‌های در جریان
  const pendingCheques = cheques.filter((c) => c.status === 'در جریان');
  const pendingChequesCount = pendingCheques.length;

  // فروش امروز
  const todaySales = invoices
    .filter((inv) => inv.type === 'فروش' && inv.jalaliDate === todayJalali)
    .reduce((sum, inv) => sum + (Number(inv.finalAmount) || 0), 0);

  // ۲. فیلتر چک‌های با سررسید نزدیک (سررسید گذشته یا تا ۳ روز آینده)
  const dueSoonCheques = pendingCheques
    .map((c) => {
      const days = getDaysUntilJalali(c.jalaliDueDate);
      return { ...c, daysRemaining: days };
    })
    .filter((c) => c.daysRemaining !== null && c.daysRemaining <= 3)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // ۳. کالاهای زیر سقف هشدار موجودی
  const lowStockProducts = products
    .filter((p) => Number(p.stock) <= Number(p.minStockAlert))
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  // افزایش سریع موجودی کالا
  const handleQuickRestock = async (product) => {
    try {
      await db.products.update(product.id, {
        stock: Number(product.stock) + 5
      });
    } catch (err) {
      console.error('خطا در افزایش موجودی:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* بنر خوش‌آمدگویی و اقدامات سریع تبلت */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800/95 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">میز کار و داشبورد</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">خلاصه وضعیت مالی و انبارداری امروز ({toPersianDigits(todayJalali)})</p>
        </div>

        {/* دکمه‌های اقدام سریع لمسی */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenNewInvoice}
            className="min-h-[48px] px-3 sm:px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-600/30 text-sm sm:text-base"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>صدور فاکتور</span>
          </button>
          <button
            onClick={onOpenPaymentModal}
            className="min-h-[48px] px-3 sm:px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-600/30 text-sm sm:text-base"
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            <span>دریافت / پرداخت</span>
          </button>
          <button
            onClick={onOpenNewProduct}
            className="min-h-[48px] px-3 sm:px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-sm sm:text-base"
          >
            <Boxes className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>کالای جدید</span>
          </button>
          <button
            onClick={onOpenNewCheque}
            className="min-h-[48px] px-3 sm:px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-sm sm:text-base"
          >
            <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
            <span>ثبت چک</span>
          </button>
        </div>
      </div>

      {/* ۱. کارت‌های آماری اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="جمع کل طلب‌ها (بدهی مشتریان)"
          value={formatToman(totalReceivables)}
          subtitle={`${toPersianDigits(customers.filter((c) => c.balance > 0).length)} نفر بدهکار`}
          icon={TrendingUp}
          color="rose"
          onClick={() => setActiveTab('customers')}
        />

        <StatCard
          title="ارزش ریالی موجودی انبار"
          value={formatToman(totalInventoryCost)}
          subtitle={`${toPersianDigits(products.length)} قلم کالا ثبت شده`}
          icon={Boxes}
          color="emerald"
          onClick={() => setActiveTab('inventory')}
        />

        <StatCard
          title="چک‌های در جریان وصول"
          value={`${toPersianDigits(pendingChequesCount)} فقره`}
          subtitle={
            pendingChequesCount > 0
              ? formatToman(pendingCheques.reduce((s, c) => s + (Number(c.amount) || 0), 0))
              : 'چک در جریانی وجود ندارد'
          }
          icon={CreditCard}
          color="amber"
          onClick={() => setActiveTab('cheques')}
        />

        <StatCard
          title="فروش امروز"
          value={formatToman(todaySales)}
          subtitle={`${toPersianDigits(invoices.filter((inv) => inv.type === 'فروش' && inv.jalaliDate === todayJalali).length)} فاکتور صادر شده`}
          icon={ArrowUpRight}
          color="indigo"
          onClick={() => setActiveTab('invoices')}
        />
      </div>

      {/* ۲ و ۳. ردیف هشدارهای مهم تبلت */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* بخش چک‌های با سررسید نزدیک */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">سررسید چک‌ها (تا ۳ روز آینده)</h3>
                <p className="text-xs text-slate-400">چک‌های نیازمند پیگیری فوری و واریز</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('cheques')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {dueSoonCheques.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-2" />
                <p className="text-base font-semibold">هیچ چکی با سررسید نزدیک وجود ندارد.</p>
                <p className="text-xs text-slate-500 mt-1">تمام چک‌های جاری در وضعیت مناسبی قرار دارند.</p>
              </div>
            ) : (
              dueSoonCheques.map((c) => {
                const isOverdue = c.daysRemaining < 0;
                const isToday = c.daysRemaining === 0;

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOverdue
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : isToday
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : 'bg-slate-700/40 border-slate-600/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            isOverdue
                              ? 'bg-rose-500/30 text-rose-300'
                              : isToday
                              ? 'bg-amber-500/30 text-amber-300'
                              : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {isOverdue
                            ? `سررسید گذشته (${toPersianDigits(Math.abs(c.daysRemaining))} روز)`
                            : isToday
                            ? 'سررسید امروز!'
                            : `${toPersianDigits(c.daysRemaining)} روز مانده`}
                        </span>
                        <span className="text-sm font-bold text-white">{c.personName}</span>
                        <span className="text-xs text-slate-400">({c.type})</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{c.bankName}</span>
                        <span>•</span>
                        <span>ش.چک: {toPersianDigits(c.chequeNumber)}</span>
                        <span>•</span>
                        <span>تاریخ: {toPersianDigits(c.jalaliDueDate)}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-amber-400">
                        {formatToman(c.amount)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* بخش کالاهای زیر سقف هشدار */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">هشدار کسری موجودی انبار</h3>
                <p className="text-xs text-slate-400">کالاهایی که موجودی آنها به زیر سقف رسیده است</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده انبار</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-2" />
                <p className="text-base font-semibold">موجودی کلیه کالاها بالاتر از سقف هشدار است.</p>
                <p className="text-xs text-slate-500 mt-1">کسری کالا در انبار گزارش نشده است.</p>
              </div>
            ) : (
              lowStockProducts.map((p) => {
                const isOutOfStock = Number(p.stock) <= 0;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-700/40 border border-slate-600/60 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {isOutOfStock ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300 font-bold">
                            ناموجود
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 font-bold">
                            روبه اتمام
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        سقف هشدار: {toPersianDigits(p.minStockAlert)} {p.unit} | قیمت فروش: {formatToman(p.sellPrice)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-black">
                        <span className={`text-lg ${isOutOfStock ? 'text-rose-400' : 'text-amber-400'}`}>
                          {toPersianDigits(p.stock)}
                        </span>
                        <span className="text-xs text-slate-400 mr-1">{p.unit}</span>
                      </div>

                      <button
                        onClick={() => handleQuickRestock(p)}
                        title="افزایش ۵ عدد موجودی"
                        className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs">+۵ شارژ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
