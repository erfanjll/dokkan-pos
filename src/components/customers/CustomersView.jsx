import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import CustomerModal from './CustomerModal';
import PaymentModal from './PaymentModal';
import ShareModal from '../common/ShareModal';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Receipt,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

export default function CustomersView({ showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, debtors, creditors, settled
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [shareModalState, setShareModalState] = useState({
    isOpen: false,
    name: '',
    phone: '',
    text: ''
  });

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // فیلتر و جستجوی زنده
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));

    if (!matchSearch) return false;

    if (filterType === 'debtors') return Number(c.balance) > 0;
    if (filterType === 'creditors') return Number(c.balance) < 0;
    if (filterType === 'settled') return Number(c.balance) === 0;

    return true;
  });

  const totalDebtors = customers.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0);
  const totalCreditors = customers.filter((c) => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);

  const handleSaveCustomer = async (data) => {
    try {
      if (data.id) {
        await db.customers.update(data.id, data);
        showToast?.({ message: 'اطلاعات طرف‌حساب با موفقیت ویرایش شد.', type: 'success' });
      } else {
        await db.customers.add(data);
        showToast?.({ message: 'طرف‌حساب جدید با موفقیت ثبت شد.', type: 'success' });
      }
    } catch (err) {
      showToast?.({ message: `خطا در ذخیره طرف‌حساب: ${err.message}`, type: 'error' });
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`آیا از حذف طرف‌حساب «${customer.name}» مطمئن هستید؟`)) {
      try {
        await db.customers.delete(customer.id);
        showToast?.({ message: 'طرف‌حساب حذف گردید.', type: 'info' });
      } catch (err) {
        showToast?.({ message: `خطا در حذف طرف‌حساب: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش طرف‌حساب‌ها */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">دفتر طرف‌حساب‌ها و بدهکاران</h2>
            <div className="flex items-center gap-3 text-xs mt-0.5">
              <span className="text-rose-400 font-bold">
                طلب ما: {formatToman(totalDebtors)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">
                بدهی ما: {formatToman(totalCreditors)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsPaymentModalOpen(true);
            }}
            className="min-h-[48px] px-3 sm:px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer text-xs sm:text-base"
          >
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>دریافت / پرداخت</span>
          </button>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            className="min-h-[48px] px-3 sm:px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer text-xs sm:text-base"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] shrink-0" />
            <span>مشتری جدید</span>
          </button>
        </div>
      </div>

      {/* جستجو و فیلترها */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو با نام یا شماره تلفن..."
            className="w-full min-h-[50px] pr-12 pl-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              filterType === 'all'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            همه ({toPersianDigits(customers.length)})
          </button>
          <button
            onClick={() => setFilterType('debtors')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              filterType === 'debtors'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>بدهکاران ({toPersianDigits(customers.filter((c) => c.balance > 0).length)})</span>
          </button>
          <button
            onClick={() => setFilterType('creditors')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              filterType === 'creditors'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>بستانکاران ({toPersianDigits(customers.filter((c) => c.balance < 0).length)})</span>
          </button>
          <button
            onClick={() => setFilterType('settled')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              filterType === 'settled'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            بی‌حساب ({toPersianDigits(customers.filter((c) => c.balance === 0).length)})
          </button>
        </div>
      </div>

      {/* لیست کارت‌های مشتریان */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-12 text-center text-slate-400">
          <Users className="w-16 h-16 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">طرف‌حسابی یافت نشد</h3>
          <p className="text-sm text-slate-500 mt-1">با دکمه «مشتری جدید» شخص یا فروشگاه مورد نظر را ثبت کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const isDebtor = Number(c.balance) > 0;
            const isCreditor = Number(c.balance) < 0;

            return (
              <div
                key={c.id}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
              >
                <div>
                  {/* نام و بج وضعیت */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-black text-white leading-snug">{c.name}</h3>
                    {isDebtor ? (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        بدهکار (طلب ما)
                      </span>
                    ) : isCreditor ? (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        بستانکار (بدهی ما)
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-slate-700 text-slate-300 font-bold">
                        تسویه کامل
                      </span>
                    )}
                  </div>

                  {/* تلفن و آدرس */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-3">
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <a
                          href={`tel:${c.phone}`}
                          className="hover:text-emerald-400 font-mono transition-colors"
                        >
                          {toPersianDigits(c.phone)}
                        </a>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* مانده حساب برجسته */}
                  <div className={`p-4 rounded-2xl border text-center ${
                    isDebtor
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                      : isCreditor
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900/40 border-slate-700 text-slate-300'
                  }`}>
                    <span className="text-xs text-slate-400 block mb-1">وضعیت مانده حساب:</span>
                    <div className="text-xl font-black">
                      {c.balance === 0 ? '۰ تومان (تسویه)' : formatToman(Math.abs(c.balance))}
                    </div>
                  </div>

                  {/* سقف اعتبار و هشدار عبور از سقف */}
                  {c.creditLimit > 0 && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">سقف اعتبار:</span>
                      <span className="font-bold text-slate-200">{formatToman(c.creditLimit)}</span>
                    </div>
                  )}

                  {isDebtor && c.creditLimit > 0 && c.balance > c.creditLimit && (
                    <div className="mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>هشدار: مانده بدهی از سقف اعتبار عبور کرده است!</span>
                    </div>
                  )}
                </div>

                {/* دکمه‌های کنترل و تسویه بهینه‌شده برای موبایل و تبلت */}
                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCustomer(c);
                        setIsPaymentModalOpen(true);
                      }}
                      className="min-h-[44px] flex-1 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>ثبت دریافت / پرداخت وجه</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsCustomerModalOpen(true);
                        }}
                        title="ویرایش"
                        className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(c)}
                        title="حذف"
                        className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* دکمه پیامک یادآوری تمام‌عرض برای بدهکاران */}
                  {isDebtor && (
                    <button
                      onClick={() => {
                        const text = `سلام جناب ${c.name} گرامی،\nبا احترام یادآوری می‌گردد مانده بدهی شما نزد فروشگاه پوشاک، مبلغ ${formatToman(c.balance)} می‌باشد.\nخواهشمند است در صورت امکان جهت هماهنگی و تسویه حساب اقدام فرمایید.\nبا سپاس و احترام.`;
                        setShareModalState({
                          isOpen: true,
                          name: c.name,
                          phone: c.phone || '',
                          text
                        });
                      }}
                      title="ارسال پیامک یادآوری بدهی"
                      className="w-full min-h-[42px] px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ارسال پیامک یادآوری بدهی به مشتری</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال افزودن و ویرایش مشتری */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
      />

      {/* مودال ثبت دریافت / پرداخت سریع */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedCustomer(null);
        }}
        defaultCustomer={selectedCustomer}
        customers={customers}
        onComplete={(toast) => showToast?.(toast)}
      />

      {/* مودال ارسال پیامک و اشتراک یادآوری بدهی */}
      <ShareModal
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState((prev) => ({ ...prev, isOpen: false }))}
        title="ارسال پیامک یادآوری بدهی"
        recipientName={shareModalState.name}
        recipientPhone={shareModalState.phone}
        initialText={shareModalState.text}
        onFeedback={(t) => showToast?.(t)}
      />
    </div>
  );
}
