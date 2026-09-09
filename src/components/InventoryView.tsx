import React, { useState } from 'react';
import {
  Layers, AlertTriangle, ArrowUpDown, History, ShieldAlert,
  TrendingUp, DollarSign, PackageX, Plus, Minus, Check, X
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  products: Product[];
  stockMovements: StockMovement[];
  onAdjustStock: (productId: string, newStock: number, reason: string) => void;
}

export const InventoryView: React.FC<Props> = ({
  products,
  stockMovements,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts'>('overview');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('set');
  const [adjustValue, setAdjustValue] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('پشکنینی کۆگا و سەرژمێری');

  // Calculations
  const totalItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const projectedProfit = totalRetailValuation - totalCostValuation;

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    let targetStock = adjustValue;
    if (adjustmentType === 'add') {
      targetStock = adjustingProduct.stock + adjustValue;
    } else if (adjustmentType === 'remove') {
      targetStock = Math.max(0, adjustingProduct.stock - adjustValue);
    }

    onAdjustStock(adjustingProduct.id, targetStock, adjustReason);
    posSound.playSuccess();
    setAdjustingProduct(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">بەڕێوەبردنی کۆگا و سەرمایە (Inventory Valuation)</h1>
            <p className="text-xs text-slate-400">کۆی پارەی وەبەرهێنراو لە کاڵاکان و چاودێری جووڵەی ستۆک</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            سەرمایە و ستۆک
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'alerts' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ئاگادارییەکان ({lowStockProducts.length + outOfStockProducts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'movements' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <History className="w-3.5 h-3.5" />
            <span>مێژووی جووڵە ({stockMovements.length})</span>
          </button>
        </div>
      </div>

      {/* Summary Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">کۆی پارچەی کاڵا (Units)</span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">
              {totalItemsCount.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">سەرمایەی تێچوو (Cost Value)</span>
            <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
              {totalCostValuation.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">سەرمایەی فرۆشتن (Retail Value)</span>
            <span className="text-xl font-black font-mono text-sky-400 mt-1 block">
              {totalRetailValuation.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between shadow-lg shadow-emerald-950/30">
          <div>
            <span className="text-xs text-slate-400 block">قازانجی پێشبینیکراو (Projected)</span>
            <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
              +{projectedProfit.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab 1: Overview & Quick Adjustment */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
            <span>لیستی ستۆکی کاڵاکان و دەستکاریکردنی بڕ</span>
            <span className="text-slate-500 font-mono">کلیک لەسەر [ڕێکخستن] بکە بۆ چاککردنی ستۆک</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono">
                <tr>
                  <th className="p-3">ناوی کاڵا</th>
                  <th className="p-3">بارکۆد</th>
                  <th className="p-3">تێچوو</th>
                  <th className="p-3">فرۆشتن</th>
                  <th className="p-3">ستۆکی ئێستا</th>
                  <th className="p-3">کۆی تێچووی کۆگا</th>
                  <th className="p-3 text-center">ڕێکخستنی ستۆک</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{p.nameKu}</td>
                    <td className="p-3 font-mono text-slate-400">{p.barcode}</td>
                    <td className="p-3 font-mono text-slate-400">{p.purchasePrice.toLocaleString()} د.ع</td>
                    <td className="p-3 font-mono text-emerald-400">{p.sellingPrice.toLocaleString()} د.ع</td>
                    <td className="p-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.stock <= 0 ? 'bg-red-950 text-red-400 border border-red-800' :
                        p.stock <= p.minStock ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-200'
                      }`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {(p.stock * p.purchasePrice).toLocaleString()} د.ع
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setAdjustingProduct(p);
                          setAdjustValue(p.stock);
                          setAdjustmentType('set');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 rounded text-xs font-semibold transition-colors"
                      >
                        ڕێکخستن
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Alerts (Low & Out of Stock) */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Out of stock */}
          <div className="bg-slate-900 border border-red-900/60 rounded-xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <PackageX className="w-5 h-5" />
              <h2 className="text-sm font-bold">کاڵای تەواوبوو لە کۆگا ({outOfStockProducts.length})</h2>
            </div>
            {outOfStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">هیچ کاڵایەکی نەماو نییە</p>
            ) : (
              <div className="space-y-2">
                {outOfStockProducts.map(p => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.nameKu}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.barcode}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAdjustingProduct(p);
                        setAdjustValue(10);
                        setAdjustmentType('add');
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold"
                    >
                      زیادکردن
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock */}
          <div className="bg-slate-900 border border-amber-900/60 rounded-xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-sm font-bold">کاڵای بەرەو تەواوبوون ({lowStockProducts.length})</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">هیچ کاڵایەکی کەم ماو نییە</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.nameKu}</span>
                      <span className="text-[10px] text-amber-400 font-mono">ماوە: {p.stock} (کەمترین: {p.minStock})</span>
                    </div>
                    <button
                      onClick={() => {
                        setAdjustingProduct(p);
                        setAdjustValue(10);
                        setAdjustmentType('add');
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
                    >
                      زیادکردن
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movement Audit Trail */}
      {activeTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-850 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
            <span>مێژووی جووڵەی کاڵاکان و تۆماری وردبینی</span>
            <span className="text-slate-500 font-mono">کۆی تۆمارەکان: {stockMovements.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="p-3">کاتی کردار</th>
                  <th className="p-3">کاڵا</th>
                  <th className="p-3">جۆری جووڵە</th>
                  <th className="p-3">بڕی گۆڕانکاری</th>
                  <th className="p-3">پێشتر</th>
                  <th className="p-3">دوای کردار</th>
                  <th className="p-3">هۆکار / تێبینی</th>
                  <th className="p-3">بەکارهێنەر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      هیچ جووڵەیەکی تۆمارکراو نییە تا ئێستا
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(mov.date).toLocaleString('ckb-IQ')}
                      </td>
                      <td className="p-3 font-bold text-white">{mov.productNameKu}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          mov.type === 'sale' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                          mov.type === 'purchase' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          mov.type === 'return' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {mov.type === 'sale' ? 'فرۆشتن' :
                           mov.type === 'purchase' ? 'کڕین لە دابینکەر' :
                           mov.type === 'return' ? 'گەڕاندنەوە' : 'ڕێکخستنی دەستی'}
                        </span>
                      </td>
                      <td className={`p-3 font-mono font-bold ${mov.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{mov.stockBefore}</td>
                      <td className="p-3 font-mono text-white font-bold">{mov.stockAfter}</td>
                      <td className="p-3 text-slate-300">{mov.notes}</td>
                      <td className="p-3 text-slate-400">{mov.userName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">ڕێکخستنی ستۆکی: {adjustingProduct.nameKu}</h2>
                <span className="text-xs text-slate-400 font-mono">ستۆکی ئێستا: {adjustingProduct.stock} {adjustingProduct.unit}</span>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="py-4 space-y-3">
              {/* Type */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('set')}
                  className={`py-2 rounded-lg border ${adjustmentType === 'set' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  دیاریکردنی نوێ
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`py-2 rounded-lg border ${adjustmentType === 'add' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  زیادکردن (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('remove')}
                  className={`py-2 rounded-lg border ${adjustmentType === 'remove' ? 'bg-red-600 text-white border-red-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                >
                  کەمکردنەوە (-)
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">بڕی دانە:</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-lg font-mono text-white"
                  dir="ltr"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">هۆکاری دەستکاریکردن:</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="پشکنینی کۆگا و سەرژمێری">پشکنینی کۆگا و سەرژمێری (Inventory Count)</option>
                  <option value="تێکچوون یان شکان">تێکچوون یان شکان (Damaged Goods)</option>
                  <option value="بەسەرچوونی بەروار">بەسەرچوونی بەروار (Expired)</option>
                  <option value="دیاری یان بردن لەلایەن خاوەن کار">دیاری یان بردن لەلایەن خاوەن کار</option>
                  <option value="هۆکاری تر">هۆکاری تر</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  هەڵوەشاندنەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
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
