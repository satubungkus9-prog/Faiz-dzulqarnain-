import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REOWN_PROJECT_ID,
  resolveReownProjectId,
  buildAppKitMetadata,
  shortenAddress,
  formatCaipAddress,
  resolveNetworkName,
  getNetworkMeta,
  buildTonConnectManifest,
  validateSignMessage,
  withFormattedBalance,
  createEip1193Provider,
} from "./wallet-logic";

test("resolveReownProjectId prioritizes configured env vars and falls back to official localhost test ID", () => {
  const fallback = resolveReownProjectId({});
  assert.equal(fallback.projectId, DEFAULT_REOWN_PROJECT_ID);
  assert.equal(fallback.isPublicTestId, true);

  const custom = resolveReownProjectId({
    viteProjectId: "custom-project-id-1234",
    nextProjectId: "ignored-next-id",
  });
  assert.equal(custom.projectId, "custom-project-id-1234");
  assert.equal(custom.isPublicTestId, false);

  const ignoresPlaceholder = resolveReownProjectId({
    viteProjectId: "MY_REOWN_PROJECT_ID",
  });
  assert.equal(ignoresPlaceholder.projectId, DEFAULT_REOWN_PROJECT_ID);
  assert.equal(ignoresPlaceholder.isPublicTestId, true);
});

test("buildAppKitMetadata aligns url and icons with current origin", () => {
  const meta = buildAppKitMetadata("https://wallet.example.com/");
  assert.equal(meta.url, "https://wallet.example.com");
  assert.deepEqual(meta.icons, ["https://wallet.example.com/wallet-icon.png"]);
  assert.equal(meta.name, "Wallet Login");
});

test("shortenAddress truncates standard EVM and TON addresses properly", () => {
  const evm = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  assert.equal(shortenAddress(evm), "0x71C7...976F");
  assert.equal(shortenAddress("0x123456"), "0x123456");
});

test("formatCaipAddress builds CAIP-10 strings for EVM and TON wallets", () => {
  const addr = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  assert.equal(formatCaipAddress(false, 137, addr), `eip155:137:${addr}`);
  assert.equal(formatCaipAddress(true, undefined, "UQAbc123"), "ton:mainnet:UQAbc123");
  assert.equal(
    formatCaipAddress(false, 1, addr, `eip155:8453:${addr}`),
    `eip155:8453:${addr}`
  );
});

test("resolveNetworkName and getNetworkMeta resolve all supported AppKit chains", () => {
  assert.equal(resolveNetworkName(true, 1), "TON Network");
  assert.equal(resolveNetworkName(false, 1), "Ethereum");
  assert.equal(resolveNetworkName(false, 137), "Polygon");
  assert.equal(resolveNetworkName(false, 42161), "Arbitrum");
  assert.equal(resolveNetworkName(false, 10), "Optimism");
  assert.equal(resolveNetworkName(false, 8453), "Base");
  assert.equal(resolveNetworkName(false, 8453, "Base Mainnet"), "Base Mainnet");
  assert.equal(resolveNetworkName(false, 999999), "EVM Chain");

  assert.equal(getNetworkMeta(137)?.symbol, "POL");
  assert.equal(getNetworkMeta(8453)?.hexId, "0x2105");
});

test("validateSignMessage rejects empty or overly long messages", () => {
  const empty = validateSignMessage("   ");
  assert.equal(empty.valid, false);

  const tooLong = validateSignMessage("a".repeat(501));
  assert.equal(tooLong.valid, false);

  const ok = validateSignMessage("  Verifikasi sesi Wallet Login  ");
  assert.equal(ok.valid, true);
  if (ok.valid) {
    assert.equal(ok.trimmed, "Verifikasi sesi Wallet Login");
  }
});

test("buildTonConnectManifest constructs valid TON Connect manifest JSON", () => {
  const manifest = buildTonConnectManifest("http://localhost:3000");
  assert.deepEqual(manifest, {
    url: "http://localhost:3000",
    name: "Wallet Login",
    iconUrl: "http://localhost:3000/wallet-icon.png",
  });
});

test("withFormattedBalance populates formatted string from bigint value and decimals", () => {
  const raw = {
    value: 1250000000000000000n,
    decimals: 18,
    symbol: "ETH",
  };
  const formatted = withFormattedBalance(raw);
  assert.equal(formatted.formatted, "1.25");
  assert.equal(`${Number(formatted.formatted).toFixed(4)} ${formatted.symbol}`, "1.2500 ETH");
});

test("createEip1193Provider handles connect, accounts, chain switch, personal_sign, and revoke", async () => {
  const provider = createEip1193Provider();
  const initialAccounts = await provider.request({ method: "eth_accounts" });
  assert.deepEqual(initialAccounts, []);

  const requested = await provider.request({ method: "eth_requestAccounts" });
  assert.ok(Array.isArray(requested));
  assert.equal(requested.length, 1);
  assert.equal(requested[0], "0x71C7656EC7ab88b098defB751B7401B5f6d8976F");

  const chainId = await provider.request({ method: "eth_chainId" });
  assert.equal(chainId, "0x1");

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x89" }],
  });
  assert.equal(await provider.request({ method: "eth_chainId" }), "0x89");

  const sig = await provider.request({
    method: "personal_sign",
    params: ["0x48656c6c6f", "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"],
  });
  assert.equal(typeof sig, "string");
  assert.ok((sig as string).startsWith("0x"));
  assert.equal((sig as string).length, 132);

  await provider.request({ method: "wallet_revokePermissions" });
  assert.deepEqual(await provider.request({ method: "eth_accounts" }), []);
});

test("cross-fetch shim delegates safely when globalThis.fetch is getter-only", async () => {
  const shim = await import("./cross-fetch-shim");
  assert.equal(typeof shim.default, "function");
  assert.equal(shim.default, shim.fetch);
  assert.equal(shim.Headers, globalThis.Headers);
  assert.equal(shim.Request, globalThis.Request);
  assert.equal(shim.Response, globalThis.Response);
});

test("disableThirdPartyTelemetry installs a no-op ClientAnalytics stub without overriding existing", async () => {
  const { disableThirdPartyTelemetry } = await import("./wallet-logic");
  const mockWin: Record<string, any> = {};
  disableThirdPartyTelemetry(mockWin);
  assert.equal(typeof mockWin.ClientAnalytics.init, "function");
  assert.equal(typeof mockWin.ClientAnalytics.identify, "function");
  assert.equal(typeof mockWin.ClientAnalytics.logEvent, "function");
  assert.equal(mockWin.ClientAnalytics.PlatformName.web, "web");
  assert.doesNotThrow(() => {
    mockWin.ClientAnalytics.init({});
    mockWin.ClientAnalytics.identify({ deviceId: "test" });
    mockWin.ClientAnalytics.logEvent("test_event", {}, "low");
  });
});

test("isWalletConnectOfflineLog matches only WalletConnect offline relay errors", async () => {
  const { isWalletConnectOfflineLog } = await import("./wallet-logic");

  const pinoJson = JSON.stringify({
    time: 1795300431161,
    level: 50,
    context: "core",
    msg: "No internet connection detected. Please restart your network and try again.",
  });
  assert.equal(isWalletConnectOfflineLog([pinoJson]), true);
  assert.equal(
    isWalletConnectOfflineLog([
      {
        level: 50,
        context: "core/relayer",
        msg: "Couldn't establish socket connection to the relay server: wss://relay.walletconnect.org",
      },
    ]),
    true
  );
  assert.equal(
    isWalletConnectOfflineLog([
      "AppKit:getUniversalProvider - Cannot create provider",
      new Error("No internet connection detected. Please restart your network and try again."),
    ]),
    true
  );

  // Non-offline errors must NOT be swallowed
  assert.equal(
    isWalletConnectOfflineLog([new TypeError("Cannot read properties of undefined")]),
    false
  );
  assert.equal(
    isWalletConnectOfflineLog([
      JSON.stringify({
        time: 1795300431161,
        level: 50,
        context: "core",
        msg: "Invalid projectId format",
      }),
    ]),
    false
  );
});

test("installWalletConnectOfflineGuard downgrades offline logs to warn and preserves other errors", async () => {
  const { installWalletConnectOfflineGuard } = await import("./wallet-logic");
  const errors: unknown[][] = [];
  const warns: unknown[][] = [];
  const mockConsole = {
    error: (...args: unknown[]) => errors.push(args),
    warn: (...args: unknown[]) => warns.push(args),
  };

  const restore = installWalletConnectOfflineGuard(mockConsole);
  // Idempotent second install should be a no-op
  installWalletConnectOfflineGuard(mockConsole);

  const wcOfflinePayload =
    '{"time":1795300431161,"level":50,"context":"core","msg":"No internet connection detected. Please restart your network and try again."}';
  mockConsole.error(wcOfflinePayload);
  mockConsole.error("Real application error", new Error("Boom"));

  assert.equal(warns.length, 1);
  assert.equal(warns[0][1], wcOfflinePayload);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], "Real application error");

  restore();
  mockConsole.error(wcOfflinePayload);
  assert.equal(errors.length, 2);
});
