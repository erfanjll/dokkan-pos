import { toJalaali, toGregorian } from 'jalaali-js';

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * تبدیل ارقام انگلیسی و عربی به فارسی
 */
export function toPersianDigits(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[0-9]/g, (w) => persianDigits[+w])
    .replace(/[٠-٩]/g, (w) => persianDigits[w.charCodeAt(0) - 1632]);
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
export function toEnglishDigits(str) {
  if (str === null || str === undefined) return '';
  let s = String(str);
  for (let i = 0; i < 10; i++) {
    s = s.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
  }
  return s.replace(/[٠-٩]/g, (w) => String(w.charCodeAt(0) - 1632));
}

/**
 * فرمت عدد به صورت سه رقم سه رقم با ارقام فارسی
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return '۰';
  const parts = Math.round(Number(num)).toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(parts.join('.'));
}

/**
 * فرمت مبلغ به صورت تومان (مثال: ۱,۲۵۰,۰۰۰ تومان)
 */
export function formatToman(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '۰ تومان';
  }
  const numericAmount = Math.round(Number(amount));
  const isNegative = numericAmount < 0;
  const formatted = formatNumber(Math.abs(numericAmount));
  return `${isNegative ? 'منفی ' : ''}${formatted} تومان`;
}

/**
 * استخراج عدد خالص از ورودی‌های متنی و قیمت‌ها
 */
export function parseToman(str) {
  if (!str) return 0;
  const enStr = toEnglishDigits(String(str)).replace(/[^0-9-]/g, '');
  const parsed = parseInt(enStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * دریافت تاریخ امروز به صورت شمسی (مثال: ۱۴۰۳/۰۸/۱۹)
 */
export function getTodayJalali() {
  const now = new Date();
  const j = toJalaali(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
}

/**
 * تبدیل هر نوع تاریخ (Date, timestamp, ISO) به تاریخ شمسی با فرمت YYYY/MM/DD
 */
export function formatJalaliDate(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const j = toJalaali(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${j.jy}/${pad(j.jm)}/${pad(j.jd)}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * محاسبه روزهای باقیمانده تا یک تاریخ شمسی
 * مقدار بازگشتی:
 * منفی: سررسید گذشته
 * صفر: سررسید امروز
 * مثبت: روزهای باقیمانده تا سررسید
 */
export function getDaysUntilJalali(jalaliDateStr) {
  if (!jalaliDateStr) return null;
  const parts = jalaliDateStr.split('/').map((p) => parseInt(toEnglishDigits(p), 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }

  const [jy, jm, jd] = parts;
  try {
    const gregTarget = toGregorian(jy, jm, jd);
    const targetDate = new Date(gregTarget.gy, gregTarget.gm - 1, gregTarget.gd);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
