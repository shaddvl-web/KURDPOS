import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Barcode, Plus, Minus, Trash2, ShoppingCart,
  UserCheck, PauseCircle, PlayCircle, Tag, Check, AlertTriangle,
  RotateCcw, Sparkles
} from 'lucide-react';
import { Product, Category, CartItem, Customer, Settings, Shift, User } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  cart: CartItem[];
  onUpdateCart: (newCart: CartItem[]) => void;
  invoiceDiscount: number;
  onUpdateInvoiceDiscount: (disc: number) => void;
  onOpenPaymentModal: () => void;
  onHoldInvoice: () => void;
  onOpenHeldModal: () => void;
  heldCount: number;
  settings: Settings;
  currentShift: Shift;
  currentUser: User;
}

export const PosScreen: React.FC<Props> = ({
  products,
  categories,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  cart,
  onUpdateCart,
  invoiceDiscount,
  onUpdateInvoiceDiscount,
  onOpenPaymentModal,
  onHoldInvoice,
  onOpenHeldModal,
  heldCount,
  settings,
  currentShift,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(0);
  const [scannerNotification, setScannerNotification] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input on load and after actions
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  // Handle Barcode Scanner Input (Terminates with Enter)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Search exact barcode first
    let product = products.find(p => p.barcode === query && p.active);

    // Fallback: SKU or exact name match
    if (!product) {
      product = products.find(
        p => (p.sku.toLowerCase() === query.toLowerCase() || p.nameKu === query) && p.active
      );
    }

    // Fallback 2: first partial match if typed
    if (!product) {
      product = products.find(
        p => (p.nameKu.includes(query) || p.nameEn.toLowerCase().includes(query.toLowerCase())) && p.active
      );
    }

    if (product) {
      addProductToCart(product);
      setScannerNotification(`سکان کرا: ${product.nameKu}`);
      setTimeout(() => setScannerNotification(null), 2500);
      setSearchQuery('');
    } else {
      posSound.playError();
      setScannerNotification(`کاڵا بە بارکۆدی (${query}) نەدۆزرایەوە!`);
      setTimeout(() => setScannerNotification(null), 3000);
    }
  };

  const addProductToCart = (prod: Product) => {
    if (prod.stock <= 0) {
      posSound.playError();
      alert(`بڕی کاڵای "${prod.nameKu}" لە کۆگا نەماوە (Out of Stock)!`);
      return;
    }

    posSound.playBarcodeBeep();

    const existingIndex = cart.findIndex(i => i.product.id === prod.id);
    let newCart = [...cart];

    if (existingIndex >= 0) {
      const currentQty = newCart[existingIndex].quantity;
      if (currentQty + 1 > prod.stock) {
        posSound.playError();
        alert(`بڕی کاڵا لە کۆگا بەس نییە! تەنها ${prod.stock} دانە لە ستۆک ماوە.`);
        return;
      }
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].total =
        newCart[existingIndex].quantity * (newCart[existingIndex].unitPrice - newCart[existingIndex].discount);
      setSelectedCartIndex(existingIndex);
    } else {
      const unitPrice = prod.discountPrice && prod.discountPrice > 0 ? prod.discountPrice : prod.sellingPrice;
      const newItem: CartItem = {
        product: prod,
        quantity: 1,
        unitPrice,
        discount: 0,
        total: unitPrice,
      };
      newCart.unshift(newItem);
      setSelectedCartIndex(0);
    }

    onUpdateCart(newCart);
  };

  const updateQuantity = (index: number, delta: number) => {
    if (index < 0 || index >= cart.length) return;
    const newCart = [...cart];
    const item = newCart[index];
    const targetQty = item.quantity + delta;

    if (targetQty <= 0) {
      removeItem(index);
      return;
    }

    if (targetQty > item.product.stock) {
      posSound.playError();
      alert(`بڕی داواکراو لە ستۆک بەردەست نییە! بەردەست: ${item.product.stock}`);
      return;
    }

    posSound.playClick();
    item.quantity = targetQty;
    item.total = item.quantity * (item.unitPrice - item.discount);
    onUpdateCart(newCart);
  };

  const updateItemDiscount = (index: number, discountPerUnit: number) => {
    if (index < 0 || index >= cart.length) return;
    const newCart = [...cart];
    const item = newCart[index];
    item.discount = Math.max(0, discountPerUnit);
    item.total = item.quantity * (item.unitPrice - item.discount);
    onUpdateCart(newCart);
  };

  const removeItem = (index: number) => {
    posSound.playClick();
    const newCart = cart.filter((_, i) => i !== index);
    onUpdateCart(newCart);
    if (selectedCartIndex >= newCart.length) {
      setSelectedCartIndex(Math.max(0, newCart.length - 1));
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('ئایا دڵنیایت لە بەتاڵکردنەوەی سەبەتەی ئێستا؟')) {
      posSound.playClick();
      onUpdateCart([]);
      onUpdateInvoiceDiscount(0);
    }
  };

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        p.nameKu.includes(searchQuery) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch && p.active;
    });
  }, [products, selectedCategory, searchQuery]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (!settings.taxEnabled || settings.taxRate <= 0) return 0;
    return Math.round((subtotal * settings.taxRate) / 100);
  }, [subtotal, settings]);

  const grandTotal = Math.max(0, subtotal - invoiceDiscount + taxAmount);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f0f2f5] select-none" dir="rtl">
      {/* LEFT/MAIN AREA: Search & Product Catalog */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        {/* Top Search & Category Card */}
        <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200 mb-3 shrink-0 space-y-3">
          {/* Barcode & Search Input Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بارکۆد یان ناوی کاڵا داخڵ بکە (F2)..."
                className="w-full h-12 bg-slate-50 border-2 border-blue-500 rounded-lg pr-11 pl-4 text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                dir="rtl"
                autoFocus
              />
              <div className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-xs transition-all active:translate-y-px flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>زیادکردن</span>
            </button>
          </form>

          {/* Scanner Success / Error Notification Pill */}
          {scannerNotification && (
            <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span>{scannerNotification}</span>
              <span className="text-[10px] text-blue-600 font-mono">سکان کرا</span>
            </div>
          )}

          {/* Quick Category Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => { setSelectedCategory('all'); posSound.playClick(); }}
              className={`px-4 py-1.5 rounded-md font-bold transition-all whitespace-nowrap border ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              هەموو جۆرەکان ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); posSound.playClick(); }}
                  className={`px-4 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span>{cat.nameKu}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto pr-0.5 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 bg-white rounded-lg border border-slate-200">
              <ShoppingCart className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">هیچ کاڵایەک نەدۆزرایەوە</p>
              <p className="text-xs text-slate-400 mt-1">وشەیەکی تر بنووسە یان بارکۆدەکەی سکان بکە</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                return (
                  <button
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    disabled={isOutOfStock}
                    className={`group bg-white rounded-lg border p-2.5 shadow-xs flex flex-col items-center text-center cursor-pointer transition-all ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-blue-500 hover:shadow-md hover:ring-2 hover:ring-blue-100 active:scale-[0.98]'
                    }`}
                  >
                    {/* Image Placeholder */}
                    <div className="w-full aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center text-slate-400 text-xs relative overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.nameKu}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-slate-400 text-xs">وێنە نییە</span>
                      )}

                      {/* Stock badge */}
                      <span
                        className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shadow-xs ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white/95 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isOutOfStock ? 'نەماوە' : `${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="font-bold text-sm text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600">
                      {product.nameKu}
                    </div>

                    {/* Price */}
                    <div className="text-blue-600 font-bold text-base md:text-lg">
                      {product.sellingPrice.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">د.ع</span>
                    </div>

                    {/* Barcode / Stock Micro info */}
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono" dir="ltr">
                      کۆگا: {product.stock} دانە
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AREA: Shopping Cart & Checkout Summary */}
      <aside className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col shadow-lg shrink-0">
        {/* Cart Header */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>سەبەتەی کڕین</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                {totalItemCount} بابەت
              </span>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-slate-400 hover:text-red-500 p-1 transition-colors disabled:opacity-30"
                title="بەتاڵکردنەوەی سەبەتە (CTRL+N)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="flex-1 bg-white border border-slate-300 py-1.5 px-2 rounded-md text-xs text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:border-blue-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  کڕیار: {c.name} {c.currentBalance > 0 ? `(قەرز: ${c.currentBalance.toLocaleString()} د.ع)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Balance Warning */}
        {selectedCustomer && selectedCustomer.currentBalance > 0 && (
          <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 flex items-center justify-between font-mono">
            <span>قەرزی پێشووی کڕیار:</span>
            <span className="font-bold">{selectedCustomer.currentBalance.toLocaleString()} د.ع</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingCart className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">سەبەتە بەتاڵە</p>
              <p className="text-xs text-slate-400 mt-1">بارکۆدی کاڵاکان سکان بکە یان کلیکیان لێ بکە</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="text-right py-2 font-medium">کاڵا</th>
                  <th className="text-center py-2 font-medium">بڕ</th>
                  <th className="text-left py-2 font-medium">کۆ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item, idx) => {
                  const isSelected = selectedCartIndex === idx;

                  return (
                    <tr
                      key={item.product.id}
                      onClick={() => setSelectedCartIndex(idx)}
                      className={`group cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5">
                        <div className={`font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                          {item.product.nameKu}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.unitPrice.toLocaleString()} د.ع
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(idx, -1);
                            }}
                            className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold font-mono text-xs w-5 text-center text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(idx, 1);
                            }}
                            className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 text-left font-bold font-mono text-xs text-slate-800">
                        {item.total.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Financial Calculation & Checkout Area (Dark Theme from Design) */}
        <div className="p-4 bg-slate-900 text-white shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] space-y-3">
          <div className="space-y-2 mb-2">
            <div className="flex justify-between text-slate-400 text-xs">
              <span>کۆی گشتی:</span>
              <span className="font-mono">{subtotal.toLocaleString()} د.ع</span>
            </div>

            {/* Discount input row */}
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="text-slate-300">داشکان (F7):</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={invoiceDiscount || ''}
                  onChange={(e) => onUpdateInvoiceDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-green-400 text-left focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
                <span className="text-[10px] text-green-400 font-bold">د.ع</span>
              </div>
            </div>

            {settings.taxEnabled && (
              <div className="flex justify-between text-slate-400 text-xs">
                <span>باج ({settings.taxRate}%):</span>
                <span className="font-mono">+{taxAmount.toLocaleString()} د.ع</span>
              </div>
            )}

            <div className="h-px bg-slate-700 my-2"></div>

            {/* Grand Total */}
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-slate-200">کۆی کۆتایی:</span>
              <span className="text-3xl lg:text-4xl font-black text-blue-400 font-mono">
                {grandTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-blue-400 font-mono">
              <span>~ ${(grandTotal / settings.currencyRate).toFixed(2)} USD</span>
              <span className="tracking-widest uppercase">IQD</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onHoldInvoice}
              disabled={cart.length === 0}
              className="bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-bold text-xs border border-slate-700 text-slate-200 flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
              title="ڕاگرتنی وەصڵ (F9)"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>ڕاگرتن (F9)</span>
            </button>

            <button
              onClick={onOpenHeldModal}
              className="bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-bold text-xs border border-slate-700 text-slate-200 flex items-center justify-center gap-1 transition-colors relative"
              title="وەصڵە ڕاگیراوەکان (F10)"
            >
              <PlayCircle className="w-4 h-4 text-blue-400" />
              <span>هێنانەوە (F10)</span>
              {heldCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 rounded-full w-4 h-4 text-[10px] font-black font-mono flex items-center justify-center">
                  {heldCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (cart.length === 0) {
                  posSound.playError();
                  alert('سەبەتە بەتاڵە! تکایە سەرەتا کاڵا زیاد بکە.');
                  return;
                }
                posSound.playClick();
                onOpenPaymentModal();
              }}
              disabled={cart.length === 0}
              className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-sm shadow-lg active:translate-y-px transition-all text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>پارەدان (F4)</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
