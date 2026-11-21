"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import { useAppKitTheme } from "@reown/appkit/react"
import { wagmiConfig } from "@/lib/wagmi"

type ThemeMode = "light" | "dark"

const TonAvailableContext = createContext(false)
const NetworkOnlineContext = createContext(true)

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (next: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
})

export function useTonAvailable() {
  return useContext(TonAvailableContext)
}

export function useNetworkOnline() {
  return useContext(NetworkOnlineContext)
}

export function useAppTheme() {
  return useContext(ThemeContext)
}

function AppKitThemeBridge({ theme }: { theme: ThemeMode }) {
  const { setThemeMode } = useAppKitTheme()

  useEffect(() => {
    setThemeMode(theme)
  }, [theme, setThemeMode])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [manifestUrl, setManifestUrl] = useState<string | undefined>(undefined)
  // null = still checking, true = manifest reachable, false = unavailable
  const [tonReady, setTonReady] = useState<boolean | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light"
    const stored = window.localStorage.getItem("wallet-login-theme")
    if (stored === "dark" || stored === "light") return stored
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
    try {
      window.localStorage.setItem("wallet-login-theme", theme)
    } catch {
      // ignore storage errors in restricted iframes
    }
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  useEffect(() => {
    let cancelled = false
    const url = `${window.location.origin}/tonconnect-manifest.json`

    async function checkManifest() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!cancelled) setTonReady(false)
        return
      }
      try {
        const res = await fetch(url, { cache: "no-store", redirect: "manual" })
        const contentType = res.headers.get("content-type") ?? ""
        if (!cancelled && res.ok && contentType.includes("application/json")) {
          await res.json()
          if (!cancelled) {
            setManifestUrl(url)
            setTonReady(true)
            return
          }
        }
      } catch {
        // ignore – treated as unavailable below
      }
      if (!cancelled) setTonReady(false)
    }

    if (tonReady !== true) {
      checkManifest()
    }
    return () => {
      cancelled = true
    }
  }, [isOnline, tonReady])

  if (tonReady === null) return null

  const inner = (
    <NetworkOnlineContext.Provider value={isOnline}>
      <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppKitThemeBridge theme={theme} />
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeContext.Provider>
    </NetworkOnlineContext.Provider>
  )

  return (
    <TonAvailableContext.Provider value={tonReady}>
      {tonReady && manifestUrl ? (
        <TonConnectUIProvider manifestUrl={manifestUrl}>{inner}</TonConnectUIProvider>
      ) : (
        inner
      )}
    </TonAvailableContext.Provider>
  )
}
