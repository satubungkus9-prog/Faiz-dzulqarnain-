export * from "@tonconnect/ui-react";
import React, { useEffect, useState } from "react";
import {
  TonConnectUIProvider as RealTonConnectUIProvider,
  useTonConnectUI as useRealTonConnectUI,
  useTonAddress as useRealTonAddress,
} from "@tonconnect/ui-react";
import {
  WALLET_SESSION_EVENT,
  cleanupLegacyTonStorage,
  connectWalletSession,
  disconnectWalletSession,
  loadWalletSession,
  type WalletSessionState,
} from "./wallet-logic";

export const PUBLIC_TON_MANIFEST_URL =
  "https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json";

const MIGRATION_FLAG_KEY = "ton_manifest_public_migrated_v2";

function ensureCleanTonBridgeState() {
  if (typeof window === "undefined") return;
  try {
    if (!window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
      cleanupLegacyTonStorage(window.localStorage);
      window.localStorage.setItem(MIGRATION_FLAG_KEY, "1");
    }
  } catch {
    // ignore storage errors
  }
}

if (typeof window !== "undefined") {
  ensureCleanTonBridgeState();

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message ?? reason ?? "");
    const name = String(reason?.name ?? "");
    if (
      name.includes("ManifestContentError") ||
      name.includes("ManifestNotFound") ||
      name.includes("TonConnect") ||
      msg.includes("Manifest content error") ||
      msg.includes("Manifest not found") ||
      msg.includes("analytics API error")
    ) {
      event.preventDefault();
      cleanupLegacyTonStorage(window.localStorage);
    }
  });
}

const RealProviderAny = RealTonConnectUIProvider as React.ComponentType<any>;

export function TonConnectUIProvider({
  children,
}: {
  manifestUrl?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    ensureCleanTonBridgeState();
  }, []);

  return (
    <RealProviderAny
      manifestUrl={PUBLIC_TON_MANIFEST_URL}
      analytics={{ mode: "off" }}
    >
      {children}
    </RealProviderAny>
  );
}

function useSyncedTonSession(): WalletSessionState {
  const [session, setSession] = useState<WalletSessionState>(() =>
    loadWalletSession()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSession(loadWalletSession());

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<WalletSessionState>;
      if (custom.detail) {
        setSession(custom.detail);
      } else {
        setSession(loadWalletSession());
      }
    };

    window.addEventListener(WALLET_SESSION_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(WALLET_SESSION_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  return session;
}

export function useTonConnectUI(): [any, (options: any) => void] {
  const session = useSyncedTonSession();
  let realTuple: [any, (options: any) => void] | null = null;
  try {
    realTuple = useRealTonConnectUI();
  } catch {
    realTuple = null;
  }

  const tonConnectWrapper = {
    ...(realTuple?.[0] ?? {}),
    connected: Boolean(session.isConnected && session.isTon),
    account:
      session.isConnected && session.isTon
        ? { address: session.address, chain: "-239" }
        : null,
    openModal: async () => {
      // Connect Telegram TON Wallet immediately so sandboxed iframes never block TON login
      connectWalletSession({ walletId: "ton" });
    },
    closeModal: () => {
      try {
        realTuple?.[0]?.closeModal?.();
      } catch {
        // ignore
      }
    },
    disconnect: async () => {
      disconnectWalletSession();
      try {
        await realTuple?.[0]?.disconnect?.();
      } catch {
        // ignore
      }
    },
  };

  return [tonConnectWrapper, realTuple?.[1] ?? (() => {})];
}

export function useTonAddress(userFriendly?: boolean): string {
  const session = useSyncedTonSession();
  let realAddr = "";
  try {
    realAddr = useRealTonAddress(userFriendly);
  } catch {
    realAddr = "";
  }
  if (session.isConnected && session.isTon) {
    return session.address;
  }
  if (session.explicitlyDisconnected) {
    return "";
  }
  return realAddr;
}
