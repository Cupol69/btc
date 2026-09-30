import React, { useState, useEffect, useRef } from 'react';
import { Ticker24h } from '../types';
import { CATEGORIES, symbolService } from '../services/symbolService';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  History,
  AlertCircle,
  Sparkles,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

interface MarketOverviewPanelProps {
  topTickers: Record<string, Ticker24h>;
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  searchError?: string | null;
  onClearSearchError?: () => void;
}

export const MarketOverviewPanel: React.FC<MarketOverviewPanelProps> = ({
  topTickers,
  currentSymbol,
  onSelectSymbol,
  searchError: propError,
  onClearSearchError,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('majors');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(propError || null);
  const [recentSymbols, setRecentSymbols] = useState<string[]>(symbolService.getRecentSymbols());
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(symbolService.getFavoriteSymbols());
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'all' | 'favorites'>('all');
  const [historyFilter, setHistoryFilter] = useState<string>('');
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propError) {
      setErrorMessage(propError);
    }
  }, [propError]);

  // Refresh recent and favorite symbols when currentSymbol changes
  useEffect(() => {
    setRecentSymbols(symbolService.getRecentSymbols());
    setFavoriteSymbols(symbolService.getFavoriteSymbols());
  }, [currentSymbol]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setIsHistoryDropdownOpen(false);
      }
    };
    if (isHistoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryDropdownOpen]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchInput.trim();
    if (!raw) return;

    // Detect Smart Contract Address (EVM 0x... or Solana base58)
    const isContractAddress = /^0x[a-fA-F0-9]{40}$/i.test(raw) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw);
    if (isContractAddress) {
      onSelectSymbol(raw);
      setSearchInput('');
      setErrorMessage(null);
      setIsHistoryDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    if (onClearSearchError) onClearSearchError();

    const formatted = symbolService.normalizeSymbol(searchInput);
    const { exists } = await symbolService.validateSpotSymbol(formatted);

    setIsSearching(false);

    if (exists) {
      const updated = symbolService.addRecentSymbol(formatted);
      setRecentSymbols(updated);
      onSelectSymbol(formatted);
      setSearchInput('');
      setErrorMessage(null);
      setIsHistoryDropdownOpen(false);
    } else {
      const msg = `Пара ${formatted} не найдена на Binance`;
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  const handleSelect = (symbol: string) => {
    const updated = symbolService.addRecentSymbol(symbol);
    setRecentSymbols(updated);
    setErrorMessage(null);
    if (onClearSearchError) onClearSearchError();
    onSelectSymbol(symbol);
    setIsHistoryDropdownOpen(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    const updated = symbolService.toggleFavorite(sym);
    setFavoriteSymbols(updated);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, symbolToRemove: string) => {
    e.stopPropagation();
    const updated = symbolService.removeRecentSymbol(symbolToRemove);
    setRecentSymbols(updated);
  };

  const handleClearHistory = () => {
    const cleared = symbolService.clearRecentSymbols();
    setRecentSymbols(cleared);
    setIsHistoryDropdownOpen(false);
  };

  // Build combined categories including dynamic ⭐ Избранное category
  const categoriesList = [
    {
      id: 'favorites',
      name: `⭐ Избранное (${favoriteSymbols.length})`,
      icon: '⭐',
      symbols: favoriteSymbols.map((sym) => {
        const info = symbolService.getCoinInfo(sym);
        return { symbol: sym, base: info.base, name: info.name };
      }),
    },
    ...CATEGORIES,
  ];

  const selectedCategoryObj =
    categoriesList.find((c) => c.id === activeCategory) ||
    categoriesList.find((c) => c.id === 'majors') ||
    categoriesList[0];

  const activeHistoryList = historyTab === 'favorites' ? favoriteSymbols : recentSymbols;

  const filteredHistory = activeHistoryList.filter((sym) => {
    if (!historyFilter.trim()) return true;
    const info = symbolService.getCoinInfo(sym);
    const query = historyFilter.toLowerCase();
    return (
      sym.toLowerCase().includes(query) ||
      info.name.toLowerCase().includes(query) ||
      info.base.toLowerCase().includes(query)
    );
  });

  return (
    <div id="market-overview-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-3.5 shadow-sm">
      {/* 1. Top Section: Header & Quick Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Выбор и Поиск пар
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Все спот и фьючерсные пары Binance</span>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((cat) => {
            const isActive = cat.id === activeCategory;
            const isFavCat = cat.id === 'favorites';
            return (
              <button
                key={cat.id}
                id={`cat-btn-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? isFavCat
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                      : 'bg-slate-800 text-amber-400 border-amber-500/40 shadow-sm'
                    : isFavCat
                    ? 'bg-amber-500/5 text-amber-400/80 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-300'
                    : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner when Pair Not Found */}
      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono text-rose-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-rose-300 text-[11px] p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Combined Action Bar: Search Input + History Dropdown Button */}
      <div className="relative bg-slate-800/60 p-2 rounded-lg border border-slate-750 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5" ref={historyDropdownRef}>
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <input
              id="market-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Поиск монеты или пары: PEPE, ONDO, BTC, TON, SOL, WIF..."
              className="w-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-950 text-white font-mono text-xs rounded-lg pl-8 pr-8 py-2 border border-slate-700 focus:outline-none focus:border-amber-500 transition placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            id="market-search-btn"
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow flex-shrink-0"
          >
            {isSearching ? (
              <span>Поиск...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Найти</span>
              </>
            )}
          </button>
        </form>

        {/* History / Favorites Toggle Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setHistoryTab('favorites');
              setIsHistoryDropdownOpen(true);
            }}
            className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-2 rounded-lg border transition cursor-pointer ${
              isHistoryDropdownOpen && historyTab === 'favorites'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-800'
            }`}
            title="Открыть список избранного"
          >
            <Star className={`w-3.5 h-3.5 ${favoriteSymbols.length > 0 ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
            <span>Избранное ({favoriteSymbols.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHistoryTab('all');
              setIsHistoryDropdownOpen(!isHistoryDropdownOpen || historyTab !== 'all');
            }}
            className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-2 rounded-lg border transition cursor-pointer ${
              isHistoryDropdownOpen && historyTab === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
            }`}
            title="Открыть сохраненную историю просмотров"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>История ({recentSymbols.length})</span>
            {isHistoryDropdownOpen && historyTab === 'all' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Dropdown Menu Popup (History + Favorites) */}
        {isHistoryDropdownOpen && (
          <div className="absolute top-full right-0 sm:right-auto sm:left-auto sm:right-2 mt-1.5 z-50 w-full sm:w-[450px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Dropdown Header with Tab switchers */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setHistoryTab('all')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer ${
                    historyTab === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>История ({recentSymbols.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('favorites')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer ${
                    historyTab === 'favorites'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>⭐ Избранное ({favoriteSymbols.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryDropdownOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick search filter in dropdown if > 4 items */}
            {activeHistoryList.length > 4 && (
              <div className="p-2 border-b border-slate-800 bg-slate-900/95">
                <input
                  type="text"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  placeholder={historyTab === 'favorites' ? 'Фильтр в избранном: BTC, SOL...' : 'Фильтр в истории: BTC, Pepe, AI...'}
                  className="w-full bg-slate-950 text-white font-mono text-[11px] rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* List of Coins */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/70 scrollbar-thin">
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-2">
                  {historyTab === 'favorites' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Star className="w-4 h-4" />
                      </div>
                      <p className="text-slate-300 font-semibold">Список избранного пуст</p>
                      <p className="text-[11px] text-slate-500">
                        Нажмите на звездочку <span className="text-amber-400 font-bold">⭐</span> рядом с любой монетой в истории или в карточках, чтобы закрепить её.
                      </p>
                    </>
                  ) : (
                    <p>Ничего не найдено в истории</p>
                  )}
                </div>
              ) : (
                filteredHistory.map((sym) => {
                  const isSelected = sym === currentSymbol;
                  const isFav = favoriteSymbols.includes(sym);
                  const coinInfo = symbolService.getCoinInfo(sym);
                  const t = topTickers[sym];
                  const price = t ? parseFloat(t.lastPrice) : null;
                  const change = t ? parseFloat(t.priceChangePercent) : null;

                  return (
                    <div
                      key={`hist-drop-${sym}`}
                      className={`flex items-center justify-between p-2.5 transition hover:bg-slate-800/70 group ${
                        isSelected ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      {/* Star Button for adding/removing favorite */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, sym)}
                        className={`p-1.5 mr-1 rounded-md transition cursor-pointer ${
                          isFav
                            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/15'
                            : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                        title={isFav ? 'Удалить из избранного' : 'Добавить в избранное (нажмите звездочку)'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      {/* Clickable coin info */}
                      <button
                        type="button"
                        onClick={() => handleSelect(sym)}
                        className="flex-1 flex items-center justify-between text-left cursor-pointer mr-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-amber-400 group-hover:border-amber-500/50">
                            {coinInfo.base.slice(0, 3)}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs font-mono text-white group-hover:text-amber-300">
                                {coinInfo.base}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {coinInfo.name}
                              </span>
                              {isFav && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  ★
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">
                              {sym} {coinInfo.tag ? `• ${coinInfo.tag}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Price & Change */}
                        {price !== null && (
                          <div className="text-right font-mono">
                            <div className="text-xs font-semibold text-slate-200">
                              ${price >= 1 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(4)}
                            </div>
                            {change !== null && (
                              <div className={`text-[10px] ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Action Button: Remove item */}
                      {historyTab === 'all' ? (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveHistoryItem(e, sym)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition cursor-pointer flex-shrink-0"
                          title={`Удалить ${coinInfo.base} из истории`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, sym)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition cursor-pointer flex-shrink-0"
                          title={`Убрать ${coinInfo.base} из избранного`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>
                {historyTab === 'favorites'
                  ? `⭐ В избранном: ${favoriteSymbols.length} пар`
                  : `Сохранено в истории: ${recentSymbols.length} из 30`}
              </span>
              {historyTab === 'all' ? (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Очистить историю</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setHistoryTab('all')}
                  className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3 h-3" />
                  <span>Все просмотры</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Category Coin Cards Grid */}
      {selectedCategoryObj.symbols.length === 0 ? (
        <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-xs font-mono text-slate-400">
          <Star className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-60" />
          <p className="text-slate-300 font-semibold">Список избранного пока пуст</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Кликните на звездочку <span className="text-amber-400">⭐</span> на любой монете или в истории, чтобы добавить её в избранное.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {selectedCategoryObj.symbols.map((item) => {
            const t = topTickers[item.symbol];
            const isSelected = item.symbol === currentSymbol;
            const isFav = favoriteSymbols.includes(item.symbol);
            const price = t ? parseFloat(t.lastPrice) : 0;
            const change = t ? parseFloat(t.priceChangePercent) : 0;
            const isPositive = change >= 0;
            const volM = t ? parseFloat(t.quoteVolume) / 1_000_000 : 0;

            return (
              <div
                key={item.symbol}
                id={`ticker-card-${item.symbol}`}
                onClick={() => handleSelect(item.symbol)}
                className={`p-2 rounded-lg border transition text-left relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-slate-800/60 border-slate-750 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-bl" />
                )}

                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold font-mono text-slate-200 group-hover:text-amber-400 transition">
                      {item.base}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[50px]">{item.name}</span>
                  </div>

                  {/* Quick Star Toggle on Card */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, item.symbol)}
                    className={`p-1 -mr-1 -mt-1 rounded transition cursor-pointer ${
                      isFav
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-600 hover:text-amber-400 opacity-40 group-hover:opacity-100'
                    }`}
                    title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="font-mono text-xs font-semibold text-white tracking-tight">
                  {price > 0
                    ? price >= 1
                      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `$${price.toFixed(4)}`
                    : '—'}
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                  <span
                    className={`inline-flex items-center font-medium ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                    {isPositive ? '+' : ''}
                    {change ? change.toFixed(2) : '0.00'}%
                  </span>
                  {volM > 0 && <span className="text-slate-400 text-[9px]">${volM.toFixed(0)}M</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

