import React, { useState } from 'react';
import { Receipt, Plus, Search, Calendar, DollarSign, Tag, Trash2, X } from 'lucide-react';
import { Expense, Shift, User } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  expenses: Expense[];
  currentShift: Shift;
  currentUser: User;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<Props> = ({
  expenses,
  currentShift,
  currentUser,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    category: 'مووچە و کرێکاری ڕۆژانە',
    amount: 15000,
    paidFromShift: true,
    notes: '',
  });

  const categories = [
    'مووچە و کرێکاری ڕۆژانە',
    'کارەبا و موەلیدە',
    'کرێی دوکان یان کۆگا',
    'پاککەرەوە و پێداویستی مارکێت',
    'چایخانە و میوانداری',
    'چاککردنەوە و سڕینەوە',
    'شارەوانی و باج',
    'خەرجی تر',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0) return;

    const expense: Expense = {
      id: 'exp-' + Date.now(),
      title: formData.title,
      category: formData.category,
      amount: formData.amount,
      paidFromShift: formData.paidFromShift,
      shiftId: currentShift.id,
      date: new Date().toISOString(),
      userName: currentUser.nameKu,
      notes: formData.notes,
    };

    onAddExpense(expense);
    posSound.playSuccess();
    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'مووچە و کرێکاری ڕۆژانە',
      amount: 15000,
      paidFromShift: true,
      notes: '',
    });
  };

  const filtered = expenses.filter(e => {
    const matchSearch = e.title.includes(search) || e.userName.includes(search);
    const matchCat = selectedCat === 'all' || e.category === selectedCat;
    return matchSearch && matchCat;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">بەڕێوەبردنی خەرجییەکان (Expense Management)</h1>
            <p className="text-xs text-slate-400">کۆی گشتی خەرجییە تۆمارکراوەکان: <strong className="text-red-400 font-mono text-sm">{totalExpenseAmount.toLocaleString()} د.ع</strong></p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>تۆمارکردنی خەرجی نوێ</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="گەڕان بەپێی ناونیشانی خەرجی..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">هەموو جۆرەکان</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">ناونیشانی خەرجی</th>
                <th className="p-3">پۆلێن</th>
                <th className="p-3">بڕی پارە</th>
                <th className="p-3">سەرچاوەی پارە</th>
                <th className="p-3">تۆمارکراوە لەلایەن</th>
                <th className="p-3">کاتی تۆمارکردن</th>
                <th className="p-3">تێبینی</th>
                <th className="p-3 text-center">سڕینەوە</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    هیچ خەرجییەک نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{e.title}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-red-400">{e.amount.toLocaleString()} د.ع</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.paidFromShift ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}>
                        {e.paidFromShift ? 'لە مەجەرا (سندوقی کاشێر)' : 'دەرەکی'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{e.userName}</td>
                    <td className="p-3 font-mono text-slate-400">{new Date(e.date).toLocaleString('ckb-IQ')}</td>
                    <td className="p-3 text-slate-400">{e.notes || '---'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`ئایا دڵنیایت لە سڕینەوەی ئەم خەرجییە؟`)) {
                            onDeleteExpense(e.id);
                            posSound.playClick();
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded"
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
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">تۆمارکردنی خەرجی نوێ</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناونیشانی خەرجی *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="نموونە: کڕینی کاغەزی پسوولە"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">پۆلێن</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بڕی پارە (د.ع) *</label>
                <input
                  type="number"
                  required
                  min={250}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-red-500 rounded-lg px-3 py-2 text-lg font-mono text-red-400 font-bold"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidFromShift"
                  checked={formData.paidFromShift}
                  onChange={(e) => setFormData({ ...formData, paidFromShift: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-0"
                />
                <label htmlFor="paidFromShift" className="text-xs text-slate-300">
                  پارەکە ڕاستەوخۆ لە مەجەرای سندوقی کاشێر دراوە
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">تێبینی:</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
