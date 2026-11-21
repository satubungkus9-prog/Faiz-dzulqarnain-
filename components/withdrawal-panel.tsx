import { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownUp,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Copy,
  Check,
  ArrowRightLeft,
} from "lucide-react";
import {
  ASSET_RATES_USD,
  PRESET_EXTERNAL_WALLETS,
  calculateCryptoWithdrawalAmount,
  calculateSwapQuote,
  calculateWalletBalances,
  getAllRecipientWallets,
  parseFlexibleAmount,
  formatUsd,
  type PortfolioState,
  type TransferSourceType,
  type WalletActionMode,
  type WalletBalanceSummary,
  type WithdrawalAsset,
  type WithdrawalRecord,
} from "@/lib/global-stocks";

const ASSET_OPTIONS: {
  id: WithdrawalAsset;
  label: string;
  networkLabel: string;
}[] = [
  { id: "USDT", label: "USDT (Tether)", networkLabel: "ERC-20 / TON / Polygon" },
  { id: "USDC", label: "USDC (USD Coin)", networkLabel: "ERC-20 / Base / Arbitrum" },
  { id: "ETH", label: "ETH (Ethereum)", networkLabel: "Ethereum Mainnet" },
  { id: "TON", label: "TON (Toncoin)", networkLabel: "TON Mainnet" },
];

const QUICK_USD_AMOUNTS = [100, 500, 1000, 5000, 10000];

function shortenAddr(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

export function WithdrawalPanel({
  portfolio,
  availableBalanceUsd,
  walletAddress,
  network,
  withdrawals,
  walletBalances,
  actionMode: controlledActionMode,
  onChangeActionMode,
  onSubmitWithdrawal,
  onSubmitSwap,
  onSwitchActiveWallet,
}: {
  portfolio: PortfolioState;
  availableBalanceUsd: number;
  walletAddress: string;
  network: string;
  withdrawals: WithdrawalRecord[];
  walletBalances?: WalletBalanceSummary;
  actionMode?: WalletActionMode;
  onChangeActionMode?: (mode: WalletActionMode) => void;
  onSubmitWithdrawal: (params: {
    amountUsd: number;
    asset: WithdrawalAsset;
    destinationAddress: string;
    sourceType?: TransferSourceType;
    sourceAddress?: string;
  }) => { ok: boolean; error?: string; withdrawal?: WithdrawalRecord };
  onSubmitSwap?: (params: {
    fromAsset: WithdrawalAsset;
    toAsset: WithdrawalAsset;
    fromAmount: number;
  }) => {
    ok: boolean;
    error?: string;
    withdrawal?: WithdrawalRecord;
    fundedFromPortfolio?: boolean;
  };
  onSwitchActiveWallet?: (address: string) => void;
}) {
  const [internalMode, setInternalMode] = useState<WalletActionMode>(
    controlledActionMode ?? "WITHDRAW"
  );
  const currentMode = controlledActionMode ?? internalMode;

  // State for Tarik & Kirim
  const [sourceType, setSourceType] = useState<TransferSourceType>("PORTFOLIO");
  const [amountInput, setAmountInput] = useState<string>("1000");
  const [selectedAsset, setSelectedAsset] = useState<WithdrawalAsset>(() =>
    network.toLowerCase().includes("ton") ? "TON" : "USDT"
  );
  const [destinationAddress, setDestinationAddress] =
    useState<string>(walletAddress);

  // State for Suweb (Swap)
  const [swapFromAsset, setSwapFromAsset] = useState<WithdrawalAsset>("USDT");
  const [swapToAsset, setSwapToAsset] = useState<WithdrawalAsset>(() =>
    network.toLowerCase().includes("ton") ? "TON" : "ETH"
  );
  const [swapFromAmountInput, setSwapFromAmountInput] = useState<string>("1300");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    receipt?: WithdrawalRecord;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [walletSyncedNotice, setWalletSyncedNotice] = useState<string | null>(
    null
  );

  function setMode(nextMode: WalletActionMode) {
    setInternalMode(nextMode);
    if (onChangeActionMode) onChangeActionMode(nextMode);
    setFeedback(null);
    setWalletSyncedNotice(null);
    if (nextMode === "WITHDRAW") {
      setSourceType("PORTFOLIO");
      setDestinationAddress(walletAddress);
    } else if (nextMode === "SEND") {
      if (
        !destinationAddress.trim() ||
        destinationAddress.toLowerCase() === walletAddress.toLowerCase()
      ) {
        setDestinationAddress(PRESET_EXTERNAL_WALLETS[0].address);
      }
    }
  }

  useEffect(() => {
    if (controlledActionMode) {
      setInternalMode(controlledActionMode);
      if (controlledActionMode === "WITHDRAW") {
        setSourceType("PORTFOLIO");
        setDestinationAddress(walletAddress);
      } else if (
        controlledActionMode === "SEND" &&
        (!destinationAddress.trim() ||
          destinationAddress.toLowerCase() === walletAddress.toLowerCase())
      ) {
        setDestinationAddress(PRESET_EXTERNAL_WALLETS[0].address);
      }
    }
  }, [controlledActionMode, walletAddress]);

  const senderWalletSummary = useMemo(
    () =>
      calculateWalletBalances(portfolio, {
        walletAddress,
      }),
    [portfolio, walletAddress]
  );

  const destinationWalletSummary = useMemo(
    () =>
      calculateWalletBalances(portfolio, {
        walletAddress:
          currentMode === "SWAP"
            ? walletAddress
            : destinationAddress.trim() || walletAddress,
      }),
    [portfolio, currentMode, destinationAddress, walletAddress]
  );

  const allRecipientWallets = useMemo(
    () =>
      getAllRecipientWallets(portfolio, walletAddress, {
        includeAllPresets: true,
      }),
    [portfolio, walletAddress]
  );

  const rawMaxSourceUsd =
    sourceType === "PORTFOLIO"
      ? availableBalanceUsd
      : senderWalletSummary.totalWalletUsd;
  const maxSourceUsd =
    rawMaxSourceUsd > 0 ? rawMaxSourceUsd : Math.max(availableBalanceUsd, 25000);

  const numericAmount = parseFlexibleAmount(amountInput, 1000);
  const estimatedCrypto = calculateCryptoWithdrawalAmount(
    numericAmount,
    selectedAsset
  );

  // Swap quote calculation
  const numericSwapFrom = parseFlexibleAmount(swapFromAmountInput, 1000);
  const swapQuote = useMemo(
    () => calculateSwapQuote(swapFromAsset, swapToAsset, numericSwapFrom),
    [swapFromAsset, swapToAsset, numericSwapFrom]
  );

  const walletBalanceOfSwapFrom = senderWalletSummary[swapFromAsset];
  const maxSwapFromToken =
    walletBalanceOfSwapFrom > 0
      ? walletBalanceOfSwapFrom
      : calculateCryptoWithdrawalAmount(
          Math.max(availableBalanceUsd, 25000),
          swapFromAsset
        );

  function handlePercentageSelect(pct: number) {
    const calculated = Number(((maxSourceUsd * pct) / 100).toFixed(2));
    setAmountInput(String(calculated > 0 ? calculated : 1000));
    setFeedback(null);
  }

  function handleQuickAmountSelect(usd: number) {
    setAmountInput(String(usd));
    setFeedback(null);
  }

  function handleSwapPercentageSelect(pct: number) {
    const decimals = swapFromAsset === "ETH" ? 4 : 2;
    const calculated = Number(((maxSwapFromToken * pct) / 100).toFixed(decimals));
    setSwapFromAmountInput(String(calculated > 0 ? calculated : 100));
    setFeedback(null);
  }

  function handleFlipSwapAssets() {
    const prevFrom = swapFromAsset;
    const prevTo = swapToAsset;
    setSwapFromAsset(prevTo);
    setSwapToAsset(prevFrom);
    if (swapQuote.toAmount > 0) {
      setSwapFromAmountInput(String(swapQuote.toAmount));
    }
    setFeedback(null);
  }

  function handleSelectPresetWallet(addr: string) {
    setDestinationAddress(addr);
    if (
      addr.toLowerCase().startsWith("uq") ||
      addr.toLowerCase().startsWith("eq")
    ) {
      setSelectedAsset("TON");
    }
    setFeedback(null);
  }

  function handleSubmitSwap(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setWalletSyncedNotice(null);

    if (!onSubmitSwap) return;

    const parsedFrom = parseFlexibleAmount(swapFromAmountInput, 1000);
    const res = onSubmitSwap({
      fromAsset: swapFromAsset,
      toAsset: swapToAsset,
      fromAmount: parsedFrom,
    });

    if (!res.ok || !res.withdrawal) {
      setFeedback({
        type: "error",
        message: res.error ?? "Gagal memproses Suweb (Swap) aset kripto.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: `Suweb Berhasil! ${res.withdrawal.fromCryptoAmount} ${
        res.withdrawal.fromAsset
      } (${formatUsd(res.withdrawal.amountUsd)}) telah ditukar menjadi +${
        res.withdrawal.cryptoAmount
      } ${res.withdrawal.asset} dan langsung masuk ke dompet Anda (${shortenAddr(
        walletAddress
      )}).`,
      receipt: res.withdrawal,
    });
  }

  function executeWithdrawOrSend(overrideUsd?: number) {
    setFeedback(null);
    setWalletSyncedNotice(null);

    const cleanDest = destinationAddress.trim() || walletAddress;
    const targetAddr = currentMode === "WITHDRAW" ? cleanDest : cleanDest;
    const finalUsd =
      typeof overrideUsd === "number" && overrideUsd > 0
        ? overrideUsd
        : parseFlexibleAmount(amountInput, 1000);

    const res = onSubmitWithdrawal({
      amountUsd: finalUsd,
      asset: selectedAsset,
      destinationAddress: targetAddr,
      sourceType: currentMode === "WITHDRAW" ? "PORTFOLIO" : sourceType,
      sourceAddress: walletAddress,
    });

    if (!res.ok || !res.withdrawal) {
      setFeedback({
        type: "error",
        message: res.error ?? "Gagal mengirim tarikan/transfer saldo.",
      });
      return;
    }

    const isOtherWallet =
      res.withdrawal.destinationAddress.toLowerCase() !==
      walletAddress.toLowerCase();

    const matchedApp = PRESET_EXTERNAL_WALLETS.find(
      (p) =>
        p.address.toLowerCase() ===
        res.withdrawal!.destinationAddress.toLowerCase()
    );
    const appLabel = matchedApp?.shortAppLabel ?? "Aplikasi Wallet Tujuan";

    setFeedback({
      type: "success",
      message: isOtherWallet
        ? `Kirim Saldo Berhasil! Sebesar ${formatUsd(
            res.withdrawal.amountUsd
          )} (+${res.withdrawal.cryptoAmount} ${
            res.withdrawal.asset
          }) telah masuk & tersinkronisasi ke ${appLabel} (${shortenAddr(
            res.withdrawal.destinationAddress
          )}).`
        : `Tarik Saldo Berhasil! Sebesar ${formatUsd(
            res.withdrawal.amountUsd
          )} (+${res.withdrawal.cryptoAmount} ${
            res.withdrawal.asset
          }) telah masuk ke Dompet Anda (${shortenAddr(walletAddress)}).`,
      receipt: res.withdrawal,
    });

    // Automatically sync to wallet extension and switch active view to destination wallet app
    void handleSyncToWalletExtension(res.withdrawal, { scrollToTop: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeWithdrawOrSend();
  }

  async function handleSyncToWalletExtension(
    receipt: WithdrawalRecord,
    options?: { scrollToTop?: boolean }
  ) {
    try {
      const ethProvider =
        typeof window !== "undefined" ? (window as any).ethereum : undefined;
      if (ethProvider?.request) {
        if (receipt.destinationAddress.startsWith("0x")) {
          await ethProvider
            .request({
              method: "eth_sendTransaction",
              params: [
                {
                  from: walletAddress.startsWith("0x")
                    ? walletAddress
                    : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                  to: receipt.destinationAddress,
                  value: "0x0",
                },
              ],
            })
            .catch(() => null);
        }
        if (receipt.asset === "USDT" || receipt.asset === "USDC") {
          await ethProvider
            .request({
              method: "wallet_watchAsset",
              params: {
                type: "ERC20",
                options: {
                  address:
                    receipt.asset === "USDT"
                      ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
                      : "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                  symbol: receipt.asset,
                  decimals: 6,
                },
              },
            })
            .catch(() => null);
        }
      }
    } catch {
      // ignore extension errors
    }
    if (onSwitchActiveWallet) {
      onSwitchActiveWallet(receipt.destinationAddress);
    }
    setWalletSyncedNotice(
      `Saldo +${receipt.cryptoAmount} ${receipt.asset} (${formatUsd(
        receipt.amountUsd
      )}) kini aktif & tampil di aplikasi wallet (${shortenAddr(
        receipt.destinationAddress
      )}).`
    );
    if (options?.scrollToTop !== false) {
      const el = document.getElementById("connected-wallet-card");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function handleCopyHash(hash: string) {
    try {
      navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  const isTargetDifferentFromActive =
    destinationAddress.trim().length > 0 &&
    destinationAddress.trim().toLowerCase() !== walletAddress.toLowerCase();

  return (
    <div id="wallet-action-hub" className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        {/* Header & Ringkasan Saldo */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-foreground" />
              <span>Pusat Transaksi Dompet Kripto &amp; Investasi</span>
              <span aria-hidden="true">·</span>
              <span>Jaringan Aktif: {network}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Suweb (Swap) · Tarik Saldo · Kirim ke Wallet
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Saldo Siap Tarik (USD)</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {formatUsd(availableBalanceUsd)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-left sm:text-right">
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Saldo di Wallet ({shortenAddr(destinationAddress || walletAddress)})
              </p>
              <p
                data-testid="withdrawal-panel-wallet-total"
                className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
              >
                {formatUsd(destinationWalletSummary.totalWalletUsd)}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Mode Utama: SUWEB (SWAP) | TARIK SALDO | KIRIM SALDO */}
        <div
          data-testid="action-mode-tabs"
          className="mt-5 grid grid-cols-1 gap-2 rounded-xl bg-muted p-1.5 sm:grid-cols-3"
          role="tablist"
          aria-label="Mode Transaksi Dompet"
        >
          <button
            type="button"
            role="tab"
            data-testid="mode-tab-swap"
            aria-selected={currentMode === "SWAP"}
            onClick={() => setMode("SWAP")}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              currentMode === "SWAP"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>1. Suweb (Swap Kripto)</span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="mode-tab-withdraw"
            aria-selected={currentMode === "WITHDRAW"}
            onClick={() => setMode("WITHDRAW")}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              currentMode === "WITHDRAW"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="h-4 w-4 text-primary" />
            <span>2. Tarik Saldo ke Dompet</span>
          </button>

          <button
            type="button"
            role="tab"
            data-testid="mode-tab-send"
            aria-selected={currentMode === "SEND"}
            onClick={() => setMode("SEND")}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
              currentMode === "SEND"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>3. Kirim ke Wallet Lain</span>
          </button>
        </div>

        {/* =========================================================
            MODE 1: SUWEB (SWAP) ASET KRIPTO INSTAN
           ========================================================= */}
        {currentMode === "SWAP" && (
          <form
            noValidate
            data-testid="swap-form-panel"
            onSubmit={handleSubmitSwap}
            className="mt-5 space-y-5"
          >
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="swap-from-amount"
                  className="text-xs font-semibold text-foreground"
                >
                  Dari Aset (Anda Tukar / Bayar)
                </label>
                <span className="font-mono text-xs text-muted-foreground">
                  Saldo {swapFromAsset} di Dompet:{" "}
                  <strong className="text-foreground">
                    {walletBalanceOfSwapFrom} {swapFromAsset}
                  </strong>
                  {walletBalanceOfSwapFrom === 0 && (
                    <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                      (Didukung otomatis Saldo Investasi{" "}
                      {formatUsd(availableBalanceUsd)})
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <div className="flex items-center rounded-lg border border-border bg-background px-3 py-2.5 focus-within:border-primary">
                    <input
                      id="swap-from-amount"
                      data-testid="swap-from-amount-input"
                      type="text"
                      inputMode="decimal"
                      value={swapFromAmountInput}
                      onChange={(e) => setSwapFromAmountInput(e.target.value)}
                      className="w-full bg-transparent font-mono text-lg font-semibold tabular-nums text-foreground focus:outline-none"
                      placeholder="1000"
                    />
                    <span className="ml-2 font-mono text-xs font-semibold text-muted-foreground">
                      {swapFromAsset}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Setara Nilai USD: {formatUsd(swapQuote.usdValue)}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:col-span-5">
                  {ASSET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`swap-from-asset-${opt.id}`}
                      onClick={() => {
                        setSwapFromAsset(opt.id);
                        if (opt.id === swapToAsset) {
                          const fallback = ASSET_OPTIONS.find(
                            (a) => a.id !== opt.id
                          );
                          if (fallback) setSwapToAsset(fallback.id);
                        }
                        setFeedback(null);
                      }}
                      className={`rounded-lg border px-2 py-2 text-center font-mono text-xs font-semibold transition-colors ${
                        swapFromAsset === opt.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSwapPercentageSelect(pct)}
                    className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {pct === 100 ? "Maks (100%)" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Balik Aset Suweb */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                data-testid="swap-flip-btn"
                onClick={handleFlipSwapAssets}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-accent"
              >
                <ArrowDownUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Tukar Posisi ({swapFromAsset} ⇄ {swapToAsset})
              </button>
            </div>

            {/* Ke Aset Penerima */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Ke Aset Penerima (Langsung Masuk ke Dompet {shortenAddr(walletAddress)})
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Saldo {swapToAsset} Saat Ini:{" "}
                  <strong className="text-foreground">
                    {senderWalletSummary[swapToAsset]} {swapToAsset}
                  </strong>
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-background px-3.5 py-2.5">
                    <span
                      data-testid="swap-output-estimate"
                      className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
                    >
                      +{swapQuote.toAmount}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {swapToAsset}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Kurs Instan: 1 {swapFromAsset} = {swapQuote.rate} {swapToAsset}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:col-span-5">
                  {ASSET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`swap-to-asset-${opt.id}`}
                      onClick={() => {
                        setSwapToAsset(opt.id);
                        if (opt.id === swapFromAsset) {
                          const fallback = ASSET_OPTIONS.find(
                            (a) => a.id !== opt.id
                          );
                          if (fallback) setSwapFromAsset(fallback.id);
                        }
                        setFeedback(null);
                      }}
                      className={`rounded-lg border px-2 py-2 text-center font-mono text-xs font-semibold transition-colors ${
                        swapToAsset === opt.id
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ringkasan Suweb */}
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nilai Transaksi Suweb</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatUsd(swapQuote.usdValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Suweb &amp; Slippage</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  $0.00 (0% Slippage · Instan)
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span className="text-foreground">
                  Hasil Suweb Masuk ke Dompet ({shortenAddr(walletAddress)})
                </span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{swapQuote.toAmount} {swapToAsset}
                </span>
              </div>
            </div>

            {feedback && (
              <div
                role="status"
                className={`rounded-xl border p-4 text-xs ${
                  feedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold">{feedback.message}</p>
                    {feedback.receipt && (
                      <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                        Total Saldo di Dompet Sekarang:{" "}
                        {formatUsd(senderWalletSummary.totalWalletUsd)} (
                        {senderWalletSummary.secondaryDisplayValue})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              data-testid="swap-submit-btn"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ArrowDownUp className="h-4 w-4" />
              Konfirmasi Suweb Sekarang ({swapQuote.fromAmount} {swapFromAsset} → +
              {swapQuote.toAmount} {swapToAsset})
            </button>
          </form>
        )}

        {/* =========================================================
            MODE 2 & 3: TARIK SALDO & KIRIM KE WALLET LAIN
           ========================================================= */}
        {currentMode !== "SWAP" && (
          <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Sumber Dana Pengiriman */}
            <div>
              <label className="block text-xs font-medium text-foreground">
                {currentMode === "WITHDRAW"
                  ? "Sumber Penarikan Dana"
                  : "Sumber Dana Pengiriman"}
              </label>
              <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSourceType("PORTFOLIO");
                    setFeedback(null);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    sourceType === "PORTFOLIO"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Dari Saldo Akun Investasi
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tarik ke dompet sendiri atau kirim ke wallet lain
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatUsd(availableBalanceUsd)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType("WALLET");
                    if (
                      currentMode === "SEND" &&
                      destinationAddress.toLowerCase() ===
                        walletAddress.toLowerCase()
                    ) {
                      setDestinationAddress(PRESET_EXTERNAL_WALLETS[0].address);
                    }
                    setFeedback(null);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    sourceType === "WALLET"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Dari Saldo Dompet Aktif ({shortenAddr(walletAddress)})
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Gunakan saldo dompet (otomatis didukung Saldo Investasi)
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatUsd(senderWalletSummary.totalWalletUsd)}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Nominal Penarikan / Kirim USD */}
              <div>
                <label
                  htmlFor="withdraw-amount-usd"
                  className="block text-xs font-medium text-foreground"
                >
                  {currentMode === "WITHDRAW"
                    ? "Nominal Tarik Saldo (USD)"
                    : "Nominal Kirim ke Wallet (USD)"}
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-border bg-background px-3 py-2.5 focus-within:border-primary">
                  <span className="mr-2 font-mono text-sm text-muted-foreground">$</span>
                  <input
                    id="withdraw-amount-usd"
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full bg-transparent font-mono text-base font-semibold tabular-nums text-foreground focus:outline-none"
                    placeholder="1000"
                  />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">USD</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {QUICK_USD_AMOUNTS.map((usd) => (
                    <button
                      key={usd}
                      type="button"
                      data-testid={`quick-usd-${usd}`}
                      onClick={() => handleQuickAmountSelect(usd)}
                      className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      ${usd.toLocaleString("en-US")}
                    </button>
                  ))}
                  {[25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentageSelect(pct)}
                      className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      {pct === 100 ? "Tarik Semua (100%)" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilihan Aset Kripto Tujuan */}
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Mata Uang Kripto Penerima
                </label>
                <div
                  className="mt-1.5 grid grid-cols-2 gap-2"
                  role="group"
                  aria-label="Pilih aset kripto penarikan"
                >
                  {ASSET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedAsset(opt.id)}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                        selectedAsset === opt.id
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {opt.id}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        1 {opt.id} = ${ASSET_RATES_USD[opt.id].toLocaleString("en-US")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alamat Dompet Tujuan + Pilihan Cepat Wallet Lain */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="withdraw-destination-address"
                  className="block text-xs font-medium text-foreground"
                >
                  {currentMode === "WITHDRAW"
                    ? "Alamat Dompet Penerima Tarikan (Dompet Anda / Bebas Diubah)"
                    : "Alamat Dompet Tujuan (Pilih Wallet Lain atau Masukkan Alamat)"}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetWallet(walletAddress)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      !isTargetDifferentFromActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Dompet Saya ({shortenAddr(walletAddress)})
                  </button>
                  {PRESET_EXTERNAL_WALLETS.map((preset, idx) => {
                    const isSelected =
                      destinationAddress.trim().toLowerCase() ===
                      preset.address.toLowerCase();
                    return (
                      <button
                        key={preset.address}
                        type="button"
                        data-testid={`preset-wallet-${idx + 1}`}
                        onClick={() => handleSelectPresetWallet(preset.address)}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {preset.shortAppLabel} ({preset.address.slice(0, 6)}...)
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                id="withdraw-destination-address"
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                placeholder="Masukkan alamat dompet tujuan (0x... atau UQ.../EQ...)"
              />

              {/* Kartu Saldo Live di Dompet Tujuan (Termasuk Wallet Lain) */}
              <div
                data-testid="destination-wallet-balance-card"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-foreground">
                        {isTargetDifferentFromActive
                          ? `Saldo Masuk di Wallet Tujuan (${shortenAddr(destinationAddress)})`
                          : `Saldo Masuk di Dompet Anda (${shortenAddr(walletAddress)})`}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground break-all">
                      {destinationAddress || walletAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-muted-foreground">Total Saldo di Wallet Ini</p>
                      <p
                        data-testid="destination-wallet-total-usd"
                        className="font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
                      >
                        {formatUsd(destinationWalletSummary.totalWalletUsd)}
                      </p>
                    </div>
                    {isTargetDifferentFromActive && onSwitchActiveWallet && (
                      <button
                        type="button"
                        data-testid="switch-to-destination-wallet-btn"
                        onClick={() => onSwitchActiveWallet(destinationAddress.trim())}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 shrink-0"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Buka Wallet Ini
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">USDT</p>
                    <p
                      data-testid="destination-wallet-usdt"
                      className="font-mono text-xs font-semibold tabular-nums text-foreground"
                    >
                      {destinationWalletSummary.USDT.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDT
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">USDC</p>
                    <p
                      data-testid="destination-wallet-usdc"
                      className="font-mono text-xs font-semibold tabular-nums text-foreground"
                    >
                      {destinationWalletSummary.USDC.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">ETH</p>
                    <p
                      data-testid="destination-wallet-eth"
                      className="font-mono text-xs font-semibold tabular-nums text-foreground"
                    >
                      {destinationWalletSummary.ETH.toFixed(4)} ETH
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">TON</p>
                    <p
                      data-testid="destination-wallet-ton"
                      className="font-mono text-xs font-semibold tabular-nums text-foreground"
                    >
                      {destinationWalletSummary.TON.toFixed(4)} TON
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan Konversi & Estimasi Diterima */}
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {currentMode === "WITHDRAW" ? "Nominal Ditarik" : "Nominal Dikirim"}
                </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatUsd(numericAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Jaringan (Gas Fee)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  $0.00 (Ditanggung Platform)
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span className="text-foreground">
                  Estimasi Saldo Masuk ke Wallet (
                  {shortenAddr(destinationAddress || walletAddress)})
                </span>
                <span
                  data-testid="withdraw-crypto-estimate"
                  className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
                >
                  +{estimatedCrypto} {selectedAsset}
                </span>
              </div>
            </div>

            {feedback && (
              <div
                role="status"
                data-testid="withdraw-feedback-banner"
                className={`rounded-xl border p-4 text-xs ${
                  feedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-semibold">{feedback.message}</p>
                    {feedback.receipt && (
                      <div className="mt-2 space-y-1.5 border-t border-emerald-500/20 pt-2 font-mono text-[11px]">
                        <p>Tujuan Dompet: {feedback.receipt.destinationAddress}</p>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                          Total Saldo di Wallet Tujuan Sekarang:{" "}
                          {formatUsd(destinationWalletSummary.totalWalletUsd)} (
                          {destinationWalletSummary.secondaryDisplayValue})
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="truncate">
                            TX Hash: {feedback.receipt.txHash}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyHash(feedback.receipt!.txHash)}
                              className="inline-flex items-center gap-1 rounded border border-emerald-500/30 px-2 py-1 text-[10px] font-medium hover:bg-emerald-500/20 shrink-0"
                            >
                              {copiedHash === feedback.receipt.txHash ? (
                                <>
                                  <Check className="h-3 w-3" /> Tersalin
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Salin TX
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSyncToWalletExtension(feedback.receipt!)
                              }
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 font-sans text-[10px] font-semibold text-white hover:bg-emerald-700 shrink-0"
                            >
                              Buka &amp; Lihat Saldo di Wallet Ini
                            </button>
                          </div>
                        </div>
                        {walletSyncedNotice && (
                          <p className="pt-1 font-sans text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            {walletSyncedNotice}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              data-testid="withdraw-submit-btn"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ArrowUpRight className="h-4 w-4" />
              {currentMode === "WITHDRAW"
                ? `Tarik Saldo Sekarang (+${estimatedCrypto} ${selectedAsset})`
                : `Kirim Saldo ke Wallet Sekarang (+${estimatedCrypto} ${selectedAsset})`}
            </button>
          </form>
        )}
      </div>

      {/* Daftar Saldo Semua Wallet Penerima (Dompet Utama & Wallet Lain) */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Daftar Saldo di Semua Wallet ({allRecipientWallets.length} Dompet)
            </h3>
            <p className="text-xs text-muted-foreground">
              Setiap hasil Suweb, Tarik Saldo, maupun Kirim ke Wallet Lain tercatat otomatis dan dapat dibuka langsung.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {allRecipientWallets.map((entry) => (
            <div
              key={entry.address}
              className={`rounded-xl border p-4 transition-colors ${
                entry.isCurrentWallet
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {entry.label}
                    </span>
                    {entry.isCurrentWallet && (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Sedang Aktif
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {entry.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatUsd(entry.summary.totalWalletUsd)}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {entry.summary.secondaryDisplayValue}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
                <span className="text-muted-foreground">
                  {entry.summary.transferCount} transaksi tercatat
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("SEND");
                      setDestinationAddress(entry.address);
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Kirim ke Sini
                  </button>
                  {!entry.isCurrentWallet && onSwitchActiveWallet && (
                    <button
                      type="button"
                      onClick={() => onSwitchActiveWallet(entry.address)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Buka Wallet Ini
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabel Riwayat Suweb, Tarik & Kirim Saldo */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">
            Riwayat Suweb (Swap), Tarik &amp; Kirim Saldo ({withdrawals.length})
          </h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground">
              Belum ada riwayat transaksi. Gunakan tab Suweb, Tarik Saldo, atau Kirim ke Wallet di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-3 pr-2 pl-5 font-medium">Waktu &amp; Jenis</th>
                  <th className="px-3 py-3 font-medium">Dompet Tujuan</th>
                  <th className="px-3 py-3 text-right font-medium">Nilai (USD)</th>
                  <th className="px-3 py-3 text-right font-medium">Rincian Aset</th>
                  <th className="py-3 pr-5 pl-3 text-right font-medium">Aksi &amp; Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-muted/40">
                    <td className="py-3 pr-2 pl-5">
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {wd.timestamp}
                      </p>
                      <span
                        className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          wd.sourceType === "SWAP"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : wd.sourceType === "WALLET"
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                              : "bg-primary/10 text-foreground"
                        }`}
                      >
                        {wd.sourceType === "SWAP"
                          ? "SUWEB / SWAP"
                          : wd.sourceType === "WALLET"
                            ? "KIRIM WALLET"
                            : "TARIK SALDO"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-xs font-medium text-foreground">
                        {wd.destinationAddress.slice(0, 8)}...
                        {wd.destinationAddress.slice(-6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wd.sourceType === "SWAP"
                          ? `Tukar ${wd.fromCryptoAmount} ${wd.fromAsset} → ${wd.asset}`
                          : wd.sourceType === "WALLET"
                            ? `Dari ${shortenAddr(wd.sourceAddress ?? "")}`
                            : `Penarikan Investasi · ${wd.network}`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                      {formatUsd(wd.amountUsd)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {wd.sourceType === "SWAP"
                        ? `${wd.fromCryptoAmount} ${wd.fromAsset} → +${wd.cryptoAmount} ${wd.asset}`
                        : `+${wd.cryptoAmount} ${wd.asset}`}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right font-mono text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {wd.status}
                        </span>
                        {onSwitchActiveWallet && (
                          <button
                            type="button"
                            onClick={() => onSwitchActiveWallet(wd.destinationAddress)}
                            className="rounded border border-border bg-background px-2 py-0.5 font-sans text-[11px] font-medium text-foreground hover:bg-accent"
                          >
                            Cek Wallet
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
