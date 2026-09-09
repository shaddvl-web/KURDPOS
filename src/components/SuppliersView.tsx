import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, MapPin, Building, Edit, X, DollarSign } from 'lucide-react';
import { Supplier } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Supplier) => void;
  onSupplierPayment: (supplierId: string, amount: number) => void;
}

export const SuppliersView: React.FC<Props> = ({
  suppliers,
  onSaveSupplier,
  onSupplierPayment,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    company: '',
    phone: '',
    address: '',
    email: '',
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      code: 'SUPP-' + Math.floor(100 + Math.random() * 900),
      name: '',
      company: '',
      phone: '',
      address: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      code: s.code || '',
      name: s.name,
      company: s.company,
      phone: s.phone,
      address: s.address,
      email: s.email || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('تکایە ناوی دابینکەر بنووسە!');
      return;
    }

    const saved: Supplier = {
      ...formData,
      id: editingSupplier ? editingSupplier.id : 'sup-' + Date.now(),
      openingBalance: editingSupplier ? (editingSupplier.openingBalance || 0) : 0,
      currentBalance: editingSupplier ? (editingSupplier.currentBalance ?? (editingSupplier as any).balance ?? 0) : 0,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
    };

    onSaveSupplier(saved);
    posSound.playSuccess();
    setIsModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSupplier || payAmount <= 0) return;
    onSupplierPayment(paymentSupplier.id, payAmount);
    posSound.playSuccess();
    setPaymentSupplier(null);
  };

  const filtered = suppliers.filter(s =>
    s.name.includes(search) || s.company.includes(search) || s.phone.includes(search)
  );

  const getSupBalance = (s: Supplier) => s.currentBalance ?? (s as any).balance ?? 0;

  const totalSupplierDebts = suppliers.reduce((sum, s) => {
    const bal = getSupBalance(s);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">دابینکەران و کۆمپانیاکان (Suppliers)</h1>
            <p className="text-xs text-slate-400">کۆی قەرز لەسەر ئێمە بۆ دابینکەران: <strong className="text-red-400 font-mono text-sm">{totalSupplierDebts.toLocaleString()} د.ع</strong></p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>دابینکەری نوێ</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="گەڕان بەپێی ناوی دابینکەر، کۆمپانیا، یان تەلەفۆن..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">کۆد</th>
                <th className="p-3">ناوی نوێنەر</th>
                <th className="p-3">کۆمپانیا</th>
                <th className="p-3">تەلەفۆن</th>
                <th className="p-3">ناونیشان</th>
                <th className="p-3">قەرزی دابینکەر</th>
                <th className="p-3 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{s.code}</td>
                  <td className="p-3 font-semibold text-white">{s.name}</td>
                  <td className="p-3 text-sky-400 font-bold">{s.company}</td>
                  <td className="p-3 font-mono text-slate-300">{s.phone}</td>
                  <td className="p-3 text-slate-400">{s.address}</td>
                  <td className="p-3 font-mono">
                    {s.balance > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold">
                        {s.balance.toLocaleString()} د.ع
                      </span>
                    ) : (
                      <span className="text-slate-500">0 د.ع</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {s.balance > 0 && (
                        <button
                          onClick={() => {
                            setPaymentSupplier(s);
                            setPayAmount(s.balance);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors"
                        >
                          دانەوەی قەرز
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">
                {editingSupplier ? 'دەستکاریکردنی دابینکەر' : 'زیادکردنی دابینکەری نوێ'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی نوێنەر *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نموونە: کاک ئارام"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی کۆمپانیا</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="کۆمپانیای سەردەم..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ژمارەی مۆبایل</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0750..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناونیشان / شار</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="سلێمانی، شەقامی بازنەیی مەلیك مەحموود"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Debt Pay Modal */}
      {paymentSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">دانەوەی قەرز بە {paymentSupplier.name} ({paymentSupplier.company})</h2>
              <button onClick={() => setPaymentSupplier(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/40 text-xs flex justify-between font-mono">
              <span className="text-slate-300">کۆی قەرزی ماوە:</span>
              <span className="text-red-400 font-bold">{paymentSupplier.balance.toLocaleString()} د.ع</span>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بڕی پارەی دراو (د.ع):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentSupplier.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-lg font-mono text-emerald-400 font-bold"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentSupplier(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  هەڵوەشاندنەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  تۆمارکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
