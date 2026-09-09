import React from 'react';
import { Printer, X, Check, Copy } from 'lucide-react';
import { Sale, Settings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: Settings;
}

export const ThermalReceiptModal: React.FC<Props> = ({ isOpen, onClose, sale, settings }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">پێشبینینی وەصڵی چاپ (Thermal 80mm Receipt)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Content Container */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-black p-4 rounded shadow-lg font-mono text-xs border border-dashed border-slate-400 leading-tight select-text"
            dir="rtl"
          >
            {/* Market Header */}
            <div className="text-center pb-3 border-b border-black border-dashed">
              <h1 className="text-sm font-black font-sans text-black">{settings.marketNameKu}</h1>
              <p className="text-[10px] text-gray-700 font-sans">{settings.marketNameEn}</p>
              <p className="text-[10px] mt-1 text-gray-800 font-sans">تەلەفۆن: {settings.phone}</p>
              <p className="text-[10px] text-gray-700 font-sans">{settings.address}</p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2 text-[11px] border-b border-black border-dashed space-y-1 font-sans">
              <div className="flex justify-between">
                <span>ژمارەی وەصڵ:</span>
                <span className="font-bold font-mono">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>کاتی فرۆشتن:</span>
                <span>{new Date(sale.date || sale.createdAt || Date.now()).toLocaleString('ckb-IQ')}</span>
              </div>
              <div className="flex justify-between">
                <span>کاشێر:</span>
                <span className="font-semibold">{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>کڕیار:</span>
                <span>{sale.customerName || 'کڕیاری گشتی'}</span>
              </div>
              <div className="flex justify-between">
                <span>شێوازی پارەدان:</span>
                <span className="font-bold">
                  {sale.paymentMethod === 'cash' ? 'نەقد (Cash)' :
                   sale.paymentMethod === 'card' ? 'کارت (Card)' :
                   sale.paymentMethod === 'credit' ? 'قەرز (Credit)' : 'تێکەڵاو (Mixed)'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full my-2 text-[11px] font-sans">
              <thead>
                <tr className="border-b border-black border-dashed text-gray-700">
                  <th className="text-right py-1">کاڵا</th>
                  <th className="text-center py-1">بڕ</th>
                  <th className="text-left py-1">نرخ</th>
                  <th className="text-left py-1">کۆ</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item, idx) => {
                  const pName = item.productNameKu || item.product?.nameKu || 'کاڵا';
                  const disc = item.discount || 0;
                  const uPrice = item.unitPrice || item.product?.sellingPrice || 0;
                  const itemSubtotal = item.subtotal ?? item.total ?? (item.quantity * uPrice) ?? 0;

                  return (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-1 text-right font-medium">
                        {pName}
                        {disc > 0 && (
                          <span className="block text-[9px] text-red-600 font-mono">
                            (داشکاندن: {disc.toLocaleString()} د.ع)
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="py-1 text-left font-mono">{uPrice.toLocaleString()}</td>
                      <td className="py-1 text-left font-bold font-mono">{itemSubtotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="py-2 border-t border-black border-dashed text-[11px] space-y-1 font-sans">
              <div className="flex justify-between">
                <span>کۆی کاڵاکان:</span>
                <span className="font-mono">{(sale.subtotal || 0).toLocaleString()} د.ع</span>
              </div>

              {(sale.invoiceDiscount || sale.discount || 0) > 0 && (
                <div className="flex justify-between text-red-700 font-semibold">
                  <span>داشکاندنی وەصڵ:</span>
                  <span className="font-mono">-{(sale.invoiceDiscount || sale.discount || 0).toLocaleString()} د.ع</span>
                </div>
              )}

              {(sale.taxAmount || sale.tax || 0) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>باج:</span>
                  <span className="font-mono">+{(sale.taxAmount || sale.tax || 0).toLocaleString()} د.ع</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black border-y border-black py-1 my-1">
                <span>کۆی گشتی:</span>
                <span className="font-mono">{(sale.grandTotal || 0).toLocaleString()} د.ع</span>
              </div>

              <div className="flex justify-between">
                <span>پارەی دراو:</span>
                <span className="font-mono font-semibold">{(sale.paidAmount || 0).toLocaleString()} د.ع</span>
              </div>

              <div className="flex justify-between font-bold">
                <span>ماوە (باقی):</span>
                <span className="font-mono">{(sale.changeAmount || 0).toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* Barcode & Footer note */}
            <div className="pt-3 text-center border-t border-black border-dashed">
              <div className="text-[9px] font-mono tracking-widest py-1 border border-black inline-block px-3 rounded">
                * {sale.invoiceNumber} *
              </div>
              <p className="text-[10px] mt-2 font-sans text-gray-800 leading-snug">
                {settings.receiptFooterKu}
              </p>
              <p className="text-[9px] text-gray-500 font-sans mt-1">
                سیستەمی پێشکەوتووی مارکێت KurdoPOS v2.5
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-800 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            گونجاوە بۆ پرینتەری حەراری 80mm و وەرەقەی A4
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              داخستن (ESC)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              چاپکردن (F4 / CTRL+P)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
