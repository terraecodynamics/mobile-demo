"use client";

import { useState } from "react";
import { kronis } from "@/lib/kronis";
import { KronisSplash } from "@/components/ui/KronisSplash";

/** Phone frame only — no bottom nav (matches native pump home) */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);

  return (
    <div
      className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden p-3 sm:p-6"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #eef2f7 0%, #c5ccd8 55%, #b4bdc9 100%)",
      }}
    >
      <div
        className="relative flex h-[min(880px,90dvh)] w-full max-w-[min(390px,calc(90dvh*390/844))] flex-col overflow-hidden"
        style={{
          borderRadius: 40,
          background: kronis.background,
          boxShadow:
            "0 30px 80px rgba(23,26,18,0.28), 0 0 0 11px #1a1d22, 0 0 0 13px #3a3f48",
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-[#1a1d22]" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-10">
          {booted ? children : null}
        </div>
        {!booted ? (
          <KronisSplash minMs={2200} ready onDone={() => setBooted(true)} />
        ) : null}
      </div>
    </div>
  );
}
