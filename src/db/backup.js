import { db, clearAllDatabase } from './db';
import { getTodayJalali, toEnglishDigits } from '../utils/formatters';

/**
 * خروجی گرفتن از کل پایگاه داده به صورت فایل JSON و ذخیره روی حافظه
 */
export async function exportDatabase() {
  try {
    const products = await db.products.toArray();
    const customers = await db.customers.toArray();
    const invoices = await db.invoices.toArray();
    const cheques = await db.cheques.toArray();
    const expenses = await db.expenses.toArray();

    const todayJalali = getTodayJalali();
    const cleanDate = toEnglishDigits(todayJalali).replace(/\//g, '-');
    const timestamp = Date.now();

    const backupPayload = {
      version: 2,
      appName: 'DokanPOS',
      exportedAt: new Date().toISOString(),
      jalaliExportDate: todayJalali,
      data: {
        products,
        customers,
        invoices,
        cheques,
        expenses
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dokan-backup-${cleanDate}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'نسخه پشتیبان با موفقیت دانلود و در حافظه ذخیره شد.',
      counts: {
        products: products.length,
        customers: customers.length,
        invoices: invoices.length,
        cheques: cheques.length,
        expenses: expenses.length
      }
    };
  } catch (error) {
    console.error('خطا در تهیه نسخه پشتیبان:', error);
    return {
      success: false,
      message: `خطا در استخراج اطلاعات: ${error.message}`
    };
  }
}

/**
 * بازیابی پایگاه داده از روی فایل پشتیبان JSON
 */
export async function importDatabase(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('محتوای فایل معتبر نمی‌باشد.');
    }

    const parsed = JSON.parse(jsonString);

    if (!parsed || !parsed.data) {
      throw new Error('ساختار فایل پشتیبان سازگار با نرم‌افزار بازار نیست.');
    }

    const { products = [], customers = [], invoices = [], cheques = [], expenses = [] } = parsed.data;

    await db.transaction('rw', db.products, db.customers, db.invoices, db.cheques, db.expenses, async () => {
      // پاکسازی رکوردهای فعلی
      await db.products.clear();
      await db.customers.clear();
      await db.invoices.clear();
      await db.cheques.clear();
      await db.expenses.clear();

      // درج رکوردهای جدید
      if (products.length > 0) await db.products.bulkAdd(products);
      if (customers.length > 0) await db.customers.bulkAdd(customers);
      if (invoices.length > 0) await db.invoices.bulkAdd(invoices);
      if (cheques.length > 0) await db.cheques.bulkAdd(cheques);
      if (expenses.length > 0) await db.expenses.bulkAdd(expenses);
    });

    return {
      success: true,
      message: 'اطلاعات با موفقیت بازیابی و جایگزین شدند.',
      counts: {
        products: products.length,
        customers: customers.length,
        invoices: invoices.length,
        cheques: cheques.length,
        expenses: expenses.length
      }
    };
  } catch (error) {
    console.error('خطا در بازیابی نسخه پشتیبان:', error);
    return {
      success: false,
      message: `خطا در بازگردانی فایل: ${error.message}`
    };
  }
}

/**
 * پاکسازی کامل تمامی اطلاعات پایگاه داده
 */
export async function resetDatabaseToEmpty() {
  try {
    await clearAllDatabase();
    return { success: true, message: 'کلیه اطلاعات پایگاه داده پاکسازی و صفر شدند.' };
  } catch (error) {
    return { success: false, message: `خطا در پاکسازی: ${error.message}` };
  }
}
