import React from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle, Monitor, ShieldCheck, Database } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  installState: ReturnType<typeof usePWAInstall>;
}

export const PWAInstallModal: React.FC<Props> = ({ installState }) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showAutoPrompt,
    setShowAutoPrompt,
    install,
    dismissAutoPrompt,
  } = installState;

  if (isInstalled || !showAutoPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-blue-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={dismissAutoPrompt}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="داخستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3.5 border border-blue-400/30">
            <Smartphone className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold mb-2">
            <Download className="w-3.5 h-3.5" />
            <span>داواکاری ئینستاڵ (Add to Home Screen)</span>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            دامەزراندنی KurdoPOS لەسەر دیڤایسەکەت
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mb-4">
            بەخێربێیت! دەتوانیت ئەم سیستەمە ڕاستەوخۆ بخەیتە سەر شاشەی سەرەکی (Home Screen) وەک بەرنامەیەکی فەرمی، بەبێ پێویستی بە دابەزاندنی فایل، لەگەڵ داتابەیسی خێرای <strong className="text-amber-300">SQLite</strong> و کارکردنی بەردەوامی ئۆفلاین.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>کارکردنی ئۆفلاین ١٠٠٪</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span>داتابەیسی SQLite لەناو دیڤایس</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>پاراستنی هەموو داتاکان</span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-400 shrink-0" />
            <span>شاشەی گەورەی POS و بارکۆد</span>
          </div>
        </div>

        {/* Installation Instructions / Button */}
        {isInstallable ? (
          <div className="space-y-3">
            <button
              onClick={async () => {
                await install();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>ئێستا دایمەزرێنە (Add to Home Screen)</span>
            </button>
            <button
              onClick={dismissAutoPrompt}
              className="w-full py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition"
            >
              دواتر لە ڕێکخستنەکان دایدەمەزرێنم
            </button>
          </div>
        ) : isIOS ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs space-y-2 text-blue-100">
              <div className="font-bold text-blue-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>ڕێنمایی بۆ ئامێرەکانی iPhone و iPad:</span>
              </div>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">١</span>
                <span>لە شریتی خوارەوەی وێبگەڕی Safari کلیک لەسەر دوگمەی <strong className="text-white flex inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> بکە.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">٢</span>
                <span>کەمێک بۆ خوارەوە بڕۆ و کلیک لەسەر <strong className="text-white flex inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong> بکە.</span>
              </p>
            </div>
            <button
              onClick={dismissAutoPrompt}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              تێگەیشتم، سوپاس
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 space-y-1.5">
              <p className="font-medium text-white flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>بۆ کۆمپیوتەر یان وێبگەڕی تر:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                دەتوانیت لە ڕێگەی ئایکۆنی دامەزراندن لە بەشی سەرەوەی ئەدرەسبار (URL Bar) لە وێبگەڕەکەتدا یان مێنۆی سەرووی وێبگەڕ (⋮) بژاردەی <strong>Install KurdoPOS</strong> یان <strong>Add to Home Screen</strong> هەڵبژێریت.
              </p>
            </div>
            <button
              onClick={dismissAutoPrompt}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              داخستن و بەردەوامبوون لەگەڵ وێب
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const PWAHeaderButton: React.FC<{ installState: ReturnType<typeof usePWAInstall> }> = ({ installState }) => {
  const { isInstalled, setShowAutoPrompt, isInstallable } = installState;

  if (isInstalled) return null;

  return (
    <button
      onClick={() => setShowAutoPrompt(true)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 border border-blue-400/40 animate-pulse"
      title="دامەزراندنی ئەپڵیکەیشن لەسەر شاشەی سەرەکی (Add to Home Screen)"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-200" />
      <span className="hidden sm:inline">ئاد بۆ سەر سکرین</span>
      <span className="sm:hidden">ئینستاڵ</span>
    </button>
  );
};
