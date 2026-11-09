import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { formatToman, toPersianDigits } from '../../utils/formatters';
import ProductModal from './ProductModal';
import { 
  Boxes, 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Barcode, 
  PackageX
} from 'lucide-react';

export default function InventoryView({ showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, lowStock, outOfStock
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  // فیلتر و جستجوی زنده
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));

    if (!matchSearch) return false;

    if (filterStatus === 'lowStock') {
      return Number(p.stock) <= Number(p.minStockAlert) && Number(p.stock) > 0;
    }
    if (filterStatus === 'outOfStock') {
      return Number(p.stock) <= 0;
    }
    return true;
  });

  // عملیات ذخیره کالا
  const handleSaveProduct = async (productData) => {
    try {
      if (productData.id) {
        await db.products.update(productData.id, productData);
        showToast?.({ message: 'اطلاعات کالا با موفقیت به‌روزرسانی شد.', type: 'success' });
      } else {
        await db.products.add(productData);
        showToast?.({ message: 'کالای جدید با موفقیت به انبار افزوده شد.', type: 'success' });
      }
    } catch (err) {
      showToast?.({ message: `خطا در ذخیره کالا: ${err.message}`, type: 'error' });
    }
  };

  // افزایش سریع موجودی
  const handleIncreaseStock = async (product, amount = 1) => {
    try {
      const newStock = Number(product.stock) + amount;
      await db.products.update(product.id, { stock: newStock });
      showToast?.({ message: `موجودی ${product.name} افزایش یافت (${toPersianDigits(newStock)})`, type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  // کاهش سریع موجودی
  const handleDecreaseStock = async (product, amount = 1) => {
    try {
      const currentStock = Number(product.stock);
      if (currentStock <= 0) {
        showToast?.({ message: 'موجودی این کالا در انبار صفر است.', type: 'error' });
        return;
      }
      const newStock = Math.max(0, currentStock - amount);
      await db.products.update(product.id, { stock: newStock });
      showToast?.({ message: `موجودی ${product.name} کاهش یافت (${toPersianDigits(newStock)})`, type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  // حذف کالا
  const handleDeleteProduct = async (product) => {
    if (window.confirm(`آیا از حذف کالای «${product.name}» از سیستم مطمئن هستید؟`)) {
      try {
        await db.products.delete(product.id);
        showToast?.({ message: 'کالا از انبار حذف گردید.', type: 'info' });
      } catch (err) {
        showToast?.({ message: `خطا در حذف کالا: ${err.message}`, type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش انبار */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">مدیریت موجودی و انبار</h2>
            <p className="text-xs text-slate-400">
              مجموع {toPersianDigits(products.length)} قلم کالا | {toPersianDigits(filteredProducts.length)} کالا مطابق فیلتر
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>افزودن مدل پوشاک جدید</span>
        </button>
      </div>

      {/* نوار جستجو و فیلترهای لمسی */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* اینپوت جستجوی زنده */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در انبار پوشاک با نام مدل یا بارکد..."
            className="w-full min-h-[50px] pr-12 pl-4 rounded-2xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* فیلترهای وضعیت */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              filterStatus === 'all'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            همه کالاها ({toPersianDigits(products.length)})
          </button>
          <button
            onClick={() => setFilterStatus('lowStock')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              filterStatus === 'lowStock'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>روبه اتمام ({toPersianDigits(products.filter((p) => Number(p.stock) <= Number(p.minStockAlert) && Number(p.stock) > 0).length)})</span>
          </button>
          <button
            onClick={() => setFilterStatus('outOfStock')}
            className={`min-h-[48px] px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
              filterStatus === 'outOfStock'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <PackageX className="w-4 h-4 text-rose-400" />
            <span>ناموجود ({toPersianDigits(products.filter((p) => Number(p.stock) <= 0).length)})</span>
          </button>
        </div>
      </div>

      {/* لیست کارت‌های کالا بهینه‌شده برای لمس تبلت */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-12 text-center text-slate-400">
          <Boxes className="w-16 h-16 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300">پوشاک یا کالایی یافت نشد</h3>
          <p className="text-sm text-slate-500 mt-1">با تغییر فیلتر یا افزودن مدل پوشاک جدید شروع کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = Number(p.stock) <= 0;
            const isLowStock = !isOutOfStock && Number(p.stock) <= Number(p.minStockAlert);

            return (
              <div
                key={p.id}
                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
              >
                {/* بالایی: نام کالا و نشان وضعیت */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-black text-white leading-snug">{p.name}</h3>
                    {isOutOfStock ? (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        ناموجود
                      </span>
                    ) : isLowStock ? (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        کسری انبار
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        موجود
                      </span>
                    )}
                  </div>

                  {p.barcode && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mb-3">
                      <Barcode className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.barcode}</span>
                    </div>
                  )}

                  {/* قیمت‌ها */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block mb-0.5">قیمت خرید:</span>
                      <span className="font-bold text-slate-200">{formatToman(p.buyPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">قیمت فروش:</span>
                      <span className="font-bold text-emerald-400">{formatToman(p.sellPrice)}</span>
                    </div>
                  </div>

                  {/* ویژگی‌های پوشاک: سایزها و رنگ‌ها */}
                  {(p.sizes?.length > 0 || p.colors?.length > 0) && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-xs">
                      {p.sizes?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-400">سایزها:</span>
                          {(Array.isArray(p.sizes) ? p.sizes : String(p.sizes).split(',')).map((sz, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                              {sz}
                            </span>
                          ))}
                        </div>
                      )}
                      {p.colors?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-400">رنگ‌ها:</span>
                          {(Array.isArray(p.colors) ? p.colors : String(p.colors).split(',')).map((col, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-[10px]">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* پایینی: کنترل سریع موجودی با دکمه‌های بزرگ لمسی */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">موجودی:</span>
                      <span className={`text-xl font-black ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                        {toPersianDigits(p.stock)}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">{p.unit}</span>
                    </div>
                    {/* محاسبه معادل جینی در پوشاک */}
                    {(p.unit === 'جین' || (p.packRatio && Number(p.packRatio) > 1)) && (
                      <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        {p.unit === 'جین'
                          ? `معادل ${toPersianDigits(Number(p.stock) * (Number(p.packRatio) || 12))} عدد تکی`
                          : Number(p.stock) >= (Number(p.packRatio) || 12)
                          ? `معادل ${toPersianDigits(Math.floor(Number(p.stock) / (Number(p.packRatio) || 12)))} جین و ${toPersianDigits(Number(p.stock) % (Number(p.packRatio) || 12))} عدد`
                          : null}
                      </p>
                    )}
                  </div>

                  {/* دکمه‌های لمسی سریع + و - */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDecreaseStock(p)}
                      title="کاهش ۱ عدد"
                      className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleIncreaseStock(p)}
                      title="افزایش ۱ عدد"
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <div className="h-6 w-px bg-slate-700 mx-1" />

                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setIsModalOpen(true);
                      }}
                      title="ویرایش کامل"
                      className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p)}
                      title="حذف"
                      className="w-10 h-10 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال افزودن / ویرایش */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </div>
  );
}
