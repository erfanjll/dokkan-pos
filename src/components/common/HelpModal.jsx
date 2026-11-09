import React, { useState } from 'react';
import Modal from './Modal';
import { 
  HelpCircle, 
  ShoppingBag, 
  Boxes, 
  Users, 
  TrendingUp, 
  CreditCard, 
  HardDrive
} from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  const [activeHelpTab, setActiveHelpTab] = useState('invoices');

  const helpTabs = [
    { id: 'invoices', label: 'فروش و فاکتور', icon: ShoppingBag, color: 'text-emerald-400' },
    { id: 'inventory', label: 'پوشاک و انبار', icon: Boxes, color: 'text-teal-400' },
    { id: 'customers', label: 'مشتریان و نسیه', icon: Users, color: 'text-indigo-400' },
    { id: 'expenses', label: 'هزینه‌ها و سود', icon: TrendingUp, color: 'text-rose-400' },
    { id: 'cheques', label: 'دفتر چک و صیاد', icon: CreditCard, color: 'text-amber-400' },
    { id: 'backup', label: 'بک‌آپ و امنیت', icon: HardDrive, color: 'text-cyan-400' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="راهنمای کامل و گام‌به‌گام نرم‌افزار دکان"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* معرفی اولیه */}
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">راهنمای استفاده ساده و سریع</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              روی هر بخش در زیر بزنید تا قدم‌به‌قدم یاد بگیرید چطور از برنامه به راحتی آب خوردن استفاده کنید.
            </p>
          </div>
        </div>

        {/* منوی تب‌های راهنما (اسکرول افقی روان) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {helpTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeHelpTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveHelpTab(tab.id)}
                className={`min-h-[42px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-md ring-2 ring-emerald-500'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* محتوای تب انتخاب شده */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-slate-200 text-sm leading-relaxed space-y-4">
          {/* ۱. فروش و فاکتور */}
          {activeHelpTab === 'invoices' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>چطور جنس بفروشم و فاکتور صادر کنم؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. زدن دکمه فاکتور:</span>
                  <p className="text-xs text-slate-300">
                    دکمه سبز **«فاکتور جدید»** بالای صفحه یا در داشبورد را بزنید تا پنجره فاکتور باز شود.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. انتخاب خریدار (طرف‌حساب):</span>
                  <p className="text-xs text-slate-300">
                    نام مشتری را از منوی کشویی انتخاب کنید. (اگر مشتری جدیده، دکمه «+» جلویش را بزنید و سریع اسمش را ثبت کنید).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. انتخاب لباس و مشخصات:</span>
                  <p className="text-xs text-slate-300">
                    مدل لباس موردنظر را انتخاب کنید. بلافاصله سایزها و رنگ‌های موجود ظاهر می‌شوند. سایز، رنگ و تعداد را انتخاب کنید. اگر جینی می‌فروشید، گزینه «جین» را بزنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۴. افزودن به فاکتور:</span>
                  <p className="text-xs text-slate-300">
                    دکمه سبز **(+)** را بزنید تا قلم وارد جدول شود. برای لباس‌های بعدی هم همین کار را تکرار کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۵. انتخاب روش تسویه:</span>
                  <p className="text-xs text-slate-300">
                    یکی از گزینه‌های **نقد**، **کارتخوان**، **نسیه** یا **چک** را انتخاب کنید. اگر نسیه انتخاب کنید، مبلغ خودکار به بدهی‌های مشتری اضافه می‌شود.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۶. ثبت نهایی و ارسال فاکتور:</span>
                  <p className="text-xs text-slate-300">
                    دکمه سبز پایین صفحه **«ثبت و صدور فاکتور»** را بزنید. فاکتور صادر شده و موجودی انبار خودکار کم می‌شود. در صفحه باز شده، دکمه **«ارسال به مشتری»** را بزنید تا متن فاکتور در واتساپ، ایتا یا پیامک برایش فرستاده شود!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ۲. پوشاک و انبار */}
          {activeHelpTab === 'inventory' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-teal-400 flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                <span>چطور لباس جدید با سایز و رنگ در انبار ثبت کنم؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. ورود به انبار:</span>
                  <p className="text-xs text-slate-300">
                    از منوی بالای صفحه روی تب **«انبار و کالاها»** بزنید و دکمه سبز **«افزودن مدل پوشاک جدید»** را لمس کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. نام و بارکد:</span>
                  <p className="text-xs text-slate-300">
                    نام مدل را بنویسید (مثلاً: شلوار جین مام استایل ترک). کادر بارکد را اگر خالی بگذارید، برنامه خودکار یک بارکد استاندارد به آن اختصاص می‌دهد.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. سایزها و رنگ‌ها:</span>
                  <p className="text-xs text-slate-300">
                    خیلی ساده روی سایزهایی که موجود دارید کلیک کنید تا سبز شوند (مثلاً ۳۲، ۳۴، ۳۶ یا M، L، XL). همچنین رنگ‌های لباس (مشکی، طوسی، ذغالی...) را انتخاب کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۴. قیمت خرید، قیمت فروش و موجودی:</span>
                  <p className="text-xs text-slate-300">
                    قیمتی که خودتان خریدید، قیمتی که می‌فروشید، و تعداد فعلی در انبار را وارد کنید. اگر جینی می‌فروشید، ضریب جین (۱۲ عدد) را تنظیم کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۵. تغییر سریع موجودی:</span>
                  <p className="text-xs text-slate-300">
                    در صفحه انبار، روی هر کارت دو دکمه **(+)** و **(-)** هست که می‌توانید با ۱ لمس، موجودی را کم یا زیاد کنید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ۳. مشتریان و نسیه */}
          {activeHelpTab === 'customers' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-indigo-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>چطور بدهی‌ها، نسیه‌ها و تسویه‌ها را مدیریت کنم؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. ثبت مشتری جدید و سقف اعتبار:</span>
                  <p className="text-xs text-slate-300">
                    در تب **«طرف‌حساب‌ها»** دکمه «مشتری جدید» را بزنید. اسم، شماره موبایل و سقف اعتبار نسیه (مثلاً ۳۰ میلیون تومان) را بنویسید تا اگر بدهی‌اش بیشتر شد به شما هشدار بدهد.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. رنگ کارت‌ها (وضعیت حساب):</span>
                  <p className="text-xs text-slate-300">
                    کارت مشتریانی که بدهکارند **قرمز** می‌شود (طلب ما). کارت کسانی که تسویه کامل کرده‌اند طوسی، و بستانکارها سبز می‌شوند.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. ثبت پول دریافتی از مشتری (تسویه حساب):</span>
                  <p className="text-xs text-slate-300">
                    وقتی مشتری پول آورد، روی دکمه بنفش **«ثبت دریافت / پرداخت وجه»** بزنید. مبلغ را بنویسید؛ خودکار از مانده بدهی مشتری کسر می‌شود.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۴. ارسال پیامک یادآوری بدهی با یک لمس:</span>
                  <p className="text-xs text-slate-300">
                    روی کارت مشتری بدهکار، دکمه **«ارسال پیامک یادآوری بدهی به مشتری»** را بزنید. بلافاصله صفحه ارسال پیامک گوشی با شماره مشتری و متن رسمی محترمانه باز می‌شود و فقط دکمه Send را می‌زنید!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ۴. هزینه‌ها و سود */}
          {activeHelpTab === 'expenses' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-rose-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>چطور بفهمم مغازه چقدر سود خالص کرده است؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. تب هزینه‌ها و سود (کنار داشبورد):</span>
                  <p className="text-xs text-slate-300">
                    این تب دخل و خرج واقعی شما را مو‌به‌مو محاسبه می‌کند.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. معنی کارت‌های آماری:</span>
                  <ul className="text-xs text-slate-300 space-y-1 mt-1 list-disc list-inside">
                    <li>**کل فروش:** جمع کل مبلغی که فروخته‌اید.</li>
                    <li>**سود ناخالص اجناس:** تفاضل قیمت فروش و قیمت خرید پوشاک.</li>
                    <li>**کل هزینه‌های مغازه:** مخارج روزمره مثل کرایه، حقوق و باربری.</li>
                    <li>**سود خالص واقعی (کادر سبز):** درآمد خالص نهایی شما پس از کسر تمام مخارج!</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. ثبت هزینه‌های مغازه:</span>
                  <p className="text-xs text-slate-300">
                    دکمه قرمز **«ثبت هزینه جدید»** را بزنید. نوع هزینه (کرایه مغازه، حقوق شاگرد، باربری تیپاکس، قبض برق، نایلون و کاور لباس، پذیرایی و چای) را انتخاب کرده و مبلغ را ثبت کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۴. پرفروش‌ترین مدل‌های پوشاک:</span>
                  <p className="text-xs text-slate-300">
                    پایین صفحه نشان داده می‌شود کدام مدل‌های لباس بیشترین تعداد فروش را داشته‌اند تا همیشه پرطرفدارها را موجود نگه دارید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ۵. دفتر چک و صیاد */}
          {activeHelpTab === 'cheques' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-amber-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>چطور چک‌های دریافتی و پرداختی را ثبت و پیگیری کنم؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. ثبت چک:</span>
                  <p className="text-xs text-slate-300">
                    در تب **«دفتر چک و داده‌ها»**، دکمه «ثبت چک جدید» را بزنید. شماره چک، صیاد ۱۶ رقمی، نام بانک، مبلغ و تاریخ سررسید شمسی را وارد کنید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. هشدار سررسید در داشبورد:</span>
                  <p className="text-xs text-slate-300">
                    هر چکی که ۳ روز یا کمتر به تاریخ سررسیدش مانده باشد، در صفحه داشبورد با رنگ زرد چشمک‌زن اخطار داده می‌شود تا موعدش فراموش نشود.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. پیامک یادآوری سررسید:</span>
                  <p className="text-xs text-slate-300">
                    روی کارت چک دکمه **«پیامک یادآوری سررسید»** را لمس کنید تا پیامک حاوی شماره چک، مبلغ و تاریخ برای صاحب چک ارسال شود.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۴. اعلام وضعیت چک:</span>
                  <p className="text-xs text-slate-300">
                    هر زمان چک وصول شد، دکمه **«پاس شد»** را بزنید. اگر برگشت خورد، دکمه **«برگشت خورد»** یا **«خرج شد»** را لمس کنید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ۶. بک‌آپ و امنیت */}
          {activeHelpTab === 'backup' && (
            <div className="space-y-3.5">
              <h4 className="text-base font-black text-cyan-400 flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                <span>چطور نسخه پشتیبان بگیرم که خیالم ۱۰۰٪ راحت باشد؟</span>
              </h4>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۱. آیا برنامه آفلاین کار می‌کند؟</span>
                  <p className="text-xs text-slate-300">
                    بله! برنامه ۱۰۰٪ روی حافظه داخلی گوشی شما ذخیره است و بدون اینترنت هم تمام بخش‌های آن کار می‌کند.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۲. نحوه تهیه فایل بک‌آپ (توصیه: هر هفته یک بار):</span>
                  <p className="text-xs text-slate-300">
                    به تب **«دفتر چک و داده‌ها»** بروید، به پایین صفحه اسکرول کنید و دکمه آبی **«دانلود نسخه پشتیبان (JSON)»** را بزنید. یک فایل شامل تمام حساب‌هایتان روی گوشی ذخیره می‌شود. می‌توانید آن را برای خودتان در تلگرام یا ایتا بفرستید.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-white block mb-1">۳. نحوه بازیابی اطلاعات:</span>
                  <p className="text-xs text-slate-300">
                    اگر گوشی را عوض کردید، برنامه را باز کرده و دکمه سبز **«بارگذاری فایل پشتیبان»** را بزنید و همان فایل را انتخاب کنید. همه حساب‌ها فوراً زنده می‌شوند!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* دکمه بستن */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-[46px] px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            متوجه شدم، بستن راهنما
          </button>
        </div>
      </div>
    </Modal>
  );
}
