import { createEip1193Provider, connectWalletSession, loadWalletSession } from "./wallet-logic";

export function ensureEthereumFallback() {
  if (typeof window === "undefined") return;

  const fallbackProvider = createEip1193Provider();
  const initialSession = loadWalletSession();
  if (initialSession.isConnected && !initialSession.isTon) {
    fallbackProvider
      .request({
        method: "wallet_switchActiveAccount",
        params: [initialSession.address],
      })
      .catch(() => null);
  }

  const existing = (window as any).ethereum;
  if (typeof existing === "undefined") {
    try {
      Object.defineProperty(window, "ethereum", {
        value: fallbackProvider,
        writable: true,
        configurable: true,
      });
    } catch {
      // ignore if window.ethereum is non-configurable
    }
    return;
  }

  // If a browser extension injected window.ethereum, wrap its request method
  // so cross-origin iframe blocks or timeouts seamlessly fall back to fallbackProvider.
  if (existing && !existing.isFallbackProvider && !existing.__resilientWrapped) {
    try {
      const originalRequest =
        typeof existing.request === "function"
          ? existing.request.bind(existing)
          : null;

      const resilientRequest = async (args: { method: string; params?: any[] }) => {
        if (args.method === "wallet_switchActiveAccount") {
          return fallbackProvider.request(args);
        }
        if (originalRequest) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Iframe extension timeout")), 800)
            );
            const result = await Promise.race([
              originalRequest(args),
              timeoutPromise,
            ]);
            if (
              args.method === "eth_requestAccounts" &&
              Array.isArray(result) &&
              typeof result[0] === "string"
            ) {
              connectWalletSession({
                walletId: "metamask",
                customAddress: result[0],
                walletName: "MetaMask",
              });
            }
            return result;
          } catch {
            // Fall back to internal provider when extension rejects or blocks iframe
            return fallbackProvider.request(args);
          }
        }
        return fallbackProvider.request(args);
      };

      existing.request = resilientRequest;
      existing.__resilientWrapped = true;
    } catch {
      // If existing.request is read-only, replace window.ethereum if configurable
      try {
        Object.defineProperty(window, "ethereum", {
          value: fallbackProvider,
          writable: true,
          configurable: true,
        });
      } catch {
        // ignore
      }
    }
  }
}
