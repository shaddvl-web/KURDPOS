import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, RefreshCw, Check, Database, Store, DollarSign, Printer } from 'lucide-react';
import { Settings } from '../types';
import { posSound } from '../utils/audio';

interface Props {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onExportDatabase: () => void;
  onImportDatabase: (jsonString: string) => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onSaveSettings,
  onExportDatabase,
  onImportDatabase,
  onResetDatabase,
}) => {
  const [formData, setFormData] = useState<Settings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    posSound.playSuccess();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        onImportDatabase(json);
        posSound.playSuccess();
        alert('داتابەیسەکە بە سەرکەوتوویی گەڕێنرایەوە (Database Restored)!');
      } catch (err) {
        posSound.playError();
        alert('هەڵە ڕوویدا لە خوێندنەوەی فایلی بەکئەپ!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-950 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">ڕێکخستنەکانی سیستەم (System Settings)</h1>
            <p className="text-xs text-slate-400">ناونیشانی مارکێت، باج، دراو، ڕێکخستنی پسوولە و بەکئەپ</p>
          </div>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>ڕێکخستنەکان پاشەکەوت کران!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Market Profile Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <Store className="w-4 h-4 text-sky-400" />
            <span>زانیاری مارکێت و کۆمپانیا</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی مارکێت (کوردی) *</label>
              <input
                type="text"
                required
                value={formData.marketNameKu}
                onChange={(e) => setFormData({ ...formData, marketNameKu: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ناوی مارکێت (ئینگلیزی)</label>
              <input
                type="text"
                value={formData.marketNameEn}
                onChange={(e) => setFormData({ ...formData, marketNameEn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ژمارەی تەلەفۆنی مارکێت</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ژمارەی ناسنامەی باج / بازرگانی</label>
              <input
                type="text"
                value={formData.taxNumber || ''}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>دراو، نرخی ئاڵوگۆڕ و باج</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نرخی ١٠٠ دۆلار بە دینار (Exchange Rate)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.currencyRate}
                  onChange={(e) => setFormData({ ...formData, currencyRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  dir="ltr"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">د.ع بۆ هەر $1</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="taxEnabled"
                checked={formData.taxEnabled}
                onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                className="rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-0 w-4 h-4"
              />
              <label htmlFor="taxEnabled" className="text-xs font-semibold text-slate-300">
                چالاککردنی باجی فرۆشتن لەسەر پسوولە
              </label>
            </div>

            {formData.taxEnabled && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ڕێژەی باج (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
            <Printer className="w-4 h-4 text-purple-400" />
            <span>ڕێکخستنەکانی پسوولەی کاشێر (Thermal Receipt)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">پەیامی سەرەوەی پسوولە</label>
              <input
                type="text"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">پەیامی خوارەوە (سوپاسگوزاری)</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex items-center gap-4 pt-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.showLogoOnReceipt}
                  onChange={(e) => setFormData({ ...formData, showLogoOnReceipt: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-sky-600"
                />
                پیشاندانی لۆگۆی مارکێت لەسەر پسوولە
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.showBarcodeOnReceipt}
                  onChange={(e) => setFormData({ ...formData, showBarcodeOnReceipt: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-sky-600"
                />
                پیشاندانی بارکۆدی پسوولە
              </label>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-950 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>پاشەکەوتکردنی هەموو ڕێکخستنەکان</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-amber-400" />
          <span>پاشەکەوتکردن و گەڕاندنەوەی داتابەیس (Backup & Restore)</span>
        </div>

        <p className="text-xs text-slate-400">
          دەتوانیت هەر کاتێک بتەوێت فایلی تەواوی داتابەیسی سیستەم (کاڵاکان، کڕیاران، فرۆش، شیفتەکان) دابگریت و لەسەر کۆمپیوتەرێکی تر بگەڕێنیتەوە.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportDatabase}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>داگرتنی فایلی بەکئەپ (Export JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>گەڕاندنەوە لە فایلی بەکئەپ (Restore JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset Database */}
          <button
            type="button"
            onClick={onResetDatabase}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900 text-red-300 rounded-lg text-xs font-bold border border-red-800/60 transition-colors mr-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>گەڕاندنەوەی داتابەیس بۆ سەرەتایی (Reset to Initial Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
