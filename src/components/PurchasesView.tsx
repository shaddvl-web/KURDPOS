import React, { useState } from 'react';
import { ArrowDownToLine, Plus, Search, Truck, Calendar, Check, Trash2, X, Eye } from 'lucide-react';
import { Purchase, PurchaseItem, Supplier, Product } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  onRecordPurchase: (purchase: Purchase) => void;
}

export const PurchasesView: React.FC<Props> = ({
  purchases,
  suppliers,
  products,
  onRecordPurchase,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Add Item to Purchase form
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(products[0]?.purchasePrice || 1000);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemCost(prod.purchasePrice);
    }
  };

  const addItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIdx = items.findIndex(i => i.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += itemQty;
      updated[existingIdx].purchasePrice = itemCost;
      updated[existingIdx].total = updated[existingIdx].quantity * itemCost;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productNameKu: prod.nameKu,
          quantity: itemQty,
          purchasePrice: itemCost,
          total: itemQty * itemCost,
        }
      ]);
    }
    posSound.playClick();
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('تکایە سەرەتا کاڵاکان زیاد بکە بۆ وەصڵی کڕین!');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    const invNumber = 'PUR-' + Date.now().toString().slice(-6);

    const purchase: Purchase = {
      id: 'pur-' + Date.now(),
      invoiceNumber: invNumber,
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'دابینکەری گشتی',
      date: new Date().toISOString(),
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      paidAmount,
      notes,
    };

    onRecordPurchase(purchase);
    posSound.playSuccess();
    setIsModalOpen(false);
    setItems([]);
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">داغڵکردنی کڕین (Purchase Management)</h1>
            <p className="text-xs text-slate-400">تۆمارکردنی وەصڵی دابینکەران، زیادبوونی خۆکاری ستۆک و قەرز</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setPaidAmount(0);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>تۆمارکردنی وەصڵی کڕینی نوێ</span>
        </button>
      </div>

      {/* Purchases Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>لیستی وەصڵەکانی کڕین لە دابینکەران</span>
          <span className="text-slate-500 font-mono">کۆی وەصڵەکان: {purchases.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">ژمارەی وەصڵ</th>
                <th className="p-3">دابینکەر</th>
                <th className="p-3">کاتی کڕین</th>
                <th className="p-3">ژمارەی کاڵا</th>
                <th className="p-3">کۆی تێچوو</th>
                <th className="p-3">دراو</th>
                <th className="p-3">ماوەی قەرز</th>
                <th className="p-3 text-center">وردەکاری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    هیچ وەصڵێکی کڕین تا ئێستا تۆمار نەکراوە
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const debt = p.total - p.paidAmount;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-sky-400">{p.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-white">{p.supplierName}</td>
                      <td className="p-3 font-mono text-slate-400">{new Date(p.date).toLocaleString('ckb-IQ')}</td>
                      <td className="p-3 font-mono text-slate-300">{p.items.length} جۆر</td>
                      <td className="p-3 font-mono font-bold text-white">{p.total.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono text-emerald-400">{p.paidAmount.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono">
                        {debt > 0 ? (
                          <span className="text-red-400 font-bold">+{debt.toLocaleString()} د.ع</span>
                        ) : (
                          <span className="text-slate-500">تەواو دراوە</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingPurchase(p)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                          title="پیشاندان"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">تۆمارکردنی وەصڵی کڕینی نوێ لە دابینکەر</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">دابینکەر (Supplier) *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.company || 'کۆمپانیا'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add item box */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-sky-400 block">زیادکردنی کاڵا بۆ ئەم وەصڵە:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">کاڵا</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameKu} ({p.barcode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">بڕ (دانە)</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">نرخی کڕین (تێچوو)</label>
                    <input
                      type="number"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  + زیادکردن بۆ وەصڵ
                </button>
              </div>

              {/* Items List in current invoice */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-850 text-slate-400 font-mono">
                    <tr>
                      <th className="p-2.5">کاڵا</th>
                      <th className="p-2.5">بڕ</th>
                      <th className="p-2.5">تێچوو</th>
                      <th className="p-2.5">کۆ</th>
                      <th className="p-2.5 text-center">سڕینەوە</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          هیچ کاڵایەک زیاد نەکراوە
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-white">{it.productNameKu}</td>
                          <td className="p-2.5 font-mono text-center">{it.quantity}</td>
                          <td className="p-2.5 font-mono">{it.purchasePrice.toLocaleString()} د.ع</td>
                          <td className="p-2.5 font-mono font-bold text-sky-400">{it.total.toLocaleString()} د.ع</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">پارەی پێدراو بۆ دابینکەر (د.ع):</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 font-bold"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    قەرزی تۆمارکراو: {(subtotal - paidAmount).toLocaleString()} د.ع
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center text-left font-mono">
                  <span className="text-xs text-slate-400">کۆی گشتی وەصڵ:</span>
                  <span className="text-xl font-black text-white">{subtotal.toLocaleString()} د.ع</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg disabled:opacity-40"
                >
                  پاشەکەوتکردنی کڕین و نوێکردنەوەی ستۆک
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">وردەکاری وەصڵی {viewingPurchase.invoiceNumber}</h2>
              <button onClick={() => setViewingPurchase(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>دابینکەر:</span>
                <span className="font-bold text-white">{viewingPurchase.supplierName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>کاتی تۆمارکردن:</span>
                <span>{new Date(viewingPurchase.date).toLocaleString('ckb-IQ')}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="p-2">کاڵا</th>
                    <th className="p-2 text-center">بڕ</th>
                    <th className="p-2">تێچوو</th>
                    <th className="p-2">کۆ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingPurchase.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold text-white">{it.productNameKu}</td>
                      <td className="p-2 font-mono text-center">{it.quantity}</td>
                      <td className="p-2 font-mono">{it.purchasePrice.toLocaleString()}</td>
                      <td className="p-2 font-mono font-bold">{it.total.toLocaleString()} د.ع</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between font-mono text-xs">
              <span>کۆی وەصڵ: <strong>{viewingPurchase.total.toLocaleString()} د.ع</strong></span>
              <span>دراو: <strong className="text-emerald-400">{viewingPurchase.paidAmount.toLocaleString()} د.ع</strong></span>
            </div>

            <button
              onClick={() => setViewingPurchase(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
            >
              داخستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
