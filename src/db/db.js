import Dexie from 'dexie';

export const db = new Dexie('BazaarDB');

// تعریف ساختار و ایندکس‌های پایگاه داده محلی
db.version(1).stores({
  products: '++id, name, barcode, unit, buyPrice, sellPrice, stock, minStockAlert',
  customers: '++id, name, phone, balance, address',
  invoices: '++id, invoiceNumber, customerId, customerName, type, totalAmount, discount, finalAmount, paymentType, date, jalaliDate',
  cheques: '++id, chequeNumber, sayadNumber, bankName, amount, dueDate, jalaliDueDate, personName, type, status'
});

db.version(2).stores({
  products: '++id, name, barcode, unit, buyPrice, sellPrice, stock, minStockAlert, packRatio',
  customers: '++id, name, phone, balance, address, creditLimit',
  invoices: '++id, invoiceNumber, customerId, customerName, type, totalAmount, discount, finalAmount, paymentType, date, jalaliDate',
  cheques: '++id, chequeNumber, sayadNumber, bankName, amount, dueDate, jalaliDueDate, personName, type, status',
  expenses: '++id, title, category, amount, date, jalaliDate'
});

/**
 * درخواست از سیستم‌عامل برای ذخیره‌سازی دائمی در حافظه لوکال
 */
export async function enableStoragePersistence() {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.info(`[BazaarDB] وضعیت ذخیره‌سازی دائمی: ${granted ? 'فعال شد' : 'رد شد'}`);
        return granted;
      }
      return true;
    } catch (err) {
      console.warn('[BazaarDB] خطا در فعال‌سازی ذخیره‌سازی دائمی:', err);
      return false;
    }
  }
  return false;
}

/**
 * پاکسازی کامل تمامی جداول دیتابیس
 */
export async function clearAllDatabase() {
  await db.transaction('rw', db.products, db.customers, db.invoices, db.cheques, db.expenses, async () => {
    await db.products.clear();
    await db.customers.clear();
    await db.invoices.clear();
    await db.cheques.clear();
    await db.expenses.clear();
  });
}

// فعال‌سازی ذخیره‌سازی دائمی هنگام لود اولیه
enableStoragePersistence();
