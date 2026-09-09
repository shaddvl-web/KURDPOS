import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Banknote, Split, UserCheck, X, Check, Calculator, AlertCircle, ShoppingBag
} from 'lucide-react';
import { PaymentMethod, Customer } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  currencyRate?: number;
  onCompleteSale: (
    method: PaymentMethod,
    paidAmount: number,
    changeAmount: number,
    details?: { cash?: number; card?: number }
  ) => void;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  grandTotal,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  currencyRate,
  onCompleteSale,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(grandTotal);
  const [mixedCash, setMixedCash] = useState<number>(grandTotal / 2);
  const [mixedCard, setMixedCard] = useState<number>(grandTotal / 2);
  const paidInputRef = useRef<HTMLInputElement>(null);

  // Sync when grandTotal changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(grandTotal);
      setMixedCash(Math.floor(grandTotal / 2));
      setMixedCard(Math.ceil(grandTotal / 2));
      setTimeout(() => {
        paidInputRef.current?.focus();
        paidInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, paidAmount - grandTotal);
  const remainingDebt = Math.max(0, grandTotal - paidAmount);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handlePresetClick = (amount: number) => {
    posSound.playClick();
    setPaidAmount(amount);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (method === 'credit') {
      if (!selectedCustomerId || selectedCustomerId === 'cust-1') {
        posSound.playError();
        alert('تکایە سەرەتا کڕیارێک دیاریبکە بۆ فرۆشتنی قەرز!');
        return;
      }
      onCompleteSale('credit', paidAmount, 0);
    } else if (method === 'mixed') {
      const totalPaid = mixedCash + mixedCard;
      if (totalPaid < grandTotal) {
        posSound.playError();
        alert('کۆی نەقد و کارت کەمترە لە بڕی گشتی وەصڵ!');
        return;
      }
      onCompleteSale('mixed', totalPaid, totalPaid - grandTotal, { cash: mixedCash, card: mixedCard });
    } else {
      if (paidAmount < grandTotal && method === 'cash') {
        posSound.playError();
        alert('بڕی پارەی دراو کەمترە لە کۆی گشتی!');
        return;
      }
      onCompleteSale(method, paidAmount, changeAmount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">تەواوکردنی پارەدان و فرۆشتن (F4)</h2>
              <p className="text-xs text-slate-500">
                کۆی گشتی وەصڵ: <strong className="text-blue-600 font-mono text-sm">{grandTotal.toLocaleString()} د.ع</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => { setMethod('cash'); posSound.playClick(); }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${
                method === 'cash'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-5 h-5 mb-1" />
              نەقد (Cash)
            </button>

            <button
              type="button"
              onClick={() => { setMethod('card'); posSound.playClick(); }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${
                method === 'card'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              کارت (Card)
            </button>

            <button
              type="button"
              onClick={() => { setMethod('mixed'); posSound.playClick(); }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${
                method === 'mixed'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Split className="w-5 h-5 mb-1" />
              تێکەڵاو (Mixed)
            </button>

            <button
              type="button"
              onClick={() => { setMethod('credit'); posSound.playClick(); }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${
                method === 'credit'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-5 h-5 mb-1" />
              قەرز (Credit)
            </button>
          </div>

          {/* Customer Selection if Credit or optional */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              کڕیار: {method === 'credit' && <span className="text-red-500">*(پێویستە کڕیاری تایبەت دیاریبکرێت)</span>}
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentBalance > 0 ? `(قەرز: ${c.currentBalance.toLocaleString()} د.ع)` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer && selectedCustomer.currentBalance > 0 && (
              <div className="mt-2 text-xs flex justify-between text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                <span>قەرزی پێشووی ئەم کڕیارە:</span>
                <span className="font-bold font-mono">{selectedCustomer.currentBalance.toLocaleString()} د.ع</span>
              </div>
            )}
          </div>

          {/* Cash Payment Mode Details */}
          {method === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  بڕی پارەی پێدراو لەلایەن کڕیار (Paid Amount):
                </label>
                <div className="relative">
                  <input
                    ref={paidInputRef}
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                    className="w-full bg-slate-50 border-2 border-blue-500 rounded-lg px-4 py-2.5 text-2xl font-black font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 text-left"
                    dir="ltr"
                  />
                  <span className="absolute right-3 top-3.5 text-xs text-slate-500 font-bold">د.ع</span>
                </div>
              </div>

              {/* Quick Cash Presets for Iraqi Dinar */}
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handlePresetClick(grandTotal)}
                  className="px-2 py-2 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 rounded-md border border-blue-200 transition-colors"
                >
                  تەواو
                </button>
                {[5000, 10000, 25000, 50000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetClick(val)}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-md border border-slate-300 transition-colors font-mono"
                  >
                    {(val / 1000).toLocaleString()} هەزار
                  </button>
                ))}
              </div>

              {/* Remaining / Change Banner */}
              <div className="p-4 rounded-lg bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-slate-400 block">ماوە کە دەبێت بگەڕێندرێتەوە (Change):</span>
                  <span className="text-xs text-slate-500">کۆی وەصڵ: {grandTotal.toLocaleString()} د.ع</span>
                </div>
                <div className="text-left font-mono">
                  <span className={`text-2xl font-black ${changeAmount >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {changeAmount.toLocaleString()} د.ع
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mixed Payment Mode Details */}
          {method === 'mixed' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">بڕی نەقد (Cash):</label>
                  <input
                    type="number"
                    value={mixedCash}
                    onChange={(e) => setMixedCash(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">بڕی کارت (Card):</label>
                  <input
                    type="number"
                    value={mixedCard}
                    onChange={(e) => setMixedCard(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold font-mono text-blue-600 focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="text-xs flex justify-between text-slate-500 pt-2 border-t border-slate-200 font-mono">
                <span>کۆی هەردووکیان: {(mixedCash + mixedCard).toLocaleString()} د.ع</span>
                <span>جیاوازی لە وەصڵ: {((mixedCash + mixedCard) - grandTotal).toLocaleString()} د.ع</span>
              </div>
            </div>
          )}

          {/* Credit Sale Mode Details */}
          {method === 'credit' && (
            <div className="space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  پێشەکی دراو ئێستا (Optional Down Payment):
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-lg font-bold font-mono text-amber-900 focus:outline-none focus:border-amber-500"
                  dir="ltr"
                />
              </div>
              <div className="p-3 bg-white rounded-lg flex justify-between items-center text-xs border border-amber-200">
                <span className="text-slate-700">بڕی قەرزی تۆمارکراو لەسەر کڕیار:</span>
                <span className="font-bold font-mono text-sm text-red-600">
                  {remainingDebt.toLocaleString()} د.ع
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            هەڵوەشاندنەوە (ESC)
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-xs transition-all active:translate-y-px"
          >
            <Check className="w-5 h-5" />
            تەواوکردنی فرۆشتن و چاپکردن (ENTER)
          </button>
        </div>
      </div>
    </div>
  );
};
