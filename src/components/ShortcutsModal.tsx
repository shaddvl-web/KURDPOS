import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', descKu: 'ڕێبەری کلیلە خێراکان (ئەم پەنجەرەیە)', descEn: 'Help / Keyboard Shortcuts' },
    { key: 'F2', descKu: 'تەرکیز لەسەر خانەی بارکۆد و گەڕان', descEn: 'Focus Barcode / Search Input' },
    { key: 'F3', descKu: 'گەڕانی خێرای کاڵاکان', descEn: 'Quick Product Search' },
    { key: 'F4', descKu: 'تەواوکردنی فرۆشتن و پارەدان', descEn: 'Complete Sale & Checkout' },
    { key: 'F5', descKu: 'نوێکردنەوەی پەڕەی POS', descEn: 'Refresh POS' },
    { key: 'F6', descKu: 'هەڵبژاردنی کڕیار', descEn: 'Select Customer' },
    { key: 'F7', descKu: 'داشکاندنی وەصڵ', descEn: 'Apply Invoice Discount' },
    { key: 'F8', descKu: 'ڕاوێژکاری زیرەکی AI و ئۆتۆمەیشن', descEn: 'AI Assistant & Automation' },
    { key: 'F9', descKu: 'ڕاگرتنی وەصڵی ئێستا (Hold)', descEn: 'Hold Current Invoice' },
    { key: 'F10', descKu: 'هێنانەوەی وەصڵە ڕاگیراوەکان (Recall)', descEn: 'Recall Held Invoices' },
    { key: 'F11', descKu: 'شاشەی گەورە (Fullscreen)', descEn: 'Toggle Fullscreen' },
    { key: 'F12', descKu: 'کردنەوەی ڕێکخستنەکان', descEn: 'Open Settings' },
    { key: 'ESC', descKu: 'داخستنی مۆدالەکان / هەڵوەشاندنەوە', descEn: 'Close Modal / Cancel Action' },
    { key: 'ENTER', descKu: 'تەواوکردنی سکان / زیادکردن بۆ سەبەتە', descEn: 'Confirm / Add Item' },
    { key: 'DELETE', descKu: 'سڕینەوەی کاڵای دیاریکراو لە سەبەتە', descEn: 'Delete Selected Item' },
    { key: '+', descKu: 'زیادکردنی بڕی کاڵا (+1)', descEn: 'Increase Item Quantity' },
    { key: '-', descKu: 'کەمکردنەوەی بڕی کاڵا (-1)', descEn: 'Decrease Item Quantity' },
    { key: 'CTRL + N', descKu: 'وەصڵی نوێ (سڕینەوەی سەبەتە)', descEn: 'New Invoice' },
    { key: 'CTRL + P', descKu: 'چاپکردنی وەسڵی کۆتایی', descEn: 'Print Receipt' },
    { key: 'CTRL + B', descKu: 'خانەی بارکۆد', descEn: 'Focus Barcode Field' },
    { key: 'CTRL + H', descKu: 'مێژووی فرۆشتنەکان', descEn: 'Sales History' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">کلیلە خێراکانی کاشێر (Keyboard Shortcuts)</h2>
              <p className="text-xs text-slate-500">سیستەمەکە بە تەواوی ئامادەیە بە بێ دەستلێدانی ماوس کار بکات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">{sc.descKu}</span>
                <span className="text-[11px] text-slate-500 font-mono">{sc.descEn}</span>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-blue-700 bg-white border border-slate-300 rounded shadow-2xs whitespace-nowrap">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>بۆ داخستنی ئەم پەنجەرەیە کلیلی <strong className="text-slate-800">ESC</strong> دابگرە</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
