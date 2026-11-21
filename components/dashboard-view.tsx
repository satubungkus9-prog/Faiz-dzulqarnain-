"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect as useWagmiDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi"
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useDisconnect as useAppKitDisconnect,
  useWalletInfo,
} from "@reown/appkit/react"
import {
  Check,
  Copy,
  Layers,
  LogOut,
  Moon,
  PenTool,
  Sun,
  Wallet,
  WifiOff,
} from "lucide-react"
import { networks } from "@/lib/wagmi"
import { useAppTheme, useNetworkOnline } from "@/app/providers"
import {
  MetaMaskIcon,
  ReownIcon,
  TonIcon,
} from "@/components/wallet-icons"
import {
  TonConnectBridge,
  type TonBridgeState,
} from "@/components/ton-wallet-controls"
import {
  SUPPORTED_NETWORKS_META,
  formatCaipAddress,
  getNetworkMeta,
  resolveNetworkName,
  shortenAddress,
  validateSignMessage,
  withFormattedBalance,
} from "@/src/shims/wallet-logic"

export function DashboardView() {
  const router = useRouter()
  const { theme, toggleTheme } = useAppTheme()
  const isOnline = useNetworkOnline()
  const [mounted, setMounted] = useState(false)

  const { open: openAppKit } = useAppKit()
  const {
    address: appKitAddress,
    isConnected: isAppKitConnected,
    caipAddress: appKitCaipAddress,
  } = useAppKitAccount()
  const {
    caipNetwork,
    chainId: appKitChainId,
    switchNetwork: appKitSwitchNetwork,
  } = useAppKitNetwork()
  const { disconnect: appKitDisconnect } = useAppKitDisconnect()
  const { walletInfo } = useWalletInfo()

  const {
    address: wagmiAddress,
    isConnected: isWagmiConnected,
    connector,
  } = useAccount()
  const wagmiChainId = useChainId()
  const { disconnectAsync: wagmiDisconnect } = useWagmiDisconnect()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const evmAddress = (wagmiAddress ?? appKitAddress) as `0x${string}` | undefined
  const activeChainId =
    typeof wagmiChainId === "number"
      ? wagmiChainId
      : typeof appKitChainId === "number"
        ? appKitChainId
        : Number(appKitChainId) || 1

  const { data: balance } = useBalance({
    address: evmAddress,
    chainId: activeChainId,
  })

  const {
    signMessage,
    data: signature,
    isPending: isSigning,
    error: signError,
    reset: resetSignature,
  } = useSignMessage()

  const [tonState, setTonState] = useState<TonBridgeState>({
    address: "",
    openModal: () => {},
    disconnect: async () => {},
  })

  const [copiedTarget, setCopiedTarget] = useState<"address" | "signature" | null>(
    null
  )
  const [messageInput, setMessageInput] = useState("")
  const [messageError, setMessageError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  const handleTonChange = useCallback((next: TonBridgeState) => {
    setTonState(next)
  }, [])

  useEffect(() => setMounted(true), [])

  const isTon = Boolean(tonState.address)
  const isEvmConnected = isAppKitConnected || isWagmiConnected
  const activeAddress = isTon ? tonState.address : evmAddress

  useEffect(() => {
    if (mounted && !isEvmConnected && !isTon) {
      router.replace("/")
    }
  }, [mounted, isEvmConnected, isTon, router])

  if (!mounted) return null
  if (!activeAddress) return null

  const networkName = resolveNetworkName(
    isTon,
    activeChainId,
    isTon ? undefined : caipNetwork?.name
  )
  const activeNetworkMeta = getNetworkMeta(activeChainId)
  const fullCaipAddress = formatCaipAddress(
    isTon,
    activeChainId,
    activeAddress,
    isTon ? undefined : appKitCaipAddress
  )

  const walletLabel = isTon
    ? "Telegram Wallet (TON)"
    : walletInfo?.name ?? connector?.name ?? "Reown AppKit"

  async function handleCopy(value: string, target: "address" | "signature") {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      window.setTimeout(() => {
        setCopiedTarget((prev) => (prev === target ? null : prev))
      }, 1800)
    } catch {
      // clipboard blocked in restricted contexts
    }
  }

  async function handleSwitchNetwork(targetChainId: number) {
    setNetworkError(null)
    const targetAppKitNet = networks.find((n) => Number(n.id) === targetChainId)
    try {
      if (targetAppKitNet && isAppKitConnected) {
        appKitSwitchNetwork(targetAppKitNet)
      }
      if (isWagmiConnected) {
        switchChain({ chainId: targetChainId })
      }
    } catch (err) {
      setNetworkError(
        err instanceof Error
          ? err.message
          : "Gagal memindahkan jaringan di dompet."
      )
    }
  }

  function handleSignSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateSignMessage(messageInput)
    if (!validation.valid) {
      setMessageError(validation.error)
      return
    }
    setMessageError(null)
    resetSignature()
    signMessage({ message: validation.trimmed })
  }

  async function handleLogout() {
    try {
      if (isAppKitConnected) {
        await appKitDisconnect()
      }
    } catch {
      // fallback to wagmi disconnect
    }
    try {
      if (isWagmiConnected) {
        await wagmiDisconnect()
      }
    } catch {
      // ignore disconnect cleanup errors
    }
    try {
      if (isTon) {
        await tonState.disconnect()
      }
    } catch {
      // ignore TON disconnect errors
    }
    router.replace("/")
  }

  const formattedBalance = isTon
    ? "Lihat di dompet"
    : balance
      ? `${Number(withFormattedBalance(balance).formatted).toFixed(4)} ${balance.symbol}`
      : `— ${activeNetworkMeta?.symbol ?? "ETH"}`

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <TonConnectBridge onChange={handleTonChange} />

      {/* Top Bar Contract: Brand — Context Nav — 1 Primary Action */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap shrink-0"
          >
            Wallet Login
          </a>

          <nav
            aria-label="Navigasi dashboard"
            className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground"
          >
            <span className="text-foreground whitespace-nowrap shrink-0">
              Dashboard
            </span>
            {!isTon && (
              <>
                <button
                  type="button"
                  onClick={() => openAppKit({ view: "Account" })}
                  className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Modal Akun
                </button>
                <button
                  type="button"
                  onClick={() => openAppKit({ view: "Networks" })}
                  className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Modal Jaringan
                </button>
              </>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ubah ke mode terang" : "Ubah ke mode gelap"}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span>Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span>Gelap</span>
                </>
              )}
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ganti tema terang" : "Ganti tema gelap"}
              className="inline-flex sm:hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 sm:py-10 space-y-6">
        {!isOnline && (
          <div
            role="status"
            data-testid="offline-banner"
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Koneksi internet terputus. Pembaruan saldo dan layanan Reown AppKit akan
              tersambung kembali otomatis saat jaringan pulih.
            </span>
          </div>
        )}
        {/* Account Overview Card */}
        <section
          aria-labelledby="heading-dompet"
          className="rounded-2xl border border-border bg-card p-6 sm:p-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                {isTon ? (
                  <TonIcon className="h-8 w-8" />
                ) : walletLabel.toLowerCase().includes("metamask") ? (
                  <MetaMaskIcon className="h-8 w-8" />
                ) : (
                  <ReownIcon className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    Terhubung
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{walletLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums whitespace-nowrap">
                    {isTon ? "TON Mainnet" : `Chain ${activeChainId}`}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <h1
                    id="heading-dompet"
                    className="truncate font-mono text-xl font-semibold tracking-tight text-foreground"
                  >
                    {shortenAddress(activeAddress)}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeAddress, "address")}
                    aria-label="Salin alamat dompet"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedTarget === "address" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {!isTon && (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openAppKit({ view: "Account" })}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  <span>Kelola Akun AppKit</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAppKit({ view: "Networks" })}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  <span>Ganti Jaringan</span>
                </button>
              </div>
            )}
          </div>

          {/* Flat 3-Column Metrics Strip separated by hairline dividers */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
            <div className="sm:pr-6">
              <p className="text-xs font-medium text-muted-foreground">
                Jaringan Aktif
              </p>
              <p
                data-testid="active-network-name"
                className="mt-1 text-base font-semibold text-foreground"
              >
                {networkName}
              </p>
            </div>

            <div className="sm:px-6">
              <p className="text-xs font-medium text-muted-foreground">
                Saldo Native
              </p>
              <p
                data-testid="wallet-balance"
                className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground"
              >
                {formattedBalance}
              </p>
            </div>

            <div className="sm:pl-6 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Identitas CAIP-10
              </p>
              <p
                title={fullCaipAddress}
                className="mt-1 truncate font-mono text-sm font-medium text-foreground"
              >
                {fullCaipAddress}
              </p>
            </div>
          </div>
        </section>

        {/* Two-Column Workspace: Network Switcher + Sign Message */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Network Switcher & Full Address */}
          <div className="lg:col-span-5 space-y-6">
            <section
              aria-labelledby="heading-jaringan"
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2
                    id="heading-jaringan"
                    className="text-base font-semibold text-foreground"
                  >
                    Pindah Jaringan
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isTon
                      ? "Dompet Telegram aktif pada TON Network."
                      : "Pilih jaringan EVM melalui Reown AppKit & Wagmi."}
                  </p>
                </div>
              </div>

              {isTon ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Perpindahan chain EVM tersedia saat Anda masuk menggunakan dompet
                  EVM atau Reown AppKit.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {SUPPORTED_NETWORKS_META.map((net, idx) => {
                    const isActive = activeChainId === net.id
                    const isLastOdd =
                      idx === SUPPORTED_NETWORKS_META.length - 1 &&
                      SUPPORTED_NETWORKS_META.length % 2 === 1
                    return (
                      <button
                        key={net.id}
                        type="button"
                        disabled={isSwitchingChain}
                        aria-pressed={isActive}
                        onClick={() => handleSwitchNetwork(net.id)}
                        className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isLastOdd ? "col-span-2" : ""
                        } ${
                          isActive
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border bg-background text-foreground hover:border-brand/50 hover:bg-accent"
                        }`}
                      >
                        <span className="truncate">{net.name}</span>
                        <span className="font-mono text-xs tabular-nums opacity-75 shrink-0">
                          {net.id}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {networkError && (
                <p role="alert" className="mt-3 text-xs text-destructive">
                  {networkError}
                </p>
              )}
            </section>

            <section
              aria-labelledby="heading-alamat"
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2
                id="heading-alamat"
                className="text-base font-semibold text-foreground"
              >
                Alamat Lengkap
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Gunakan alamat ini untuk menerima aset pada jaringan {networkName}.
              </p>
              <div className="mt-3 rounded-xl border border-border bg-muted/60 px-3.5 py-3 font-mono text-xs sm:text-sm break-all text-foreground">
                {activeAddress}
              </div>
            </section>
          </div>

          {/* Right Column: Sign Message (from reown-com/skills react-wagmi.md) */}
          <section
            aria-labelledby="heading-sign"
            className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 flex flex-col"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="heading-sign"
                  className="text-base font-semibold text-foreground"
                >
                  Tanda Tangani Pesan
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bukti kepemilikan dompet secara kriptografi tanpa transaksi on-chain
                  (bebas biaya gas).
                </p>
              </div>
              {!isTon && (
                <button
                  type="button"
                  onClick={() => {
                    setMessageInput(
                      `Verifikasi sesi Wallet Login di ${networkName} (${shortenAddress(activeAddress)})`
                    )
                    setMessageError(null)
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                >
                  Isi Contoh
                </button>
              )}
            </div>

            {isTon ? (
              <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Penandatanganan pesan EVM (`personal_sign`) tersedia untuk koneksi
                dompet EVM melalui Reown AppKit atau MetaMask.
              </div>
            ) : (
              <form onSubmit={handleSignSubmit} className="mt-5 flex flex-1 flex-col gap-4" noValidate>
                <div>
                  <label
                    htmlFor="sign-message-input"
                    className="block text-sm font-medium text-foreground"
                  >
                    Pesan untuk ditandatangani
                  </label>
                  <textarea
                    id="sign-message-input"
                    rows={4}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value)
                      if (messageError) setMessageError(null)
                    }}
                    placeholder="Contoh: Saya menyetujui autentikasi sesi Wallet Login."
                    aria-invalid={Boolean(messageError)}
                    aria-describedby={messageError ? "sign-message-error" : undefined}
                    className="mt-2 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
                  />
                  {messageError && (
                    <p
                      id="sign-message-error"
                      role="alert"
                      className="mt-1.5 text-xs text-destructive"
                    >
                      {messageError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSigning}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <PenTool className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isSigning ? "Menunggu tanda tangan..." : "Tanda Tangani Pesan"}
                    </span>
                  </button>

                  {(signature || messageInput) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessageInput("")
                        setMessageError(null)
                        resetSignature()
                      }}
                      className="min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                {signError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
                  >
                    {signError.message}
                  </div>
                )}

                {signature && (
                  <div
                    data-testid="signature-result"
                    className="mt-2 rounded-xl border border-border bg-muted/50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Tanda tangan berhasil dibuat
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(signature, "signature")}
                        aria-label="Salin tanda tangan"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
                      >
                        {copiedTarget === "signature" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Salin Signature</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="break-all font-mono text-xs leading-relaxed text-foreground">
                      {signature}
                    </p>
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
