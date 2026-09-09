import React, { useState, useMemo } from 'react';
import {
  Package, Plus, Search, Filter, Edit, Trash2, Barcode,
  Printer, Download, Upload, Check, X, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { Product, Category, Supplier } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsView: React.FC<Props> = ({
  products,
  categories,
  suppliers,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeLabelModal, setBarcodeLabelModal] = useState<Product | null>(null);
  const [labelQty, setLabelQty] = useState<number>(4);

  // Form state
  const initialFormState: Omit<Product, 'id' | 'createdAt'> = {
    barcode: '',
    sku: '',
    nameKu: '',
    nameEn: '',
    categoryId: categories[0]?.id || 'cat-1',
    unit: 'دانە',
    purchasePrice: 1000,
    sellingPrice: 1500,
    wholesalePrice: 1250,
    discountPrice: 0,
    stock: 20,
    minStock: 5,
    maxStock: 100,
    supplierId: suppliers[0]?.id || '',
    image: '',
    expiryDate: '',
    batchNumber: '',
    taxRate: 0,
    active: true,
  };

  const [formData, setFormData] = useState<typeof initialFormState>(initialFormState);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialFormState,
      barcode: '869' + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      sku: 'PROD-' + Math.floor(1000 + Math.random() * 9000),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      barcode: prod.barcode,
      sku: prod.sku,
      nameKu: prod.nameKu,
      nameEn: prod.nameEn,
      categoryId: prod.categoryId,
      unit: prod.unit,
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      wholesalePrice: prod.wholesalePrice,
      discountPrice: prod.discountPrice || 0,
      stock: prod.stock,
      minStock: prod.minStock,
      maxStock: prod.maxStock,
      supplierId: prod.supplierId || '',
      image: prod.image || '',
      expiryDate: prod.expiryDate || '',
      batchNumber: prod.batchNumber || '',
      taxRate: prod.taxRate || 0,
      active: prod.active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.nameKu) {
      alert('تکایە ناوی کوردی و بارکۆدی کاڵا پڕبکەرەوە!');
      return;
    }

    // Check duplicate barcode
    const duplicate = products.find(
      p => p.barcode === formData.barcode && (!editingProduct || p.id !== editingProduct.id)
    );
    if (duplicate) {
      posSound.playError();
      alert(`ئەم بارکۆدە (${formData.barcode}) پێشتر بۆ کاڵای "${duplicate.nameKu}" بەکارهاتووە!`);
      return;
    }

    const saved: Product = {
      ...formData,
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(saved);
    posSound.playSuccess();
    setIsModalOpen(false);
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.nameKu.includes(search) ||
        p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
      const matchStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'low'
          ? p.stock > 0 && p.stock <= p.minStock
          : p.stock <= 0;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCat, stockFilter]);

  const exportCSV = () => {
    const headers = ['ID', 'Barcode', 'SKU', 'NameKu', 'NameEn', 'PurchasePrice', 'SellingPrice', 'Stock', 'Unit'];
    const rows = products.map(p => [
      p.id,
      p.barcode,
      p.sku,
      `"${p.nameKu}"`,
      `"${p.nameEn}"`,
      p.purchasePrice,
      p.sellingPrice,
      p.stock,
      p.unit,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">بەڕێوەبردنی کاڵاکان (Product Management)</h1>
            <p className="text-xs text-slate-400">کۆی گشتی: {products.length} کاڵا تۆمارکراوە لە سیستەم</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>هەناردەکردنی CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-sky-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی کاڵای نوێ</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="گەڕان بەپێی ناو، بارکۆد، یان SKU..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">هەموو پۆلەکان ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameKu}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setStockFilter('all')}
            className={`flex-1 py-1 rounded-lg transition-colors ${stockFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            هەموو
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`flex-1 py-1 rounded-lg transition-colors ${stockFilter === 'low' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            کەم ماوە
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`flex-1 py-1 rounded-lg transition-colors ${stockFilter === 'out' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            نەماوە
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="p-3">وێنە</th>
                <th className="p-3">ناوی کاڵا</th>
                <th className="p-3">بارکۆد & SKU</th>
                <th className="p-3">پۆل</th>
                <th className="p-3">نرخی تێچوو</th>
                <th className="p-3">نرخی فرۆشتن</th>
                <th className="p-3">ستۆک</th>
                <th className="p-3">بەسەرچوون</th>
                <th className="p-3 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    هیچ کاڵایەک نەدۆزرایەوە بەپێی ئەم فلتەرە
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const cat = categories.find(c => c.id === prod.categoryId);
                  const isOut = prod.stock <= 0;
                  const isLow = prod.stock > 0 && prod.stock <= prod.minStock;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.nameKu} className="w-full h-full object-cover" />
                          ) : (
                            <Barcode className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <div>{prod.nameKu}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{prod.nameEn}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        <div>{prod.barcode}</div>
                        <div className="text-[10px] text-slate-500">{prod.sku}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          {cat ? cat.nameKu : 'نادیار'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {prod.purchasePrice.toLocaleString()} د.ع
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {prod.sellingPrice.toLocaleString()} د.ع
                      </td>
                      <td className="p-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isOut
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : isLow
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">
                        {prod.expiryDate || '---'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setBarcodeLabelModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                            title="چاپکردنی ستیكەری بارکۆد"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            title="دەستکاریکردن"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`ئایا دڵنیایت لە سڕینەوەی کاڵای "${prod.nameKu}"؟`)) {
                                onDeleteProduct(prod.id);
                                posSound.playClick();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">
                {editingProduct ? 'دەستکاریکردنی کاڵا' : 'زیادکردنی کاڵای نوێ'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kurdish Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی کاڵا (کوردی) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameKu}
                    onChange={(e) => setFormData({ ...formData, nameKu: e.target.value })}
                    placeholder="نموونە: شیری پینار ١ لیتر"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* English Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی کاڵا (ئینگلیزی)</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Pinar Milk 1L"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">بارکۆد *</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: '869' + Math.floor(1000000000 + Math.random() * 9000000000) })}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      دروستکردنی بارکۆدی خۆکار
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">کۆدی کاڵا (SKU)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">پۆل (Category)</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameKu}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">یەکە (Unit)</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="دانە">دانە (Piece)</option>
                    <option value="کگم">کگم (Kg)</option>
                    <option value="پاکەت">پاکەت (Packet)</option>
                    <option value="قوتوو">قوتوو (Can/Box)</option>
                    <option value="فەردە">فەردە (Bag/Sack)</option>
                    <option value="کارتۆن">کارتۆن (Carton)</option>
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نرخی تێچووی کڕین (د.ع)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نرخی فرۆشتن (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-emerald-500/80 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                    dir="ltr"
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ستۆکی ئێستا</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>

                {/* Minimum Stock Alert */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">کەمترین بڕ بۆ ئاگادارکردنەوە</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">بەرواری بەسەرچوون</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">لینکی وێنە (Image URL)</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Printing Modal */}
      {barcodeLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">چاپکردنی ستیكەری بارکۆد</h2>
              <button onClick={() => setBarcodeLabelModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">ژمارەی ستیكەر:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={labelQty}
                  onChange={(e) => setLabelQty(Number(e.target.value))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                />
              </div>

              {/* Printable Sticker Preview */}
              <div className="p-4 bg-white text-black rounded-lg border border-dashed border-gray-400 text-center font-mono space-y-1">
                <div className="text-xs font-black font-sans">{barcodeLabelModal.nameKu}</div>
                <div className="text-sm font-black tracking-wider py-1 border-y border-black font-mono">
                  ||| | | |||| | || | |||
                </div>
                <div className="text-[11px] font-mono tracking-widest">{barcodeLabelModal.barcode}</div>
                <div className="text-xs font-black text-emerald-800 pt-1">
                  نرخ: {barcodeLabelModal.sellingPrice.toLocaleString()} د.ع
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setBarcodeLabelModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  window.print();
                  setBarcodeLabelModal(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                چاپکردن ({labelQty} دانە)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
