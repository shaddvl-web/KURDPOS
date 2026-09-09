import React, { useState } from 'react';
import { Wallet, DollarSign, Clock, CheckCircle2, AlertTriangle, Printer, History, Plus, Lock } from 'lucide-react';
import { Shift, Sale, Expense, User } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  currentShift: Shift;
  previousShifts: Shift[];
  sales: Sale[];
  expenses: Expense[];
  currentUser: User;
  onCloseShift: (actualCash: number, notes: string) => void;
  onOpenShift: (openingCash: number) => void;
}

export const ShiftsView: React.FC<Props> = ({
  currentShift,
  previousShifts,
  sales,
  expenses,
  currentUser,
  onCloseShift,
  onOpenShift,
}) => {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [newOpeningCash, setNewOpeningCash] = useState<number>(100000);
  const [closeNotes, setCloseNotes] = useState<string>('');

  // Shift financial live metrics
  const isShiftActive = currentShift.status === 'open';

  // Sales in current shift
  const shiftSales = sales.filter(s => s.shiftId === currentShift.id);
  const cashSales = shiftSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.grandTotal, 0);
  const cardSales = shiftSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.grandTotal, 0);
  const creditSales = shiftSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.grandTotal, 0);

  // Cash expenses in current shift
  const shiftExpenses = expenses.filter(e => e.shiftId === currentShift.id);
  const cashExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expected Cash in Drawer: Opening Cash + Cash Sales - Cash Expenses
  const expectedCashInDrawer = currentShift.openingCash + cashSales - cashExpenses;
  const cashDifference = actualCashCounted - expectedCashInDrawer;

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(actualCashCounted, closeNotes);
    posSound.playSuccess();
    setIsCloseModalOpen(false);
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(newOpeningCash);
    posSound.playSuccess();
    setIsOpenModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">بەڕێوەبردنی سندوق و شیفت (Cash Register & Shift)</h1>
            <p className="text-xs text-slate-400">
              دۆخی ئێستا:{' '}
              {isShiftActive ? (
                <span className="text-emerald-400 font-bold">شیفت کراوەیە ({currentShift.userName})</span>
              ) : (
                <span className="text-red-400 font-bold">شیفت داخراوە</span>
              )}
            </p>
          </div>
        </div>

        {isShiftActive ? (
          <button
            onClick={() => {
              setActualCashCounted(expectedCashInDrawer);
              setIsCloseModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-950 transition-all active:scale-95"
          >
            <Lock className="w-4 h-4" />
            <span>داخستنی شیفت و دەرکردنی ڕاپۆرتی Z</span>
          </button>
        ) : (
          <button
            onClick={() => setIsOpenModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>کردنەوەی شیفتی نوێ</span>
          </button>
        )}
      </div>

      {/* Active Shift Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">پارەی دەستپێک لە سندوق</span>
          <span className="text-xl font-black font-mono text-white mt-1 block">
            {currentShift.openingCash.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            کاتی دەستپێک: {new Date(currentShift.startTime).toLocaleTimeString('ckb-IQ')}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">فرۆشی کاش (کاشێر)</span>
          <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
            +{cashSales.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            کارت: {cardSales.toLocaleString()} | قەرز: {creditSales.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">خەرجییەکانی دراو لە سندوق</span>
          <span className="text-xl font-black font-mono text-red-400 mt-1 block">
            -{cashExpenses.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {shiftExpenses.length} پسوولەی خەرجی تۆمارکراوە
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border-2 border-emerald-500/70 shadow-lg shadow-emerald-950/20">
          <span className="text-xs text-slate-400 block">پارەی چاوەڕوانکراو لە مەجەرا (سندوق)</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
            {expectedCashInDrawer.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-emerald-300 mt-1 block">
            = پارەی دەستپێک + فرۆشی کاش - خەرجی
          </span>
        </div>
      </div>

      {/* Closed Shifts History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>مێژووی شیفتەکانی پێشوو (Closed Shifts Archive)</span>
          <span className="text-slate-500 font-mono">کۆی شیفتەکان: {previousShifts.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">کاشێر</th>
                <th className="p-3">دەستپێک</th>
                <th className="p-3">کۆتایی</th>
                <th className="p-3">دەستپێک (کاش)</th>
                <th className="p-3">فرۆشی کاش</th>
                <th className="p-3">کۆتایی (ژمێردراو)</th>
                <th className="p-3">جیاوازی</th>
                <th className="p-3">تێبینی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {previousShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    هیچ شیفتێکی داخراوی پێشوو تۆمار نەکراوە
                  </td>
                </tr>
              ) : (
                previousShifts.map((s) => {
                  const diff = (s.closingCash || 0) - (s.expectedCash || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-semibold text-white">{s.userName}</td>
                      <td className="p-3 font-mono text-slate-400">{new Date(s.startTime).toLocaleString('ckb-IQ')}</td>
                      <td className="p-3 font-mono text-slate-400">{s.endTime ? new Date(s.endTime).toLocaleString('ckb-IQ') : '---'}</td>
                      <td className="p-3 font-mono">{s.openingCash.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono text-emerald-400">{s.totalSalesCash.toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono font-bold text-white">{(s.closingCash || 0).toLocaleString()} د.ع</td>
                      <td className="p-3 font-mono">
                        {diff === 0 ? (
                          <span className="text-emerald-400 font-bold">بێ جیاوازی (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-sky-400 font-bold">+{diff.toLocaleString()} (زیادە)</span>
                        ) : (
                          <span className="text-red-400 font-bold">{diff.toLocaleString()} (کورتهێنان)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{s.notes || '---'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Shift Modal (Z-Report) */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">داخستنی شیفت و ڕاپۆرتی Z</h2>
                <span className="text-xs text-slate-400">کاشێر: {currentShift.userName}</span>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>پارەی دەستپێک:</span>
                  <span>{currentShift.openingCash.toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>کۆی فرۆشی کاش:</span>
                  <span>+{cashSales.toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>خەرجی لە سندوق:</span>
                  <span>-{cashExpenses.toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800 text-sm">
                  <span>پارەی چاوەڕوانکراو:</span>
                  <span className="text-emerald-400">{expectedCashInDrawer.toLocaleString()} د.ع</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  پارەی ژمێردراوی ناو سندوق لەلایەن کاشێر (د.ع): *
                </label>
                <input
                  type="number"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500/80 rounded-lg px-3 py-2 text-xl font-mono text-emerald-400 font-bold"
                  dir="ltr"
                />
              </div>

              {/* Difference badge */}
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">جیاوازی ژمێردراو و چاوەڕوانکراو:</span>
                <span className={`font-bold ${cashDifference === 0 ? 'text-emerald-400' : cashDifference > 0 ? 'text-sky-400' : 'text-red-400'}`}>
                  {cashDifference > 0 ? `+${cashDifference.toLocaleString()} زیادە` : cashDifference < 0 ? `${cashDifference.toLocaleString()} کورتهێنان` : 'ڕێك و بێ هەڵە'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">تێبینی یان هۆکاری جیاوازی:</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="ئەگەر کورتهێنان هەبوو هۆکار بنووسە..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white h-16"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  تەواوکردن و داخستنی سندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-white pb-2 border-b border-slate-800">کردنەوەی شیفتی نوێ</h2>
            <form onSubmit={handleOpenShiftSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  پارەی سەرەتایی لە سندوق (د.ع): *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newOpeningCash}
                  onChange={(e) => setNewOpeningCash(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500/80 rounded-lg px-3 py-2 text-xl font-mono text-white font-bold"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  کردنەوەی شیفت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
