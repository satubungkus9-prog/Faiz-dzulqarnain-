import { createAppKit } from "@reown/appkit/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  type AppKitNetwork,
} from "@reown/appkit/networks"
import { injected } from "wagmi/connectors"
import { ensureEthereumFallback } from "@/src/shims/ethereum-fallback"
import {
  buildAppKitMetadata,
  disableThirdPartyTelemetry,
  installWalletConnectOfflineGuard,
  resolveReownProjectId,
} from "@/src/shims/wallet-logic"

installWalletConnectOfflineGuard()
disableThirdPartyTelemetry()
ensureEthereumFallback()

const resolvedProject = resolveReownProjectId({
  viteProjectId: import.meta.env.VITE_PROJECT_ID,
  viteWalletConnectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  nextProjectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  nextWalletConnectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
})

export const projectId = resolvedProject.projectId
export const isPublicTestProjectId = resolvedProject.isPublicTestId

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
]

const origin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

export const metadata = buildAppKitMetadata(origin)

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks,
  projectId,
  connectors: [injected({ shimDisconnect: true })],
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

// Initialize Reown AppKit once at module level per https://github.com/reown-com/skills
// Disable third-party Coinbase/BaseAccount SDK auto-injection & analytics beacons
// so blocked telemetry endpoints (cca-lite.coinbase.com) never throw AnalyticsSDKApiError.
export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: mainnet,
  projectId,
  metadata,
  enableCoinbase: false,
  enableBaseAccount: false,
  features: {
    analytics: false,
    email: true,
    socials: ["google", "x", "github", "discord", "apple"],
    emailShowWallets: true,
  },
  allWallets: "SHOW",
  themeVariables: {
    "--w3m-accent": "#2563EB",
    "--w3m-border-radius-master": "2px",
  },
})

export const hasWalletConnect = Boolean(projectId)

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}
