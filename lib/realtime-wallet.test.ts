import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_CRYPTO_TICKERS,
  applyRealtimeMarketTick,
  parseHexToNumber,
  parseHexWeiToEther,
  calculateRealtimeWalletValuation,
} from "./realtime-wallet";
import {
  DEFAULT_PORTFOLIO_STATE,
  withdrawFundsFromPortfolio,
} from "./global-stocks";

test("parseHexToNumber and parseHexWeiToEther decode JSON-RPC hex values accurately", () => {
  assert.equal(parseHexToNumber("0x142b5f8"), 21149176);
  assert.equal(parseHexToNumber("invalid", 42), 42);
  // 1.5 ETH in wei = 0x14d1120d7b160000
  assert.equal(parseHexWeiToEther("0x14d1120d7b160000"), 1.5);
  assert.equal(parseHexWeiToEther("0x0"), 0);
});

test("applyRealtimeMarketTick updates volatile crypto prices while keeping stablecoins at $1.00", () => {
  const next = applyRealtimeMarketTick(INITIAL_CRYPTO_TICKERS, 1730000000000);
  assert.equal(next.USDT.priceUsd, 1.0);
  assert.equal(next.USDC.priceUsd, 1.0);
  assert.ok(next.BTC.priceUsd > 0);
  assert.ok(next.ETH.priceUsd > 0);
  assert.ok(next.TON.priceUsd > 0);
});

test("calculateRealtimeWalletValuation computes real-time USD values from wallet holdings and live prices", () => {
  const walletAddr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const res1 = withdrawFundsFromPortfolio(DEFAULT_PORTFOLIO_STATE, 1000, {
    asset: "USDT",
    destinationAddress: walletAddr,
  });
  assert.ok(res1.ok && res1.nextState);

  const valuation = calculateRealtimeWalletValuation(
    res1.nextState,
    walletAddr,
    INITIAL_CRYPTO_TICKERS,
    { isTon: false, onChainNativeBalance: 1.0 }
  );

  const usdtItem = valuation.tokenValuations.find((t) => t.symbol === "USDT");
  const ethItem = valuation.tokenValuations.find((t) => t.symbol === "ETH");
  assert.ok(usdtItem && ethItem);
  assert.equal(usdtItem.amount, 1000);
  assert.equal(usdtItem.totalValueUsd, 1000);
  assert.equal(ethItem.amount, 1.0);
  assert.ok(valuation.walletTotalRealtimeUsd > 4000);
});
