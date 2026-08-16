"use client";

import { useEffect } from "react";
import { USE_MOCK } from "@/lib/api-client";

let started = false;

export function MswInit() {
  useEffect(() => {
    if (!USE_MOCK || started) return;
    started = true;

    async function enableMocking() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });
    }

    void enableMocking();
  }, []);

  return null;
}
