import React, { useState } from 'react';
import Modal from '../common/Modal';
import ShareModal from '../common/ShareModal';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import { Printer, Share2 } from 'lucide-react';

export default function InvoicePrintModal({ isOpen, onClose, invoice }) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  // ساخت متن پیام فاکتور جهت ارسال به مشتری
  const generateInvoiceShareText = () => {
    let lines = [
      `🧾 فاکتور رسمی ${invoice.type || 'فروش'} کالا`,
      `شماره فاکتور: ${toPersianDigits(invoice.invoiceNumber)}`,
      `مشتری گرامی: ${invoice.customerName}`,
      `تاریخ: ${toPersianDigits(invoice.jalaliDate)}`,
      `تسویه: ${invoice.paymentType}`,
      `--------------------------------`,
      `اقلام فاکتور:`
    ];

    (invoice.items || []).forEach((it, idx) => {
      const details = [it.size ? `سایز ${it.size}` : '', it.color ? `${it.color}` : ''].filter(Boolean).join(' - ');
      lines.push(`${idx + 1}. ${it.productName}${details ? ` (${details})` : ''} | ${toPersianDigits(it.quantity)} ${it.unit || 'عدد'} | کل: ${formatToman(it.totalPrice)}`);
    });

    lines.push(`--------------------------------`);
    if (invoice.discount > 0) {
      lines.push(`تخفیف: ${formatToman(invoice.discount)}`);
    }
    lines.push(`مبلغ کل قابل پرداخت: ${formatToman(invoice.finalAmount)}`);
    lines.push(`با تشکر از اعتماد و خرید شما.`);

    return lines.join('\n');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`پیش‌نمایش و چاپ فاکتور شماره ${toPersianDigits(invoice.invoiceNumber)}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* نوار ابزار بالای پیش‌نمایش (در چاپ مخفی است) */}
        <div className="no-print flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700 gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span>جهت چاپ روی کاغذ A4 یا ارسال فاکتور از دکمه‌های زیر استفاده کنید.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="min-h-[48px] px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
              <span>ارسال به مشتری (پیامک/واتساپ)</span>
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>چاپ / ذخیره PDF</span>
            </button>
          </div>
        </div>

        {/* برگه استاندارد فاکتور (مناسب برای صفحه نمایش و پرینت) */}
        <div id="printable-invoice" className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
          {/* هدر فاکتور */}
          <div className="flex flex-wrap items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg sm:text-xl shrink-0">
                دکان
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">فاکتور رسمی {invoice.type || 'فروش'} کالا</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">سیستم حسابداری و صندوق فروش دکان</p>
              </div>
            </div>

            <div className="text-left space-y-1 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500">شماره فاکتور: </span>
                <span className="font-mono font-black text-slate-900">{toPersianDigits(invoice.invoiceNumber)}</span>
              </div>
              <div>
                <span className="text-slate-500">تاریخ صدور: </span>
                <span className="font-bold text-slate-900">{toPersianDigits(invoice.jalaliDate)}</span>
              </div>
              <div>
                <span className="text-slate-500">نوع تسویه: </span>
                <span className="font-bold text-emerald-700">{invoice.paymentType}</span>
              </div>
            </div>
          </div>

          {/* اطلاعات خریدار */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-slate-500">نام طرف‌حساب / خریدار: </span>
              <span className="font-bold text-slate-900 mr-1">{invoice.customerName}</span>
            </div>
          </div>

          {/* جدول اقلام فاکتور */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-y-2 border-slate-800 text-slate-700 font-bold">
                  <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
                  <th className="py-2.5 px-3">شرح کالا / خدمات</th>
                  <th className="py-2.5 px-3 text-center w-24">تعداد / مقدار</th>
                  <th className="py-2.5 px-3 text-center w-20">واحد</th>
                  <th className="py-2.5 px-3 text-left w-36">قیمت واحد (تومان)</th>
                  <th className="py-2.5 px-3 text-left w-36">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-center font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{toPersianDigits(item.quantity)}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.unit || 'عدد'}</td>
                    <td className="py-3 px-3 text-left font-bold text-slate-800">{formatToman(item.unitPrice).replace(' تومان', '')}</td>
                    <td className="py-3 px-3 text-left font-black text-slate-900">{formatToman(item.totalPrice).replace(' تومان', '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* جمع‌ها و مبالغ */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-2 border-slate-800 pt-4 mb-8">
            <div className="text-xs text-slate-500 max-w-sm">
              <p className="font-semibold text-slate-700 mb-1">شرایط فاکتور:</p>
              <p>اجناس فروخته شده در صورت سلامت فیزیکی تا ۴۸ ساعت قابل تعویض می‌باشند. از حسن اعتماد شما سپاسگزاریم.</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-slate-600">
                <span>جمع اقلام:</span>
                <span className="font-bold">{formatToman(invoice.totalAmount)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-bold">
                  <span>تخفیف:</span>
                  <span>{formatToman(invoice.discount)} -</span>
                </div>
              )}
              <div className="h-px bg-slate-300 my-1" />
              <div className="flex justify-between items-center text-base font-black text-slate-900">
                <span>مبلغ نهایی:</span>
                <span className="text-emerald-700">{formatToman(invoice.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* محل امضا */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-center text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800 mb-12">مهر و امضای فروشنده</p>
              <p className="border-t border-slate-300 pt-1">امضا شده</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-12">امضا و تحویل گیرنده</p>
              <p className="border-t border-slate-300 pt-1">نام و امضا</p>
            </div>
          </div>
        </div>

        {/* دکمه‌های پایین مودال */}
        <div className="no-print flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition-all cursor-pointer"
          >
            بستن
          </button>
          <button
            onClick={handlePrint}
            className="min-h-[48px] px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>پرینت فاکتور</span>
          </button>
        </div>
      </div>

      {/* مودال اشتراک و ارسال فاکتور */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={`ارسال فاکتور شماره ${toPersianDigits(invoice.invoiceNumber)}`}
        recipientName={invoice.customerName}
        recipientPhone=""
        initialText={generateInvoiceShareText()}
      />
    </Modal>
  );
}
