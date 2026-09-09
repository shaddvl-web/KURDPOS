import React from 'react';
import { PauseCircle, ArrowRight, Trash2, X, Clock, ShoppingCart } from 'lucide-react';
import { HeldInvoice } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  heldInvoices: HeldInvoice[];
  onRecall: (invoice: HeldInvoice) => void;
  onDelete: (id: string) => void;
}

export const HeldInvoicesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  heldInvoices,
  onRecall,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <PauseCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">وەصڵە ڕاگیراوەکان (Held / Suspended Invoices - F10)</h2>
              <p className="text-xs text-slate-500">کۆی وەصڵە ڕاگیراوەکان: {heldInvoices.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoices List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {heldInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 stroke-1 text-slate-400 mb-3" />
              <p className="text-base font-semibold text-slate-700">هیچ وەصڵێکی ڕاگیراو لە سیستەمدا نییە</p>
              <p className="text-xs text-slate-400 mt-1">کاتێک لە شاشەی کاشێر کلیلی F9 دابگریت، وەصڵەکە لێرە هەڵدەگیرێت</p>
            </div>
          ) : (
            heldInvoices.map((inv) => {
              const totalAmount = inv.items.reduce((sum, it) => sum + it.total, 0) - (inv.invoiceDiscount || 0);
              const totalItems = inv.items.reduce((sum, it) => sum + it.quantity, 0);

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{inv.customerName || 'کڕیاری گشتی'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                        {totalItems} کاڵا
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(inv.holdTime).toLocaleTimeString('ckb-IQ')}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">{totalAmount.toLocaleString()} د.ع</span>
                    </div>
                    {/* Preview of item names */}
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {inv.items.map(i => `${i.product.nameKu} (${i.quantity})`).join('، ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        onDelete(inv.id);
                        posSound.playClick();
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onRecall(inv);
                        posSound.playClick();
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>هێنانەوە بۆ سەبەتە</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>بۆ هەڵوەشاندنەوە کلیلی <strong className="text-slate-800">ESC</strong> دابگرە</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
