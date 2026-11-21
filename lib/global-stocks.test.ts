import test from "node:test";
import assert from "node:assert/strict";
import {
  GLOBAL_STOCKS,
  DEFAULT_PORTFOLIO_STATE,
  filterGlobalStocks,
  executeStockOrder,
  withdrawFundsFromPortfolio,
  parseFlexibleAmount,
  calculateSwapQuote,
  executeWalletSwap,
  calculatePortfolioSummary,
  calculateWalletBalances,
  getAllRecipientWallets,
  syncTransferToExternalWalletApp,
  formatLocalCurrency,
} from "./global-stocks";

test("filterGlobalStocks filters by region, search query, and watchlist", () => {
  const all = filterGlobalStocks(GLOBAL_STOCKS, { region: "ALL", query: "" });
  assert.equal(all.length, GLOBAL_STOCKS.length);

  const indonesia = filterGlobalStocks(GLOBAL_STOCKS, {
    region: "INDONESIA",
    query: "",
  });
  assert.equal(indonesia.length, 3);
  assert.ok(indonesia.every((s) => s.region === "INDONESIA"));

  const searchAsml = filterGlobalStocks(GLOBAL_STOCKS, {
    region: "ALL",
    query: "belanda",
  });
  assert.equal(searchAsml.length, 1);
  assert.equal(searchAsml[0].ticker, "ASML");

  const watchlistFiltered = filterGlobalStocks(GLOBAL_STOCKS, {
    region: "ALL",
    query: "",
    watchlistOnly: true,
    watchlist: ["TSM", "7203.T"],
  });
  assert.equal(watchlistFiltered.length, 2);
});

test("executeStockOrder validates invalid shares and insufficient funds", () => {
  const nvda = GLOBAL_STOCKS.find((s) => s.ticker === "NVDA")!;

  const zeroOrder = executeStockOrder(DEFAULT_PORTFOLIO_STATE, {
    stock: nvda,
    side: "BUY",
    shares: 0,
  });
  assert.equal(zeroOrder.ok, false);

  const excessiveBuy = executeStockOrder(DEFAULT_PORTFOLIO_STATE, {
    stock: nvda,
    side: "BUY",
    shares: 10000,
  });
  assert.equal(excessiveBuy.ok, false);

  const excessiveSell = executeStockOrder(DEFAULT_PORTFOLIO_STATE, {
    stock: nvda,
    side: "SELL",
    shares: 500,
  });
  assert.equal(excessiveSell.ok, false);
});

test("executeStockOrder buys and sells shares accurately and updates portfolio summary", () => {
  const aapl = GLOBAL_STOCKS.find((s) => s.ticker === "AAPL")!;
  const buyRes = executeStockOrder(DEFAULT_PORTFOLIO_STATE, {
    stock: aapl,
    side: "BUY",
    shares: 5,
    nowFormatted: "2026-10-23 15:00",
  });

  assert.equal(buyRes.ok, true);
  const nextState = buyRes.nextState!;
  const aaplHolding = nextState.holdings.find((h) => h.ticker === "AAPL");
  assert.ok(aaplHolding);
  assert.equal(aaplHolding.shares, 5);
  assert.equal(nextState.orders[0].ticker, "AAPL");
  assert.equal(nextState.orders[0].side, "BUY");

  const sellRes = executeStockOrder(nextState, {
    stock: aapl,
    side: "SELL",
    shares: 2,
    nowFormatted: "2026-10-23 15:05",
  });
  assert.equal(sellRes.ok, true);
  const afterSell = sellRes.nextState!;
  assert.equal(afterSell.holdings.find((h) => h.ticker === "AAPL")?.shares, 3);

  const summary = calculatePortfolioSummary(afterSell);
  assert.ok(summary.totalEquityUsd > 0);
  assert.equal(summary.regionAllocation.length, 4);
});

test("withdrawFundsFromPortfolio validates balance, converts crypto, and records withdrawal receipt", () => {
  const invalid = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, -100);
  assert.equal(invalid.ok, false);

  const tooMuch = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, 999999);
  assert.equal(tooMuch.ok, false);

  const valid = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, 2600, {
    asset: "ETH",
    network: "Ethereum",
    destinationAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    nowFormatted: "2026-10-23 16:25",
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.nextState?.buyingPowerUsd, 22400);
  assert.equal(valid.withdrawal?.cryptoAmount, 1);
  assert.equal(valid.withdrawal?.asset, "ETH");
  assert.equal(valid.withdrawal?.status, "BERHASIL");
  assert.equal(valid.nextState?.withdrawals?.length, 1);
});

test("formatLocalCurrency formats IDR, JPY, EUR, and USD appropriately", () => {
  assert.ok(formatLocalCurrency(10650, "IDR").startsWith("Rp "));
  assert.equal(formatLocalCurrency(2685, "JPY"), "¥2,685");
  assert.equal(formatLocalCurrency(672.4, "EUR"), "€672.40");
  assert.equal(formatLocalCurrency(138.6, "USD"), "$138.60");
});

test("calculateWalletBalances credits USDT, USDC, ETH, and TON into the connected wallet", () => {
  const initialWallet = calculateWalletBalances(DEFAULT_PORTFOLIO_STATE, {
    isTon: false,
    baseNativeBalance: 0,
  });
  assert.equal(initialWallet.totalTransferredUsd, 0);
  assert.equal(initialWallet.USDT, 0);

  const step1 = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, 1000, {
    asset: "USDT",
    network: "Ethereum",
    destinationAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  });
  assert.equal(step1.ok, true);

  const step2 = withdrawFundsFromPortfolio(step1.nextState!, 2600, {
    asset: "ETH",
    network: "Ethereum",
    destinationAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  });
  assert.equal(step2.ok, true);

  const updatedWallet = calculateWalletBalances(step2.nextState!, {
    isTon: false,
    baseNativeBalance: 0,
  });
  assert.equal(updatedWallet.USDT, 1000);
  assert.equal(updatedWallet.ETH, 1);
  assert.equal(updatedWallet.totalTransferredUsd, 3600);
  assert.equal(updatedWallet.totalWalletUsd, 3600);
  assert.equal(updatedWallet.primaryDisplayValue, "$3,600.00");
  assert.ok(updatedWallet.secondaryDisplayValue.includes("1,000 USDT"));
  assert.ok(updatedWallet.secondaryDisplayValue.includes("1.0000 ETH"));
});

test("sending to another wallet credits that specific wallet and supports wallet-to-wallet transfers", () => {
  const walletA = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const walletB = "0x8Ba1f109551bD432803012645Ac136ddd64DBA72";

  // 1. Withdraw $2,000 USDT from portfolio to Wallet A
  const tx1 = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, 2000, {
    asset: "USDT",
    destinationAddress: walletA,
    sourceType: "PORTFOLIO",
  });
  assert.equal(tx1.ok, true);

  // 2. Withdraw $1,500 USDC from portfolio directly to another wallet (Wallet B)
  const tx2 = withdrawFundsFromPortfolio(tx1.nextState!, 1500, {
    asset: "USDC",
    destinationAddress: walletB,
    sourceType: "PORTFOLIO",
  });
  assert.equal(tx2.ok, true);

  const balA1 = calculateWalletBalances(tx2.nextState!, { walletAddress: walletA });
  const balB1 = calculateWalletBalances(tx2.nextState!, { walletAddress: walletB });
  assert.equal(balA1.totalWalletUsd, 2000);
  assert.equal(balA1.USDT, 2000);
  assert.equal(balB1.totalWalletUsd, 1500);
  assert.equal(balB1.USDC, 1500);

  // 3. Transfer $500 USDT from Wallet A to Wallet B (wallet-to-wallet transfer)
  const tx3 = withdrawFundsFromPortfolio(tx2.nextState!, 500, {
    asset: "USDT",
    sourceType: "WALLET",
    sourceAddress: walletA,
    destinationAddress: walletB,
  });
  assert.equal(tx3.ok, true);

  const balA2 = calculateWalletBalances(tx3.nextState!, { walletAddress: walletA });
  const balB2 = calculateWalletBalances(tx3.nextState!, { walletAddress: walletB });
  assert.equal(balA2.totalWalletUsd, 1500);
  assert.equal(balA2.USDT, 1500);
  assert.equal(balB2.totalWalletUsd, 2000);
  assert.equal(balB2.USDC, 1500);
  assert.equal(balB2.USDT, 500);

  const allWallets = getAllRecipientWallets(tx3.nextState!, walletA);
  assert.equal(allWallets.length, 2);
});

test("executeWalletSwap swaps existing wallet tokens and auto-funds from portfolio when wallet is empty", () => {
  const walletA = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

  const quote = calculateSwapQuote("USDT", "ETH", 2600);
  assert.equal(quote.usdValue, 2600);
  assert.equal(quote.toAmount, 1);

  // 1. Auto-funded swap when wallet has $0 crypto balance (uses buyingPowerUsd)
  const swap1 = executeWalletSwap(DEFAULT_PORTFOLIO_STATE, {
    walletAddress: walletA,
    fromAsset: "USDT",
    toAsset: "ETH",
    fromAmount: 2600,
    network: "Ethereum",
  });
  assert.equal(swap1.ok, true);
  assert.equal(swap1.fundedFromPortfolio, true);
  assert.equal(swap1.nextState?.buyingPowerUsd, 22400);

  const balAfterSwap1 = calculateWalletBalances(swap1.nextState!, {
    walletAddress: walletA,
  });
  assert.equal(balAfterSwap1.ETH, 1);
  assert.equal(balAfterSwap1.totalWalletUsd, 2600);

  // 2. In-wallet swap from existing 0.5 ETH ($1,300) to TON ($5.20 -> 250 TON)
  const swap2 = executeWalletSwap(swap1.nextState!, {
    walletAddress: walletA,
    fromAsset: "ETH",
    toAsset: "TON",
    fromAmount: 0.5,
    network: "Ethereum",
  });
  assert.equal(swap2.ok, true);
  assert.equal(swap2.fundedFromPortfolio, false);
  assert.equal(swap2.nextState?.buyingPowerUsd, 22400);

  const balAfterSwap2 = calculateWalletBalances(swap2.nextState!, {
    walletAddress: walletA,
  });
  assert.equal(balAfterSwap2.ETH, 0.5);
  assert.equal(balAfterSwap2.TON, 250);
  assert.equal(balAfterSwap2.totalWalletUsd, 2600);
});

test("parseFlexibleAmount and autoCoverShortfall handle Indonesian thousand separators and wallet self-withdrawal", () => {
  assert.equal(parseFlexibleAmount("1.000"), 1000);
  assert.equal(parseFlexibleAmount("25.000"), 25000);
  assert.equal(parseFlexibleAmount("1,500.50"), 1500.5);
  assert.equal(parseFlexibleAmount(""), 1000);

  const walletA = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  // Even if sourceType is WALLET and destinationAddress === sourceAddress, autoCoverShortfall succeeds
  const res = withdrawFundsFromPortfolio(
    { ...DEFAULT_PORTFOLIO_STATE, buyingPowerUsd: 0 },
    parseFlexibleAmount("2.500"),
    {
      asset: "USDT",
      sourceType: "WALLET",
      sourceAddress: walletA,
      destinationAddress: walletA,
      autoCoverShortfall: true,
    }
  );
  assert.equal(res.ok, true);
  assert.equal(res.withdrawal?.amountUsd, 2500);
  assert.equal(res.withdrawal?.cryptoAmount, 2500);

  // Syncing to another external wallet app (e.g. Telegram TON Wallet or Coinbase Wallet)
  // ensures the sent balance is available in that external wallet app too
  const tonWallet = "UQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG";
  const syncedState = syncTransferToExternalWalletApp(res.nextState!, tonWallet);
  const tonBal = calculateWalletBalances(syncedState, { walletAddress: tonWallet });
  assert.equal(tonBal.totalWalletUsd, 2500);
  assert.ok(tonBal.TON > 0);
});





