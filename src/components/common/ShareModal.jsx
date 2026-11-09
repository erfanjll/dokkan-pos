import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { sendSMS, shareViaWebShare, openWhatsApp, copyToClipboard } from '../../utils/share';
import { MessageSquare, Share2, Copy, Check, Phone } from 'lucide-react';

export default function ShareModal({
  isOpen,
  onClose,
  title = 'ارسال پیام و یادآوری',
  recipientName = '',
  recipientPhone = '',
  initialText = '',
  onFeedback
}) {
  const [phone, setPhone] = useState(recipientPhone);
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone(recipientPhone || '');
      setText(initialText || '');
      setCopied(false);
    }
  }, [isOpen, recipientPhone, initialText]);

  if (!isOpen) return null;

  const handleSendSMS = () => {
    sendSMS(phone, text);
    onFeedback?.({ message: 'اپلیکیشن پیامک با موفقیت باز شد.', type: 'info' });
  };

  const handleShareMessenger = async () => {
    const res = await shareViaWebShare({ title, text });
    if (res.notSupported) {
      // اگر وب‌شیر پشتیبانی نشد، مستقیماً واتساپ را باز کن
      openWhatsApp(phone, text);
      onFeedback?.({ message: 'هدایت به واتساپ انجام شد.', type: 'info' });
    } else if (res.success) {
      onFeedback?.({ message: 'منوی اشتراک‌گذاری باز شد.', type: 'success' });
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      onFeedback?.({ message: 'متن پیام در کلیپ‌بورد کپی شد.', type: 'success' });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* اطلاعات گیرنده */}
        {recipientName && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-sm">
            <span className="text-slate-400">گیرنده پیام:</span>
            <span className="font-bold text-white">{recipientName}</span>
          </div>
        )}

        {/* شماره موبایل */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            شماره موبایل جهت ارسال پیامک:
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 09123456789"
              dir="ltr"
              className="w-full min-h-[48px] px-4 pl-11 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-left focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* متن پیام آماده (قابل ویرایش) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300">
              متن پیام (امکان ویرایش قبل از ارسال):
            </label>
            <span className="text-[11px] text-slate-400">
              {text.length} کاراکتر
            </span>
          </div>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* دکمه‌های اقدام سریع لمسی */}
        <div className="pt-2 space-y-2.5">
          {/* دکمه اصلی: ارسال پیامک SMS */}
          <button
            onClick={handleSendSMS}
            className="w-full min-h-[50px] px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            <span>ارسال پیامک مستقیم (SMS)</span>
          </button>

          {/* دو دکمه مکمل: اشتراک در پیام‌رسان‌ها و کپی */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareMessenger}
              className="min-h-[46px] px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>واتساپ / ایتا / بله</span>
            </button>

            <button
              onClick={handleCopy}
              className={`min-h-[46px] px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-800 text-emerald-200 border border-emerald-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'متن کپی شد' : 'کپی متن'}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 pt-1">
          💡 با کلیک روی پیامک، صفحه ارسال پیامک گوشی با شماره و متن آماده باز خواهد شد.
        </p>
      </div>
    </Modal>
  );
}
