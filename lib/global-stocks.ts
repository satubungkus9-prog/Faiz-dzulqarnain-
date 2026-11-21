export type StockRegion = "ALL" | "AMERIKA" | "EROPA" | "ASIA" | "INDONESIA";

export interface GlobalStock {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  region: Exclude<StockRegion, "ALL">;
  sector: string;
  localCurrency: string;
  localPrice: number;
  priceUsd: number;
  change24hPercent: number;
  marketCapUsdB: number;
  peRatio: number;
  dividendYieldPercent: number;
  high52wUsd: number;
  low52wUsd: number;
  volume24hM: number;
  history: {
    "1H": number[];
    "1M": number[];
    "1B": number[];
    "1T": number[];
  };
}

export interface StockHolding {
  ticker: string;
  shares: number;
  avgBuyPriceUsd: number;
}

export interface StockOrderRecord {
  id: string;
  timestamp: string;
  ticker: string;
  companyName: string;
  exchange: string;
  side: "BUY" | "SELL";
  shares: number;
  pricePerShareUsd: number;
  totalUsd: number;
  paymentAsset: string;
}

export type WithdrawalAsset = "USDT" | "USDC" | "ETH" | "TON";
export type TransferSourceType = "PORTFOLIO" | "WALLET" | "SWAP";
export type WalletActionMode = "SWAP" | "WITHDRAW" | "SEND";

export interface WithdrawalRecord {
  id: string;
  timestamp: string;
  amountUsd: number;
  asset: WithdrawalAsset;
  cryptoAmount: number;
  fromAsset?: WithdrawalAsset;
  fromCryptoAmount?: number;
  network: string;
  destinationAddress: string;
  sourceType?: TransferSourceType;
  sourceAddress?: string;
  txHash: string;
  status: "BERHASIL";
}

export interface PortfolioState {
  buyingPowerUsd: number;
  holdings: StockHolding[];
  orders: StockOrderRecord[];
  watchlist: string[];
  withdrawals?: WithdrawalRecord[];
}

export const GLOBAL_STOCKS: GlobalStock[] = [
  // AMERIKA SERIKAT (NASDAQ / NYSE)
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    country: "Amerika Serikat",
    region: "AMERIKA",
    sector: "Semikonduktor & AI",
    localCurrency: "USD",
    localPrice: 138.6,
    priceUsd: 138.6,
    change24hPercent: 3.42,
    marketCapUsdB: 3390,
    peRatio: 52.4,
    dividendYieldPercent: 0.03,
    high52wUsd: 143.71,
    low52wUsd: 75.6,
    volume24hM: 64.2,
    history: {
      "1H": [134.1, 134.8, 135.2, 134.9, 136.0, 136.8, 137.4, 138.1, 138.6],
      "1M": [128.5, 130.2, 129.8, 132.4, 134.0, 133.5, 135.9, 137.2, 138.6],
      "1B": [116.0, 119.5, 122.0, 120.8, 125.4, 129.0, 132.6, 135.8, 138.6],
      "1T": [82.4, 90.1, 96.5, 106.2, 118.4, 112.0, 124.8, 133.2, 138.6],
    },
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    country: "Amerika Serikat",
    region: "AMERIKA",
    sector: "Teknologi Konsumen",
    localCurrency: "USD",
    localPrice: 234.85,
    priceUsd: 234.85,
    change24hPercent: 1.18,
    marketCapUsdB: 3560,
    peRatio: 35.8,
    dividendYieldPercent: 0.44,
    high52wUsd: 237.23,
    low52wUsd: 164.08,
    volume24hM: 42.8,
    history: {
      "1H": [232.1, 232.5, 232.9, 233.2, 233.0, 233.8, 234.1, 234.5, 234.85],
      "1M": [226.4, 227.9, 229.1, 228.5, 230.2, 231.8, 233.0, 234.1, 234.85],
      "1B": [218.0, 220.4, 221.9, 225.0, 224.2, 228.1, 230.5, 232.9, 234.85],
      "1T": [172.5, 181.0, 189.4, 196.8, 210.5, 218.2, 224.0, 231.0, 234.85],
    },
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    country: "Amerika Serikat",
    region: "AMERIKA",
    sector: "Cloud & Perangkat Lunak",
    localCurrency: "USD",
    localPrice: 428.5,
    priceUsd: 428.5,
    change24hPercent: 0.86,
    marketCapUsdB: 3180,
    peRatio: 36.1,
    dividendYieldPercent: 0.72,
    high52wUsd: 468.35,
    low52wUsd: 366.5,
    volume24hM: 18.9,
    history: {
      "1H": [424.8, 425.2, 425.9, 426.1, 426.8, 427.0, 427.6, 428.1, 428.5],
      "1M": [416.0, 418.2, 419.5, 421.0, 420.4, 423.2, 425.0, 426.9, 428.5],
      "1B": [408.5, 412.0, 415.2, 414.0, 418.6, 421.5, 424.0, 426.8, 428.5],
      "1T": [375.0, 388.2, 402.5, 415.0, 442.0, 430.5, 418.0, 424.2, 428.5],
    },
  },
  {
    ticker: "BRK.B",
    name: "Berkshire Hathaway Inc.",
    exchange: "NYSE",
    country: "Amerika Serikat",
    region: "AMERIKA",
    sector: "Keuangan & Investasi",
    localCurrency: "USD",
    localPrice: 462.1,
    priceUsd: 462.1,
    change24hPercent: 0.54,
    marketCapUsdB: 998,
    peRatio: 21.3,
    dividendYieldPercent: 0.0,
    high52wUsd: 484.8,
    low52wUsd: 355.2,
    volume24hM: 3.6,
    history: {
      "1H": [459.6, 460.0, 460.4, 460.8, 461.1, 461.0, 461.5, 461.9, 462.1],
      "1M": [451.0, 452.8, 454.2, 455.9, 457.0, 458.4, 459.8, 461.0, 462.1],
      "1B": [442.0, 445.5, 448.0, 450.2, 453.0, 455.8, 458.2, 460.4, 462.1],
      "1T": [362.0, 378.5, 395.0, 410.2, 426.8, 439.0, 448.5, 456.0, 462.1],
    },
  },

  // EROPA (EURONEXT / XETRA / LSE / SIX)
  {
    ticker: "ASML",
    name: "ASML Holding N.V.",
    exchange: "Euronext Amsterdam",
    country: "Belanda",
    region: "EROPA",
    sector: "Litografi Semikonduktor",
    localCurrency: "EUR",
    localPrice: 672.4,
    priceUsd: 726.2,
    change24hPercent: 2.15,
    marketCapUsdB: 286,
    peRatio: 34.2,
    dividendYieldPercent: 0.91,
    high52wUsd: 1086.0,
    low52wUsd: 645.0,
    volume24hM: 1.9,
    history: {
      "1H": [710.8, 712.5, 715.0, 714.2, 718.0, 720.4, 722.8, 724.5, 726.2],
      "1M": [692.0, 696.5, 701.2, 699.0, 706.8, 712.0, 718.5, 722.0, 726.2],
      "1B": [680.0, 688.5, 695.0, 690.2, 701.5, 709.0, 715.4, 721.0, 726.2],
      "1T": [665.0, 740.0, 820.5, 910.0, 980.0, 860.0, 745.0, 715.0, 726.2],
    },
  },
  {
    ticker: "MC.PA",
    name: "LVMH Moët Hennessy Louis Vuitton",
    exchange: "Euronext Paris",
    country: "Prancis",
    region: "EROPA",
    sector: "Barang Mewah Global",
    localCurrency: "EUR",
    localPrice: 638.0,
    priceUsd: 689.04,
    change24hPercent: -0.62,
    marketCapUsdB: 344,
    peRatio: 23.8,
    dividendYieldPercent: 1.98,
    high52wUsd: 942.0,
    low52wUsd: 650.0,
    volume24hM: 0.85,
    history: {
      "1H": [693.4, 692.8, 692.1, 691.5, 690.8, 690.2, 689.9, 689.4, 689.04],
      "1M": [704.0, 701.5, 699.0, 696.2, 695.0, 693.1, 691.5, 690.0, 689.04],
      "1B": [715.0, 710.2, 706.8, 702.0, 698.5, 695.0, 692.4, 690.5, 689.04],
      "1T": [740.0, 790.0, 845.0, 810.0, 765.0, 730.0, 710.0, 696.0, 689.04],
    },
  },
  {
    ticker: "SAP",
    name: "SAP SE",
    exchange: "XETRA Frankfurt",
    country: "Jerman",
    region: "EROPA",
    sector: "Perangkat Lunak Enterprise",
    localCurrency: "EUR",
    localPrice: 221.5,
    priceUsd: 239.22,
    change24hPercent: 1.74,
    marketCapUsdB: 279,
    peRatio: 44.5,
    dividendYieldPercent: 1.02,
    high52wUsd: 242.5,
    low52wUsd: 148.2,
    volume24hM: 2.4,
    history: {
      "1H": [235.1, 235.8, 236.2, 236.9, 237.4, 237.9, 238.4, 238.9, 239.22],
      "1M": [228.0, 229.5, 231.0, 232.4, 233.8, 235.2, 236.8, 238.1, 239.22],
      "1B": [216.0, 219.5, 222.8, 225.0, 228.4, 231.5, 234.8, 237.2, 239.22],
      "1T": [155.0, 168.4, 182.0, 194.5, 205.0, 214.2, 223.5, 232.0, 239.22],
    },
  },
  {
    ticker: "NESN",
    name: "Nestlé S.A.",
    exchange: "SIX Swiss Exchange",
    country: "Swiss",
    region: "EROPA",
    sector: "Konsumen Primer",
    localCurrency: "CHF",
    localPrice: 84.6,
    priceUsd: 97.29,
    change24hPercent: 0.38,
    marketCapUsdB: 254,
    peRatio: 19.6,
    dividendYieldPercent: 3.45,
    high52wUsd: 118.4,
    low52wUsd: 93.1,
    volume24hM: 3.1,
    history: {
      "1H": [96.9, 96.95, 97.0, 97.05, 97.1, 97.15, 97.2, 97.25, 97.29],
      "1M": [95.4, 95.8, 96.1, 96.3, 96.5, 96.8, 97.0, 97.15, 97.29],
      "1B": [94.0, 94.5, 95.0, 95.4, 95.9, 96.3, 96.7, 97.0, 97.29],
      "1T": [112.0, 108.5, 105.0, 102.4, 99.8, 97.5, 96.2, 96.8, 97.29],
    },
  },

  // ASIA PASIFIK (TSE / TWSE / HKEX / SGX)
  {
    ticker: "TSM",
    name: "Taiwan Semiconductor (TSMC)",
    exchange: "TWSE / NYSE",
    country: "Taiwan",
    region: "ASIA",
    sector: "Foundry Semikonduktor",
    localCurrency: "TWD",
    localPrice: 1065.0,
    priceUsd: 201.4,
    change24hPercent: 2.89,
    marketCapUsdB: 1045,
    peRatio: 31.4,
    dividendYieldPercent: 1.24,
    high52wUsd: 212.6,
    low52wUsd: 99.2,
    volume24hM: 21.5,
    history: {
      "1H": [195.8, 196.4, 197.1, 197.9, 198.5, 199.2, 200.1, 200.8, 201.4],
      "1M": [188.0, 190.2, 191.8, 193.5, 195.0, 196.8, 198.4, 200.0, 201.4],
      "1B": [174.5, 178.0, 182.4, 185.0, 189.2, 193.0, 196.5, 199.1, 201.4],
      "1T": [104.0, 118.5, 134.0, 148.2, 165.0, 172.4, 184.0, 194.5, 201.4],
    },
  },
  {
    ticker: "7203.T",
    name: "Toyota Motor Corporation",
    exchange: "TSE Tokyo",
    country: "Jepang",
    region: "ASIA",
    sector: "Otomotif & Mobilitas",
    localCurrency: "JPY",
    localPrice: 2685.0,
    priceUsd: 17.9,
    change24hPercent: 1.12,
    marketCapUsdB: 242,
    peRatio: 9.8,
    dividendYieldPercent: 2.75,
    high52wUsd: 25.4,
    low52wUsd: 16.1,
    volume24hM: 28.4,
    history: {
      "1H": [17.7, 17.72, 17.75, 17.78, 17.8, 17.83, 17.85, 17.88, 17.9],
      "1M": [17.2, 17.3, 17.4, 17.45, 17.55, 17.65, 17.75, 17.82, 17.9],
      "1B": [16.8, 16.95, 17.1, 17.25, 17.4, 17.55, 17.7, 17.8, 17.9],
      "1T": [18.5, 20.1, 22.4, 24.0, 21.8, 19.5, 17.4, 17.6, 17.9],
    },
  },
  {
    ticker: "0700.HK",
    name: "Tencent Holdings Ltd.",
    exchange: "HKEX Hong Kong",
    country: "Hong Kong",
    region: "ASIA",
    sector: "Internet & Ekosistem Digital",
    localCurrency: "HKD",
    localPrice: 428.6,
    priceUsd: 55.15,
    change24hPercent: 1.95,
    marketCapUsdB: 512,
    peRatio: 18.9,
    dividendYieldPercent: 0.85,
    high52wUsd: 61.5,
    low52wUsd: 34.2,
    volume24hM: 19.2,
    history: {
      "1H": [54.1, 54.25, 54.4, 54.5, 54.65, 54.8, 54.9, 55.05, 55.15],
      "1M": [52.0, 52.4, 52.9, 53.3, 53.8, 54.1, 54.5, 54.9, 55.15],
      "1B": [48.5, 49.4, 50.2, 51.0, 52.1, 53.0, 53.9, 54.6, 55.15],
      "1T": [36.0, 38.5, 41.2, 45.0, 48.4, 51.2, 56.8, 54.0, 55.15],
    },
  },
  {
    ticker: "D05.SI",
    name: "DBS Group Holdings Ltd.",
    exchange: "SGX Singapura",
    country: "Singapura",
    region: "ASIA",
    sector: "Perbankan & Keuangan",
    localCurrency: "SGD",
    localPrice: 39.45,
    priceUsd: 29.88,
    change24hPercent: 0.74,
    marketCapUsdB: 84.8,
    peRatio: 11.2,
    dividendYieldPercent: 5.42,
    high52wUsd: 30.2,
    low52wUsd: 22.8,
    volume24hM: 4.7,
    history: {
      "1H": [29.66, 29.69, 29.72, 29.75, 29.78, 29.81, 29.84, 29.86, 29.88],
      "1M": [29.1, 29.2, 29.32, 29.45, 29.52, 29.64, 29.72, 29.8, 29.88],
      "1B": [28.4, 28.6, 28.85, 29.0, 29.2, 29.4, 29.6, 29.75, 29.88],
      "1T": [23.5, 24.4, 25.2, 26.1, 27.0, 27.9, 28.6, 29.3, 29.88],
    },
  },

  // INDONESIA (BEI / IDX JAKARTA)
  {
    ticker: "BBCA.JK",
    name: "PT Bank Central Asia Tbk",
    exchange: "BEI / IDX Jakarta",
    country: "Indonesia",
    region: "INDONESIA",
    sector: "Perbankan Utama",
    localCurrency: "IDR",
    localPrice: 10650,
    priceUsd: 0.68,
    change24hPercent: 1.43,
    marketCapUsdB: 83.9,
    peRatio: 24.6,
    dividendYieldPercent: 2.68,
    high52wUsd: 0.71,
    low52wUsd: 0.56,
    volume24hM: 88.5,
    history: {
      "1H": [0.67, 0.671, 0.672, 0.674, 0.675, 0.676, 0.678, 0.679, 0.68],
      "1M": [0.65, 0.654, 0.658, 0.662, 0.665, 0.669, 0.673, 0.677, 0.68],
      "1B": [0.63, 0.638, 0.645, 0.65, 0.658, 0.664, 0.67, 0.675, 0.68],
      "1T": [0.57, 0.585, 0.6, 0.615, 0.63, 0.645, 0.66, 0.672, 0.68],
    },
  },
  {
    ticker: "BMRI.JK",
    name: "PT Bank Mandiri (Persero) Tbk",
    exchange: "BEI / IDX Jakarta",
    country: "Indonesia",
    region: "INDONESIA",
    sector: "Perbankan Korporasi",
    localCurrency: "IDR",
    localPrice: 7050,
    priceUsd: 0.45,
    change24hPercent: 0.92,
    marketCapUsdB: 42.1,
    peRatio: 11.8,
    dividendYieldPercent: 5.12,
    high52wUsd: 0.48,
    low52wUsd: 0.36,
    volume24hM: 94.0,
    history: {
      "1H": [0.445, 0.446, 0.446, 0.447, 0.448, 0.448, 0.449, 0.449, 0.45],
      "1M": [0.432, 0.435, 0.438, 0.44, 0.442, 0.444, 0.446, 0.448, 0.45],
      "1B": [0.415, 0.42, 0.426, 0.43, 0.435, 0.44, 0.444, 0.447, 0.45],
      "1T": [0.37, 0.382, 0.395, 0.41, 0.422, 0.43, 0.438, 0.445, 0.45],
    },
  },
  {
    ticker: "TLKM.JK",
    name: "PT Telkom Indonesia (Persero) Tbk",
    exchange: "BEI / IDX Jakarta",
    country: "Indonesia",
    region: "INDONESIA",
    sector: "Telekomunikasi & Data",
    localCurrency: "IDR",
    localPrice: 3120,
    priceUsd: 0.2,
    change24hPercent: -0.48,
    marketCapUsdB: 19.8,
    peRatio: 12.4,
    dividendYieldPercent: 5.85,
    high52wUsd: 0.27,
    low52wUsd: 0.18,
    volume24hM: 112.0,
    history: {
      "1H": [0.202, 0.202, 0.201, 0.201, 0.201, 0.2, 0.2, 0.2, 0.2],
      "1M": [0.206, 0.205, 0.204, 0.203, 0.202, 0.202, 0.201, 0.201, 0.2],
      "1B": [0.21, 0.208, 0.207, 0.205, 0.204, 0.203, 0.202, 0.201, 0.2],
      "1T": [0.25, 0.242, 0.23, 0.22, 0.21, 0.195, 0.198, 0.202, 0.2],
    },
  },
];

export const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  buyingPowerUsd: 25000,
  holdings: [
    { ticker: "NVDA", shares: 12, avgBuyPriceUsd: 124.5 },
    { ticker: "ASML", shares: 2, avgBuyPriceUsd: 695.0 },
    { ticker: "BBCA.JK", shares: 2500, avgBuyPriceUsd: 0.62 },
  ],
  orders: [
    {
      id: "ord-seed-1",
      timestamp: "2026-10-22 14:20",
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      exchange: "NASDAQ",
      side: "BUY",
      shares: 12,
      pricePerShareUsd: 124.5,
      totalUsd: 1494.0,
      paymentAsset: "USDC / Wallet",
    },
    {
      id: "ord-seed-2",
      timestamp: "2026-10-21 10:15",
      ticker: "ASML",
      companyName: "ASML Holding N.V.",
      exchange: "Euronext Amsterdam",
      side: "BUY",
      shares: 2,
      pricePerShareUsd: 695.0,
      totalUsd: 1390.0,
      paymentAsset: "USDC / Wallet",
    },
    {
      id: "ord-seed-3",
      timestamp: "2026-10-19 09:30",
      ticker: "BBCA.JK",
      companyName: "PT Bank Central Asia Tbk",
      exchange: "BEI / IDX Jakarta",
      side: "BUY",
      shares: 2500,
      pricePerShareUsd: 0.62,
      totalUsd: 1550.0,
      paymentAsset: "USDC / Wallet",
    },
  ],
  watchlist: ["NVDA", "AAPL", "ASML", "TSM", "BBCA.JK"],
};

export function filterGlobalStocks(
  stocks: GlobalStock[],
  options: {
    region: StockRegion;
    query: string;
    watchlistOnly?: boolean;
    watchlist?: string[];
  }
): GlobalStock[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const watchlistSet = new Set(options.watchlist ?? []);

  return stocks.filter((stock) => {
    if (options.region !== "ALL" && stock.region !== options.region) {
      return false;
    }
    if (options.watchlistOnly && !watchlistSet.has(stock.ticker)) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      stock.ticker.toLowerCase().includes(normalizedQuery) ||
      stock.name.toLowerCase().includes(normalizedQuery) ||
      stock.country.toLowerCase().includes(normalizedQuery) ||
      stock.exchange.toLowerCase().includes(normalizedQuery) ||
      stock.sector.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function formatLocalCurrency(amount: number, currency: string): string {
  if (currency === "IDR") {
    return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  }
  if (currency === "JPY") {
    return `¥${Math.round(amount).toLocaleString("en-US")}`;
  }
  if (currency === "EUR") {
    return `€${amount.toFixed(2)}`;
  }
  if (currency === "CHF") {
    return `CHF ${amount.toFixed(2)}`;
  }
  if (currency === "HKD") {
    return `HK$${amount.toFixed(2)}`;
  }
  if (currency === "SGD") {
    return `S$${amount.toFixed(2)}`;
  }
  if (currency === "TWD") {
    return `NT$${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface OrderExecutionResult {
  ok: boolean;
  error?: string;
  nextState?: PortfolioState;
  order?: StockOrderRecord;
}

export function executeStockOrder(
  state: PortfolioState,
  params: {
    stock: GlobalStock;
    side: "BUY" | "SELL";
    shares: number;
    paymentAsset?: string;
    nowFormatted?: string;
  }
): OrderExecutionResult {
  const { stock, side, shares } = params;
  if (!Number.isFinite(shares) || shares <= 0) {
    return {
      ok: false,
      error: "Masukkan jumlah lembar saham yang valid (lebih dari 0).",
    };
  }

  const roundedShares = Number(shares.toFixed(4));
  const totalUsd = Number((roundedShares * stock.priceUsd).toFixed(2));

  if (totalUsd <= 0) {
    return {
      ok: false,
      error: "Nilai transaksi terlalu kecil.",
    };
  }

  const existingIndex = state.holdings.findIndex((h) => h.ticker === stock.ticker);
  const existingHolding = existingIndex >= 0 ? state.holdings[existingIndex] : undefined;

  if (side === "BUY") {
    if (totalUsd > state.buyingPowerUsd) {
      return {
        ok: false,
        error: `Saldo daya beli tidak mencukupi (${formatUsd(state.buyingPowerUsd)} tersedia).`,
      };
    }

    const nextHoldings = [...state.holdings];
    if (existingHolding) {
      const combinedShares = Number((existingHolding.shares + roundedShares).toFixed(4));
      const totalCost =
        existingHolding.shares * existingHolding.avgBuyPriceUsd +
        roundedShares * stock.priceUsd;
      nextHoldings[existingIndex] = {
        ticker: stock.ticker,
        shares: combinedShares,
        avgBuyPriceUsd: Number((totalCost / combinedShares).toFixed(4)),
      };
    } else {
      nextHoldings.push({
        ticker: stock.ticker,
        shares: roundedShares,
        avgBuyPriceUsd: stock.priceUsd,
      });
    }

    const order: StockOrderRecord = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp:
        params.nowFormatted ??
        new Date().toISOString().replace("T", " ").slice(0, 16),
      ticker: stock.ticker,
      companyName: stock.name,
      exchange: stock.exchange,
      side: "BUY",
      shares: roundedShares,
      pricePerShareUsd: stock.priceUsd,
      totalUsd,
      paymentAsset: params.paymentAsset ?? "USDC / Wallet",
    };

    return {
      ok: true,
      order,
      nextState: {
        ...state,
        buyingPowerUsd: Number((state.buyingPowerUsd - totalUsd).toFixed(2)),
        holdings: nextHoldings,
        orders: [order, ...state.orders],
      },
    };
  } else {
    if (!existingHolding || existingHolding.shares < roundedShares) {
      const owned = existingHolding ? existingHolding.shares : 0;
      return {
        ok: false,
        error: `Jumlah saham ${stock.ticker} yang dimiliki tidak mencukupi (${owned} lembar tersedia).`,
      };
    }

    const remainingShares = Number((existingHolding.shares - roundedShares).toFixed(4));
    const nextHoldings =
      remainingShares > 0.0001
        ? state.holdings.map((h) =>
            h.ticker === stock.ticker ? { ...h, shares: remainingShares } : h
          )
        : state.holdings.filter((h) => h.ticker !== stock.ticker);

    const order: StockOrderRecord = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp:
        params.nowFormatted ??
        new Date().toISOString().replace("T", " ").slice(0, 16),
      ticker: stock.ticker,
      companyName: stock.name,
      exchange: stock.exchange,
      side: "SELL",
      shares: roundedShares,
      pricePerShareUsd: stock.priceUsd,
      totalUsd,
      paymentAsset: params.paymentAsset ?? "USDC / Wallet",
    };

    return {
      ok: true,
      order,
      nextState: {
        ...state,
        buyingPowerUsd: Number((state.buyingPowerUsd + totalUsd).toFixed(2)),
        holdings: nextHoldings,
        orders: [order, ...state.orders],
      },
    };
  }
}

export const ASSET_RATES_USD: Record<WithdrawalAsset, number> = {
  USDT: 1.0,
  USDC: 1.0,
  ETH: 2600.0,
  TON: 5.2,
};

export function calculateCryptoWithdrawalAmount(
  amountUsd: number,
  asset: WithdrawalAsset
): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0;
  const rate = ASSET_RATES_USD[asset] ?? 1;
  const decimals = asset === "ETH" ? 6 : asset === "TON" ? 4 : 2;
  return Number((amountUsd / rate).toFixed(decimals));
}

export function parseFlexibleAmount(
  raw: string | number,
  fallback = 1000
): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[$Rp\s]/gi, "");
  if (!cleaned) return fallback;

  // Indonesian thousands separator e.g. "1.000" or "25.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    const val = Number(cleaned.replace(/\./g, ""));
    return Number.isFinite(val) && val > 0 ? val : fallback;
  }

  // Standard comma thousands separator e.g. "1,000.50"
  const normalized = cleaned.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function withdrawFundsFromPortfolio(
  state: PortfolioState,
  amountUsd: number,
  options?: {
    asset?: WithdrawalAsset;
    network?: string;
    destinationAddress?: string;
    sourceType?: TransferSourceType;
    sourceAddress?: string;
    autoCoverShortfall?: boolean;
    nowFormatted?: string;
  }
): {
  ok: boolean;
  error?: string;
  nextState?: PortfolioState;
  withdrawal?: WithdrawalRecord;
} {
  const autoCover = options?.autoCoverShortfall === true;
  let effectiveAmountUsd = amountUsd;

  if (!Number.isFinite(effectiveAmountUsd) || effectiveAmountUsd <= 0) {
    if (autoCover) {
      effectiveAmountUsd =
        state.buyingPowerUsd > 0 ? Math.min(1000, state.buyingPowerUsd) : 1000;
    } else {
      return {
        ok: false,
        error:
          "Masukkan nominal penarikan/transfer saldo yang valid (lebih dari $0).",
      };
    }
  }

  let sourceType: TransferSourceType = options?.sourceType ?? "PORTFOLIO";
  const sourceAddress = (
    options?.sourceAddress ?? "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
  ).trim();
  const rawDest = (
    options?.destinationAddress ?? sourceAddress
  ).trim();
  const destinationAddress =
    rawDest.length >= 10
      ? rawDest
      : sourceAddress.length >= 10
        ? sourceAddress
        : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

  if (!autoCover && ( options?.destinationAddress ?? destinationAddress ).trim().length < 10) {
    return {
      ok: false,
      error: "Masukkan alamat dompet tujuan yang valid.",
    };
  }

  if (sourceType === "WALLET") {
    if (sourceAddress.toLowerCase() === destinationAddress.toLowerCase()) {
      if (autoCover) {
        sourceType = "PORTFOLIO";
      } else {
        return {
          ok: false,
          error:
            "Untuk transfer antar dompet, masukkan alamat Wallet Lain yang berbeda dari dompet pengirim.",
        };
      }
    } else {
      const senderWallet = calculateWalletBalances(state, {
        walletAddress: sourceAddress,
      });
      if (effectiveAmountUsd > senderWallet.totalWalletUsd) {
        if (autoCover) {
          sourceType = "PORTFOLIO";
        } else {
          return {
            ok: false,
            error: `Saldo di dompet pengirim tidak mencukupi (${formatUsd(
              senderWallet.totalWalletUsd
            )} tersedia di dompet ${sourceAddress.slice(0, 6)}...${sourceAddress.slice(-4)}).`,
          };
        }
      }
    }
  }

  if (sourceType === "PORTFOLIO") {
    if (!autoCover && effectiveAmountUsd > state.buyingPowerUsd) {
      return {
        ok: false,
        error: `Saldo tersedia tidak mencukupi untuk penarikan (${formatUsd(
          state.buyingPowerUsd
        )} tersedia).`,
      };
    }
  }

  const asset: WithdrawalAsset = options?.asset ?? "USDT";
  const network = options?.network ?? "Ethereum";
  const cryptoAmount = calculateCryptoWithdrawalAmount(effectiveAmountUsd, asset);
  const randomHex = Array.from({ length: 16 }, (_, i) =>
    ((Math.floor(effectiveAmountUsd * 17 + i * 31) % 16) >>> 0).toString(16)
  ).join("");

  const withdrawal: WithdrawalRecord = {
    id: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp:
      options?.nowFormatted ??
      new Date().toISOString().replace("T", " ").slice(0, 16),
    amountUsd: Number(effectiveAmountUsd.toFixed(2)),
    asset,
    cryptoAmount,
    network,
    destinationAddress,
    sourceType,
    sourceAddress,
    txHash: `0x${randomHex}8f9a2b4c6d1e3f5a`,
    status: "BERHASIL",
  };

  let nextBuyingPower = state.buyingPowerUsd;
  if (sourceType === "PORTFOLIO") {
    const remaining = Number(
      (state.buyingPowerUsd - effectiveAmountUsd).toFixed(2)
    );
    nextBuyingPower =
      remaining > 0
        ? remaining
        : autoCover
          ? DEFAULT_PORTFOLIO_STATE.buyingPowerUsd
          : Math.max(0, remaining);
  }

  return {
    ok: true,
    withdrawal,
    nextState: {
      ...state,
      buyingPowerUsd: nextBuyingPower,
      withdrawals: [withdrawal, ...(state.withdrawals ?? [])],
    },
  };
}

export interface SwapQuote {
  fromAsset: WithdrawalAsset;
  toAsset: WithdrawalAsset;
  fromAmount: number;
  toAmount: number;
  usdValue: number;
  rate: number;
}

export function calculateSwapQuote(
  fromAsset: WithdrawalAsset,
  toAsset: WithdrawalAsset,
  fromAmount: number
): SwapQuote {
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return {
      fromAsset,
      toAsset,
      fromAmount: 0,
      toAmount: 0,
      usdValue: 0,
      rate: Number((ASSET_RATES_USD[fromAsset] / ASSET_RATES_USD[toAsset]).toFixed(6)),
    };
  }
  const fromRate = ASSET_RATES_USD[fromAsset];
  const toRate = ASSET_RATES_USD[toAsset];
  const usdValue = Number((fromAmount * fromRate).toFixed(2));
  const toAmount = calculateCryptoWithdrawalAmount(usdValue, toAsset);
  const rate = Number((fromRate / toRate).toFixed(6));

  return {
    fromAsset,
    toAsset,
    fromAmount: Number(fromAmount.toFixed(6)),
    toAmount,
    usdValue,
    rate,
  };
}

export function executeWalletSwap(
  state: PortfolioState,
  params: {
    walletAddress: string;
    fromAsset: WithdrawalAsset;
    toAsset: WithdrawalAsset;
    fromAmount: number;
    network?: string;
    autoFundFromPortfolio?: boolean;
    nowFormatted?: string;
  }
): {
  ok: boolean;
  error?: string;
  nextState?: PortfolioState;
  withdrawal?: WithdrawalRecord;
  fundedFromPortfolio?: boolean;
} {
  const walletAddress = params.walletAddress.trim();
  if (walletAddress.length < 10) {
    return {
      ok: false,
      error: "Alamat dompet untuk Suweb (Swap) tidak valid.",
    };
  }

  if (params.fromAsset === params.toAsset) {
    return {
      ok: false,
      error: "Pilih aset kripto tujuan Suweb yang berbeda dari aset asal.",
    };
  }

  if (!Number.isFinite(params.fromAmount) || params.fromAmount <= 0) {
    return {
      ok: false,
      error: "Masukkan jumlah aset untuk Suweb (Swap) lebih dari 0.",
    };
  }

  const quote = calculateSwapQuote(
    params.fromAsset,
    params.toAsset,
    params.fromAmount
  );

  if (quote.usdValue <= 0 || quote.toAmount <= 0) {
    return {
      ok: false,
      error: "Nominal konversi Suweb terlalu kecil.",
    };
  }

  const walletSummary = calculateWalletBalances(state, {
    walletAddress,
  });
  const availableFromAsset = walletSummary[params.fromAsset];
  const autoFund = params.autoFundFromPortfolio !== false;

  let fundedFromPortfolio = false;
  let nextBuyingPower = state.buyingPowerUsd;

  if (availableFromAsset >= params.fromAmount) {
    fundedFromPortfolio = false;
  } else if (autoFund && state.buyingPowerUsd >= quote.usdValue) {
    fundedFromPortfolio = true;
    nextBuyingPower = Number((state.buyingPowerUsd - quote.usdValue).toFixed(2));
  } else {
    return {
      ok: false,
      error: `Saldo ${params.fromAsset} di dompet (${availableFromAsset} ${params.fromAsset}) maupun Saldo Investasi (${formatUsd(
        state.buyingPowerUsd
      )}) tidak mencukupi untuk Suweb senilai ${formatUsd(quote.usdValue)}.`,
    };
  }

  const randomHex = Array.from({ length: 16 }, (_, i) =>
    ((Math.floor(quote.usdValue * 19 + i * 29) % 16) >>> 0).toString(16)
  ).join("");

  const swapRecord: WithdrawalRecord = {
    id: `swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp:
      params.nowFormatted ??
      new Date().toISOString().replace("T", " ").slice(0, 16),
    amountUsd: quote.usdValue,
    asset: params.toAsset,
    cryptoAmount: quote.toAmount,
    fromAsset: params.fromAsset,
    fromCryptoAmount: quote.fromAmount,
    network: params.network ?? "Ethereum",
    destinationAddress: walletAddress,
    sourceType: "SWAP",
    sourceAddress: fundedFromPortfolio ? "PORTFOLIO_SWAP" : walletAddress,
    txHash: `0x${randomHex}c4e8a1b2f3d5907e`,
    status: "BERHASIL",
  };

  return {
    ok: true,
    withdrawal: swapRecord,
    fundedFromPortfolio,
    nextState: {
      ...state,
      buyingPowerUsd: nextBuyingPower,
      withdrawals: [swapRecord, ...(state.withdrawals ?? [])],
    },
  };
}

export interface EnrichedHolding extends StockHolding {
  stock: GlobalStock;
  marketValueUsd: number;
  costBasisUsd: number;
  pnlUsd: number;
  pnlPercent: number;
  weightPercent: number;
}

export interface PortfolioSummary {
  holdings: EnrichedHolding[];
  totalEquityUsd: number;
  totalCostBasisUsd: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
  buyingPowerUsd: number;
  totalAccountValueUsd: number;
  regionAllocation: { region: Exclude<StockRegion, "ALL">; label: string; valueUsd: number; percent: number }[];
}

const REGION_LABELS: Record<Exclude<StockRegion, "ALL">, string> = {
  AMERIKA: "Amerika Serikat",
  EROPA: "Eropa",
  ASIA: "Asia Pasifik",
  INDONESIA: "Indonesia",
};

export function calculatePortfolioSummary(
  state: PortfolioState,
  stocks: GlobalStock[] = GLOBAL_STOCKS
): PortfolioSummary {
  const stockMap = new Map(stocks.map((s) => [s.ticker, s]));
  let totalEquityUsd = 0;
  let totalCostBasisUsd = 0;

  const rawEnriched = state.holdings
    .map((h) => {
      const stock = stockMap.get(h.ticker);
      if (!stock) return null;
      const marketValueUsd = Number((h.shares * stock.priceUsd).toFixed(2));
      const costBasisUsd = Number((h.shares * h.avgBuyPriceUsd).toFixed(2));
      const pnlUsd = Number((marketValueUsd - costBasisUsd).toFixed(2));
      const pnlPercent =
        costBasisUsd > 0 ? Number(((pnlUsd / costBasisUsd) * 100).toFixed(2)) : 0;

      totalEquityUsd += marketValueUsd;
      totalCostBasisUsd += costBasisUsd;

      return {
        ...h,
        stock,
        marketValueUsd,
        costBasisUsd,
        pnlUsd,
        pnlPercent,
        weightPercent: 0,
      };
    })
    .filter((item): item is EnrichedHolding => item !== null);

  const enrichedHoldings = rawEnriched.map((item) => ({
    ...item,
    weightPercent:
      totalEquityUsd > 0
        ? Number(((item.marketValueUsd / totalEquityUsd) * 100).toFixed(1))
        : 0,
  }));

  const totalPnlUsd = Number((totalEquityUsd - totalCostBasisUsd).toFixed(2));
  const totalPnlPercent =
    totalCostBasisUsd > 0
      ? Number(((totalPnlUsd / totalCostBasisUsd) * 100).toFixed(2))
      : 0;

  const regionTotals: Record<Exclude<StockRegion, "ALL">, number> = {
    AMERIKA: 0,
    EROPA: 0,
    ASIA: 0,
    INDONESIA: 0,
  };

  for (const h of enrichedHoldings) {
    regionTotals[h.stock.region] += h.marketValueUsd;
  }

  const regionAllocation = (Object.keys(regionTotals) as Exclude<StockRegion, "ALL">[]).map(
    (region) => ({
      region,
      label: REGION_LABELS[region],
      valueUsd: Number(regionTotals[region].toFixed(2)),
      percent:
        totalEquityUsd > 0
          ? Number(((regionTotals[region] / totalEquityUsd) * 100).toFixed(1))
          : 0,
    })
  );

  return {
    holdings: enrichedHoldings,
    totalEquityUsd: Number(totalEquityUsd.toFixed(2)),
    totalCostBasisUsd: Number(totalCostBasisUsd.toFixed(2)),
    totalPnlUsd,
    totalPnlPercent,
    buyingPowerUsd: state.buyingPowerUsd,
    totalAccountValueUsd: Number((totalEquityUsd + state.buyingPowerUsd).toFixed(2)),
    regionAllocation,
  };
}

export const PORTFOLIO_STORAGE_KEY = "global_stock_portfolio_v1";
export const PORTFOLIO_SYNC_EVENT = "global-portfolio-updated";

export interface WalletBalanceSummary {
  USDT: number;
  USDC: number;
  ETH: number;
  TON: number;
  totalTransferredUsd: number;
  totalWalletUsd: number;
  nativeSymbol: "ETH" | "TON";
  nativeTokenAmount: number;
  nativeEquivalentTotal: number;
  primaryDisplayValue: string;
  secondaryDisplayValue: string;
  transferCount: number;
  latestTransfer: WithdrawalRecord | null;
}

export interface RecipientWalletEntry {
  address: string;
  label: string;
  isCurrentWallet: boolean;
  network: string;
  summary: WalletBalanceSummary;
}

export const PRESET_EXTERNAL_WALLETS: {
  address: string;
  label: string;
  shortAppLabel: string;
  network: string;
}[] = [
  {
    address: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
    label: "Aplikasi Trust Wallet / WalletConnect",
    shortAppLabel: "Trust / WalletConnect",
    network: "Ethereum / BSC",
  },
  {
    address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    label: "Aplikasi Coinbase Wallet (Base / EVM)",
    shortAppLabel: "Coinbase Wallet",
    network: "Base / Polygon",
  },
  {
    address: "UQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG",
    label: "Aplikasi Telegram Wallet / Tonkeeper (TON)",
    shortAppLabel: "Telegram Wallet (TON)",
    network: "TON Network",
  },
];

const LEGACY_WALLET_ALIASES: Record<string, string> = {
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906":
    "0x8ba1f109551bd432803012645ac136ddd64dba72",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc":
    "0x8ba1f109551bd432803012645ac136ddd64dba72",
  "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7":
    "0xdd2fd4581271e230360230f9337d5c0430bf44c0",
  uqby592241427c9b5a888023794976c904b5b0f4a2d19c82:
    "uqbvw8z5hubkmjydnfaem5jqtnkuwx3diqyenkwsil0xgggg",
};

export function resolveCanonicalWalletAddress(addr?: string): string {
  if (!addr) return "";
  const lower = addr.trim().toLowerCase();
  return LEGACY_WALLET_ALIASES[lower] ?? lower;
}

export function syncTransferToExternalWalletApp(
  state: PortfolioState,
  targetAddress: string
): PortfolioState {
  const cleanTarget = targetAddress.trim();
  if (cleanTarget.length < 10) return state;

  const currentBal = calculateWalletBalances(state, {
    walletAddress: cleanTarget,
  });
  if (currentBal.totalTransferredUsd > 0) {
    return state;
  }

  const withdrawals = state.withdrawals ?? [];
  const latestValid = withdrawals.find(
    (w) => w.status === "BERHASIL" && w.amountUsd > 0
  );
  if (!latestValid) return state;

  const isTargetTon =
    cleanTarget.toLowerCase().startsWith("uq") ||
    cleanTarget.toLowerCase().startsWith("eq");
  const syncedAsset: WithdrawalAsset = isTargetTon
    ? "TON"
    : latestValid.asset === "TON"
      ? "USDT"
      : latestValid.asset;
  const syncedCryptoAmount = calculateCryptoWithdrawalAmount(
    latestValid.amountUsd,
    syncedAsset
  );

  const syncedRecord: WithdrawalRecord = {
    ...latestValid,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    asset: syncedAsset,
    cryptoAmount: syncedCryptoAmount,
    network: isTargetTon ? "TON Network" : latestValid.network || "Ethereum",
    destinationAddress: cleanTarget,
    sourceType: "PORTFOLIO",
    status: "BERHASIL",
  };

  return {
    ...state,
    withdrawals: [syncedRecord, ...withdrawals],
  };
}

export function calculateWalletBalances(
  state: PortfolioState,
  options?: {
    isTon?: boolean;
    baseNativeBalance?: number;
    walletAddress?: string;
  }
): WalletBalanceSummary {
  const rawFilterAddr = options?.walletAddress?.trim().toLowerCase();
  const filterAddr = rawFilterAddr
    ? resolveCanonicalWalletAddress(rawFilterAddr)
    : undefined;
  const isTon =
    options?.isTon ??
    (filterAddr
      ? filterAddr.startsWith("uq") || filterAddr.startsWith("eq")
      : false);
  const baseNative =
    typeof options?.baseNativeBalance === "number" &&
    Number.isFinite(options.baseNativeBalance) &&
    options.baseNativeBalance > 0
      ? options.baseNativeBalance
      : 0;

  let usdt = 0;
  let usdc = 0;
  let eth = isTon ? 0 : baseNative;
  let ton = isTon ? baseNative : 0;
  let totalTransferredUsd = 0;
  let matchingCount = 0;
  let latestTransfer: WithdrawalRecord | null = null;

  const withdrawals = state.withdrawals ?? [];
  for (const w of withdrawals) {
    if (w.status !== "BERHASIL") continue;
    const destAddr = resolveCanonicalWalletAddress(w.destinationAddress);
    const srcAddr = w.sourceAddress
      ? resolveCanonicalWalletAddress(w.sourceAddress)
      : undefined;

    if (filterAddr) {
      if (w.sourceType === "SWAP") {
        if (destAddr === filterAddr) {
          if (w.asset === "USDT") usdt += w.cryptoAmount;
          else if (w.asset === "USDC") usdc += w.cryptoAmount;
          else if (w.asset === "ETH") eth += w.cryptoAmount;
          else if (w.asset === "TON") ton += w.cryptoAmount;

          if (w.sourceAddress === "PORTFOLIO_SWAP") {
            totalTransferredUsd += w.amountUsd;
          } else if (w.fromAsset && typeof w.fromCryptoAmount === "number") {
            if (w.fromAsset === "USDT") usdt -= w.fromCryptoAmount;
            else if (w.fromAsset === "USDC") usdc -= w.fromCryptoAmount;
            else if (w.fromAsset === "ETH") eth -= w.fromCryptoAmount;
            else if (w.fromAsset === "TON") ton -= w.fromCryptoAmount;
          }
          matchingCount += 1;
          if (!latestTransfer) latestTransfer = w;
        }
        continue;
      }

      if (destAddr === filterAddr) {
        totalTransferredUsd += w.amountUsd;
        if (w.asset === "USDT") usdt += w.cryptoAmount;
        else if (w.asset === "USDC") usdc += w.cryptoAmount;
        else if (w.asset === "ETH") eth += w.cryptoAmount;
        else if (w.asset === "TON") ton += w.cryptoAmount;
        matchingCount += 1;
        if (!latestTransfer) latestTransfer = w;
      }
      if (
        w.sourceType === "WALLET" &&
        srcAddr === filterAddr &&
        destAddr !== filterAddr
      ) {
        totalTransferredUsd -= w.amountUsd;
        const debitAsset = w.fromAsset ?? w.asset;
        const debitCrypto = w.fromCryptoAmount ?? w.cryptoAmount;
        if (debitAsset === "USDT") usdt -= debitCrypto;
        else if (debitAsset === "USDC") usdc -= debitCrypto;
        else if (debitAsset === "ETH") eth -= debitCrypto;
        else if (debitAsset === "TON") ton -= debitCrypto;
      }
    } else {
      // Aggregate across all portfolio withdrawals
      if (w.sourceType === "SWAP") {
        if (w.asset === "USDT") usdt += w.cryptoAmount;
        else if (w.asset === "USDC") usdc += w.cryptoAmount;
        else if (w.asset === "ETH") eth += w.cryptoAmount;
        else if (w.asset === "TON") ton += w.cryptoAmount;

        if (w.sourceAddress === "PORTFOLIO_SWAP") {
          totalTransferredUsd += w.amountUsd;
        } else if (w.fromAsset && typeof w.fromCryptoAmount === "number") {
          if (w.fromAsset === "USDT") usdt -= w.fromCryptoAmount;
          else if (w.fromAsset === "USDC") usdc -= w.fromCryptoAmount;
          else if (w.fromAsset === "ETH") eth -= w.fromCryptoAmount;
          else if (w.fromAsset === "TON") ton -= w.fromCryptoAmount;
        }
      } else if (w.sourceType !== "WALLET") {
        totalTransferredUsd += w.amountUsd;
        if (w.asset === "USDT") usdt += w.cryptoAmount;
        else if (w.asset === "USDC") usdc += w.cryptoAmount;
        else if (w.asset === "ETH") eth += w.cryptoAmount;
        else if (w.asset === "TON") ton += w.cryptoAmount;
      }
      matchingCount += 1;
      if (!latestTransfer) latestTransfer = w;
    }
  }

  usdt = Number(Math.max(0, usdt).toFixed(2));
  usdc = Number(Math.max(0, usdc).toFixed(2));
  eth = Number(Math.max(0, eth).toFixed(6));
  ton = Number(Math.max(0, ton).toFixed(4));
  totalTransferredUsd = Number(Math.max(0, totalTransferredUsd).toFixed(2));

  const nativeSymbol: "ETH" | "TON" = isTon ? "TON" : "ETH";
  const nativeRate = ASSET_RATES_USD[nativeSymbol];
  const baseNativeUsd = Number((baseNative * nativeRate).toFixed(2));
  const totalWalletUsd = Number((baseNativeUsd + totalTransferredUsd).toFixed(2));
  const nativeTokenAmount = isTon ? ton : eth;
  const nativeEquivalentTotal = Number(
    (totalWalletUsd / nativeRate).toFixed(4)
  );

  let primaryDisplayValue = `${nativeEquivalentTotal.toFixed(4)} ${nativeSymbol}`;
  let secondaryDisplayValue = formatUsd(totalWalletUsd);

  if (totalTransferredUsd > 0) {
    primaryDisplayValue = formatUsd(totalWalletUsd);
    const nonZeroParts: string[] = [];
    if (usdt > 0) nonZeroParts.push(`${usdt.toLocaleString("en-US")} USDT`);
    if (usdc > 0) nonZeroParts.push(`${usdc.toLocaleString("en-US")} USDC`);
    if (eth > 0) nonZeroParts.push(`${eth.toFixed(4)} ETH`);
    if (ton > 0) nonZeroParts.push(`${ton.toFixed(4)} TON`);
    secondaryDisplayValue =
      nonZeroParts.length > 0
        ? nonZeroParts.join(" · ")
        : `${nativeEquivalentTotal.toFixed(4)} ${nativeSymbol}`;
  }

  return {
    USDT: usdt,
    USDC: usdc,
    ETH: eth,
    TON: ton,
    totalTransferredUsd,
    totalWalletUsd,
    nativeSymbol,
    nativeTokenAmount,
    nativeEquivalentTotal,
    primaryDisplayValue,
    secondaryDisplayValue,
    transferCount: matchingCount,
    latestTransfer,
  };
}

export function getAllRecipientWallets(
  state: PortfolioState,
  currentWalletAddress?: string,
  options?: { includeAllPresets?: boolean }
): RecipientWalletEntry[] {
  const seen = new Map<string, { address: string; network: string }>();

  if (currentWalletAddress && currentWalletAddress.trim().length > 0) {
    const clean = currentWalletAddress.trim();
    const canonical = resolveCanonicalWalletAddress(clean);
    const isTonAddr =
      canonical.startsWith("uq") || canonical.startsWith("eq");
    seen.set(canonical, {
      address: clean,
      network: isTonAddr ? "TON Network" : "Ethereum",
    });
  }

  if (options?.includeAllPresets) {
    const metaMaskAddr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    if (!seen.has(resolveCanonicalWalletAddress(metaMaskAddr))) {
      seen.set(resolveCanonicalWalletAddress(metaMaskAddr), {
        address: metaMaskAddr,
        network: "Ethereum",
      });
    }
    for (const preset of PRESET_EXTERNAL_WALLETS) {
      const canonical = resolveCanonicalWalletAddress(preset.address);
      if (!seen.has(canonical)) {
        seen.set(canonical, {
          address: preset.address,
          network: preset.network,
        });
      }
    }
  }

  for (const w of state.withdrawals ?? []) {
    const dest = w.destinationAddress?.trim();
    if (dest) {
      const canonicalDest = resolveCanonicalWalletAddress(dest);
      if (!seen.has(canonicalDest)) {
        seen.set(canonicalDest, {
          address: dest,
          network: w.network || "Ethereum",
        });
      }
    }
    const src = w.sourceAddress?.trim();
    if (src && src !== "PORTFOLIO_SWAP") {
      const canonicalSrc = resolveCanonicalWalletAddress(src);
      if (!seen.has(canonicalSrc)) {
        seen.set(canonicalSrc, {
          address: src,
          network: w.network || "Ethereum",
        });
      }
    }
  }

  const currentCanonical = resolveCanonicalWalletAddress(currentWalletAddress);
  const entries: RecipientWalletEntry[] = [];

  for (const [canonical, info] of seen.entries()) {
    const isCurrentWallet = canonical === currentCanonical;
    const preset = PRESET_EXTERNAL_WALLETS.find(
      (p) => resolveCanonicalWalletAddress(p.address) === canonical
    );
    const summary = calculateWalletBalances(state, {
      walletAddress: info.address,
    });
    const isMetaMaskMain =
      canonical === "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";
    entries.push({
      address: info.address,
      label: isCurrentWallet
        ? `Dompet Aktif (${
            preset?.shortAppLabel ??
            (isMetaMaskMain ? "MetaMask Utama" : "Wallet Terhubung")
          })`
        : preset?.label ??
          (isMetaMaskMain
            ? "Aplikasi MetaMask Utama"
            : "Aplikasi Wallet Penerima (Eksternal)"),
      isCurrentWallet,
      network: info.network,
      summary,
    });
  }

  return entries;
}

export function loadPortfolioFromStorage(): PortfolioState {
  if (typeof window === "undefined") return DEFAULT_PORTFOLIO_STATE;
  try {
    const saved = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed.buyingPowerUsd === "number" &&
        Array.isArray(parsed.holdings)
      ) {
        const replenishedBuyingPower =
          parsed.buyingPowerUsd > 0
            ? parsed.buyingPowerUsd
            : DEFAULT_PORTFOLIO_STATE.buyingPowerUsd;
        return {
          ...DEFAULT_PORTFOLIO_STATE,
          ...parsed,
          buyingPowerUsd: replenishedBuyingPower,
          withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_PORTFOLIO_STATE;
}

export function savePortfolioToStorage(state: PortfolioState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(PORTFOLIO_SYNC_EVENT, { detail: state }));
  } catch {
    // ignore storage errors
  }
}

