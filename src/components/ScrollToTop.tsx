"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  applySavedScroll,
  markPopRestore,
  saveScroll,
  writeScrollY,
} from "@/lib/scrollMemory";

export default function ScrollToTop() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const popping = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const onPop = () => {
      popping.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onScroll = () => saveScroll(pathname);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("/") && !href.startsWith("//")) saveScroll(pathname);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  useEffect(() => {
    const prev = prevPath.current;
    if (prev && prev !== pathname) {
      saveScroll(prev);
    }

    const restore = popping.current;
    popping.current = false;
    if (restore) markPopRestore(pathname);
    prevPath.current = pathname;

    const apply = () => {
      if (restore) {
        applySavedScroll(pathname);
        return;
      }
      writeScrollY(0);
    };

    apply();
    const frame = window.requestAnimationFrame(apply);
    const later = window.setTimeout(apply, restore ? 80 : 0);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, [pathname]);

  return null;
}
