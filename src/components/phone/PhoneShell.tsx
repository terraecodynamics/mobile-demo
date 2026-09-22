"use client";

import { useEffect, useState } from "react";
import { kronis } from "@/lib/kronis";
import { KronisSplash } from "@/components/ui/KronisSplash";

/** Design phone size (iPhone-ish). Scaled to fit the viewport. */
const FRAME_W = 390;
const FRAME_H = 844;

/**
 * Phone frame only — no bottom nav (matches native pump home).
 * Auto-scales so layout fits at 100% browser zoom (avoids overlap).
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [scale, setScale] = useState(0.82);

  useEffect(() => {
    const update = () => {
      const padX = window.innerWidth < 640 ? 16 : 48;
      const padY = window.innerWidth < 640 ? 12 : 32;
      const availW = Math.max(240, window.innerWidth - padX * 2);
      const availH = Math.max(400, window.innerHeight - padY * 2);
      // Cap below 1 — full 100% frame was overlapping; ~0.82–0.88 matches “80% zoom feels good”
      const next = Math.min(0.86, availW / FRAME_W, availH / FRAME_H);
      setScale(Math.max(0.58, Number(next.toFixed(3))));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const slotW = Math.round(FRAME_W * scale);
  const slotH = Math.round(FRAME_H * scale);

  return (
    <div
      className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden p-2 sm:p-4"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #eef2f7 0%, #c5ccd8 55%, #b4bdc9 100%)",
      }}
    >
      <div
        className="relative shrink-0"
        style={{ width: slotW, height: slotH }}
      >
        <div
          className="absolute left-0 top-0 flex flex-col overflow-hidden"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
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
    </div>
  );
}
