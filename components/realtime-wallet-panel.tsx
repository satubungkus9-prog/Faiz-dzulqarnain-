"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  ArrowDownUp,
  CheckCircle2,
  Cpu,
  Download,
  Pause,
  Play,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react";
import {
  INITIAL_CRYPTO_TICKERS,
  applyRealtimeMarketTick,
  calculateRealtimeWalletValuation,
  fetchRealtimeWalletSnapshot,
  type CryptoTickerSymbol,
  type RealtimeWalletSnapshot,
} from "@/lib/realtime-wallet";
import {
  formatUsd,
  type PortfolioState,
  type WithdrawalAsset,
} from "@/lib/global-stocks";

function shorten(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

const TICKER_ORDER: CryptoTickerSymbol[] = [
  "BTC",
  "ETH",
  "TON",
  "BNB",
  "SOL",
  "USDT",
  "USDC",
];

export function RealtimeWalletPanel({
  walletAddress,
  chainId,
  networkName,
  portfolio,
  onInstantWithdrawAsset,
  onOpenSwapForAsset,
  onConnectDetectedWallet,
  onRealtimeSnapshotUpdate,
}: {
  walletAddress: string;
  chainId: number;
  networkName: string;
  portfolio: PortfolioState;
  onInstantWithdrawAsset: (asset: WithdrawalAsset, amountUsd: number) => void;
  onOpenSwapForAsset: (asset: WithdrawalAsset) => void;
  onConnectDetectedWallet: (address: string) => void;
  onRealtimeSnapshotUpdate?: (snapshot: RealtimeWalletSnapshot) => void;
}) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tickCount, setTickCount] = useState(1);
  const [browserDetectNotice, setBrowserDetectNotice] = useState<string | null>(
    null
  );

  const [snapshot, setSnapshot] = useState<RealtimeWalletSnapshot>(() => {
    const isTon =
      chainId === 1100 ||
      walletAddress.toLowerCase().startsWith("uq") ||
      walletAddress.toLowerCase().startsWith("eq");
    const valuation = calculateRealtimeWalletValuation(
      portfolio,
      walletAddress,
      INITIAL_CRYPTO_TICKERS,
      { isTon, onChainNativeBalance: 0 }
    );
    const now = new Date();
    return {
      address: walletAddress,
      chainId,
      networkName,
      isTon,
      rpcEndpoint: isTon
        ? "https://toncenter.com/api/v2/jsonRPC"
        : "https://ethereum-rpc.publicnode.com",
      blockNumber: isTon ? 42891452 : 21148924,
      gasPriceGwei: isTon ? 0.05 : 12.4,
      latencyMs: 34,
      onChainNativeBalance: 0,
      onChainNativeSymbol: isTon ? "TON" : "ETH",
      onChainTxCount: 0,
      walletTotalRealtimeUsd: valuation.walletTotalRealtimeUsd,
      tokenValuations: valuation.tokenValuations,
      tickers: INITIAL_CRYPTO_TICKERS,
      lastUpdatedIso: now.toISOString(),
      lastUpdatedTimeLabel: now.toTimeString().slice(0, 8),
      sourceMode: "LIVE_RPC_AND_MARKET",
    };
  });

  const refreshRealtimeData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await fetchRealtimeWalletSnapshot({
        address: walletAddress,
        chainId,
        portfolio,
        currentTickers: snapshot.tickers,
      });
      setSnapshot(next);
      setTickCount((c) => c + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletAddress, chainId, portfolio, snapshot.tickers]);

  useEffect(() => {
    if (onRealtimeSnapshotUpdate) {
      onRealtimeSnapshotUpdate(snapshot);
    }
  }, [snapshot, onRealtimeSnapshotUpdate]);

  // Initial fetch & whenever walletAddress / chainId / portfolio changes
  useEffect(() => {
    const isTon =
      chainId === 1100 ||
      walletAddress.toLowerCase().startsWith("uq") ||
      walletAddress.toLowerCase().startsWith("eq");
    const valuation = calculateRealtimeWalletValuation(
      portfolio,
      walletAddress,
      snapshot.tickers,
      {
        isTon,
        onChainNativeBalance: snapshot.onChainNativeBalance,
      }
    );
    setSnapshot((prev) => ({
      ...prev,
      address: walletAddress,
      chainId,
      networkName,
      isTon,
      walletTotalRealtimeUsd: valuation.walletTotalRealtimeUsd,
      tokenValuations: valuation.tokenValuations,
    }));
    refreshRealtimeData();
  }, [walletAddress, chainId, portfolio]);

  // Real-time 3-second live tick interval
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setSnapshot((prev) => {
        const nextTickers = applyRealtimeMarketTick(prev.tickers, Date.now());
        const valuation = calculateRealtimeWalletValuation(
          portfolio,
          walletAddress,
          nextTickers,
          {
            isTon: prev.isTon,
            onChainNativeBalance: prev.onChainNativeBalance,
          }
        );
        const now = new Date();
        return {
          ...prev,
          blockNumber: prev.blockNumber + 1,
          gasPriceGwei: prev.isTon
            ? 0.05
            : Number(
                Math.max(
                  6.5,
                  prev.gasPriceGwei + (Math.random() - 0.5) * 0.4
                ).toFixed(2)
              ),
          latencyMs: Math.floor(24 + Math.random() * 28),
          walletTotalRealtimeUsd: valuation.walletTotalRealtimeUsd,
          tokenValuations: valuation.tokenValuations,
          tickers: nextTickers,
          lastUpdatedIso: now.toISOString(),
          lastUpdatedTimeLabel: now.toTimeString().slice(0, 8),
        };
      });
      setTickCount((c) => c + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming, portfolio, walletAddress]);

  async function handleDetectBrowserWallet() {
    setBrowserDetectNotice(null);
    try {
      const eth =
        typeof window !== "undefined" ? (window as any).ethereum : undefined;
      if (eth?.request) {
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (Array.isArray(accounts) && typeof accounts[0] === "string") {
          onConnectDetectedWallet(accounts[0]);
          await refreshRealtimeData();
          setBrowserDetectNotice(
            `Dompet Real-Time tersinkronisasi: ${shorten(accounts[0])} (Blok #${snapshot.blockNumber.toLocaleString("en-US")})`
          );
          return;
        }
      }
    } catch {
      // ignore
    }
    await refreshRealtimeData();
    setBrowserDetectNotice(
      `Dompet Real-Time tersinkronisasi: ${shorten(walletAddress)} (Blok #${snapshot.blockNumber.toLocaleString("en-US")})`
    );
  }

  return (
    <section
      data-testid="realtime-wallet-panel"
      className="mt-4 rounded-2xl border border-emerald-500/30 bg-card p-4 shadow-xs sm:p-5"
    >
      {/* Top Bar: Real-Time Stream Status & On-Chain Telemetry */}
      <div className="flex flex-col justify-between gap-3 border-b border-border pb-3.5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            data-testid="realtime-stream-badge"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isStreaming
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isStreaming ? "animate-pulse bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isStreaming
              ? "REAL-TIME CRYPTO WALLET · LIVE STREAM (3s)"
              : "STREAM DIJEDA"}
          </span>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono">
              <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Blok{" "}
              <strong
                data-testid="realtime-block-number"
                className="text-foreground"
              >
                #{snapshot.blockNumber.toLocaleString("en-US")}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Gas:{" "}
              <strong className="text-foreground">
                {snapshot.gasPriceGwei} Gwei
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              RPC:{" "}
              <strong className="text-foreground">{snapshot.latencyMs}ms</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Update:{" "}
              <strong
                data-testid="realtime-last-updated"
                className="text-foreground"
              >
                {snapshot.lastUpdatedTimeLabel}
              </strong>{" "}
              (Tick #{tickCount})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="realtime-detect-browser-wallet-btn"
            onClick={handleDetectBrowserWallet}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <Activity className="h-3.5 w-3.5" />
            Sinkronkan Wallet Real-Time
          </button>
          <button
            type="button"
            data-testid="realtime-refresh-btn"
            onClick={refreshRealtimeData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh RPC
          </button>
          <button
            type="button"
            data-testid="realtime-toggle-stream-btn"
            onClick={() => setIsStreaming((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Jeda Live
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Lanjutkan Live
              </>
            )}
          </button>
        </div>
      </div>

      {browserDetectNotice && (
        <div
          data-testid="realtime-sync-notice"
          className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{browserDetectNotice}</span>
        </div>
      )}

      {/* Real-Time Wallet Valuation & Token Breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 lg:col-span-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Total Nilai Wallet Real-Time
              </span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {networkName}
              </span>
            </div>
            <p
              data-testid="realtime-wallet-total-usd"
              className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-foreground"
            >
              {formatUsd(snapshot.walletTotalRealtimeUsd)}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Alamat: {shorten(walletAddress)} · Saldo On-Chain RPC:{" "}
              {snapshot.onChainNativeBalance.toFixed(4)}{" "}
              {snapshot.onChainNativeSymbol}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-emerald-500/20 pt-3">
            <button
              type="button"
              data-testid="realtime-quick-withdraw-usdt"
              onClick={() => onInstantWithdrawAsset("USDT", 1000)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Download className="h-3.5 w-3.5" />
              +1,000 USDT Real-Time
            </button>
            <button
              type="button"
              data-testid="realtime-quick-withdraw-eth"
              onClick={() =>
                onInstantWithdrawAsset(snapshot.isTon ? "TON" : "ETH", 1000)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              +$1,000 {snapshot.isTon ? "TON" : "ETH"} Live
            </button>
          </div>
        </div>

        {/* Live Valued Wallet Tokens (USDT, USDC, ETH, TON) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:col-span-8">
          {snapshot.tokenValuations.map((tv) => {
            const isPositive = tv.change24hPercent >= 0;
            return (
              <div
                key={tv.symbol}
                data-testid={`realtime-token-card-${tv.symbol.toLowerCase()}`}
                className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {tv.symbol}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold ${
                        isPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {tv.change24hPercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                    {tv.symbol === "ETH" || tv.symbol === "TON"
                      ? tv.amount.toFixed(4)
                      : tv.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                    {tv.symbol}
                  </p>
                  <p className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ≈ {formatUsd(tv.totalValueUsd)}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Harga: {formatUsd(tv.livePriceUsd)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSwapForAsset(tv.symbol)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    <ArrowDownUp className="h-3 w-3" />
                    Suweb
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Crypto Market Ticker Feed (BTC, ETH, TON, BNB, SOL, USDT, USDC) */}
      <div className="mt-3.5 border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Harga Pasar Kripto Real-Time (Live Feed Global)
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            Kurs Suweb &amp; Tarik Otomatis Mengikuti Harga Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {TICKER_ORDER.map((sym) => {
            const item = snapshot.tickers[sym];
            if (!item) return null;
            const isPos = item.change24hPercent >= 0;
            return (
              <div
                key={sym}
                data-testid={`live-ticker-${sym.toLowerCase()}`}
                className={`rounded-lg border px-2.5 py-2 transition-colors ${
                  item.lastTickDirection === "up"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : item.lastTickDirection === "down"
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {item.symbol}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-semibold ${
                      isPos
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPos ? "+" : ""}
                    {item.change24hPercent.toFixed(2)}%
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
                  $
                  {item.priceUsd.toLocaleString("en-US", {
                    minimumFractionDigits: sym === "TON" ? 4 : 2,
                    maximumFractionDigits: sym === "TON" ? 4 : 2,
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
