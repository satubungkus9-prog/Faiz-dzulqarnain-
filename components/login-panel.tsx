"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useConnect } from "wagmi"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"
import { ChevronRight, Moon, Sun, ShieldCheck, Globe, KeyRound, WifiOff } from "lucide-react"
import { useAppTheme, useNetworkOnline, useTonAvailable } from "@/app/providers"
import {
  ReownIcon,
  MetaMaskIcon,
  CoinbaseIcon,
  TonIcon,
} from "@/components/wallet-icons"
import {
  TonConnectBridge,
  type TonBridgeState,
} from "@/components/ton-wallet-controls"

export function LoginPanel() {
  const router = useRouter()
  const { theme, toggleTheme } = useAppTheme()
  const isOnline = useNetworkOnline()
  const tonAvailable = useTonAvailable()
  const { open: openAppKit } = useAppKit()
  const { isConnected: isAppKitConnected } = useAppKitAccount()
  const { isConnected: isWagmiConnected } = useAccount()
  const { connectors, connect, isPending, variables, error: connectError } = useConnect()

  const [tonState, setTonState] = useState<TonBridgeState>({
    address: "",
    openModal: () => {},
    disconnect: async () => {},
  })
  const [actionError, setActionError] = useState<string | null>(null)

  const handleTonChange = useCallback((next: TonBridgeState) => {
    setTonState(next)
  }, [])

  const isEvmConnected = isAppKitConnected || isWagmiConnected

  useEffect(() => {
    if (isEvmConnected || tonState.address) {
      router.push("/dashboard")
    }
  }, [isEvmConnected, tonState.address, router])

  const metaMask = connectors.find(
    (c) => c.id === "injected" || c.type === "injected"
  )
  const coinbase = connectors.find(
    (c) =>
      c.id.toLowerCase().includes("coinbase") ||
      c.name.toLowerCase().includes("coinbase")
  )

  const pendingId = isPending
    ? (variables?.connector as { id?: string } | undefined)?.id
    : undefined

  async function handleOpenAppKit() {
    setActionError(null)
    if (!isOnline) {
      setActionError(
        "Tidak ada koneksi internet. Periksa jaringan Anda lalu coba hubungkan kembali."
      )
      return
    }
    try {
      await openAppKit({ view: "Connect" })
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Gagal membuka modal Reown AppKit. Silakan coba lagi."
      )
    }
  }

  function handleConnectDirect(connector: (typeof connectors)[number]) {
    setActionError(null)
    connect(
      { connector },
      {
        onError: (err) => {
          setActionError(
            err.message || "Koneksi dompet dibatalkan atau gagal."
          )
        },
      }
    )
  }

  function handleOpenTon() {
    setActionError(null)
    if (!tonAvailable) {
      setActionError(
        "Manifest TON Connect tidak dapat diakses di domain ini. Gunakan Reown AppKit atau MetaMask."
      )
      return
    }
    tonState.openModal()
  }

  const displayError = actionError ?? (connectError ? connectError.message : null)

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <TonConnectBridge onChange={handleTonChange} />

      {/* Top Bar Contract: Brand — Concise Nav — 1 Primary Action */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap shrink-0"
          >
            Wallet Login
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground"
          >
            <a
              href="#fitur-reown"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              Reown AppKit
            </a>
            <a
              href="#jaringan"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              Jaringan
            </a>
            <a
              href="#panel-masuk"
              className="hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              Dompet
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ubah ke mode terang" : "Ubah ke mode gelap"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
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
              className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleOpenAppKit}
              className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring whitespace-nowrap shrink-0"
            >
              Hubungkan Dompet
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10 lg:py-16 flex flex-col justify-center gap-6">
        {!isOnline && (
          <div
            role="status"
            data-testid="offline-banner"
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Koneksi internet terputus. Reown AppKit dan sinkronisasi jaringan akan
              tersambung kembali otomatis saat koneksi pulih.
            </span>
          </div>
        )}
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Left: Product Overview & Multi-chain Capabilities */}
          <section id="fitur-reown" className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-medium text-brand">
                Terintegrasi dengan Reown AppKit · Wagmi · TON Connect
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.12]"
                style={{ textWrap: "balance" }}
              >
                Autentikasi dompet Web3 lintas jaringan dalam satu pintu.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Hubungkan dompet EVM maupun Telegram Wallet secara langsung, kelola
                perpindahan jaringan secara real-time, dan verifikasi kepemilikan akun
                melalui tanda tangan kriptografi.
              </p>
            </div>

            <div className="divide-y divide-border border-t border-b border-border">
              <div className="flex items-start gap-4 py-4">
                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Modal Reown AppKit Universal
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Mendukung 600+ dompet via QR WalletConnect, ekstensi browser, serta
                    login Email dan akun sosial.
                  </p>
                </div>
              </div>

              <div id="jaringan" className="flex items-start gap-4 py-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    5 Jaringan EVM + TON Network
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Ethereum · Polygon · Arbitrum · Optimism · Base · TON
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Verifikasi Tanda Tangan Pesan
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Tanda tangani pesan kustom langsung dari dashboard tanpa biaya gas
                    untuk membuktikan kepemilikan alamat.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Focused Wallet Login Card */}
          <section id="panel-masuk" className="lg:col-span-6 lg:flex lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Masuk dengan Dompet
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih Reown AppKit atau sambungkan dompet favorit Anda.
                </p>
              </div>

              {/* Primary Reown AppKit Action */}
              <button
                type="button"
                onClick={handleOpenAppKit}
                className="group flex w-full min-h-14 items-center gap-3.5 rounded-xl bg-brand px-4 py-3 text-left text-brand-foreground transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <ReownIcon className="h-7 w-7" />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold leading-tight">
                    Reown AppKit
                  </span>
                  <span className="text-xs text-white/85">
                    QR WalletConnect · 550+ dompet & Sosial
                  </span>
                </span>
                <ChevronRight
                  className="ml-auto h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  atau sambungkan langsung
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col gap-2.5">
                {metaMask && (
                  <WalletButton
                    label="MetaMask"
                    sublabel="Ekstensi browser / EIP-1193"
                    icon={<MetaMaskIcon className="h-8 w-8" />}
                    loading={pendingId === metaMask.id}
                    onClick={() => handleConnectDirect(metaMask)}
                  />
                )}

                <WalletButton
                  label="Telegram Wallet"
                  sublabel={
                    tonAvailable
                      ? "TON Connect"
                      : "TON Connect (domain ini tidak mendukung manifest)"
                  }
                  icon={<TonIcon className="h-8 w-8" />}
                  onClick={handleOpenTon}
                />

                <WalletButton
                  label="Coinbase Wallet"
                  sublabel="Smart Wallet & Mobile"
                  icon={<CoinbaseIcon className="h-8 w-8" />}
                  loading={coinbase ? pendingId === coinbase.id : false}
                  onClick={() =>
                    coinbase ? handleConnectDirect(coinbase) : handleOpenAppKit()
                  }
                />
              </div>

              {displayError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
                >
                  {displayError}
                </div>
              )}

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                Dengan masuk, Anda menyetujui koneksi dompet baca-saja ke aplikasi ini.
                Kunci privat tidak pernah meninggalkan dompet Anda.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function WalletButton({
  label,
  sublabel,
  icon,
  loading,
  onClick,
}: {
  label: string
  sublabel: string
  icon: React.ReactNode
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group flex w-full min-h-14 items-center gap-3.5 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-brand/60 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground leading-tight">
          {label}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {sublabel}
        </span>
      </span>
      <span className="ml-auto shrink-0 text-muted-foreground">
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.25"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  )
}
