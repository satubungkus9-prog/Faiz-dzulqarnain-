import { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownUp,
  Send,
  Plus,
  Briefcase,
  History,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  GLOBAL_STOCKS,
  DEFAULT_PORTFOLIO_STATE,
  PORTFOLIO_SYNC_EVENT,
  filterGlobalStocks,
  executeStockOrder,
  withdrawFundsFromPortfolio,
  executeWalletSwap,
  calculatePortfolioSummary,
  calculateWalletBalances,
  loadPortfolioFromStorage,
  savePortfolioToStorage,
  formatLocalCurrency,
  formatUsd,
  type GlobalStock,
  type PortfolioState,
  type StockRegion,
  type TransferSourceType,
  type WalletActionMode,
  type WithdrawalAsset,
} from "@/lib/global-stocks";
import { StockPriceChart } from "@/components/stock-price-chart";
import { WithdrawalPanel } from "@/components/withdrawal-panel";

const REGION_TABS: { id: StockRegion; label: string }[] = [
  { id: "ALL", label: "Semua Dunia (15)" },
  { id: "AMERIKA", label: "Amerika Serikat" },
  { id: "EROPA", label: "Eropa" },
  { id: "ASIA", label: "Asia Pasifik" },
  { id: "INDONESIA", label: "Indonesia (BEI)" },
];

type WorkspaceTab = "MARKET" | "PORTFOLIO" | "ORDERS" | "WITHDRAW";

export function GlobalStockMarket({
  walletAddress,
  network,
  requestedActionMode,
  onClearRequestedActionMode,
  onSwitchActiveWallet,
}: {
  walletAddress: string;
  network: string;
  requestedActionMode?: WalletActionMode | null;
  onClearRequestedActionMode?: () => void;
  onSwitchActiveWallet?: (address: string) => void;
}) {
  const [portfolio, setPortfolio] = useState<PortfolioState>(() =>
    loadPortfolioFromStorage()
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("WITHDRAW");
  const [walletActionMode, setWalletActionMode] =
    useState<WalletActionMode>("WITHDRAW");
  const [selectedRegion, setSelectedRegion] = useState<StockRegion>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string>("NVDA");

  // Order form state
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [sharesInput, setSharesInput] = useState<string>("5");
  const [orderFeedback, setOrderFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleExternalSync = (e: Event) => {
      const custom = e as CustomEvent<PortfolioState>;
      if (custom.detail) {
        setPortfolio(custom.detail);
      } else {
        setPortfolio(loadPortfolioFromStorage());
      }
    };
    window.addEventListener(PORTFOLIO_SYNC_EVENT, handleExternalSync);
    window.addEventListener("storage", handleExternalSync);
    return () => {
      window.removeEventListener(PORTFOLIO_SYNC_EVENT, handleExternalSync);
      window.removeEventListener("storage", handleExternalSync);
    };
  }, []);

  const summary = useMemo(() => calculatePortfolioSummary(portfolio, GLOBAL_STOCKS), [portfolio]);
  const walletBalances = useMemo(
    () =>
      calculateWalletBalances(portfolio, {
        isTon: network.toLowerCase().includes("ton"),
        baseNativeBalance: 0,
        walletAddress,
      }),
    [portfolio, network, walletAddress]
  );

  const filteredStocks = useMemo(
    () =>
      filterGlobalStocks(GLOBAL_STOCKS, {
        region: selectedRegion,
        query: searchQuery,
        watchlistOnly,
        watchlist: portfolio.watchlist,
      }),
    [selectedRegion, searchQuery, watchlistOnly, portfolio.watchlist]
  );

  const selectedStock: GlobalStock = useMemo(() => {
    return (
      GLOBAL_STOCKS.find((s) => s.ticker === selectedTicker) ?? GLOBAL_STOCKS[0]
    );
  }, [selectedTicker]);

  const currentHolding = useMemo(
    () => portfolio.holdings.find((h) => h.ticker === selectedStock.ticker),
    [portfolio.holdings, selectedStock.ticker]
  );

  const parsedShares = Number(sharesInput);
  const estimatedTotalUsd =
    Number.isFinite(parsedShares) && parsedShares > 0
      ? Number((parsedShares * selectedStock.priceUsd).toFixed(2))
      : 0;

  function toggleWatchlist(ticker: string) {
    setPortfolio((prev) => {
      const exists = prev.watchlist.includes(ticker);
      const next = {
        ...prev,
        watchlist: exists
          ? prev.watchlist.filter((t) => t !== ticker)
          : [...prev.watchlist, ticker],
      };
      savePortfolioToStorage(next);
      return next;
    });
  }

  function handleDepositUsd(amountUsd: number) {
    setPortfolio((prev) => {
      const next = {
        ...prev,
        buyingPowerUsd: Number((prev.buyingPowerUsd + amountUsd).toFixed(2)),
      };
      savePortfolioToStorage(next);
      return next;
    });
    setOrderFeedback({
      type: "success",
      message: `Deposit sebesar ${formatUsd(amountUsd)} dari dompet (${network}) berhasil ditambahkan ke daya beli.`,
    });
  }

  function scrollToActionHub() {
    setTimeout(() => {
      const el = document.getElementById("wallet-action-hub");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  useEffect(() => {
    if (requestedActionMode) {
      setActiveTab("WITHDRAW");
      setWalletActionMode(requestedActionMode);
      scrollToActionHub();
      if (onClearRequestedActionMode) onClearRequestedActionMode();
    }
  }, [requestedActionMode, onClearRequestedActionMode]);

  function openWalletAction(mode: WalletActionMode) {
    setActiveTab("WITHDRAW");
    setWalletActionMode(mode);
    scrollToActionHub();
  }

  function handleExecuteWithdrawal(params: {
    amountUsd: number;
    asset: WithdrawalAsset;
    destinationAddress: string;
    sourceType?: TransferSourceType;
    sourceAddress?: string;
  }) {
    const res = withdrawFundsFromPortfolio(portfolio, params.amountUsd, {
      asset: params.asset,
      network,
      destinationAddress: params.destinationAddress,
      sourceType: params.sourceType,
      sourceAddress: params.sourceAddress ?? walletAddress,
      autoCoverShortfall: true,
    });
    if (res.ok && res.nextState) {
      setPortfolio(res.nextState);
      savePortfolioToStorage(res.nextState);
    }
    return res;
  }

  function handleExecuteSwap(params: {
    fromAsset: WithdrawalAsset;
    toAsset: WithdrawalAsset;
    fromAmount: number;
  }) {
    const res = executeWalletSwap(portfolio, {
      walletAddress,
      fromAsset: params.fromAsset,
      toAsset: params.toAsset,
      fromAmount: params.fromAmount,
      network,
      autoFundFromPortfolio: true,
    });
    if (res.ok && res.nextState) {
      setPortfolio(res.nextState);
      savePortfolioToStorage(res.nextState);
    }
    return res;
  }

  function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setOrderFeedback(null);

    const result = executeStockOrder(portfolio, {
      stock: selectedStock,
      side: orderSide,
      shares: Number(sharesInput),
      paymentAsset: `Dompet (${network})`,
    });

    if (!result.ok || !result.nextState || !result.order) {
      setOrderFeedback({
        type: "error",
        message: result.error ?? "Gagal memproses order saham.",
      });
      return;
    }

    setPortfolio(result.nextState);
    savePortfolioToStorage(result.nextState);
    setOrderFeedback({
      type: "success",
      message: `Berhasil ${
        result.order.side === "BUY" ? "membeli" : "menjual"
      } ${result.order.shares} lembar ${result.order.ticker} (${
        result.order.exchange
      }) senilai ${formatUsd(result.order.totalUsd)}.`,
    });
  }

  function handleSelectStockForOrder(ticker: string, side: "BUY" | "SELL" = "BUY") {
    setSelectedTicker(ticker);
    setOrderSide(side);
    setOrderFeedback(null);
    if (side === "SELL") {
      const held = portfolio.holdings.find((h) => h.ticker === ticker);
      if (held && held.shares > 0) {
        const currentQty = Number(sharesInput);
        if (!Number.isFinite(currentQty) || currentQty <= 0 || currentQty > held.shares) {
          setSharesInput(String(held.shares));
        }
      }
    }
  }

  const isPositiveTotalPnl = summary.totalPnlUsd >= 0;

  return (
    <div className="mt-8 space-y-6">
      {/* Section Header & Main Navigation */}
      <div className="space-y-4 border-t border-border pt-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0 text-foreground" />
              <span>Akses Bursa Saham Internasional</span>
              <span aria-hidden="true">·</span>
              <span>NYSE · NASDAQ · Euronext · TSE · BEI</span>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Investasi Saham Dunia &amp; Transaksi Kripto
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDepositUsd(5000)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Top Up +$5,000
            </button>
            <button
              type="button"
              data-testid="quick-btn-swap"
              onClick={() => openWalletAction("SWAP")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              Suweb (Swap)
            </button>
            <button
              type="button"
              data-testid="quick-btn-withdraw"
              onClick={() => openWalletAction("WITHDRAW")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Tarik Saldo
            </button>
            <button
              type="button"
              data-testid="quick-btn-send"
              onClick={() => openWalletAction("SEND")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              Kirim ke Wallet
            </button>
          </div>
        </div>

        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/60 p-1"
          role="tablist"
          aria-label="Menu Investasi Saham"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "MARKET"}
            onClick={() => setActiveTab("MARKET")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "MARKET"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Pasar Dunia
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "PORTFOLIO"}
            onClick={() => setActiveTab("PORTFOLIO")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "PORTFOLIO"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Portofolio Saya ({summary.holdings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ORDERS"}
            onClick={() => setActiveTab("ORDERS")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "ORDERS"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Riwayat Order ({portfolio.orders.length})
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-suweb-tarik-kirim"
            aria-selected={activeTab === "WITHDRAW"}
            onClick={() => setActiveTab("WITHDRAW")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "WITHDRAW"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            Suweb · Tarik · Kirim
          </button>
        </div>
      </div>

      {/* Global Portfolio KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Nilai Akun Investasi</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatUsd(summary.totalAccountValueUsd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Terhubung ke {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Nilai Ekuitas Saham Global</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatUsd(summary.totalEquityUsd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Modal beli: {formatUsd(summary.totalCostBasisUsd)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Keuntungan / Kerugian (P&amp;L)</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-semibold tabular-nums ${
                isPositiveTotalPnl
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositiveTotalPnl ? "+" : ""}
              {formatUsd(summary.totalPnlUsd)}
            </span>
            <span
              className={`font-mono text-xs font-medium tabular-nums ${
                isPositiveTotalPnl
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ({isPositiveTotalPnl ? "+" : ""}
              {summary.totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Dari {summary.holdings.length} emiten saham aktif
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Daya Beli Tersedia (USD)</p>
          <p
            data-testid="buying-power-usd"
            className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground"
          >
            {formatUsd(summary.buyingPowerUsd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Siap untuk pasar AS, Eropa, Asia &amp; BEI
          </p>
        </div>
      </div>

      {/* Main 2-Column Trading & Market Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Columns: Chart + Market / Portfolio / History Views */}
        <div className="space-y-6 lg:col-span-8">
          {/* Interactive Chart for Selected Stock */}
          {activeTab !== "WITHDRAW" && <StockPriceChart stock={selectedStock} />}

          {activeTab === "MARKET" && (
            <div className="rounded-xl border border-border bg-card">
              {/* Filter & Search Bar */}
              <div className="space-y-3 border-b border-border p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div
                    className="flex flex-wrap items-center gap-1"
                    role="group"
                    aria-label="Filter Wilayah Bursa"
                  >
                    {REGION_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedRegion(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          selectedRegion === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setWatchlistOnly((v) => !v)}
                    aria-pressed={watchlistOnly}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      watchlistOnly
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        watchlistOnly ? "fill-amber-500 text-amber-500" : ""
                      }`}
                    />
                    Pantauan ({portfolio.watchlist.length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    aria-label="Cari saham dunia"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode saham, nama perusahaan, negara, atau bursa (mis. NVDA, ASML, Toyota, BBCA)..."
                    className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Global Stocks Table */}
              {filteredStocks.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Tidak ada saham yang cocok dengan filter pencarian.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coba kata kunci lain atau tampilkan kembali seluruh bursa dunia.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegion("ALL");
                      setSearchQuery("");
                      setWatchlistOnly(false);
                    }}
                    className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Reset Filter Pasar
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-3 pr-2 pl-4 font-medium">Emiten &amp; Bursa</th>
                        <th className="px-3 py-3 font-medium">Negara / Sektor</th>
                        <th className="px-3 py-3 text-right font-medium">Harga Lokal</th>
                        <th className="px-3 py-3 text-right font-medium">Harga (USD)</th>
                        <th className="px-3 py-3 text-right font-medium">24 Jam</th>
                        <th className="py-3 pr-4 pl-3 text-right font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStocks.map((stock) => {
                        const isSelected = stock.ticker === selectedStock.ticker;
                        const isWatched = portfolio.watchlist.includes(stock.ticker);
                        const isUp = stock.change24hPercent >= 0;
                        const held = portfolio.holdings.find(
                          (h) => h.ticker === stock.ticker
                        );

                        return (
                          <tr
                            key={stock.ticker}
                            onClick={() => handleSelectStockForOrder(stock.ticker, "BUY")}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-muted/70" : "hover:bg-muted/40"
                            }`}
                          >
                            <td className="py-3 pr-2 pl-4">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  aria-label={`Pantau saham ${stock.ticker}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWatchlist(stock.ticker);
                                  }}
                                  className="text-muted-foreground hover:text-amber-500"
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      isWatched
                                        ? "fill-amber-400 text-amber-400"
                                        : ""
                                    }`}
                                  />
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-foreground">
                                      {stock.ticker}
                                    </span>
                                    {held && (
                                      <span className="font-mono text-[11px] text-muted-foreground">
                                        · {held.shares} lbr
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {stock.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-xs font-medium text-foreground">
                                {stock.country}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stock.exchange} · {stock.sector}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                              {formatLocalCurrency(
                                stock.localPrice,
                                stock.localCurrency
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm font-medium tabular-nums text-foreground">
                              {formatUsd(stock.priceUsd)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-xs font-medium tabular-nums">
                              <span
                                className={`inline-flex items-center justify-end gap-0.5 ${
                                  isUp
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isUp ? (
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                )}
                                {isUp ? "+" : ""}
                                {stock.change24hPercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-3 pr-4 pl-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectStockForOrder(stock.ticker, "BUY");
                                }}
                                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0"
                              >
                                Transaksi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "PORTFOLIO" && (
            <div className="space-y-6">
              {/* Regional Allocation Bar */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Alokasi Portofolio Berdasarkan Wilayah Dunia
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  {summary.regionAllocation.map((item) => (
                    <div
                      key={item.region}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground">
                        {formatUsd(item.valueUsd)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                      <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                        {item.percent.toFixed(1)}% dari ekuitas
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Kepemilikan Saham Global Aktif ({summary.holdings.length})
                  </h3>
                </div>
                {summary.holdings.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Belum ada kepemilikan saham di portofolio Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("MARKET")}
                      className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                    >
                      Jelajahi Pasar Dunia
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="py-3 pr-2 pl-5 font-medium">Saham</th>
                          <th className="px-3 py-3 text-right font-medium">Lembar</th>
                          <th className="px-3 py-3 text-right font-medium">Harga Rata-Rata</th>
                          <th className="px-3 py-3 text-right font-medium">Harga Pasar</th>
                          <th className="px-3 py-3 text-right font-medium">Nilai Pasar</th>
                          <th className="px-3 py-3 text-right font-medium">Imbal Hasil (P&amp;L)</th>
                          <th className="py-3 pr-5 pl-3 text-right font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {summary.holdings.map((h) => {
                          const isProfit = h.pnlUsd >= 0;
                          return (
                            <tr key={h.ticker} className="hover:bg-muted/40">
                              <td className="py-3 pr-2 pl-5">
                                <p className="font-mono font-semibold text-foreground">
                                  {h.ticker}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {h.stock.name} · {h.stock.country}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                                {h.shares}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                                {formatUsd(h.avgBuyPriceUsd)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                                {formatUsd(h.stock.priceUsd)}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-sm font-medium tabular-nums text-foreground">
                                {formatUsd(h.marketValueUsd)}
                              </td>
                              <td
                                className={`px-3 py-3 text-right font-mono text-xs font-medium tabular-nums ${
                                  isProfit
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isProfit ? "+" : ""}
                                {formatUsd(h.pnlUsd)} ({isProfit ? "+" : ""}
                                {h.pnlPercent.toFixed(2)}%)
                              </td>
                              <td className="py-3 pr-5 pl-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStockForOrder(h.ticker, "BUY")}
                                    className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                                  >
                                    Tambah
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStockForOrder(h.ticker, "SELL")}
                                    className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                                  >
                                    Jual
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ORDERS" && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Riwayat Order &amp; Penyelesaian Dompet ({portfolio.orders.length})
                </h3>
              </div>
              {portfolio.orders.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat transaksi saham.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-3 pr-2 pl-5 font-medium">Waktu</th>
                        <th className="px-3 py-3 font-medium">Tipe</th>
                        <th className="px-3 py-3 font-medium">Emiten &amp; Bursa</th>
                        <th className="px-3 py-3 text-right font-medium">Lembar</th>
                        <th className="px-3 py-3 text-right font-medium">Harga Eksekusi</th>
                        <th className="py-3 pr-5 pl-3 text-right font-medium">Total Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {portfolio.orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-muted/40">
                          <td className="py-3 pr-2 pl-5 font-mono text-xs tabular-nums text-muted-foreground">
                            {ord.timestamp}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`font-mono text-xs font-semibold ${
                                ord.side === "BUY"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {ord.side === "BUY" ? "BELI" : "JUAL"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-mono text-xs font-semibold text-foreground">
                              {ord.ticker}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ord.companyName} · {ord.exchange}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                            {ord.shares}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {formatUsd(ord.pricePerShareUsd)}
                          </td>
                          <td className="py-3 pr-5 pl-3 text-right font-mono text-sm font-medium tabular-nums text-foreground">
                            {formatUsd(ord.totalUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "WITHDRAW" && (
            <WithdrawalPanel
              portfolio={portfolio}
              availableBalanceUsd={portfolio.buyingPowerUsd}
              walletAddress={walletAddress}
              network={network}
              withdrawals={portfolio.withdrawals ?? []}
              walletBalances={walletBalances}
              actionMode={walletActionMode}
              onChangeActionMode={setWalletActionMode}
              onSubmitWithdrawal={handleExecuteWithdrawal}
              onSubmitSwap={handleExecuteSwap}
              onSwitchActiveWallet={onSwitchActiveWallet}
            />
          )}
        </div>

        {/* Right 4 Columns: Order Execution Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground">Tiket Order Instan</p>
                <h3 className="mt-0.5 font-mono text-lg font-semibold text-foreground">
                  {selectedStock.ticker} · {selectedStock.country}
                </h3>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatUsd(selectedStock.priceUsd)}
              </span>
            </div>

            {/* Buy / Sell Mode Selector */}
            <div
              className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              role="group"
              aria-label="Tipe Order"
            >
              <button
                type="button"
                onClick={() => {
                  setOrderSide("BUY");
                  setOrderFeedback(null);
                }}
                className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                  orderSide === "BUY"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Beli {selectedStock.ticker}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectStockForOrder(selectedStock.ticker, "SELL");
                }}
                className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                  orderSide === "SELL"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Jual {selectedStock.ticker}
              </button>
            </div>

            {/* Current Position Info */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs">
              <span className="text-muted-foreground">Posisi Saat Ini</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {currentHolding
                  ? `${currentHolding.shares} lembar (${formatUsd(
                      currentHolding.shares * selectedStock.priceUsd
                    )})`
                  : "0 lembar"}
              </span>
            </div>

            <form onSubmit={handleSubmitOrder} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="shares-quantity-input"
                  className="block text-xs font-medium text-foreground"
                >
                  Jumlah Lembar Saham (mendukung saham fraksional)
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary">
                  <input
                    id="shares-quantity-input"
                    type="number"
                    step="any"
                    min="0.01"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    className="w-full bg-transparent font-mono text-base font-medium tabular-nums text-foreground focus:outline-none"
                    placeholder="0"
                  />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    Lembar
                  </span>
                </div>

                {/* Quick Share Presets */}
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 5, 10, 25].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setSharesInput(String(qty))}
                      className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {qty} lbr
                    </button>
                  ))}
                  {orderSide === "SELL" && currentHolding && (
                    <button
                      type="button"
                      onClick={() => setSharesInput(String(currentHolding.shares))}
                      className="ml-auto rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs font-medium text-foreground hover:bg-accent"
                    >
                      Jual Semua
                    </button>
                  )}
                </div>
              </div>

              {/* Order Summary Breakdown */}
              <div className="space-y-2 border-t border-border pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bursa Tujuan</span>
                  <span className="font-medium text-foreground">
                    {selectedStock.exchange} ({selectedStock.localCurrency})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga per Lembar</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatUsd(selectedStock.priceUsd)}
                    {selectedStock.localCurrency !== "USD"
                      ? ` (${formatLocalCurrency(
                          selectedStock.localPrice,
                          selectedStock.localCurrency
                        )})`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Broker &amp; Konversi</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    $0.00 (Gratis)
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span className="text-foreground">Estimasi Total (USD)</span>
                  <span
                    data-testid="order-estimated-total"
                    className="font-mono tabular-nums text-foreground"
                  >
                    {formatUsd(estimatedTotalUsd)}
                  </span>
                </div>
              </div>

              {orderFeedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                    orderFeedback.type === "success"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  {orderFeedback.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{orderFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${
                  orderSide === "BUY"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {orderSide === "BUY"
                  ? `Konfirmasi Beli ${selectedStock.ticker}`
                  : `Konfirmasi Jual ${selectedStock.ticker}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
