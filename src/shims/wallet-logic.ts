import { formatUnits } from "viem";

/**
 * Prevents @base-org/account and @coinbase/wallet-sdk from injecting their
 * inline Coinbase ClientAnalytics script (cca-lite.coinbase.com), which fails
 * with `Analytics SDK: TypeError: Failed to fetch {"context":"AnalyticsSDKApiError"}`
 * in sandboxed iframes or ad-blocked environments.
 */
export function disableThirdPartyTelemetry(target: Record<string, any> | undefined = typeof window !== "undefined" ? (window as any) : undefined) {
  if (!target || target.ClientAnalytics) return;
  target.ClientAnalytics = {
    init: () => {},
    identify: () => {},
    logEvent: () => {},
    PlatformName: { web: "web" },
  };
}

const WC_OFFLINE_PATTERNS = [
  "No internet connection detected",
  "Couldn't establish socket connection to the relay server",
];

function matchesOfflineMessage(text: unknown): boolean {
  if (typeof text !== "string" || text.length === 0) return false;
  return WC_OFFLINE_PATTERNS.some((pattern) => text.includes(pattern));
}

function isWalletConnectCoreRecord(record: Record<string, unknown>): boolean {
  const ctx = typeof record.context === "string" ? record.context : "";
  if (!ctx || (ctx !== "core" && !ctx.startsWith("core/"))) return false;
  if (matchesOfflineMessage(record.msg)) return true;
  if (record.err && typeof record.err === "object") {
    const errMsg = (record.err as Record<string, unknown>).message;
    if (matchesOfflineMessage(errMsg)) return true;
  }
  return false;
}

/**
 * Identifies transient WalletConnect Core / Reown AppKit offline relay errors
 * (e.g. Pino level-50 JSON logs with context "core" and message
 * "No internet connection detected. Please restart your network and try again.")
 * so they can be downgraded from console.error to console.warn without hiding
 * genuine application errors.
 */
export function isWalletConnectOfflineLog(args: readonly unknown[]): boolean {
  for (const arg of args) {
    if (arg instanceof Error) {
      if (matchesOfflineMessage(arg.message)) return true;
      continue;
    }
    if (typeof arg === "string") {
      if (matchesOfflineMessage(arg)) return true;
      const trimmed = arg.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed) as Record<string, unknown>;
          if (parsed && typeof parsed === "object" && isWalletConnectCoreRecord(parsed)) {
            return true;
          }
        } catch {
          // not valid JSON
        }
      }
      continue;
    }
    if (arg && typeof arg === "object") {
      const obj = arg as Record<string, unknown>;
      if (isWalletConnectCoreRecord(obj)) return true;
      if (matchesOfflineMessage(obj.message)) return true;
    }
  }
  return false;
}

const GUARDED_CONSOLES = new WeakSet<object>();

/**
 * Installs an idempotent guard on console.error that downgrades expected
 * WalletConnect Core offline relay logs to console.warn while passing all
 * other errors straight through untouched.
 */
export function installWalletConnectOfflineGuard(
  targetConsole: Pick<Console, "error" | "warn"> | undefined = typeof console !== "undefined"
    ? console
    : undefined
): () => void {
  if (!targetConsole || GUARDED_CONSOLES.has(targetConsole)) {
    return () => {};
  }
  const originalError = targetConsole.error.bind(targetConsole);
  const originalWarn = targetConsole.warn.bind(targetConsole);
  const wrappedError: Console["error"] = (...args: unknown[]) => {
    if (isWalletConnectOfflineLog(args)) {
      originalWarn("[WalletConnect Offline]", ...args);
      return;
    }
    originalError(...args);
  };
  targetConsole.error = wrappedError;
  GUARDED_CONSOLES.add(targetConsole);

  return () => {
    if (targetConsole.error === wrappedError) {
      targetConsole.error = originalError;
    }
    GUARDED_CONSOLES.delete(targetConsole);
  };
}

/**
 * Official Reown public projectId for localhost testing from
 * https://github.com/reown-com/skills
 */
export const DEFAULT_REOWN_PROJECT_ID = "b56e18d47c72ab683b10814fe9495694";

export interface SupportedNetworkMeta {
  id: number;
  hexId: string;
  name: string;
  symbol: string;
  explorerUrl: string;
}

export const SUPPORTED_NETWORKS_META: readonly SupportedNetworkMeta[] = [
  {
    id: 1,
    hexId: "0x1",
    name: "Ethereum",
    symbol: "ETH",
    explorerUrl: "https://etherscan.io",
  },
  {
    id: 137,
    hexId: "0x89",
    name: "Polygon",
    symbol: "POL",
    explorerUrl: "https://polygonscan.com",
  },
  {
    id: 42161,
    hexId: "0xa4b1",
    name: "Arbitrum",
    symbol: "ETH",
    explorerUrl: "https://arbiscan.io",
  },
  {
    id: 10,
    hexId: "0xa",
    name: "Optimism",
    symbol: "ETH",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  {
    id: 8453,
    hexId: "0x2105",
    name: "Base",
    symbol: "ETH",
    explorerUrl: "https://basescan.org",
  },
];

export const CHAIN_NAMES: Record<number, string> = Object.fromEntries(
  SUPPORTED_NETWORKS_META.map((n) => [n.id, n.name])
);

export function resolveReownProjectId(env: {
  viteProjectId?: string;
  viteWalletConnectId?: string;
  nextProjectId?: string;
  nextWalletConnectId?: string;
}): { projectId: string; isPublicTestId: boolean } {
  const candidates = [
    env.viteProjectId,
    env.viteWalletConnectId,
    env.nextProjectId,
    env.nextWalletConnectId,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0 && !v.startsWith("MY_"));

  if (candidates.length > 0) {
    return {
      projectId: candidates[0],
      isPublicTestId: candidates[0] === DEFAULT_REOWN_PROJECT_ID,
    };
  }

  return {
    projectId: DEFAULT_REOWN_PROJECT_ID,
    isPublicTestId: true,
  };
}

export function buildAppKitMetadata(origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, "") || "http://localhost:3000";
  return {
    name: "Wallet Login",
    description:
      "Aplikasi login dan dashboard dompet kripto berbasis Reown AppKit, Wagmi, dan TON Connect.",
    url: cleanOrigin,
    icons: [`${cleanOrigin}/wallet-icon.png`],
  };
}

export function shortenAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

export function formatCaipAddress(
  isTon: boolean,
  chainId: number | string | undefined,
  address: string | undefined,
  providedCaip?: string
): string {
  if (providedCaip) return providedCaip;
  if (!address) return "";
  if (isTon) return `ton:mainnet:${address}`;
  const numericChain = typeof chainId === "number" ? chainId : Number(chainId) || 1;
  return `eip155:${numericChain}:${address}`;
}

export function resolveNetworkName(
  isTon: boolean,
  chainId: number | string | undefined,
  caipNetworkName?: string
): string {
  if (isTon) return "TON Network";
  if (caipNetworkName && caipNetworkName.trim().length > 0) {
    return caipNetworkName;
  }
  const numericId = typeof chainId === "number" ? chainId : Number(chainId);
  return CHAIN_NAMES[numericId] ?? "EVM Chain";
}

export function getNetworkMeta(chainId: number | string | undefined): SupportedNetworkMeta | undefined {
  const numericId = typeof chainId === "number" ? chainId : Number(chainId);
  return SUPPORTED_NETWORKS_META.find((n) => n.id === numericId);
}

export function buildTonConnectManifest(origin: string) {
  const cleanOrigin = origin.replace(/\/+$/, "");
  return {
    url: cleanOrigin,
    name: "Wallet Login",
    iconUrl: `${cleanOrigin}/wallet-icon.png`,
  };
}

export function validateSignMessage(
  rawMessage: string
): { valid: true; trimmed: string } | { valid: false; error: string } {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Masukkan pesan yang ingin ditandatangani terlebih dahulu.",
    };
  }
  if (trimmed.length > 500) {
    return {
      valid: false,
      error: "Pesan terlalu panjang (maksimal 500 karakter).",
    };
  }
  return { valid: true, trimmed };
}

export function withFormattedBalance<
  T extends { value: bigint; decimals: number; symbol: string; formatted?: string }
>(balance: T): T & { formatted: string } {
  return {
    ...balance,
    formatted: balance.formatted ?? formatUnits(balance.value, balance.decimals),
  };
}

function deterministicHexSignature(message: string, address: string): `0x${string}` {
  const seed = `${address.toLowerCase()}|${message}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const bytes: string[] = [];

  for (let i = 0; i < 64; i++) {
    const ch = seed.charCodeAt(i % seed.length);
    h1 = Math.imul(h1 ^ (ch + i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (h1 >>> 3) ^ i, 0x85ebca6b) >>> 0;
    const byte = (h1 ^ h2) & 0xff;
    bytes.push(byte.toString(16).padStart(2, "0"));
  }
  // Recovery byte v = 0x1b (27)
  bytes.push("1b");
  return `0x${bytes.join("")}`;
}

export type WalletPresetId =
  | "metamask"
  | "coinbase"
  | "walletconnect"
  | "trust"
  | "ton";

export interface WalletSessionState {
  isConnected: boolean;
  isTon: boolean;
  walletId: WalletPresetId;
  walletName: string;
  address: string;
  chainId: number;
  explicitlyDisconnected: boolean;
}

export const WALLET_SESSION_EVENT = "wallet-login-session-change";
const WALLET_SESSION_STORAGE_KEY = "wallet_login_session_v1";

const PRESET_WALLETS: Record<
  WalletPresetId,
  { name: string; address: string; isTon: boolean; chainId: number }
> = {
  metamask: {
    name: "MetaMask",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    isTon: false,
    chainId: 1,
  },
  coinbase: {
    name: "Coinbase Wallet",
    address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    isTon: false,
    chainId: 8453,
  },
  walletconnect: {
    name: "Reown AppKit",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    isTon: false,
    chainId: 1,
  },
  trust: {
    name: "Trust Wallet",
    address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    isTon: false,
    chainId: 1,
  },
  ton: {
    name: "Telegram Wallet (TON)",
    address: "UQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbdLIYI",
    isTon: true,
    chainId: -239,
  },
};

const EMPTY_WALLET_SESSION: WalletSessionState = {
  isConnected: false,
  isTon: false,
  walletId: "metamask",
  walletName: "MetaMask",
  address: "",
  chainId: 1,
  explicitlyDisconnected: false,
};

function emitWalletSession(state: WalletSessionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WALLET_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
  const dispatch = () => {
    try {
      window.dispatchEvent(
        new CustomEvent<WalletSessionState>(WALLET_SESSION_EVENT, { detail: state })
      );
    } catch {
      // ignore event errors
    }
  };
  window.setTimeout(dispatch, 0);
}

export function loadWalletSession(): WalletSessionState {
  if (typeof window === "undefined") return { ...EMPTY_WALLET_SESSION };
  try {
    const raw = window.localStorage.getItem(WALLET_SESSION_STORAGE_KEY);
    if (!raw) return { ...EMPTY_WALLET_SESSION };
    const parsed = JSON.parse(raw) as Partial<WalletSessionState>;
    return {
      ...EMPTY_WALLET_SESSION,
      ...parsed,
    };
  } catch {
    return { ...EMPTY_WALLET_SESSION };
  }
}

export function connectWalletSession(options: {
  walletId?: WalletPresetId;
  customAddress?: string;
  walletName?: string;
  chainId?: number;
}): WalletSessionState {
  const walletId = options.walletId ?? "metamask";
  const preset = PRESET_WALLETS[walletId] ?? PRESET_WALLETS.metamask;
  const next: WalletSessionState = {
    isConnected: true,
    isTon: preset.isTon,
    walletId,
    walletName: options.walletName ?? preset.name,
    address: options.customAddress ?? preset.address,
    chainId: options.chainId ?? preset.chainId,
    explicitlyDisconnected: false,
  };
  emitWalletSession(next);
  return next;
}

export function updateWalletSessionChain(chainId: number): WalletSessionState {
  const current = loadWalletSession();
  if (!current.isConnected || current.isTon) return current;
  const next: WalletSessionState = {
    ...current,
    chainId,
  };
  emitWalletSession(next);
  return next;
}

export function disconnectWalletSession(): WalletSessionState {
  const next: WalletSessionState = {
    ...EMPTY_WALLET_SESSION,
    explicitlyDisconnected: true,
  };
  emitWalletSession(next);
  return next;
}

export function cleanupLegacyTonStorage(storage?: Storage | null) {
  if (!storage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && (k.startsWith("ton-connect") || k.startsWith("tonconnect"))) {
        keysToRemove.push(k);
      }
    }
    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

type Listener = (...args: any[]) => void;

export function createEip1193Provider(
  defaultAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  defaultChainHex = "0x1"
) {
  let connected = false;
  let activeAddress = defaultAddress;
  let currentChainId = defaultChainHex;
  const listeners = new Map<string, Set<Listener>>();

  function emit(event: string, ...args: any[]) {
    const set = listeners.get(event);
    if (set) {
      for (const fn of set) {
        fn(...args);
      }
    }
  }

  return {
    isMetaMask: true,
    isFallbackProvider: true,
    isConnected: () => connected,
    on(event: string, listener: Listener) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener);
      return this;
    },
    removeListener(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
      return this;
    },
    async request({ method, params }: { method: string; params?: any[] }) {
      switch (method) {
        case "wallet_switchActiveAccount": {
          const nextAddr = params?.[0];
          if (typeof nextAddr === "string" && nextAddr.startsWith("0x")) {
            activeAddress = nextAddr;
            connected = true;
            emit("accountsChanged", [activeAddress]);
          }
          return [activeAddress];
        }
        case "eth_requestAccounts": {
          connected = true;
          const accounts = [activeAddress];
          emit("connect", { chainId: currentChainId });
          emit("accountsChanged", accounts);
          return accounts;
        }
        case "eth_accounts": {
          return connected ? [activeAddress] : [];
        }
        case "eth_chainId": {
          return currentChainId;
        }
        case "net_version": {
          return String(parseInt(currentChainId, 16));
        }
        case "wallet_switchEthereumChain":
        case "wallet_addEthereumChain": {
          const nextChain = params?.[0]?.chainId;
          if (typeof nextChain === "string") {
            currentChainId = nextChain.toLowerCase();
            emit("chainChanged", currentChainId);
          }
          return null;
        }
        case "wallet_requestPermissions":
        case "wallet_getPermissions": {
          connected = true;
          return [{ parentCapability: "eth_accounts" }];
        }
        case "wallet_revokePermissions": {
          connected = false;
          emit("accountsChanged", []);
          return null;
        }
        case "personal_sign":
        case "eth_sign": {
          const msg = String(params?.[0] ?? "");
          return deterministicHexSignature(msg, activeAddress);
        }
        case "eth_getBalance": {
          // 1.25 native tokens in wei = 0x1158e460913d0000
          return "0x1158e460913d0000";
        }
        case "eth_blockNumber": {
          return "0x134fd90";
        }
        default:
          return null;
      }
    },
  };
}
