"use client";

import { useEffect, useState } from "react";

type KronisSplashProps = {
  /** Minimum time to show splash (ms) */
  minMs?: number;
  ready?: boolean;
  onDone?: () => void;
};

/**
 * White screen + centered Kronis logo until the app is ready
 * (matches native SplashScreen).
 */
export function KronisSplash({
  minMs = 2200,
  ready = true,
  onDone,
}: KronisSplashProps) {
  const [minElapsed, setMinElapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), minMs);
    return () => window.clearTimeout(t);
  }, [minMs]);

  useEffect(() => {
    if (!minElapsed || !ready || !visible) return;
    setFading(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 420);
    return () => window.clearTimeout(t);
  }, [minElapsed, ready, visible, onDone]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: "#FFFFFF",
        opacity: fading ? 0 : 1,
        transition: "opacity 400ms ease",
        borderRadius: "inherit",
      }}
      aria-busy="true"
      aria-label="Loading Kronis"
    >
      <style>{`
        @keyframes kronis-splash-in {
          0% { opacity: 0; transform: scale(0.82); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes kronis-splash-pulse {
          0%, 100% { opacity: 0.35; transform: scaleX(0.55); }
          50% { opacity: 0.9; transform: scaleX(1); }
        }
      `}</style>
      <div
        style={{
          animation: "kronis-splash-in 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kronis-logo.svg"
          alt="Kronis"
          width={196}
          height={72}
          style={{ display: "block", width: 196, height: "auto" }}
          draggable={false}
        />
      </div>
      <div
        className="mt-8 h-[3px] w-16 overflow-hidden rounded-full"
        style={{ background: "rgba(236,83,51,0.15)" }}
      >
        <div
          className="h-full w-full origin-center rounded-full"
          style={{
            background: "linear-gradient(90deg, #EC5333, #ff8a5c)",
            animation: "kronis-splash-pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
