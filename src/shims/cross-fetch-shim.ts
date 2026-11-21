/**
 * Safe browser-native replacement for `cross-fetch`.
 *
 * `cross-fetch/dist/browser-ponyfill.js` attempts `F.prototype = globalThis; this.fetch = false;`
 * which throws `TypeError: Cannot set property fetch of #<Window> which has only a getter`
 * in environments where `window.fetch` is exposed via a getter-only descriptor (such as sandboxed iframes).
 *
 * This shim delegates directly to `globalThis.fetch` without mutating or shadowing `window.fetch`.
 */
export function fetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return globalThis.fetch(input, init);
}

export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;

export default fetch;
