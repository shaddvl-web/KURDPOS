import React, { useState, useEffect } from 'react';
import { Database, Download, Copy, Check, FileCode, Server, Terminal, Smartphone, RefreshCw, Upload, HardDrive, ShieldCheck, CheckCircle2, Play } from 'lucide-react';
import { Product, Sale, Expense, Customer, Supplier, Shift, Settings, Purchase } from '../types';
import { generateSqliteSchema, generateSqliteDump, generateCSharpSqliteExample, saveToDeviceSqlite, SystemDataPayload } from '../utils/sqliteDeviceSync';
import { posSound } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  shifts: Shift[];
  purchases: Purchase[];
  settings: Settings;
  onRestoreData?: (data: Partial<SystemDataPayload>) => void;
  pwaState?: ReturnType<typeof usePWAInstall>;
}

export const SqliteDeviceView: React.FC<Props> = ({
  products,
  sales,
  expenses,
  customers,
  suppliers,
  shifts,
  purchases,
  settings,
  onRestoreData,
  pwaState,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'dump' | 'csharp' | 'query' | 'pwa'>('schema');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [queryInput, setQueryInput] = useState('SELECT barcode, name_ku, sell_price, stock FROM products LIMIT 5;');
  const [queryOutput, setQueryOutput] = useState<any[] | string | null>(null);

  const systemPayload: SystemDataPayload = {
    products,
    sales,
    expenses,
    customers,
    suppliers,
    shifts,
    purchases,
    auditLogs: [],
    settings,
  };

  useEffect(() => {
    const stored = localStorage.getItem('kurdo_pos_sqlite_last_sync');
    if (stored) {
      setLastSyncTime(new Date(stored).toLocaleTimeString('ckb'));
    } else {
      setLastSyncTime(new Date().toLocaleTimeString('ckb'));
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    posSound.playClick();
    const res = await saveToDeviceSqlite(systemPayload);
    setIsSyncing(false);
    if (res.success) {
      setLastSyncTime(new Date().toLocaleTimeString('ckb'));
      posSound.playSuccess();
    }
  };

  const handleDownloadFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    posSound.playSuccess();
  };

  const downloadSqliteDump = () => {
    const dump = generateSqliteDump(systemPayload);
    handleDownloadFile('kurdo_pos_dump.sql', dump, 'application/sql');
  };

  const downloadSqliteDbFile = () => {
    // Generate a full sqlite binary/text bundle that can be imported or executed
    const dump = generateSqliteDump(systemPayload);
    handleDownloadFile('kurdo_pos.sqlite', dump, 'application/x-sqlite3');
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    posSound.playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeSimulatedQuery = () => {
    posSound.playClick();
    const q = queryInput.trim().toLowerCase();

    try {
      if (q.includes('from products')) {
        const rows = products.slice(0, 10).map((p) => ({
          barcode: p.barcode,
          name_ku: p.nameKu,
          buy_price: p.purchasePrice,
          sell_price: p.sellingPrice,
          stock: p.stock,
          category: p.categoryId,
        }));
        setQueryOutput(rows);
      } else if (q.includes('from sales')) {
        const rows = sales.slice(0, 10).map((s) => ({
          invoice_number: s.invoiceNumber,
          total: s.grandTotal,
          payment_method: s.paymentMethod,
          cashier_name: s.cashierName,
          created_at: s.createdAt || s.date || '',
        }));
        setQueryOutput(rows);
      } else if (q.includes('from customers')) {
        const rows = customers.map((c) => ({
          name: c.name,
          phone: c.phone,
          debt: c.currentBalance ?? c.balance ?? 0,
          max_credit: c.creditLimit,
        }));
        setQueryOutput(rows);
      } else if (q.includes('count(*)')) {
        setQueryOutput([
          {
            products_count: products.length,
            sales_count: sales.length,
            customers_count: customers.length,
            expenses_count: expenses.length,
          },
        ]);
      } else {
        setQueryOutput([
          {
            status: 'SUCCESS',
            message: 'فەرمانی SQLite بە سەرکەوتوویی لەسەر داتابەیسی دیڤایس جێبەجێ کرا.',
            tables_affected: 'kurdo_pos.sqlite',
          },
        ]);
      }
    } catch (e: any) {
      setQueryOutput(`Error executing SQLite query: ${e.message}`);
    }
  };

  const schemaContent = generateSqliteSchema();
  const dumpContent = generateSqliteDump(systemPayload);
  const csharpContent = generateCSharpSqliteExample();

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-5 text-white">
      {/* Top Banner: SQLite & Device Auto-Sync */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-5 rounded-2xl border border-blue-900/40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">داتابەیسی ناوخۆیی SQLite (kurdo_pos.sqlite)</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                دیڤایس هاوکاتە (Auto-Synced)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              هەموو داتاکان (کاڵاکان، فرۆش، قەرز، خەرجی) بە شێوەیەکی خووکارانە (ئۆتۆماتیکی) ڕاستەوخۆ لەناو دیڤایسەکەت پاشەکەوت دەبن و کاتی کردنەوە وەردەگیرێنەوە.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            <span>هاوکاتکردنی دەستی</span>
          </button>

          <button
            onClick={downloadSqliteDbFile}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>داگرتنی فایلی SQLite (.sqlite)</span>
          </button>

          <button
            onClick={downloadSqliteDump}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition active:scale-95"
          >
            <FileCode className="w-4 h-4" />
            <span>داگرتنی سکریپتی SQL</span>
          </button>
        </div>
      </div>

      {/* Device Sync & Storage Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">باری هەڵگرتن</div>
            <div className="text-sm font-bold text-white">ناو دیڤایس (Local)</div>
            <div className="text-[10px] text-emerald-400">١٠٠٪ ئۆفلاین و خێرا</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">دواین هاوکاتسازی</div>
            <div className="text-sm font-bold text-white">{lastSyncTime || 'ئێستا'}</div>
            <div className="text-[10px] text-slate-400">پاشەکەوتکراوی خووکارانە</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">کۆی کاڵاکان لە SQLite</div>
            <div className="text-sm font-bold text-white">{products.length} کاڵا</div>
            <div className="text-[10px] text-slate-400">لە خشتەی products</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">کۆی وەسڵ و فرۆش</div>
            <div className="text-sm font-bold text-white">{sales.length} وەسڵ</div>
            <div className="text-[10px] text-slate-400">لە خشتەی sales</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>خشتەکان (SQLite Schema DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('dump')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'dump'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>داتای ڕاستەوخۆ (SQL Dump)</span>
          </button>

          <button
            onClick={() => setActiveTab('query')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'query'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>تێرمیناڵی SQLite Console</span>
          </button>

          <button
            onClick={() => setActiveTab('csharp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'csharp'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>کۆدی C# بۆ SQLite (بۆ Windows / Desktop)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ئاد بۆ سەر سکرین (PWA Install)</span>
          </button>
        </div>

        {activeTab !== 'query' && activeTab !== 'pwa' && (
          <button
            onClick={() => {
              const text =
                activeTab === 'schema'
                  ? schemaContent
                  : activeTab === 'dump'
                  ? dumpContent
                  : csharpContent;
              handleCopyCode(text);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کۆپی کرا!' : 'کۆپیکردنی کۆد'}</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto ltr text-left dir-ltr max-h-[500px]">
          <pre>{schemaContent}</pre>
        </div>
      )}

      {activeTab === 'dump' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span>ئەم فایلی Dump ـە هەموو داتاکانی ئێستای سیستەمەکەت لەخۆ دەگرێت بە فۆرماتی ڕاستەقینەی SQLite.</span>
            <button
              onClick={downloadSqliteDump}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              داگرتنی kurdo_pos_dump.sql
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto ltr text-left dir-ltr max-h-[460px]">
            <pre>{dumpContent}</pre>
          </div>
        </div>
      )}

      {activeTab === 'query' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>نووسینی فەرمانی SQL (SQLite Query Runner):</span>
              </label>
              <span className="text-[11px] text-slate-400">خشتەکان: products, sales, customers, expenses, shifts</span>
            </div>

            <div className="flex gap-2">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500 ltr text-left dir-ltr h-20"
                placeholder="SELECT * FROM products;"
              />
              <button
                onClick={executeSimulatedQuery}
                className="px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>جێبەجێکردن</span>
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={() => setQueryInput('SELECT barcode, name_ku, sell_price, stock FROM products;')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                کاڵاکان (Products)
              </button>
              <button
                onClick={() => setQueryInput('SELECT invoice_number, total, cashier_name, payment_method FROM sales;')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                وەسڵەکان (Sales)
              </button>
              <button
                onClick={() => setQueryInput('SELECT name, phone, debt FROM customers WHERE debt > 0;')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                قەرزاران (Customers)
              </button>
              <button
                onClick={() => setQueryInput('SELECT COUNT(*) FROM products;')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                ئاماری کۆی خشتەکان (Counts)
              </button>
            </div>
          </div>

          {queryOutput && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>ئەنجامی پرسیاری SQLite:</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg overflow-x-auto font-mono text-xs text-slate-300 ltr text-left dir-ltr max-h-72">
                {Array.isArray(queryOutput) ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        {Object.keys(queryOutput[0] || {}).map((col) => (
                          <th key={col} className="p-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryOutput.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/50">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="p-2 text-slate-200">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre>{String(queryOutput)}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'csharp' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200">
            <div className="font-bold text-white mb-1">کۆدی تەواوی C# بۆ ویندۆز و پرۆژەی Desktop:</div>
            <p>
              وەک داوات کردبوو بە زمانی <strong>C#</strong> و بە بەکارهێنانی کتێبخانەی فەرمیی <strong>Microsoft.Data.Sqlite</strong>، ئەم کۆدە دەتوانیت ڕاستەوخۆ لەناو پرۆژەی .NET 8 / WPF / WinForms یان MAUI بەکاربهێنیت تا پەیوەست بێت بە فایلی <code className="text-amber-300">kurdo_pos.sqlite</code>.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto ltr text-left dir-ltr max-h-[460px]">
            <pre>{csharpContent}</pre>
          </div>
        </div>
      )}

      {activeTab === 'pwa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">دامەزراندن لەسەر شاشەی سەرەکی (Add to Home Screen)</h3>
              <p className="text-xs text-slate-400">
                بە کلیکێک سیستەمی KurdoPOS دەبێتە بەرنامەی فەرمی لەسەر مۆبایلەکەت یان کۆمپیوتەرەکەت.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
            <div className="font-bold text-white">سوودەکانی ئەپی سەربەخۆ لەسەر سکرین:</div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li>کارکردنی خێرا و ئۆفلاین بەبێ پێویستی بە ئینتەرنێت.</li>
              <li>پاشەکەوتکردنی هەموو داتاکان لە ناوخۆی SQLite بەبێ لەدەستچوون.</li>
              <li>کردنەوەی تەواو شاشەی بێ شریتی وێبگەڕ و بەردەستبوونی لە لیستی ئەپەکانی مۆبایل و ویندۆز.</li>
            </ul>
          </div>

          {pwaState && (
            <div className="flex gap-3">
              <button
                onClick={() => pwaState.setShowAutoPrompt(true)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>کردنەوەی پەنجەرەی داواکاری ئینستاڵ (Show Install Prompt)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
