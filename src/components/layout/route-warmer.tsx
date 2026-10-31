"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DASHBOARD_ROUTES = [
  "/",
  "/recovery",
  "/sleep",
  "/activity",
  "/vitals",
  "/lab",
  "/devices",
  "/settings",
];

export function RouteWarmer() {
  const router = useRouter();

  useEffect(() => {
    function warmRoutes() {
      for (const route of DASHBOARD_ROUTES) {
        router.prefetch(route);
        if (process.env.NODE_ENV !== "production") {
          fetch(route, { priority: "low" }).catch(() => {});
        }
      }
    }

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(warmRoutes);
      } else {
        setTimeout(warmRoutes, 300);
      }
    }
  }, [router]);

  return null;
}

