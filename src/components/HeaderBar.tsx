import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Package, BarChart3, ArrowDownToLine, Users, Truck,
  FileText, Wallet, Receipt, ShieldCheck, Settings as SettingsIcon,
  HelpCircle, Volume2, VolumeX, Maximize2, Minimize2, Minus, Square, X,
  Clock, Database, RefreshCw, Layers, Sparkles, Smartphone, HardDrive
} from 'lucide-react';
import { User, Shift, Settings } from '../types';
import { posSound } from '../utils/audio';
import { PWAHeaderButton } from './PWAInstallModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveModule =
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'sales'
  | 'shifts'
  | 'expenses'
  | 'reports'
  | 'ai_assistant'
  | 'users'
  | 'audit'
  | 'settings'
  | 'sqlite_db';

interface Props {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  currentUser: User;
  currentShift: Shift;
  settings: Settings;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onOpenShortcuts: () => void;
  heldCount: number;
  pwaState?: ReturnType<typeof usePWAInstall>;
}

export const HeaderBar: React.FC<Props> = ({
  activeModule,
  onSelectModule,
  currentUser,
  currentShift,
  settings,
  onToggleSound,
  soundEnabled,
  onOpenShortcuts,
  heldCount,
  pwaState,
}) => {
  const [time, setTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const navItems = [
    { id: 'pos' as ActiveModule, labelKu: 'شاشەی فرۆشتن (POS)', icon: ShoppingBag, shortcut: 'F4', badge: heldCount > 0 ? heldCount : null },
    { id: 'products' as ActiveModule, labelKu: 'بەڕێوەبردنی کاڵاکان', icon: Package },
    { id: 'inventory' as ActiveModule, labelKu: 'کۆگا و سەرمایە', icon: Layers },
    { id: 'purchases' as ActiveModule, labelKu: 'داغڵکردنی کڕین', icon: ArrowDownToLine },
    { id: 'customers' as ActiveModule, labelKu: 'کڕیاران و قەرز', icon: Users },
    { id: 'suppliers' as ActiveModule, labelKu: 'دابینکەران', icon: Truck },
    { id: 'sales' as ActiveModule, labelKu: 'وەصڵ و گەڕاندنەوە', icon: FileText },
    { id: 'shifts' as ActiveModule, labelKu: 'سندوق و شیفت', icon: Wallet },
    { id: 'expenses' as ActiveModule, labelKu: 'خەرجییەکان', icon: Receipt },
    { id: 'reports' as ActiveModule, labelKu: 'ڕاپۆرتەکان', icon: BarChart3 },
    { id: 'ai_assistant' as ActiveModule, labelKu: 'ڕاوێژکاری زیرەک (AI)', icon: Sparkles, isHighlight: true, shortcut: 'F8' },
    { id: 'sqlite_db' as ActiveModule, labelKu: 'داتابەیسی SQLite و دیڤایس', icon: Database, isHighlight: true, badge: 'SQLite' },
    { id: 'users' as ActiveModule, labelKu: 'بەکارهێنەران', icon: ShieldCheck },
    { id: 'settings' as ActiveModule, labelKu: 'ڕێکخستنەکان', icon: SettingsIcon },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 text-slate-200 select-none shrink-0 shadow-md">
      {/* Top Professional Titlebar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0b1120] border-b border-slate-800/80 text-xs">
        {/* Left: Window Title & App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center px-2 py-0.5 rounded bg-blue-600 text-white font-black text-sm tracking-tight shadow-sm">
            POS
          </div>
          <div className="h-5 w-px bg-slate-700 mx-1"></div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-slate-400">{settings.marketNameKu}</span>
            <span className="text-xs font-bold text-white tracking-wide">KurdoPOS Pro</span>
          </div>
          <span className="hidden sm:flex px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-mono border border-emerald-700/50 items-center gap-1.5 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            سیستەم چالاکە
          </span>
          {/* SQLite Storage Status */}
          <button
            onClick={() => onSelectModule('sqlite_db')}
            className="hidden md:flex px-2 py-0.5 rounded-full bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 text-[10px] font-mono border border-blue-700/50 items-center gap-1.5 transition"
            title="داتابەیسی ناوخۆیی SQLite بەردەوام هاوکاتە لەگەڵ دیڤایسەکەت"
          >
            <HardDrive className="w-3 h-3 text-blue-400" />
            <span>SQLite دیڤایس</span>
          </button>
        </div>

        {/* Center: Live Digital Clock & Shift Status */}
        <div className="hidden md:flex items-center gap-4 font-mono">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] text-slate-400">بەکارهێنەر</span>
            <span className="text-xs font-semibold text-white">{currentUser.nameKu} ({currentUser.role})</span>
          </div>
          <div className="h-5 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-blue-400 bg-slate-900/90 px-3 py-1 rounded-md border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-xs">{time}</span>
          </div>
        </div>

        {/* Right: Window Controls & Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Add to Home Screen Button */}
          {pwaState && <PWAHeaderButton installState={pwaState} />}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-md border transition-colors ${soundEnabled ? 'text-emerald-400 bg-slate-900 border-emerald-900/50 hover:bg-slate-800' : 'text-slate-500 bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
            title={soundEnabled ? 'دەنگی سیستەم چالاکە' : 'دەنگ بێدەنگکراوە'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Keyboard Shortcuts Help [F1] */}
          <button
            onClick={onOpenShortcuts}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold transition-colors border border-slate-700"
            title="کلیلە خێراکان (F1)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>F1</span>
          </button>

          {/* Fullscreen Button [F11] */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
            title="شاشەی گەورە (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Standard Windows Window Controls */}
          <div className="flex items-center mr-1 border-r border-slate-700 pr-1 gap-1">
            <button
              onClick={() => {}}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="کەمکردنەوە"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="گەورەکردن"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (confirm('ئایا دڵنیایت لە داخستنی سیستەمی POS؟')) {
                  window.close();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
              title="داخستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Ribbon */}
      <nav className="flex items-center overflow-x-auto px-3 py-1.5 gap-1.5 bg-[#0f172a] scrollbar-none border-t border-slate-800/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                posSound.playClick();
                onSelectModule(item.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : item.isHighlight
                  ? 'bg-slate-800 text-blue-300 hover:bg-slate-700 border border-blue-900/60'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isHighlight ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.labelKu}</span>
              {item.shortcut && (
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
                  {item.shortcut}
                </span>
              )}
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center animate-bounce">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
