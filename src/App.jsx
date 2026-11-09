import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, enableStoragePersistence } from './db/db';
import Header from './components/common/Header';
import Navigation from './components/common/Navigation';
import Toast from './components/common/Toast';

import DashboardView from './components/dashboard/DashboardView';
import InventoryView from './components/inventory/InventoryView';
import CustomersView from './components/customers/CustomersView';
import InvoicesView from './components/invoices/InvoicesView';
import ExpensesView from './components/expenses/ExpensesView';
import ChequesView from './components/cheques/ChequesView';

import ProductModal from './components/inventory/ProductModal';
import PaymentModal from './components/customers/PaymentModal';
import NewInvoiceModal from './components/invoices/NewInvoiceModal';
import InvoicePrintModal from './components/invoices/InvoicePrintModal';
import ChequeModal from './components/cheques/ChequeModal';
import HelpModal from './components/common/HelpModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // وضعیت مودال‌های اقدام سراسری
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewChequeOpen, setIsNewChequeOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // دریافت اطلاعات زنده از دیتابیس
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // فعال‌سازی ذخیره‌سازی دائمی تبلت و موبایل
  useEffect(() => {
    enableStoragePersistence();
  }, []);

  // نمایش اعلان پاپ‌آپ
  const showToast = ({ message, type = 'info', duration = 3500 }) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, duration);
    }
  };

  // ثبت کالا از طریق مودال سریع
  const handleSaveProduct = async (productData) => {
    try {
      await db.products.add(productData);
      showToast({ message: 'کالای جدید با موفقیت به انبار افزوده شد.', type: 'success' });
    } catch (err) {
      showToast({ message: `خطا در ثبت کالا: ${err.message}`, type: 'error' });
    }
  };

  // ثبت چک از طریق مودال سریع
  const handleSaveCheque = async (chequeData) => {
    try {
      await db.cheques.add(chequeData);
      showToast({ message: 'چک جدید با موفقیت در دفتر ثبت شد.', type: 'success' });
    } catch (err) {
      showToast({ message: `خطا در ثبت چک: ${err.message}`, type: 'error' });
    }
  };

  // ثبت فاکتور جدید و نمایش پیش‌نمایش چاپ
  const handleInvoiceCreated = (newInv) => {
    showToast({ message: `فاکتور شماره ${newInv.invoiceNumber} با موفقیت صادر گردید.`, type: 'success' });
    setSelectedInvoiceForPrint(newInv);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* هدر بالایی با دکمه صدور فاکتور سریع و راهنما */}
      <Header 
        onQuickNewInvoice={() => setIsNewInvoiceOpen(true)} 
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* منوی تب‌بندی لمسی بهینه‌شده برای موبایل و تبلت */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* محتوای صفحات اصلی */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 sm:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            onOpenNewProduct={() => setIsNewProductOpen(true)}
            onOpenNewCheque={() => setIsNewChequeOpen(true)}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView showToast={showToast} />
        )}

        {activeTab === 'customers' && (
          <CustomersView showToast={showToast} />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            showToast={showToast}
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            onSelectInvoiceForPrint={(inv) => setSelectedInvoiceForPrint(inv)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView showToast={showToast} />
        )}

        {activeTab === 'cheques' && (
          <ChequesView
            showToast={showToast}
            isNewChequeOpen={isNewChequeOpen}
            setIsNewChequeOpen={setIsNewChequeOpen}
          />
        )}
      </main>

      {/* ۱. مودال سراسری صدور فاکتور جدید */}
      <NewInvoiceModal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
        onOpenNewProduct={() => setIsNewProductOpen(true)}
        products={products}
        customers={customers}
      />

      {/* ۲. مودال سراسری چاپ و پیش‌نمایش فاکتور */}
      <InvoicePrintModal
        isOpen={!!selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
        invoice={selectedInvoiceForPrint}
      />

      {/* ۳. مودال سریع ثبت کالا */}
      <ProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSave={handleSaveProduct}
        product={null}
      />

      {/* ۴. مودال سریع تسویه و دریافت/پرداخت وجه */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customers={customers}
        onComplete={(t) => showToast(t)}
      />

      {/* ۵. مودال سریع ثبت چک */}
      <ChequeModal
        isOpen={isNewChequeOpen && activeTab !== 'cheques'}
        onClose={() => setIsNewChequeOpen(false)}
        onSave={handleSaveCheque}
        cheque={null}
        customers={customers}
      />

      {/* ۶. مودال راهنمای جامع و آسان برنامه */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* سیستم توست / پیام‌های موقت */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
