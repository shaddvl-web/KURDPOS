import React, { useState } from 'react';
import { ShieldCheck, Plus, User as UserIcon, Lock, Edit, Trash2, X, Check } from 'lucide-react';
import { User } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser: (user: User) => void;
}

export const UsersView: React.FC<Props> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt'>>({
    username: '',
    nameKu: '',
    nameEn: '',
    role: 'cashier',
    phone: '',
    active: true,
    pin: '1234',
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      nameKu: '',
      nameEn: '',
      role: 'cashier',
      phone: '',
      active: true,
      pin: '1234',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      nameKu: u.nameKu,
      nameEn: u.nameEn,
      role: u.role,
      phone: u.phone,
      active: u.active,
      pin: u.pin || '1234',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.nameKu) return;

    const saved: User = {
      ...formData,
      id: editingUser ? editingUser.id : 'usr-' + Date.now(),
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    onSaveUser(saved);
    posSound.playSuccess();
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">بەکارهێنەران و دەسەڵاتەکان (Users & Permissions)</h1>
            <p className="text-xs text-slate-400">بەکارهێنەری ئێستا: <strong className="text-white">{currentUser.nameKu}</strong> ({currentUser.role})</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>بەکارهێنەری نوێ</span>
        </button>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isCurrent = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-950/30 ring-1 ring-sky-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sky-400 font-bold text-sm">
                      {u.nameKu.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{u.nameKu}</h3>
                      <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                    u.role === 'manager' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {u.role === 'admin' ? 'بەڕێوەبەری گشتی' : u.role === 'manager' ? 'سەرپەرشتیار' : 'کاشێر'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg space-y-1 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">کۆدی PIN:</span>
                    <span>•••• ({u.pin})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مۆبایل:</span>
                    <span>{u.phone || 'نادیار'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">دۆخ:</span>
                    <span className={u.active ? 'text-emerald-400' : 'text-red-400'}>
                      {u.active ? 'چالاکە' : 'ناچالاک'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
                {!isCurrent && (
                  <button
                    onClick={() => {
                      onSwitchUser(u);
                      posSound.playSuccess();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600 hover:text-white text-sky-400 rounded-lg text-xs font-bold transition-colors"
                  >
                    چوونەژوورەوە بەم هەژمارە
                  </button>
                )}
                {isCurrent && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> هەژماری چالاک
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={() => {
                        if (confirm(`ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">
                {editingUser ? 'دەستکاریکردنی بەکارهێنەر' : 'زیادکردنی بەکارهێنەری نوێ'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی کوردی *</label>
                <input
                  type="text"
                  required
                  value={formData.nameKu}
                  onChange={(e) => setFormData({ ...formData, nameKu: e.target.value })}
                  placeholder="نموونە: هێمن علی"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی بەکارهێنەر (Username) *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="hemn"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">دەسەڵات (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="cashier">کاشێر (Cashier - تەنها فرۆشتن)</option>
                  <option value="manager">سەرپەرشتیار (Manager - فرۆشتن، کڕین و کۆگا)</option>
                  <option value="admin">بەڕێوەبەری گشتی (Admin - دەسەڵاتی تەواو)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">کۆدی نهێنی خێرا (PIN - 4 ژمارە)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white text-center"
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
    </div>
  );
};
