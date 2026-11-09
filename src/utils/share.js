import { toEnglishDigits } from './formatters';

/**
 * تمیزکاری و استانداردسازی شماره موبایل
 */
export function cleanPhoneNumber(phone = '') {
  const eng = toEnglishDigits(String(phone).trim());
  return eng.replace(/[^\d+]/g, '');
}

/**
 * ارسال پیامک مستقیم از طریق مرورگر / PWA
 * این تابع اپلیکیشن پیامک پیش‌فرض دستگاه (سامسونگ مسیج، گوگل مسیجز و...) را
 * با شماره و متن از پیش پر شده باز می‌کند.
 */
export function sendSMS(phone, text) {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  // پروتکل استاندارد RFC 5724 برای ارسال پیامک در مرورگر
  const smsUrl = cleanPhone 
    ? `sms:${cleanPhone}?body=${encodedText}` 
    : `sms:?body=${encodedText}`;

  // باز کردن در کلاینت وب / PWA
  const link = document.createElement('a');
  link.href = smsUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * اشتراک‌گذاری از طریق منوی بومی گوشی (Web Share API)
 * به کاربر اجازه می‌دهد پیام را در واتساپ، ایتا، بله، تلگرام یا پیامک بفرستد
 */
export async function shareViaWebShare({ title = 'دکان', text = '' }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return { success: true, method: 'share' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed:', err);
      }
      return { success: false, error: err.message };
    }
  }
  return { success: false, notSupported: true };
}

/**
 * ارسال مستقیم به واتساپ
 */
export function openWhatsApp(phone, text) {
  let clean = cleanPhoneNumber(phone);
  if (clean.startsWith('0')) {
    clean = '98' + clean.slice(1);
  } else if (!clean.startsWith('98') && !clean.startsWith('+98') && clean.length === 10) {
    clean = '98' + clean;
  }
  clean = clean.replace('+', '');
  
  const encoded = encodeURIComponent(text);
  const url = clean ? `https://wa.me/${clean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

/**
 * کپی سریع متن در کلیپ‌بورد
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

