import React, { useState } from 'react';
import { Users, Plus, Search, Phone, MapPin, DollarSign, CreditCard, Edit, X, Check } from 'lucide-react';
import { Customer } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onCustomerPayment: (customerId: string, amount: number) => void;
}

export const CustomersView: React.FC<Props> = ({
  customers,
  onSaveCustomer,
  onCustomerPayment,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    creditLimit: 200000,
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      code: 'CUST-' + Math.floor(100 + Math.random() * 900),
      name: '',
      phone: '',
      address: '',
      email: '',
      creditLimit: 250000,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      code: cust.code,
      name: cust.name,
      phone: cust.phone,
      address: cust.address,
      email: cust.email || '',
      creditLimit: cust.creditLimit,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('تکایە ناوی کڕیار بنووسە!');
      return;
    }

    const saved: Customer = {
      ...formData,
      id: editingCustomer ? editingCustomer.id : 'cust-' + Date.now(),
      openingBalance: editingCustomer ? editingCustomer.openingBalance : 0,
      currentBalance: editingCustomer ? editingCustomer.currentBalance : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    onSaveCustomer(saved);
    posSound.playSuccess();
    setIsModalOpen(false);
  };

  const handleDebtPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer || payAmount <= 0) return;
    onCustomerPayment(paymentModalCustomer.id, payAmount);
    posSound.playSuccess();
    setPaymentModalCustomer(null);
  };

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.phone.includes(search) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebts = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">کڕیاران و حیساباتی قەرز (Customer Management)</h1>
            <p className="text-xs text-slate-400">کۆی قەرزی لەسەر کڕیاران: <strong className="text-red-400 font-mono text-sm">{totalDebts.toLocaleString()} د.ع</strong></p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>کڕیاری نوێ</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="گەڕان بەپێی ناوی کڕیار، تەلەفۆن، یان کۆد..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">کۆد</th>
                <th className="p-3">ناوی کڕیار</th>
                <th className="p-3">تەلەفۆن</th>
                <th className="p-3">ناونیشان</th>
                <th className="p-3">قەرزی ئێستا</th>
                <th className="p-3">سنووری قەرز</th>
                <th className="p-3 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-mono text-slate-400">{c.code}</td>
                  <td className="p-3 font-semibold text-white">{c.name}</td>
                  <td className="p-3 font-mono text-slate-300">{c.phone}</td>
                  <td className="p-3 text-slate-400">{c.address || '---'}</td>
                  <td className="p-3 font-mono">
                    {c.currentBalance > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-bold">
                        {c.currentBalance.toLocaleString()} د.ع
                      </span>
                    ) : (
                      <span className="text-slate-500">0 د.ع</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-400">{c.creditLimit.toLocaleString()} د.ع</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.currentBalance > 0 && (
                        <button
                          onClick={() => {
                            setPaymentModalCustomer(c);
                            setPayAmount(c.currentBalance);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
                        >
                          وەرگرتنی قەرز
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(c)}
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">
                {editingCustomer ? 'دەستکاریکردنی زانیاری کڕیار' : 'زیادکردنی کڕیاری نوێ'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی سیانی کڕیار *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نموونە: کاک کاروان ئەحمەد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ژمارەی تەلەفۆن</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناونیشان</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="هەولێر..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بەرزترین بڕی قەرز (Credit Limit)</label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  dir="ltr"
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

      {/* Customer Debt Payment Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">وەرگرتنی قەرز لە {paymentModalCustomer.name}</h2>
              <button onClick={() => setPaymentModalCustomer(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/40 text-xs flex justify-between font-mono">
              <span className="text-slate-300">کۆی قەرزی کڕیار:</span>
              <span className="text-red-400 font-bold">{paymentModalCustomer.currentBalance.toLocaleString()} د.ع</span>
            </div>

            <form onSubmit={handleDebtPay} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بڕی پارەی وەرگیراو (د.ع):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentModalCustomer.currentBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500 rounded-lg px-3 py-2 text-lg font-mono text-emerald-400 font-bold"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  هەڵوەشاندنەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  تۆمارکردنی وەسڵ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
