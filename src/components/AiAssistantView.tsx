import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Send, RefreshCw, CheckCircle2, AlertTriangle,
  TrendingUp, Copy, Check, Settings as SettingsIcon, Trash2,
  Zap, DollarSign, Layers, Receipt, Users, ArrowUpRight,
  HelpCircle, ChevronRight, X, ShieldAlert, FileText, CornerDownLeft
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Product, Sale, Expense, Customer, Supplier, Shift, Settings, Purchase, AiChatMessage, AiAction } from '../types';
import { generateAiSystemPrompt } from '../utils/aiSystemContext';
import { executeAiAction, parseAiResponseForAction } from '../utils/aiAutomation';
import { sendGroqChat, checkGroqStatus, GROQ_STORAGE_KEYS, POPULAR_GROQ_MODELS, getSanitizedGroqModel } from '../utils/groqClient';
import { posSound } from '../utils/audio';

interface Props {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  currentShift: Shift;
  settings: Settings;
  onRefreshAll: () => void;
}

export const AiAssistantView: React.FC<Props> = ({
  products,
  sales,
  expenses,
  customers,
  suppliers,
  purchases,
  currentShift,
  settings,
  onRefreshAll,
}) => {
  // State
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    const saved = localStorage.getItem('kurdo_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `سڵاو بەڕێزم! من یاریدەدەری زیرەکی سیستەمی **KurdoPOS**م، کە لە ڕێگەی **Groq API** و بە مۆدێلی نوێی **Qwen 3.6** ڕاستەوخۆ بەستراومەتەوە بە هەموو داتابەیسی سیستمەکەتەوە.

دەتوانیت هەر پرسیارێک، ڕاپۆرتێک، یان شیکارییەکی دارایی و کۆگات دەوێت لێم داوا بکەیت. هەروەها دەتوانیت فەرمانم پێ بکەیت بۆ **ئەنجامدانی کاری ئۆتۆماتیکی** لە سیستمەکەدا، وەک:
- **ڕاپۆرتی دارایی و قازانج**: بە خشتەی ورد و ژمارەی فەرمی.
- **ئاگاداری کۆگا**: ناسینەوەی کاڵا کەمبووەکان و ڕاسپاردەی کڕین.
- **ئۆتۆمەیشن**: نوێکردنەوەی ژمارەی کۆگا، تۆمارکردنی خەرجی نوێ، زیادکردنی کڕیار یان دابینکەر، وەرگرتنی قەرز، و گۆڕینی نرخ.

یەکێک لە دوگمەکانی خوارەوە هەڵبژێرە یان داواکارییەکەت بنووسە:`,
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem(GROQ_STORAGE_KEYS.API_KEY) || '');
  const [selectedModel, setSelectedModel] = useState(() => getSanitizedGroqModel(localStorage.getItem(GROQ_STORAGE_KEYS.MODEL)));
  const [customModelInput, setCustomModelInput] = useState(() => getSanitizedGroqModel(localStorage.getItem(GROQ_STORAGE_KEYS.MODEL)));
  const [autoExecuteActions, setAutoExecuteActions] = useState(() => localStorage.getItem(GROQ_STORAGE_KEYS.AUTO_EXECUTE) === 'true');
  const [hasServerKey, setHasServerKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeActionNotification, setActiveActionNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check backend server Groq key status on mount
  useEffect(() => {
    checkGroqStatus().then(res => {
      setHasServerKey(res.hasGroqKey);
    });
  }, []);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('kurdo_ai_chat_history', JSON.stringify(messages.slice(-30)));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Metrics summary
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCostValuation = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalCustomerDebt = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  // Calculate net profit
  let totalCOGS = 0;
  sales.forEach(sale => {
    (sale.items || []).forEach(it => {
      const qty = it.quantity || 1;
      const unitCost = it.product?.purchasePrice || 0;
      totalCOGS += (unitCost * qty);
    });
  });
  const netProfit = totalRevenue - totalCOGS - totalExpenses;

  // Handle Save Groq Settings
  const handleSaveSettings = () => {
    localStorage.setItem(GROQ_STORAGE_KEYS.API_KEY, groqApiKey.trim());
    const modelToSave = getSanitizedGroqModel(selectedModel === 'custom' ? customModelInput.trim() : selectedModel);
    localStorage.setItem(GROQ_STORAGE_KEYS.MODEL, modelToSave);
    setSelectedModel(modelToSave);
    localStorage.setItem(GROQ_STORAGE_KEYS.AUTO_EXECUTE, String(autoExecuteActions));
    setIsSettingsOpen(false);
    posSound.playClick();
  };

  // Execute Action Manual Trigger
  const handleExecuteActionManually = (msgId: string, action: AiAction) => {
    const result = executeAiAction(action, () => {
      onRefreshAll();
    });

    if (result.success) {
      setActiveActionNotification(result.messageKu);
      setTimeout(() => setActiveActionNotification(null), 4000);

      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, actionExecuted: true } : m))
      );
    } else {
      alert(result.messageKu);
    }
  };

  // Submit Prompt to Groq Qwen
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    // Check if key is available
    if (!hasServerKey && !groqApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userMessage: AiChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);
    posSound.playClick();

    try {
      // Build fresh system prompt with current database snapshot
      const systemPrompt = generateAiSystemPrompt({
        products,
        sales,
        expenses,
        customers,
        suppliers,
        purchases,
        currentShift,
        settings,
      });

      // Format conversation history for Groq API
      const groqMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...newMessages.slice(-8).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      const modelToUse = selectedModel === 'custom' ? customModelInput.trim() : selectedModel;

      const response = await sendGroqChat({
        messages: groqMessages,
        model: modelToUse,
        customApiKey: groqApiKey,
      });

      // Parse possible automation action
      const { cleanedText, action } = parseAiResponseForAction(response.content);

      let actionExecuted = false;

      // Auto-execute if configured
      if (action && autoExecuteActions) {
        const result = executeAiAction(action, () => {
          onRefreshAll();
        });
        if (result.success) {
          actionExecuted = true;
          setActiveActionNotification(result.messageKu);
          setTimeout(() => setActiveActionNotification(null), 4000);
        }
      }

      const assistantMessage: AiChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: cleanedText,
        thinking: response.thinking,
        timestamp: new Date().toISOString(),
        action,
        actionExecuted,
      };

      setMessages(prev => [...prev, assistantMessage]);
      posSound.playBarcodeBeep();
    } catch (err: any) {
      console.error('Groq Qwen chat error:', err);
      posSound.playError();

      const errorMessage: AiChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **هەڵە لە پەیوەندیکردن بە Groq API:**\n${err.message || 'هەڵەیەکی چاوەڕواننەکراو ڕوویدا.'}\n\nتکایە دڵنیابەرەوە لە دروستی Groq API Key و ناوی مۆدێلەکەت لە بەشی ڕێکخستنەکان.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const clearChat = () => {
    if (confirm('ئایا دڵنیایت لە سڕینەوەی هەموو مێژووی گفتوگۆی AI؟')) {
      setMessages([messages[0]]);
      localStorage.removeItem('kurdo_ai_chat_history');
      posSound.playClick();
    }
  };

  // Quick report templates
  const quickReports = [
    {
      title: 'ڕاپۆرتی قازانج و داهات',
      prompt: 'ڕاپۆڕتێکی گشتی و وردم بۆ ئامادە بکە لەسەر قازانجی پوختە، داهاتی گشتی، تێچووی کاڵاکان (COGS)، خەرجییەکان، و ڕێژەی سەرکەوتنی فرۆش بە خشتەی مارکداون.',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    },
    {
      title: 'شیکاری کاڵا کەمبووەکان',
      prompt: 'شیکاری دۆخی کۆگام بۆ بکە، لیستێکی ڕێکخراو لە هەموو ئەو کاڵایانەم بۆ دابنێ کە تەواوبوون یان لە کەمیدان، لەگەڵ پێشنیاری ژمارەی پێویست بۆ کڕینەوە لە دابینکەران.',
      icon: AlertTriangle,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    },
    {
      title: 'ڕاپۆرتی قەرزی کڕیاران',
      prompt: 'ڕاپۆرتێکی وردم بۆ بکە لەسەر دۆخی قەرزەکانی مارکێت لەسەر کڕیاران و دابینکەران، کێ زۆرترین قەرزی لەسەرە و مەترسییەکانی قەرزی درەنگکەوتوو چۆن کۆنتڕۆڵ بکەین؟',
      icon: Users,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    },
    {
      title: 'شیکاری خەرجییەکان',
      prompt: 'شیکاری هەموو خەرجییە تۆمارکراوەکانی ئەم سیستمەم بۆ بکە بەپێی پۆل و بەشەکان، و ڕێنماییم پێبدە لەسەر چۆنیەتی کەمکردنەوەی بەفیڕۆچوون و زیادکردنی پاشەکەوت.',
      icon: Receipt,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20',
    },
  ];

  // Quick automation actions
  const quickActions = [
    {
      label: 'زیادکردنی ٢٠ دانە بۆ کۆگا',
      prompt: '٢٠ دانە لە کاڵای دۆشاوی تەماتە زیاد بکە بۆ کۆگا چونکە کڕینەوەی نوێ هاتووە.',
    },
    {
      label: 'تۆمارکردنی خەرجی خاوێنکردنەوە',
      prompt: 'خەرجییەکی نوێ تۆمار بکە: ١٥،٠٠٠ د.ع بۆ کڕینی مەوادی پاککەرەوە لە پۆلی خاوێنکردنەوە.',
    },
    {
      label: 'تۆمارکردنی کڕیارێکی نوێ',
      prompt: 'کڕیارێکی نوێ بۆ سیستەم زیاد بکە بە ناوی "هەندرێن فەرهاد" بە ژمارە مۆبایلی "07503344556" و سنووری قەرزی ٥٠٠،٠٠٠ د.ع.',
    },
    {
      label: 'نوێکردنەوەی نرخی فرۆشتن',
      prompt: 'نرخی فرۆشتنی کاڵای چای مەحمود 400g نوێ بکەرەوە بۆ ٤،٧٥٠ د.ع.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans relative" dir="rtl">
      {/* Top Banner & KPI Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Model Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">ڕاوێژکاری زیرەک و ئۆتۆمەیشنی سیستم</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  Groq API • {selectedModel === 'custom' ? customModelInput : selectedModel}
                </span>
                {autoExecuteActions && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    ئۆتۆمەیشنی ڕاستەوخۆ چالاکە
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                پەیوەست بە داتای ڕاستەوخۆی مارکێت • شیکاری دارایی • ڕاپۆرتی کوردی • ئەنجامدانی فەرمان
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">کۆی داهات</span>
                <span className="font-mono font-bold text-white text-xs">{totalRevenue.toLocaleString()} د.ع</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">قازانجی پوختە</span>
                <span className={`font-mono font-bold text-xs ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netProfit.toLocaleString()} د.ع
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">کەمبوون لە کۆگا</span>
                <span className="font-mono font-bold text-amber-400 text-xs">{lowStockCount} کاڵا</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">قەرزی لای کڕیاران</span>
                <span className="font-mono font-bold text-rose-400 text-xs">{totalCustomerDebt.toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                title="ڕێکخستنەکانی Groq و مۆدێل"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">ڕێکخستن</span>
              </button>

              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                title="سڕینەوەی گفتوگۆ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {activeActionNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{activeActionNotification}</span>
        </div>
      )}

      {/* Main Chat Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin">
        {/* Quick Report Cards at the top */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              ڕاپۆرتە خێرا و ئۆتۆماتیکییەکان لەسەر داتای ئەم ساتە:
            </span>
            <span className="text-[11px] text-slate-400">کلیك بکە بۆ دروستکردنی دەستبەجێی ڕاپۆرت</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {quickReports.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 shadow-xs cursor-pointer ${item.color} disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">{item.title}</span>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] opacity-80 line-clamp-2 leading-relaxed font-normal">
                    {item.prompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Automation Prompts Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-slate-400 px-1 flex items-center gap-1 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            نموونەی فەرمانە ئۆتۆماتیکییەکان (کاری دەستبەجێ لە سیستەم):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qa.prompt)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-blue-950/80 hover:text-blue-300 text-slate-300 border border-slate-800 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>⚡ {qa.label}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 rotate-180" />
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-800/80 my-2"></div>

        {/* Conversation Bubbles */}
        <div className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = msg.isError;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : isError
                      ? 'bg-rose-600 text-white'
                      : 'bg-linear-to-br from-indigo-600 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? 'تۆ' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Content */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 shadow-md border ${
                    isUser
                      ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                      : isError
                      ? 'bg-rose-950/40 text-rose-200 border-rose-800/80 rounded-tl-none'
                      : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none'
                  }`}
                >
                  {/* Thinking Process if available from Qwen reasoning */}
                  {msg.thinking && (
                    <details className="mb-2 bg-slate-950/80 border border-indigo-950 rounded-lg p-2.5 text-[11px] text-slate-300">
                      <summary className="cursor-pointer text-indigo-400 font-medium text-[11px] hover:text-indigo-300 select-none flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>بیرکردنەوە و شیتاڵکاری ژیری دەستکرد (Qwen Reasoning Process)</span>
                      </summary>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 font-mono text-[10px] whitespace-pre-wrap leading-relaxed text-slate-400 max-h-48 overflow-y-auto ltr text-left dir-ltr bg-slate-950/50 p-2 rounded">
                        {msg.thinking}
                      </div>
                    </details>
                  )}

                  {/* Markdown Content */}
                  <div className="prose prose-invert max-w-none text-xs space-y-2 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-table:border prose-table:border-slate-700 prose-th:border prose-th:border-slate-700 prose-th:p-2 prose-th:bg-slate-800/70 prose-td:border prose-td:border-slate-800 prose-td:p-2 prose-strong:text-blue-300">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Automation Action Card */}
                  {msg.action && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-indigo-900/60 space-y-2 text-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 font-bold text-indigo-400 text-xs">
                          <Zap className="w-4 h-4 text-amber-400" />
                          فەرمانی ئۆتۆمەیشنی سیستم (Automation Action)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {msg.action.type}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-white">
                        {msg.action.descriptionKu}
                      </p>

                      {/* Action Parameters Badges */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        {Object.entries(msg.action.params).map(([key, val]) => (
                          <span key={key} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                            {key}: <strong className="text-white">{String(val)}</strong>
                          </span>
                        ))}
                      </div>

                      {/* Action Execution Button / Status */}
                      <div className="pt-1 flex items-center justify-between">
                        {msg.actionExecuted ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            جێبەجێکراوە لە داتابەیسدا
                          </span>
                        ) : (
                          <button
                            onClick={() => handleExecuteActionManually(msg.id, msg.action!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>جێبەجێکردنی فەرمان لە سیستم (تۆمارکردن)</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400">دەستبەجێ کار لەسەر داتا دەکات</span>
                      </div>
                    </div>
                  )}

                  {/* Bubble Footer & Copy Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString('ckb-IQ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="لەبەرگرتنەوەی ڕاپۆرت"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">لەبەرگیرایەوە</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>لەبەرگرتنەوە</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>مۆدێلی Qwen سەرقاڵی شیکردنەوەی داتا و داڕشتنی ڕاپۆرتە...</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="پرسیار لەسەر فرۆش، قەرز، کۆگا بکە یان فەرمانی ئۆتۆمەیشن بنووسە..."
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-4 pl-10"
            />
            {inputPrompt && (
              <button
                type="button"
                onClick={() => setInputPrompt('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 rotate-180" />
                <span>ناردن</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between max-w-4xl mx-auto mt-2 text-[10px] text-slate-400 px-1">
          <span>Groq Cloud • پەیوەستە بە ژمێریاری و کۆگای KurdoPOS • وەڵامدانەوەی خێرا بە زمانی کوردی</span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-blue-300 underline transition-colors"
          >
            گۆڕینی کلیل یان مۆدێلی Qwen
          </button>
        </div>
      </div>

      {/* Settings Modal (Groq API Key & Model Configuration) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">ڕێکخستنی Groq API و مۆدێلی Qwen</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* API Key Status */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Groq API Key:
                </label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder={hasServerKey ? 'کلیل لە ڕاژەکارەوە (Server .env) دیاریکراوە' : 'gsk_...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {hasServerKey ? (
                    <span className="text-emerald-400">✓ کلیلی Groq لە سیستەم چالاکە، بەڵام دەتوانیت کلیلی خۆشت بنووسیت.</span>
                  ) : (
                    <span>دەتوانیت کلیلێکی بێبەرامبەر لە ماڵپەڕی <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-400 underline">console.groq.com</a> بەدەستبهێنیت.</span>
                  )}
                </p>
              </div>

              {/* Model Choice */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  مۆدێلی ژیری دەستکرد (Model):
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  {POPULAR_GROQ_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                  <option value="custom">مۆدێلێکی تایبەت (Custom Model)...</option>
                </select>
              </div>

              {/* Custom Model Input */}
              {selectedModel === 'custom' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    ناوی مۆدێلی تایبەت:
                  </label>
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="qwen/qwen3.6-27b یان qwen/qwen3.8-27b"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs"
                  />
                </div>
              )}

              {/* Auto Execution of Actions Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoExecuteActions}
                    onChange={(e) => setAutoExecuteActions(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">جێبەجێکردنی ئۆتۆماتیکی فەرمانەکان</span>
                    <span className="text-[10px] text-slate-400">
                      کاتێک AI فەرمانێک (وەک زیادکردنی کۆگا یان خەرجی) دەدۆزێتەوە دەستبەجێ بەبێ پێویستی کلیک جێبەجێی بکات.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
