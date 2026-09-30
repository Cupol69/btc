import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  Coins,
  Cpu,
  RefreshCw,
  Zap,
  Lock,
  ArrowRightLeft,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DexFivePillarForensicVerdictCardProps {
  tokenAddress: string;
  symbol: string;
  name: string;
  chain: string;
  liquidityUsd: number;
  volume24h: number;
  priceUsd: number;
  topHolders?: Array<{ address: string; percent: number; isContract?: boolean; tag?: string }>;
  isHoneypot?: boolean;
  buyTax?: number;
  sellTax?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  buys1h?: number;
  sells1h?: number;
  safetyScore?: number;
  riskCategory?: string;
  cycleStage?: string;
  summaryVerdict?: string;
}

interface BitqueryClusterResult {
  source?: string;
  connected?: boolean;
  clusters?: Array<{
    clusterId?: string;
    role?: string;
    type?: string;
    address?: string;
    addresses?: string[];
    shareOfVolumePct?: number;
    transfersCount?: number;
    volumeUsd?: number;
    details?: string;
  }>;
  clusterRiskScore?: string;
  transfersCount?: number;
}

export const DexFivePillarForensicVerdictCard: React.FC<DexFivePillarForensicVerdictCardProps> = ({
  tokenAddress,
  symbol,
  name,
  chain,
  liquidityUsd,
  volume24h,
  priceUsd,
  topHolders = [],
  isHoneypot = false,
  buyTax = 0,
  sellTax = 0,
  priceChange1h = 0,
  priceChange24h = 0,
  buys1h = 0,
  sells1h = 0,
  safetyScore = 50,
  riskCategory = 'MODERATE',
  cycleStage = 'Консолидация',
  summaryVerdict,
}) => {
  const [customExitSize, setCustomExitSize] = useState<number>(3000);
  const [bitqueryData, setBitqueryData] = useState<BitqueryClusterResult | null>(null);
  const [isLoadingBitquery, setIsLoadingBitquery] = useState<boolean>(false);

  // Load Bitquery cluster forensics
  useEffect(() => {
    if (!tokenAddress || !/^0x[a-f0-9]{40}$/i.test(tokenAddress)) return;

    let isMounted = true;
    setIsLoadingBitquery(true);

    const targetNetwork = chain.toLowerCase().includes('eth') ? 'eth' : 'bsc';
    fetch(`/api/bitquery/cluster-forensics?token=${tokenAddress}&network=${targetNetwork}&limit=25`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setBitqueryData(data);
        }
      })
      .catch((err) => {
        console.warn('[Bitquery Forensics] Error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBitquery(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tokenAddress, chain]);

  // 1. Movement Type Calculation (Controlled Pump vs Organic vs Sector)
  const movementType = useMemo(() => {
    const totalTrades1h = (buys1h || 0) + (sells1h || 0);
    const volLiqRatio = liquidityUsd > 0 ? (volume24h / liquidityUsd) : 0;

    if (isHoneypot || sellTax > 20) {
      return {
        label: 'Искусственный памп (Controlled Pump / Honeypot)',
        type: 'CONTROLLED',
        color: 'text-rose-400',
        bg: 'bg-rose-950/80 border-rose-500/50',
        desc: 'Экстремальный контроль: вывод заблокирован или облагается непомерным налогом.',
      };
    }

    if (bitqueryData?.clusters && bitqueryData.clusters.length > 0 && bitqueryData.clusters[0]?.shareOfVolumePct > 35) {
      return {
        label: 'Искусственный памп (Controlled MM Pump)',
        type: 'CONTROLLED',
        color: 'text-rose-400',
        bg: 'bg-rose-950/80 border-rose-500/50',
        desc: `Маркет-мейкер генерирует ${bitqueryData.clusters[0].shareOfVolumePct}% объема через связанные адреса.`,
      };
    }

    if (priceChange1h > 15 && totalTrades1h < 40 && volLiqRatio > 1.5) {
      return {
        label: 'Искусственный памп (Controlled Pump в тонком стакане)',
        type: 'CONTROLLED',
        color: 'text-rose-400',
        bg: 'bg-rose-950/80 border-rose-500/50',
        desc: 'Разгон цены малым числом сделок на тонкой ликвидности без притока новых покупателей.',
      };
    }

    if (priceChange24h > 20 && totalTrades1h > 200 && volLiqRatio > 0.8) {
      return {
        label: 'Органический импульс (Organic Inflow)',
        type: 'ORGANIC',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-500/50',
        desc: 'Рост подтвержден широкой базой розничных покупателей и пропорциональной ликвидностью.',
      };
    }

    return {
      label: 'Секторный тренд / Консолидация (Sector Beta)',
      type: 'SECTOR',
      color: 'text-amber-400',
      bg: 'bg-amber-950/80 border-amber-500/50',
      desc: 'Движение в фарватере китайских мемов BSC и BNB экосистемы.',
    };
  }, [buys1h, sells1h, liquidityUsd, volume24h, isHoneypot, sellTax, bitqueryData, priceChange1h, priceChange24h]);

  // Format Russian grammar declension: 1 кошельке, 2 кошельках, 5 кошельках
  const formatWalletsPhrase = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return `${count} кошельке`;
    }
    return `${count} кошельках`;
  };

  // 2. Ownership & Creator Cluster Calculation (Strictly Real Data, No Fake Fallbacks)
  const clusterOwnership = useMemo(() => {
    // Filter out LP routers, dead/burn, zero address, DEX pair contracts
    const cleanHolders = (topHolders || []).filter((h) => {
      if (!h) return false;
      const addr = (h.address || '').toLowerCase();
      return (
        !addr.includes('0x000000000000000000000000000000000000dead') &&
        !addr.includes('0x0000000000000000000000000000000000000000') &&
        !h.isContract &&
        !h.tag?.toLowerCase().includes('pancake') &&
        !h.tag?.toLowerCase().includes('router') &&
        !h.tag?.toLowerCase().includes('burn') &&
        !h.tag?.toLowerCase().includes('pair') &&
        !h.tag?.toLowerCase().includes('factory')
      );
    });

    const hasHolderData = cleanHolders.length > 0;
    const top5Percent = cleanHolders.slice(0, 5).reduce((acc, h) => acc + (h.percent || 0), 0);
    const top20Percent = cleanHolders.slice(0, 20).reduce((acc, h) => acc + (h.percent || 0), 0);
    const cleanCount = cleanHolders.length;

    // Bitquery detected clusters
    const mainBqCluster = bitqueryData?.clusters?.[0];
    const bqWhaleShare = mainBqCluster?.shareOfVolumePct || 0;
    const bqAddressCount = mainBqCluster?.addresses?.length || (mainBqCluster ? 1 : 0);

    let displayPercent: number | null = null;
    let displayWallets: number | null = null;
    let label = 'Кластер создателя / Смарт-контракт';
    let topPrivateEoa = 'N/A';
    let isSyndicate = false;

    if (mainBqCluster && bqWhaleShare > 0) {
      // Bitquery detected explicit connected cluster
      displayPercent = Number(bqWhaleShare.toFixed(1));
      displayWallets = bqAddressCount;
      label = mainBqCluster.role || 'Связанный кластер маркет-мейкера';
      isSyndicate = bqWhaleShare > 40;
      topPrivateEoa = cleanHolders[0]?.percent ? `${cleanHolders[0].percent.toFixed(1)}%` : 'N/A';
    } else if (hasHolderData) {
      // On-chain adjusted top holders from BSCScan / GoPlus
      const holderShare = top20Percent > 0 ? top20Percent : top5Percent;
      displayPercent = Number(holderShare.toFixed(1));
      displayWallets = cleanCount;
      label = `Adjusted Top-${Math.min(cleanCount, 20)} EOA холдеров`;
      isSyndicate = holderShare > 50;
      topPrivateEoa = cleanHolders[0]?.percent ? `${cleanHolders[0].percent.toFixed(1)}%` : 'N/A';
    }

    return {
      hasData: displayPercent !== null,
      percent: displayPercent,
      walletCount: displayWallets,
      label,
      topPrivateEoaPercent: topPrivateEoa,
      isSyndicateConcentrated: isSyndicate,
      cleanCount,
    };
  }, [topHolders, bitqueryData]);

  // 3. Real Pool Capacity & Price Impact Calculation
  // AMM formula dx / (x + dx) where x is token pool reserves in quote asset (~50% of TVL)
  const calculateSlippage = (sizeUsd: number) => {
    const poolReserveQuote = Math.max(liquidityUsd * 0.5, 1000); // Quote reserve (BNB / USDT)
    // Exact constant product AMM price impact: dy = y * dx / (x + dx) => slippage = dx / (x + dx)
    const impact = (sizeUsd / (poolReserveQuote + sizeUsd)) * 100;
    return Math.min(99.9, Math.max(0.1, impact));
  };

  const slippageCustom = calculateSlippage(customExitSize);
  const slippage1k = calculateSlippage(1000);
  const slippage3k = calculateSlippage(3000);
  const slippage10k = calculateSlippage(10000);

  // 4. Current Phase Calculation
  const currentPhase = useMemo(() => {
    if (isHoneypot) return 'Критическая ловушка (Honeypot / Экзит)';
    if (bitqueryData?.clusters && bitqueryData.clusters.length > 0 && bitqueryData.clusters[0]?.shareOfVolumePct > 50 && (sells1h || 0) > (buys1h || 0)) {
      return 'Скрытая разгрузка (Hidden Distribution): ранние кошельки сбрасывают объем в розницу';
    }
    if (priceChange24h > 50 && (sells1h || 0) > (buys1h || 0) * 0.8) {
      return 'Завершение разгона: фиксация прибыли крупными адресами';
    }
    if (priceChange1h > 10 && (buys1h || 0) > (sells1h || 0)) {
      return 'Активная фаза разгона / Памп';
    }
    return cycleStage || 'Консолидация в диапазоне';
  }, [isHoneypot, bitqueryData, sells1h, buys1h, priceChange24h, priceChange1h, cycleStage]);

  // 5. Manipulation Risk Score & Recommendation
  const manipulationAssessment = useMemo(() => {
    let score = 100 - safetyScore;
    if (isHoneypot) score = 99;
    if (clusterOwnership.hasData && clusterOwnership.percent && clusterOwnership.percent > 70) score = Math.max(score, 90);
    if (slippage3k > 20) score = Math.max(score, 85);
    if (movementType.type === 'CONTROLLED') score = Math.max(score, 88);

    let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let recommendation = 'Работать с пониженным сайзом.';
    let badgeBg = 'bg-amber-950/90 border-amber-500 text-amber-300';

    if (score >= 80) {
      level = 'CRITICAL';
      recommendation = 'НЕ ВХОДИТЬ. Высокая вероятность экзит-пампа или манипулятивной ловушки.';
      badgeBg = 'bg-rose-950/95 border-rose-500 text-rose-300';
    } else if (score >= 55) {
      level = 'HIGH';
      recommendation = 'Опасная зона. Только короткий скальпинг со стопом, ликвидность ограничена.';
      badgeBg = 'bg-orange-950/90 border-orange-500 text-orange-300';
    } else if (score <= 30) {
      level = 'LOW';
      recommendation = 'Безопасная структура пула и чистое распределение эмиссии.';
      badgeBg = 'bg-emerald-950/90 border-emerald-500 text-emerald-300';
    }

    return {
      score: Math.min(99, Math.max(1, Math.round(score))),
      level,
      recommendation,
      badgeBg,
    };
  }, [safetyScore, isHoneypot, clusterOwnership.hasData, clusterOwnership.percent, slippage3k, movementType.type]);

  return (
    <div id="dex-five-pillar-verdict-card" className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 font-mono">
      {/* Top Banner: Exact 5-Point Institutional Dossier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                5-Параметрический Форензик-Вердикт
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                {bitqueryData?.source ? 'Bitquery GraphQL EVM Realtime' : 'On-Chain AMM Engine'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Токен: <strong className="text-white">{symbol}</strong> ({name}) · Пул: ${(liquidityUsd / 1e3).toFixed(1)}k
            </div>
          </div>
        </div>

        {/* Big Risk Level Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider flex items-center gap-1.5 ${manipulationAssessment.badgeBg}`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>РИСК: {manipulationAssessment.level} ({manipulationAssessment.score}/100)</span>
          </div>
        </div>
      </div>

      {/* The 5 Structural Points */}
      <div className="grid grid-cols-1 gap-3 text-xs">
        {/* Point 1: Movement Type */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${movementType.bg}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black/40 text-slate-300 font-bold text-[10px]">1. ТИП ДВИЖЕНИЯ</span>
              <strong className={`text-sm font-black ${movementType.color}`}>{movementType.label}</strong>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">{movementType.desc}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Покупки / Продажи 1h:</span>
            <span className="font-bold text-white text-xs">{buys1h} покупок / {sells1h} продаж</span>
          </div>
        </div>

        {/* Point 2: Ownership & Creator Cluster */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">2. ВЛАДЕНИЕ И СВЯЗИ</span>
                <span className="text-sm font-bold text-white">
                  {clusterOwnership.hasData ? (
                    <>
                      {clusterOwnership.label}: <strong className="text-amber-400">{clusterOwnership.percent}%</strong> {clusterOwnership.walletCount ? <>на <strong className="text-amber-400">{formatWalletsPhrase(clusterOwnership.walletCount)}</strong></> : ''}
                    </>
                  ) : (
                    <>
                      Ончейн-распределение: <span className="text-slate-400 font-mono">N/A (Ожидание ончейн-выборки)</span>
                    </>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Крупнейший частный EOA: <strong className="text-white">{clusterOwnership.topPrivateEoaPercent}</strong> эмиссии.
                {isLoadingBitquery && <span className="text-cyan-400"> (Синхронизация Bitquery Realtime...)</span>}
                {!clusterOwnership.hasData && !isLoadingBitquery && (
                  <span className="text-slate-500"> [MISSING DATA: адреса топ-холдеров не получены]</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 block">Концентрация эмиссии:</span>
              <span className={`text-xs font-bold ${!clusterOwnership.hasData ? 'text-slate-400' : clusterOwnership.isSyndicateConcentrated ? 'text-rose-400' : 'text-emerald-400'}`}>
                {!clusterOwnership.hasData ? 'Данные уточняются' : clusterOwnership.isSyndicateConcentrated ? 'Критический синдикат' : 'Органическое распределение'}
              </span>
            </div>
          </div>

          {/* Bitquery Detected Clusters / Mint Transfer Breakdown */}
          {bitqueryData?.clusters && bitqueryData.clusters.length > 0 && (
            <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bitqueryData.clusters.map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-900/90 border border-amber-500/20 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>{c.role}</span>
                    <span className="text-rose-400">{c.shareOfVolumePct}% доли</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans truncate">
                    {c.details || `Связанных адресов в кластере: ${c.addresses?.length || 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Point 3: Real Pool Capacity & Slippage Calculator */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">3. РЕАЛЬНАЯ ЕМКОСТЬ ПУЛА</span>
              <span className="text-xs font-bold text-white">
                При попытке выйти сайзом <strong className="text-amber-400">${customExitSize.toLocaleString()}</strong> проскальзывание составит{' '}
                <strong className={slippageCustom > 10 ? 'text-rose-400' : 'text-emerald-400'}>
                  -{slippageCustom.toFixed(1)}%
                </strong>
              </span>
            </div>

            {/* Quick Size Preset Buttons */}
            <div className="flex items-center gap-1 text-[10px]">
              {[1000, 3000, 10000, 25000].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setCustomExitSize(sz)}
                  className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                    customExitSize === sz
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ${sz >= 1000 ? `${sz / 1000}k` : sz}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Grid: 1k, 3k, 10k, 50k */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500">Сайз $1 000</div>
              <div className="text-xs font-black text-emerald-400 mt-0.5">-{slippage1k.toFixed(1)}%</div>
              <div className="text-[9px] text-slate-400">{slippage1k < 5 ? 'Минимальный сдвиг' : 'Ощутимо'}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 text-center">
              <div className="text-[10px] text-slate-500">Сайз $3 000</div>
              <div className={`text-xs font-black mt-0.5 ${slippage3k > 10 ? 'text-rose-400' : 'text-amber-400'}`}>
                -{slippage3k.toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-400">{slippage3k > 10 ? 'Высокий импакт' : 'Умеренно'}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500">Сайз $10 000</div>
              <div className="text-xs font-black text-rose-400 mt-0.5">-{slippage10k.toFixed(1)}%</div>
              <div className="text-[9px] text-rose-400/80">Риск MEV / Слив</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500">Пул Quote (BNB/USDT)</div>
              <div className="text-xs font-black text-white mt-0.5">${Math.round(liquidityUsd * 0.5).toLocaleString()}</div>
              <div className="text-[9px] text-slate-400">Резерв выхода</div>
            </div>
          </div>
        </div>

        {/* Point 4: Current Phase */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">4. ТЕКУЩАЯ ФАЗА</span>
              <strong className="text-sm font-bold text-white">{currentPhase}</strong>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              24h Изменение цены: <strong className={priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%</strong> · 1h: <strong className={priceChange1h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{priceChange1h >= 0 ? '+' : ''}{priceChange1h.toFixed(2)}%</strong>
            </div>
          </div>
        </div>

        {/* Point 5: Manipulation Risk & Verdict */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${manipulationAssessment.badgeBg}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black/50 text-white font-bold text-[10px]">5. РИСК МАНИПУЛЯЦИИ</span>
              <span className="text-sm font-black tracking-wide">
                {manipulationAssessment.level} ({manipulationAssessment.score}/100)
              </span>
            </div>
            <div className="text-xs font-bold font-sans text-white">
              Вердикт: {manipulationAssessment.recommendation}
            </div>
          </div>
          <div className="shrink-0 font-sans">
            <span className="text-[10px] opacity-80 block">GoPlus Безопасность:</span>
            <span className="text-xs font-bold text-white">
              {isHoneypot ? '🔴 Honeypot обнаружен' : `🟢 Налог: B ${buyTax}% / S ${sellTax}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
