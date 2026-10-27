"use client";

import { useLayoutEffect } from "react";

/** Locks html/body overflow for phone-framed app routes. Landing stays document-scroll. */
export function AppShellLock() {
  useLayoutEffect(() => {
    document.documentElement.classList.add("app-shell");
    document.body.classList.add("app-shell");
    return () => {
      document.documentElement.classList.remove("app-shell");
      document.body.classList.remove("app-shell");
    };
  }, []);
  return null;
}
