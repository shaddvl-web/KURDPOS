import React, { useState } from 'react';
import {
  FileText, Search, Printer, RotateCcw, Eye, Calendar,
  DollarSign, Check, X, AlertCircle, ShoppingBag
} from 'lucide-react';
import { Sale, SaleItem } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  sales: Sale[];
  onProcessReturn: (saleId: string, returnedItems: { productId: string; quantity: number; refundAmount: number }[], reason: string) => void;
  onReprintReceipt: (sale: Sale) => void;
}

export const SalesView: React.FC<Props> = ({
  sales,
  onProcessReturn,
  onReprintReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('خواست لەسەر نەبوو یان هەڵە لە کڕین');

  const openReturnModal = (sale: Sale) => {
    setReturnModalSale(sale);
    const initialQtys: Record<string, number> = {};
    sale.items.forEach((it: any) => {
      const pId = it.product?.id || it.productId;
      if (pId) initialQtys[pId] = 0;
    });
    setReturnQuantities(initialQtys);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalSale) return;

    const itemsToReturn: { productId: string; quantity: number; refundAmount: number }[] = [];
    let totalRefund = 0;

    returnModalSale.items.forEach((it: any) => {
      const pId = it.product?.id || it.productId;
      const qty = returnQuantities[pId] || 0;
      if (qty > 0) {
        const itemRefund = qty * (it.unitPrice - (it.discount || 0));
        itemsToReturn.push({
          productId: pId,
          quantity: qty,
          refundAmount: itemRefund,
        });
        totalRefund += itemRefund;
      }
    });

    if (itemsToReturn.length === 0) {
      alert('تکایە بڕی ئەو کاڵایە دیاریبکە کە دەگەڕێنرێتەوە!');
      return;
    }

    onProcessReturn(returnModalSale.id, itemsToReturn, returnReason);
    posSound.playSuccess();
    setReturnModalSale(null);
  };

  const filtered = sales.filter(s =>
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName.includes(search) ||
    s.cashierName.includes(search)
  );

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">مێژووی وەصڵەکان و گەڕاندنەوە (Sales & Returns)</h1>
            <p className="text-xs text-slate-400">کۆی گشتی فرۆش: <strong className="text-emerald-400 font-mono text-sm">{totalSalesRevenue.toLocaleString()} د.ع</strong> ({sales.length} وەصڵ)</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="گەڕان بە ژمارەی وەصڵ، کڕیار، کاشێر..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">ژمارەی وەصڵ</th>
                <th className="p-3">کاتی فرۆشتن</th>
                <th className="p-3">کڕیار</th>
                <th className="p-3">کاشێر</th>
                <th className="p-3">شێوازی پارەدان</th>
                <th className="p-3">کۆی کاڵاکان</th>
                <th className="p-3">کۆی گشتی</th>
                <th className="p-3 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    هیچ وەصڵێکی فرۆشتن نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-400">{s.invoiceNumber}</td>
                    <td className="p-3 font-mono text-slate-400">{new Date(s.createdAt).toLocaleString('ckb-IQ')}</td>
                    <td className="p-3 font-semibold text-white">{s.customerName}</td>
                    <td className="p-3 text-slate-300">{s.cashierName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.paymentMethod === 'cash' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        s.paymentMethod === 'card' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {s.paymentMethod === 'cash' ? 'کاش' : s.paymentMethod === 'card' ? 'کارت' : 'قەرز'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {s.items.reduce((sum, it) => sum + it.quantity, 0)} دانە
                    </td>
                    <td className="p-3 font-mono font-black text-emerald-400">
                      {s.grandTotal.toLocaleString()} د.ع
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            onReprintReceipt(s);
                            posSound.playClick();
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="دووبارە چاپکردنەوەی پسوولە (Print)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                          title="پیشاندانی وردەکاری"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openReturnModal(s)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          title="گەڕاندنەوەی کاڵا (Return)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">وردەکاری وەصڵی {selectedSale.invoiceNumber}</h2>
              <button onClick={() => setSelectedSale(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>کڕیار:</span>
                <span className="font-bold text-white">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>کاتی تۆمارکردن:</span>
                <span>{new Date(selectedSale.createdAt).toLocaleString('ckb-IQ')}</span>
              </div>
              <div className="flex justify-between">
                <span>کاشێری بەرپرس:</span>
                <span>{selectedSale.cashierName}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-850 text-slate-400 font-mono">
                  <tr>
                    <th className="p-2">ناوی کاڵا</th>
                    <th className="p-2 text-center">بڕ</th>
                    <th className="p-2">نرخ</th>
                    <th className="p-2">کۆ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedSale.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-semibold text-white">{it.product.nameKu}</td>
                      <td className="p-2 font-mono text-center">{it.quantity}</td>
                      <td className="p-2 font-mono">{it.unitPrice.toLocaleString()}</td>
                      <td className="p-2 font-mono font-bold text-emerald-400">{it.total.toLocaleString()} د.ع</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>کۆی سەرەتایی:</span>
                <span>{selectedSale.subtotal.toLocaleString()} د.ع</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>داشکاندن:</span>
                  <span>-{selectedSale.discount.toLocaleString()} د.ع</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800 text-sm">
                <span>کۆی گشتی:</span>
                <span className="text-emerald-400">{selectedSale.grandTotal.toLocaleString()} د.ع</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onReprintReceipt(selectedSale);
                  setSelectedSale(null);
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنەوە</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">گەڕاندنەوەی کاڵا لە وەصڵی {returnModalSale.invoiceNumber}</h2>
                <span className="text-xs text-slate-400">بڕی ئەو کاڵایانە دیاری بکە کە کڕیار دەگەڕێنێتەوە</span>
              </div>
              <button onClick={() => setReturnModalSale(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-800 text-slate-400 font-mono">
                    <tr>
                      <th className="p-2">کاڵا</th>
                      <th className="p-2 text-center">کڕاوە</th>
                      <th className="p-2 text-center">بڕی گەڕاندنەوە</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {returnModalSale.items.map((it: any, idx) => {
                      const pId = it.product?.id || it.productId || `item-${idx}`;
                      const pName = it.product?.nameKu || it.productNameKu || 'کاڵا';
                      return (
                        <tr key={pId}>
                          <td className="p-2 font-semibold text-white">{pName}</td>
                          <td className="p-2 font-mono text-center text-slate-400">{it.quantity}</td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={it.quantity}
                              value={returnQuantities[pId] || 0}
                              onChange={(e) => {
                                const val = Math.min(it.quantity, Math.max(0, Number(e.target.value)));
                                setReturnQuantities({
                                  ...returnQuantities,
                                  [pId]: val,
                                });
                              }}
                              className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">هۆکاری گەڕاندنەوە:</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalSale(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                >
                  تەواوکردنی گەڕاندنەوە و گەڕاندنەوەی پارە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
