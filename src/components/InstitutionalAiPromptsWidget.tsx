import React from 'react';
import {
  Compass,
  DollarSign,
  AlertTriangle,
  Building2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
} from 'lucide-react';

interface InstitutionalAiPromptsWidgetProps {
  symbol: string;
  tokenAddress: string;
  onRunAiPrompt: (promptText: string) => void;
  isLoading?: boolean;
}

export const InstitutionalAiPromptsWidget: React.FC<InstitutionalAiPromptsWidgetProps> = ({
  symbol,
  tokenAddress,
  onRunAiPrompt,
  isLoading = false,
}) => {
  // 1. Question 1: Stage Determination
  const promptStage = `Вопрос 1 — Определи текущую стадию токена ${symbol} (${tokenAddress}) по lifecycle:
0 Just Launched
1 DEX-only Early Momentum
2 DEX-only Mature
3 Tier-2 CEX Listed
4 Binance Alpha
5 Binance Spot/Futures
6 Post-listing Distribution

Объясни, какие данные подтверждают стадию. Не используй один критерий.`;

  // 2. Question 2: $11 Micro-Entry
  const promptMicroEntry = `Вопрос 2 — Оцени токен ${symbol} (${tokenAddress}) как micro-entry на $11.
Не давай инвестиционный совет. Определи только класс риска:
A — Worth micro-entry
B — Watch only
C — Too late
D — Avoid
E — Scam/rug risk

Проверь:
- sell simulation
- contract risks
- LP и глубина выхода
- creator cluster
- clean flow
- holder growth
- early buyer selling
- liquidity change
- CEX path
- narrative stage

В конце выдай:
- Micro Entry Score (0–100)
- Main reason to enter
- Main reason to avoid
- Invalidation trigger`;

  // 3. Question 3: DEX Stagnation & Ceiling
  const promptDexCeiling = `Вопрос 3 — Проверь, почему токен ${symbol} (${tokenAddress}) остаётся DEX-only и не переходит в CEX/Alpha стадию.
Оцени:
- недостаточный объём
- слабая ликвидность
- низкий holder growth
- высокая концентрация
- плохой контракт
- слабый нарратив
- отсутствие social traction
- wash volume вместо organic flow
- early cohort distribution

Выдай:
- DEX Ceiling Risk (0–100)
- Что конкретно должно измениться, чтобы токен перешёл на следующую стадию.`;

  // 4. Question 4: Binance Continuation vs Distribution
  const promptBinance = `Вопрос 4 — Если токен ${symbol} (${tokenAddress}) добрался до Binance/крупного CEX:
Проверь:
- листинг создал новый спрос или стал выходом для ранних кошельков;
- CEX volume относительно DEX;
- deposits/withdrawals;
- spot/perp basis;
- funding;
- OI;
- DEX-CEX price divergence;
- whale deposits.

Выдай:
- Post-listing continuation probability
- Post-listing distribution risk
- Main trigger for continuation
- Main trigger for unwind`;

  // 5. Master Prompt: Full 4-Pillar Synthesis
  const promptMasterAll = `ПОЛНЫЙ ИНСТИТУЦИОНАЛЬНЫЙ СИНТЕЗ ПО ТОКЕНУ ${symbol} (${tokenAddress}):

1. СТАДИЯ ЖИЗНЕННОГО ЦИКЛА (0–6): Обоснуй стадию по нескольким источникам (DEX, CEX, ончейн).
2. ОЦЕНКА ПОД $11 MICRO-ENTRY: Выстави класс риска (A/B/C/D/E) и скор 0–100 с причинами за и против.
3. БАРЬЕРЫ ПЕРЕХОДА / DEX CEILING: Что мешает выйти на CEX/Binance Alpha и какой Ceiling Risk (0–100).
4. CEX / BINANCE STATUS: Кто побеждает — спотовый покупатель или деривативная разгрузка китов.
5. ИТОГОВАЯ КОРОТКАЯ ЛОГИКА: Резюме в 3 предложениях с триггером отмены (Invalidation).`;

  return (
    <div id="institutional-ai-prompts-widget" className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 space-y-4 font-mono shadow-2xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Институциональные Вопросы к AI-Движку
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Готовые форензик-запросы в 1 клик для глубокого синтеза токена {symbol}
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <span>AI Модель: </span>
          <strong className="text-emerald-400">Gemini 2.5 Pro + Math Core v3</strong>
        </div>
      </div>

      {/* 4 Quick Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-sans">
        {/* Button 1: Stage Determination */}
        <button
          id="btn-ai-prompt-stage"
          type="button"
          onClick={() => onRunAiPrompt(promptStage)}
          disabled={isLoading}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition cursor-pointer group flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span>1. ОПРЕДЕЛИТЬ СТАДИЮ (0–6)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            Анализ жизненного цикла токена: от Fresh DEX до Binance Spot по нескольким подтверждающим источникам.
          </p>
        </button>

        {/* Button 2: $11 Micro-Entry */}
        <button
          id="btn-ai-prompt-micro-entry"
          type="button"
          onClick={() => onRunAiPrompt(promptMicroEntry)}
          disabled={isLoading}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition cursor-pointer group flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>2. ОЦЕНКА ДЛЯ $11 (GRADE A–E)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            Скоринг 0–100 для микро-входа: симуляция продажи, кластер деплоера, чистый приток и триггеры отмены.
          </p>
        </button>

        {/* Button 3: DEX Ceiling & Stagnation */}
        <button
          id="btn-ai-prompt-dex-ceiling"
          type="button"
          onClick={() => onRunAiPrompt(promptDexCeiling)}
          disabled={isLoading}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition cursor-pointer group flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>3. ПОЧЕМУ ЗАСТРЯЛ НА DEX?</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            Расчет DEX Ceiling Risk (0–100): почему токен не переходит на CEX и что конкретно должно измениться.
          </p>
        </button>

        {/* Button 4: Binance Continuation vs Distribution */}
        <button
          id="btn-ai-prompt-binance"
          type="button"
          onClick={() => onRunAiPrompt(promptBinance)}
          disabled={isLoading}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-yellow-500/40 text-left transition cursor-pointer group flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono font-bold text-slate-200 group-hover:text-yellow-300 transition-colors">
              <Building2 className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>4. BINANCE: СПРОС VS РАЗГРУЗКА</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            Ордерфлоу Binance: спотовый спрос vs разгрузка ранних фондов, открытый интерес (OI) и фандинг.
          </p>
        </button>
      </div>

      {/* Master 1-Click Button: Full Synthesis */}
      <button
        id="btn-ai-prompt-master-all"
        type="button"
        onClick={() => onRunAiPrompt(promptMasterAll)}
        disabled={isLoading}
        className="w-full p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
      >
        <Zap className="w-4 h-4 text-slate-950 fill-current" />
        <span>СИНТЕЗИРОВАТЬ ПОЛНЫЙ ФОРЕНЗИК-ОТЧЕТ (ВСЕ 4 ВОПРОСА В 1 КЛИК)</span>
      </button>

      {/* Philosophy Legend Footer */}
      <div className="pt-2 border-t border-slate-800/80 text-[11px] font-sans text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <strong className="text-white font-mono">DEX-only:</strong> раннее обнаружение, риск — rug и концентрация.
        </div>
        <div>
          <strong className="text-white font-mono">Binance-stage:</strong> продолжение тренда, риск — вершина листинга.
        </div>
      </div>
    </div>
  );
};
