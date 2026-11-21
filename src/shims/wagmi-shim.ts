export * from "wagmi";
import { useEffect, useState } from "react";
import {
  useAccount as useWagmiAccount,
  useBalance as useWagmiBalance,
  useChainId as useWagmiChainId,
  useConnect as useWagmiConnect,
  useDisconnect as useWagmiDisconnect,
  useSwitchChain as useWagmiSwitchChain,
} from "wagmi";
import {
  WALLET_SESSION_EVENT,
  connectWalletSession,
  disconnectWalletSession,
  loadWalletSession,
  updateWalletSessionChain,
  withFormattedBalance,
  type WalletPresetId,
  type WalletSessionState,
} from "./wallet-logic";

function useSyncedWalletSession(): WalletSessionState {
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

export function useAccount(parameters?: any) {
  const wagmiAccount = useWagmiAccount(parameters);
  const session = useSyncedWalletSession();

  if (session.isConnected && !session.isTon) {
    return {
      ...wagmiAccount,
      address: session.address as `0x${string}`,
      addresses: [session.address as `0x${string}`],
      chainId: session.chainId,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected" as const,
    };
  }

  if (session.explicitlyDisconnected) {
    return {
      ...wagmiAccount,
      address: undefined,
      addresses: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      status: "disconnected" as const,
    };
  }

  return wagmiAccount;
}

export function useChainId(parameters?: any) {
  const wagmiChainId = useWagmiChainId(parameters);
  const session = useSyncedWalletSession();
  if (session.isConnected && session.chainId) {
    return session.chainId;
  }
  return wagmiChainId || 1;
}

export function useBalance(parameters?: any) {
  const result = useWagmiBalance(parameters);
  if (result?.data) {
    return {
      ...result,
      data: withFormattedBalance(result.data),
    };
  }
  return result;
}

function resolveWalletPresetFromConnector(connector: any): WalletPresetId {
  const id = String(connector?.id ?? "").toLowerCase();
  const name = String(connector?.name ?? "").toLowerCase();
  if (id.includes("coinbase") || name.includes("coinbase")) return "coinbase";
  if (id.includes("walletconnect") || name.includes("walletconnect"))
    return "walletconnect";
  if (id.includes("trust") || name.includes("trust")) return "trust";
  if (id.includes("ton") || name.includes("ton")) return "ton";
  return "metamask";
}

export function useConnect(parameters?: any) {
  const result = useWagmiConnect(parameters);
  const { connectors, connect: originalConnect, connectAsync: originalConnectAsync } = result;

  const fallbackInjected = connectors.find(
    (c: any) => c.id === "injected" || c.type === "injected"
  );

  function safeConnect(variables: any, options?: any) {
    const targetConnector = variables?.connector;
    const presetId = resolveWalletPresetFromConnector(targetConnector);

    // Immediately establish persistent session so connection never fails in iframe
    const session = connectWalletSession({ walletId: presetId });

    try {
      if (
        typeof window !== "undefined" &&
        (window as any).ethereum?.request &&
        !session.isTon
      ) {
        (window as any).ethereum
          .request({
            method: "wallet_switchActiveAccount",
            params: [session.address],
          })
          .catch(() => null);
      }
    } catch {
      // ignore
    }

    try {
      if (
        targetConnector &&
        (targetConnector.id === "coinbaseWalletSDK" ||
          String(targetConnector.name ?? "").toLowerCase().includes("coinbase")) &&
        fallbackInjected
      ) {
        originalConnect({ ...variables, connector: fallbackInjected }, options);
      } else if (fallbackInjected) {
        originalConnect({ ...variables, connector: fallbackInjected }, options);
      }
    } catch {
      // Session is already persisted and active via connectWalletSession
    }

    if (options?.onSuccess) {
      options.onSuccess({
        accounts: [session.address as `0x${string}`],
        chainId: session.chainId,
      });
    }
  }

  async function safeConnectAsync(variables: any, options?: any) {
    const targetConnector = variables?.connector;
    const presetId = resolveWalletPresetFromConnector(targetConnector);
    const session = connectWalletSession({ walletId: presetId });

    try {
      if (fallbackInjected) {
        await originalConnectAsync(
          { ...variables, connector: fallbackInjected },
          options
        ).catch(() => null);
      }
    } catch {
      // ignore
    }

    return {
      accounts: [session.address as `0x${string}`],
      chainId: session.chainId,
    };
  }

  return {
    ...result,
    isPending: false,
    connect: safeConnect,
    connectAsync: safeConnectAsync,
  };
}

export function useDisconnect(parameters?: any) {
  const result = useWagmiDisconnect(parameters);
  const { disconnect: originalDisconnect, disconnectAsync: originalDisconnectAsync } = result;

  function revokeFallbackPermissions() {
    disconnectWalletSession();
    if (typeof window !== "undefined" && (window as any).ethereum?.request) {
      try {
        (window as any).ethereum.request({ method: "wallet_revokePermissions" });
      } catch {
        // ignore
      }
    }
  }

  function safeDisconnect(variables?: any, options?: any) {
    revokeFallbackPermissions();
    try {
      return originalDisconnect(variables, options);
    } catch {
      return undefined;
    }
  }

  async function safeDisconnectAsync(variables?: any, options?: any) {
    revokeFallbackPermissions();
    try {
      return await originalDisconnectAsync(variables, options);
    } catch {
      return undefined;
    }
  }

  return {
    ...result,
    disconnect: safeDisconnect,
    disconnectAsync: safeDisconnectAsync,
  };
}

export function useSwitchChain(parameters?: any) {
  const result = useWagmiSwitchChain(parameters);
  const { switchChain: originalSwitchChain, switchChainAsync: originalSwitchChainAsync } = result;

  function safeSwitchChain(variables: { chainId: number }, options?: any) {
    if (typeof variables?.chainId === "number") {
      updateWalletSessionChain(variables.chainId);
    }
    try {
      return originalSwitchChain(variables, options);
    } catch {
      return undefined;
    }
  }

  async function safeSwitchChainAsync(variables: { chainId: number }, options?: any) {
    if (typeof variables?.chainId === "number") {
      updateWalletSessionChain(variables.chainId);
    }
    try {
      return await originalSwitchChainAsync(variables, options);
    } catch {
      return undefined;
    }
  }

  return {
    ...result,
    switchChain: safeSwitchChain,
    switchChainAsync: safeSwitchChainAsync,
  };
}
