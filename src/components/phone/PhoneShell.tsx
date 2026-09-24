"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { kronis } from "@/lib/kronis";
import { KronisSplash } from "@/components/ui/KronisSplash";

/** Design phone size (iPhone-ish). Scaled to fit desktop viewport. */
const FRAME_W = 390;
const FRAME_H = 844;

/**
 * Desktop: framed phone mockup (unchanged).
 * Real phone / narrow viewport: full-bleed app — no bezel, no scale.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [scale, setScale] = useState(0.82);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  const onBootDone = useCallback(() => setBooted(true), []);

  useEffect(() => {
    const mq = window.matchMedia(
      "(max-width: 640px), (hover: none) and (pointer: coarse)"
    );
    const sync = () => setIsMobile(mq.matches);
    sync();
    setReady(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!ready || isMobile) return;
    const update = () => {
      const padX = window.innerWidth < 640 ? 16 : 48;
      const padY = window.innerWidth < 640 ? 12 : 32;
      const availW = Math.max(240, window.innerWidth - padX * 2);
      const availH = Math.max(400, window.innerHeight - padY * 2);
      const next = Math.min(0.86, availW / FRAME_W, availH / FRAME_H);
      setScale(Math.max(0.58, Number(next.toFixed(3))));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ready, isMobile]);

  // Failsafe: never stay blank if splash callback is interrupted
  useEffect(() => {
    if (booted) return;
    const t = window.setTimeout(() => setBooted(true), 4000);
    return () => window.clearTimeout(t);
  }, [booted]);

  const showMobile = ready && isMobile;

  // Brief hold until we know viewport — avoids SSR/client frame mismatch
  if (!ready) {
    return (
      <div
        className="relative h-dvh w-full"
        style={{ background: kronis.background }}
      >
        <KronisSplash minMs={300} ready onDone={onBootDone} />
      </div>
    );
  }

  // —— Real mobile: fill the device screen ——
  if (showMobile) {
    return (
      <div
        className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden"
        style={
          {
            background: kronis.background,
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
            "--shell-top-inset": "env(safe-area-inset-top, 0px)",
          } as CSSProperties
        }
      >
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
          {booted ? children : null}
        </div>
        {!booted ? (
          <KronisSplash minMs={1800} ready={ready} onDone={onBootDone} />
        ) : null}
      </div>
    );
  }

  // —— Desktop / tablet: phone frame mockup ——
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
      <div className="relative shrink-0" style={{ width: slotW, height: slotH }}>
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
          <div
            className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden pt-10"
            style={{ "--shell-top-inset": "2.5rem" } as CSSProperties}
          >
            {booted ? children : null}
          </div>
          {!booted ? (
            <KronisSplash minMs={1800} ready={ready} onDone={onBootDone} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
