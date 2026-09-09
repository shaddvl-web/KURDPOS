import React, { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar,
  Printer, ArrowUpRight, ArrowDownRight, Package, Users, FileText
} from 'lucide-react';
import { Sale, Purchase, Expense, Product } from '../types';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  products: Product[];
}

export const ReportsView: React.FC<Props> = ({
  sales,
  purchases,
  expenses,
  products,
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Filter items by period
  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (period === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= oneWeekAgo;
    }
    if (period === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= oneMonthAgo;
    }
    return true;
  };

  const periodSales = useMemo(() => sales.filter(s => filterByDate(s.createdAt)), [sales, period]);
  const periodExpenses = useMemo(() => expenses.filter(e => filterByDate(e.date)), [expenses, period]);
  const periodPurchases = useMemo(() => purchases.filter(p => filterByDate(p.date)), [purchases, period]);

  // Calculations
  const totalRevenue = periodSales.reduce((sum, s) => sum + s.grandTotal, 0);

  // Cost of goods sold (COGS)
  const totalCOGS = useMemo(() => {
    let cogs = 0;
    periodSales.forEach(s => {
      s.items.forEach(it => {
        const prod = products.find(p => p.id === it.product.id);
        const unitCost = prod ? prod.purchasePrice : it.product.purchasePrice || 0;
        cogs += it.quantity * unitCost;
      });
    });
    return cogs;
  }, [periodSales, products]);

  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenseAmount;

  // Payment Breakdown
  const cashTotal = periodSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.grandTotal, 0);
  const cardTotal = periodSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.grandTotal, 0);
  const creditTotal = periodSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.grandTotal, 0);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    periodSales.forEach(s => {
      s.items.forEach(it => {
        if (!map[it.product.id]) {
          map[it.product.id] = { name: it.product.nameKu, qty: 0, total: 0 };
        }
        map[it.product.id].qty += it.quantity;
        map[it.product.id].total += it.total;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [periodSales]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">ڕاپۆرتە داراییەکان و قازانج و زیان (Reports & Analytics)</h1>
            <p className="text-xs text-slate-400">داهات، خەرجییەکان، قازانجی بەدەستهاتوو و فرۆشترین کاڵاکان</p>
          </div>
        </div>

        {/* Time period filter */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-md transition-colors ${period === 'today' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              ئەمڕۆ
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-md transition-colors ${period === 'week' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              ٧ ڕۆژی پێشوو
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${period === 'month' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              ئەم مانگە
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${period === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              هەمووی
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">کۆی گشتی داهاتی فرۆش</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">
            {totalRevenue.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {periodSales.length} ژمارەی وەصڵ
          </span>
        </div>

        {/* Cost of Goods Sold */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">تێچووی کاڵا فرۆشراوەکان (COGS)</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {totalCOGS.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            تێچووی کڕین لە کۆگا
          </span>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">کۆی خەرجییەکان</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
            {totalExpenseAmount.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {periodExpenses.length} ژمارەی خەرجی
          </span>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-xl bg-slate-900 border-2 border-emerald-500/70 shadow-lg shadow-emerald-950/30">
          <span className="text-xs text-slate-400 block">قازانجی سافی (Net Profit)</span>
          <span className={`text-2xl font-black font-mono mt-1 block ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? `+${netProfit.toLocaleString()}` : netProfit.toLocaleString()} <span className="text-xs font-sans">د.ع</span>
          </span>
          <span className="text-[10px] text-emerald-300 mt-1 block">
            = داهات - تێچوو - خەرجییەکان
          </span>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span>پۆلێنی شێوازی پارەدان</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold">پارەدانی کاش (نەقد)</span>
                <span className="font-mono text-white">{cashTotal.toLocaleString()} د.ع ({totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (cashTotal / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-sky-400 font-semibold">کارتی ئەلیکترۆنی (FIB / FastPay / Card)</span>
                <span className="font-mono text-white">{cardTotal.toLocaleString()} د.ع ({totalRevenue > 0 ? Math.round((cardTotal / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (cardTotal / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold">فرۆشتن بە قەرز</span>
                <span className="font-mono text-white">{creditTotal.toLocaleString()} د.ع ({totalRevenue > 0 ? Math.round((creditTotal / totalRevenue) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (creditTotal / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>فرۆشترین کاڵاکان لەم ماوەیەدا</span>
          </h2>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">هیچ فرۆشێک تۆمار نەکراوە</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-emerald-400 font-bold block">{p.qty} دانە</span>
                    <span className="text-[10px] text-slate-400">{p.total.toLocaleString()} د.ع</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
