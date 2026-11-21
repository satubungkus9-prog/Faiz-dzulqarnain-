import { useState, useEffect } from "react";

const listeners = new Set<(path: string) => void>();

function notifyRouteChange() {
  if (typeof window === "undefined") return;
  const current = window.location.pathname;
  for (const fn of listeners) {
    fn(current);
  }
  window.dispatchEvent(new Event("app-route-change"));
}

const routerInstance = {
  push(href: string) {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== href) {
      window.history.pushState({}, "", href);
    }
    notifyRouteChange();
  },
  replace(href: string) {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== href) {
      window.history.replaceState({}, "", href);
    }
    notifyRouteChange();
  },
  back() {
    if (typeof window === "undefined") return;
    window.history.back();
  },
  forward() {
    if (typeof window === "undefined") return;
    window.history.forward();
  },
  refresh() {
    notifyRouteChange();
  },
  prefetch() {
    // no-op in SPA
  },
};

export function useRouter() {
  return routerInstance;
}

export function usePathname() {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    listeners.add(setPathname);
    window.addEventListener("popstate", update);
    window.addEventListener("app-route-change", update);
    // Sync immediately in case a child useEffect updated history during mount
    update();
    return () => {
      listeners.delete(setPathname);
      window.removeEventListener("popstate", update);
      window.removeEventListener("app-route-change", update);
    };
  }, []);

  return pathname;
}
