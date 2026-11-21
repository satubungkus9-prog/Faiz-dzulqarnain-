import {
  ASSET_RATES_USD,
  calculateWalletBalances,
  type PortfolioState,
  type WithdrawalAsset,
} from "./global-stocks";

export type CryptoTickerSymbol =
  | "BTC"
  | "ETH"
  | "TON"
  | "BNB"
  | "SOL"
  | "USDT"
  | "USDC";

export interface RealtimeCryptoTicker {
  symbol: CryptoTickerSymbol;
  name: string;
  priceUsd: number;
  change24hPercent: number;
  high24hUsd: number;
  low24hUsd: number;
  volume24hUsdM: number;
  isSupportedWalletAsset: boolean;
  lastTickDirection: "up" | "down" | "flat";
}

export interface WalletTokenRealtimeValuation {
  symbol: WithdrawalAsset;
  name: string;
  amount: number;
  livePriceUsd: number;
  change24hPercent: number;
  totalValueUsd: number;
}

export interface RealtimeWalletSnapshot {
  address: string;
  chainId: number;
  networkName: string;
  isTon: boolean;
  rpcEndpoint: string;
  blockNumber: number;
  gasPriceGwei: number;
  latencyMs: number;
  onChainNativeBalance: number;
  onChainNativeSymbol: string;
  onChainTxCount: number;
  walletTotalRealtimeUsd: number;
  tokenValuations: WalletTokenRealtimeValuation[];
  tickers: Record<CryptoTickerSymbol, RealtimeCryptoTicker>;
  lastUpdatedIso: string;
  lastUpdatedTimeLabel: string;
  sourceMode: "LIVE_RPC_AND_MARKET" | "LIVE_SIMULATED_FALLBACK";
}

export const PUBLIC_RPC_BY_CHAIN: Record<
  number,
  { name: string; rpcUrl: string; nativeSymbol: string }
> = {
  1: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    nativeSymbol: "ETH",
  },
  56: {
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-rpc.publicnode.com",
    nativeSymbol: "BNB",
  },
  137: {
    name: "Polygon POS",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    nativeSymbol: "POL",
  },
  42161: {
    name: "Arbitrum One",
    rpcUrl: "https://arbitrum-one-rpc.publicnode.com",
    nativeSymbol: "ETH",
  },
  10: {
    name: "Optimism Mainnet",
    rpcUrl: "https://optimism-rpc.publicnode.com",
    nativeSymbol: "ETH",
  },
  8453: {
    name: "Base Mainnet",
    rpcUrl: "https://base-rpc.publicnode.com",
    nativeSymbol: "ETH",
  },
  1100: {
    name: "TON Mainnet",
    rpcUrl: "https://toncenter.com/api/v2/jsonRPC",
    nativeSymbol: "TON",
  },
};

export const INITIAL_CRYPTO_TICKERS: Record<
  CryptoTickerSymbol,
  RealtimeCryptoTicker
> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    priceUsd: 89420.5,
    change24hPercent: 4.18,
    high24hUsd: 90150.0,
    low24hUsd: 85620.0,
    volume24hUsdM: 48250,
    isSupportedWalletAsset: false,
    lastTickDirection: "up",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    priceUsd: 3185.4,
    change24hPercent: 3.64,
    high24hUsd: 3240.0,
    low24hUsd: 3045.0,
    volume24hUsdM: 24190,
    isSupportedWalletAsset: true,
    lastTickDirection: "up",
  },
  TON: {
    symbol: "TON",
    name: "Toncoin",
    priceUsd: 5.48,
    change24hPercent: 2.95,
    high24hUsd: 5.65,
    low24hUsd: 5.21,
    volume24hUsdM: 640,
    isSupportedWalletAsset: true,
    lastTickDirection: "up",
  },
  BNB: {
    symbol: "BNB",
    name: "BNB Chain",
    priceUsd: 642.8,
    change24hPercent: 1.92,
    high24hUsd: 655.0,
    low24hUsd: 628.4,
    volume24hUsdM: 1920,
    isSupportedWalletAsset: false,
    lastTickDirection: "up",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    priceUsd: 212.65,
    change24hPercent: 5.14,
    high24hUsd: 218.0,
    low24hUsd: 199.8,
    volume24hUsdM: 8420,
    isSupportedWalletAsset: false,
    lastTickDirection: "up",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    priceUsd: 1.0,
    change24hPercent: 0.01,
    high24hUsd: 1.001,
    low24hUsd: 0.999,
    volume24hUsdM: 76400,
    isSupportedWalletAsset: true,
    lastTickDirection: "flat",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    priceUsd: 1.0,
    change24hPercent: 0.0,
    high24hUsd: 1.001,
    low24hUsd: 0.999,
    volume24hUsdM: 12800,
    isSupportedWalletAsset: true,
    lastTickDirection: "flat",
  },
};

export function syncGlobalAssetRatesFromTickers(
  tickers: Record<CryptoTickerSymbol, RealtimeCryptoTicker>
): void {
  if (tickers.ETH?.priceUsd > 0) {
    ASSET_RATES_USD.ETH = Number(tickers.ETH.priceUsd.toFixed(2));
  }
  if (tickers.TON?.priceUsd > 0) {
    ASSET_RATES_USD.TON = Number(tickers.TON.priceUsd.toFixed(4));
  }
  ASSET_RATES_USD.USDT = 1;
  ASSET_RATES_USD.USDC = 1;
}

export function applyRealtimeMarketTick(
  current: Record<CryptoTickerSymbol, RealtimeCryptoTicker>,
  seed: number = Date.now()
): Record<CryptoTickerSymbol, RealtimeCryptoTicker> {
  const next = { ...current };
  const symbols: CryptoTickerSymbol[] = [
    "BTC",
    "ETH",
    "TON",
    "BNB",
    "SOL",
    "USDT",
    "USDC",
  ];

  symbols.forEach((sym, idx) => {
    const item = current[sym];
    if (!item) return;
    if (sym === "USDT" || sym === "USDC") {
      next[sym] = {
        ...item,
        priceUsd: 1.0,
        lastTickDirection: "flat",
      };
      return;
    }

    const wave = Math.sin((seed / 1000 + idx * 1.7) * 1.9);
    const deltaPct = wave * 0.0018; // +/- 0.18% realistic micro-tick
    const decimals = sym === "TON" ? 4 : 2;
    const rawNextPrice = item.priceUsd * (1 + deltaPct);
    const nextPrice = Number(Math.max(0.01, rawNextPrice).toFixed(decimals));
    const nextChange = Number(
      (item.change24hPercent + deltaPct * 45).toFixed(2)
    );
    const direction: "up" | "down" | "flat" =
      nextPrice > item.priceUsd
        ? "up"
        : nextPrice < item.priceUsd
          ? "down"
          : "flat";

    next[sym] = {
      ...item,
      priceUsd: nextPrice,
      change24hPercent: nextChange,
      high24hUsd: Number(Math.max(item.high24hUsd, nextPrice).toFixed(decimals)),
      low24hUsd: Number(Math.min(item.low24hUsd, nextPrice).toFixed(decimals)),
      lastTickDirection: direction,
    };
  });

  syncGlobalAssetRatesFromTickers(next);
  return next;
}

export function parseHexToNumber(hex: unknown, fallback = 0): number {
  if (typeof hex !== "string" || !hex.startsWith("0x")) return fallback;
  const parsed = Number.parseInt(hex, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseHexWeiToEther(hexWei: unknown, decimals = 18): number {
  if (typeof hexWei !== "string" || !hexWei.startsWith("0x")) return 0;
  try {
    const clean = hexWei === "0x" ? "0x0" : hexWei;
    const wei = BigInt(clean);
    const divisor = Number(10n ** BigInt(decimals));
    return Number((Number(wei) / divisor).toFixed(6));
  } catch {
    return 0;
  }
}

export function calculateRealtimeWalletValuation(
  portfolio: PortfolioState,
  walletAddress: string,
  tickers: Record<CryptoTickerSymbol, RealtimeCryptoTicker>,
  options?: {
    isTon?: boolean;
    onChainNativeBalance?: number;
  }
): {
  tokenValuations: WalletTokenRealtimeValuation[];
  walletTotalRealtimeUsd: number;
} {
  syncGlobalAssetRatesFromTickers(tickers);
  const summary = calculateWalletBalances(portfolio, {
    walletAddress,
    isTon: options?.isTon,
    baseNativeBalance: options?.onChainNativeBalance ?? 0,
  });

  const ethPrice = tickers.ETH?.priceUsd || ASSET_RATES_USD.ETH;
  const tonPrice = tickers.TON?.priceUsd || ASSET_RATES_USD.TON;

  const tokenValuations: WalletTokenRealtimeValuation[] = [
    {
      symbol: "USDT",
      name: "Tether USD",
      amount: summary.USDT,
      livePriceUsd: 1.0,
      change24hPercent: tickers.USDT?.change24hPercent ?? 0.01,
      totalValueUsd: Number(summary.USDT.toFixed(2)),
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      amount: summary.USDC,
      livePriceUsd: 1.0,
      change24hPercent: tickers.USDC?.change24hPercent ?? 0.0,
      totalValueUsd: Number(summary.USDC.toFixed(2)),
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: summary.ETH,
      livePriceUsd: ethPrice,
      change24hPercent: tickers.ETH?.change24hPercent ?? 3.64,
      totalValueUsd: Number((summary.ETH * ethPrice).toFixed(2)),
    },
    {
      symbol: "TON",
      name: "Toncoin",
      amount: summary.TON,
      livePriceUsd: tonPrice,
      change24hPercent: tickers.TON?.change24hPercent ?? 2.95,
      totalValueUsd: Number((summary.TON * tonPrice).toFixed(2)),
    },
  ];

  const walletTotalRealtimeUsd = Number(
    tokenValuations
      .reduce((acc, item) => acc + item.totalValueUsd, 0)
      .toFixed(2)
  );

  return {
    tokenValuations,
    walletTotalRealtimeUsd,
  };
}

export async function fetchLiveCryptoTickers(
  current: Record<CryptoTickerSymbol, RealtimeCryptoTicker> = INITIAL_CRYPTO_TICKERS
): Promise<{
  tickers: Record<CryptoTickerSymbol, RealtimeCryptoTicker>;
  isLiveApi: boolean;
}> {
  if (typeof fetch !== "function") {
    return {
      tickers: applyRealtimeMarketTick(current),
      isLiveApi: false,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const symbolsParam = encodeURIComponent(
      JSON.stringify(["BTCUSDT", "ETHUSDT", "TONUSDT", "BNBUSDT", "SOLUSDT"])
    );
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        tickers: applyRealtimeMarketTick(current),
        isLiveApi: false,
      };
    }

    const data = (await res.json()) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      quoteVolume: string;
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      return {
        tickers: applyRealtimeMarketTick(current),
        isLiveApi: false,
      };
    }

    const next: Record<CryptoTickerSymbol, RealtimeCryptoTicker> = {
      ...current,
    };

    const mapSym: Record<string, CryptoTickerSymbol> = {
      BTCUSDT: "BTC",
      ETHUSDT: "ETH",
      TONUSDT: "TON",
      BNBUSDT: "BNB",
      SOLUSDT: "SOL",
    };

    for (const row of data) {
      const sym = mapSym[row.symbol];
      if (!sym) continue;
      const prev = current[sym];
      const priceUsd = Number.parseFloat(row.lastPrice);
      const change24hPercent = Number.parseFloat(row.priceChangePercent);
      const high24hUsd = Number.parseFloat(row.highPrice);
      const low24hUsd = Number.parseFloat(row.lowPrice);
      const volume24hUsdM = Number.parseFloat(row.quoteVolume) / 1e6;

      if (Number.isFinite(priceUsd) && priceUsd > 0) {
        next[sym] = {
          ...prev,
          priceUsd: Number(priceUsd.toFixed(sym === "TON" ? 4 : 2)),
          change24hPercent: Number.isFinite(change24hPercent)
            ? Number(change24hPercent.toFixed(2))
            : prev.change24hPercent,
          high24hUsd: Number.isFinite(high24hUsd)
            ? Number(high24hUsd.toFixed(sym === "TON" ? 4 : 2))
            : prev.high24hUsd,
          low24hUsd: Number.isFinite(low24hUsd)
            ? Number(low24hUsd.toFixed(sym === "TON" ? 4 : 2))
            : prev.low24hUsd,
          volume24hUsdM: Number.isFinite(volume24hUsdM)
            ? Number(volume24hUsdM.toFixed(1))
            : prev.volume24hUsdM,
          lastTickDirection:
            priceUsd > prev.priceUsd
              ? "up"
              : priceUsd < prev.priceUsd
                ? "down"
                : "flat",
        };
      }
    }

    syncGlobalAssetRatesFromTickers(next);
    return {
      tickers: next,
      isLiveApi: true,
    };
  } catch {
    clearTimeout(timeout);
    return {
      tickers: applyRealtimeMarketTick(current),
      isLiveApi: false,
    };
  }
}

async function callJsonRpc(
  rpcUrl: string,
  method: string,
  params: any[] = [],
  timeoutMs = 2000
): Promise<any> {
  if (typeof fetch !== "function") return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function fetchRealtimeWalletSnapshot(params: {
  address: string;
  chainId: number;
  portfolio: PortfolioState;
  currentTickers?: Record<CryptoTickerSymbol, RealtimeCryptoTicker>;
}): Promise<RealtimeWalletSnapshot> {
  const startMs = Date.now();
  const cleanAddr = params.address.trim();
  const isTon =
    params.chainId === 1100 ||
    cleanAddr.toLowerCase().startsWith("uq") ||
    cleanAddr.toLowerCase().startsWith("eq");
  const effectiveChainId = isTon ? 1100 : params.chainId || 1;
  const chainInfo =
    PUBLIC_RPC_BY_CHAIN[effectiveChainId] ?? PUBLIC_RPC_BY_CHAIN[1];

  const tickerPromise = fetchLiveCryptoTickers(
    params.currentTickers ?? INITIAL_CRYPTO_TICKERS
  );

  let blockNumber = isTon
    ? 42891450 + Math.floor((Date.now() / 3000) % 1000)
    : 21148920 + Math.floor((Date.now() / 3000) % 1000);
  let gasPriceGwei = isTon ? 0.05 : 12.4;
  let onChainNativeBalance = 0;
  let onChainTxCount = 0;
  let gotLiveRpc = false;

  if (!isTon && cleanAddr.startsWith("0x") && cleanAddr.length === 42) {
    const [blockHex, gasHex, balHex, txCountHex, tickerRes] = await Promise.all([
      callJsonRpc(chainInfo.rpcUrl, "eth_blockNumber", []),
      callJsonRpc(chainInfo.rpcUrl, "eth_gasPrice", []),
      callJsonRpc(chainInfo.rpcUrl, "eth_getBalance", [cleanAddr, "latest"]),
      callJsonRpc(chainInfo.rpcUrl, "eth_getTransactionCount", [
        cleanAddr,
        "latest",
      ]),
      tickerPromise,
    ]);

    if (typeof blockHex === "string" && blockHex.startsWith("0x")) {
      blockNumber = parseHexToNumber(blockHex, blockNumber);
      gotLiveRpc = true;
    }
    if (typeof gasHex === "string" && gasHex.startsWith("0x")) {
      const gasWei = parseHexToNumber(gasHex, 12400000000);
      gasPriceGwei = Number(Math.max(0.01, gasWei / 1e9).toFixed(2));
    }
    if (typeof balHex === "string" && balHex.startsWith("0x")) {
      onChainNativeBalance = parseHexWeiToEther(balHex, 18);
    }
    if (typeof txCountHex === "string" && txCountHex.startsWith("0x")) {
      onChainTxCount = parseHexToNumber(txCountHex, 0);
    }

    const latencyMs = Math.max(18, Date.now() - startMs);
    const valuation = calculateRealtimeWalletValuation(
      params.portfolio,
      cleanAddr,
      tickerRes.tickers,
      {
        isTon: false,
        onChainNativeBalance,
      }
    );

    const now = new Date();
    return {
      address: cleanAddr,
      chainId: effectiveChainId,
      networkName: chainInfo.name,
      isTon: false,
      rpcEndpoint: chainInfo.rpcUrl,
      blockNumber,
      gasPriceGwei,
      latencyMs,
      onChainNativeBalance,
      onChainNativeSymbol: chainInfo.nativeSymbol,
      onChainTxCount,
      walletTotalRealtimeUsd: valuation.walletTotalRealtimeUsd,
      tokenValuations: valuation.tokenValuations,
      tickers: tickerRes.tickers,
      lastUpdatedIso: now.toISOString(),
      lastUpdatedTimeLabel: now.toTimeString().slice(0, 8),
      sourceMode:
        gotLiveRpc || tickerRes.isLiveApi
          ? "LIVE_RPC_AND_MARKET"
          : "LIVE_SIMULATED_FALLBACK",
    };
  }

  // TON Network or custom address
  const tickerRes = await tickerPromise;
  if (isTon && typeof fetch === "function") {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        "https://toncenter.com/api/v2/getMasterchainInfo",
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const seqno = Number(json?.result?.last?.seqno);
        if (Number.isFinite(seqno) && seqno > 0) {
          blockNumber = seqno;
          gotLiveRpc = true;
        }
      }
    } catch {
      // ignore TON RPC errors
    }
  }

  const latencyMs = Math.max(22, Date.now() - startMs);
  const valuation = calculateRealtimeWalletValuation(
    params.portfolio,
    cleanAddr,
    tickerRes.tickers,
    {
      isTon,
      onChainNativeBalance,
    }
  );

  const now = new Date();
  return {
    address: cleanAddr,
    chainId: effectiveChainId,
    networkName: chainInfo.name,
    isTon,
    rpcEndpoint: chainInfo.rpcUrl,
    blockNumber,
    gasPriceGwei,
    latencyMs,
    onChainNativeBalance,
    onChainNativeSymbol: chainInfo.nativeSymbol,
    onChainTxCount,
    walletTotalRealtimeUsd: valuation.walletTotalRealtimeUsd,
    tokenValuations: valuation.tokenValuations,
    tickers: tickerRes.tickers,
    lastUpdatedIso: now.toISOString(),
    lastUpdatedTimeLabel: now.toTimeString().slice(0, 8),
    sourceMode:
      gotLiveRpc || tickerRes.isLiveApi
        ? "LIVE_RPC_AND_MARKET"
        : "LIVE_SIMULATED_FALLBACK",
  };
}
