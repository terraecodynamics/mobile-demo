"use client";

import { useEffect, useMemo, useState } from "react";

export type WeatherKind = "sunny" | "cloudy" | "rain";

type Props = {
  initial?: WeatherKind;
  place?: string;
  sheetHeight?: number;
  /** Auto-switch rain → sunny (default 1 min) */
  sunnyAfterMs?: number;
};

const CYCLE: WeatherKind[] = ["rain", "cloudy", "sunny"];

const LABEL: Record<WeatherKind, string> = {
  sunny: "Sunny",
  cloudy: "Mostly Cloudy",
  rain: "Rain",
};

const TEMPS: Record<WeatherKind, { now: number; high: number; low: number }> = {
  rain: { now: 28, high: 29, low: 25 },
  cloudy: { now: 30, high: 32, low: 26 },
  sunny: { now: 35, high: 35, low: 25 },
};

function useRainDrops(count = 36) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: ((i * 37) % 100) + (i % 7) * 0.4,
        delay: (i % 17) * 0.18,
        duration: 0.95 + (i % 9) * 0.14,
        height: 12 + (i % 5) * 5,
        opacity: 0.22 + (i % 4) * 0.1,
        thick: i % 5 === 0 ? 1.5 : 1,
      })),
    [count]
  );
}

function useClockLabel() {
  const [label, setLabel] = useState(() => formatTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setLabel(formatTime(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return label;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Apple Weather–inspired atmosphere — soft crossfades, glass chip, map-only.
 */
export function WeatherAtmosphere({
  initial = "rain",
  place = "Field",
  sheetHeight = 0,
  sunnyAfterMs = 60 * 1000,
}: Props) {
  const [kind, setKind] = useState<WeatherKind>(initial);
  const drops = useRainDrops();
  const timeLabel = useClockLabel();
  const temps = TEMPS[kind];

  // Alternate rain ↔ sunny every minute
  useEffect(() => {
    if (sunnyAfterMs <= 0) return;
    const id = window.setInterval(() => {
      setKind((k) => (k === "rain" ? "sunny" : "rain"));
    }, sunnyAfterMs);
    return () => window.clearInterval(id);
  }, [sunnyAfterMs]);

  const cycle = () => {
    setKind((k) => CYCLE[(CYCLE.indexOf(k) + 1) % CYCLE.length]);
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[25] overflow-hidden"
      style={{ bottom: Math.max(0, sheetHeight) }}
    >
      {/* Soft sky wash — crossfades */}
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: kind === "sunny" ? 1 : 0,
          background:
            "linear-gradient(125deg, transparent 35%, rgba(140,200,245,0.1) 55%, rgba(255,230,160,0.14) 78%, rgba(255,220,120,0.2) 100%)",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: kind === "cloudy" ? 1 : 0,
          background:
            "linear-gradient(180deg, rgba(175,195,215,0.28) 0%, rgba(140,160,180,0.12) 48%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: kind === "rain" ? 1 : 0,
          background:
            "linear-gradient(180deg, rgba(45,58,75,0.34) 0%, rgba(35,45,60,0.16) 42%, transparent 74%)",
        }}
      />

      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{ opacity: kind === "sunny" ? 1 : 0 }}
      >
        <SunnyLayer />
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{ opacity: kind === "cloudy" ? 1 : 0 }}
      >
        <CloudyLayer />
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
        style={{ opacity: kind === "rain" ? 1 : 0 }}
      >
        <CloudyLayer storm />
        <RainLayer drops={drops} />
      </div>

      {/* Glass forecast card */}
      <button
        type="button"
        onClick={cycle}
        className="wx-card pointer-events-auto absolute bottom-3 left-3.5 z-[26] w-[min(168px,48%)] overflow-hidden rounded-[18px] px-2.5 py-2 text-left text-white active:scale-[0.985]"
        style={{
          background:
            kind === "sunny"
              ? "linear-gradient(155deg, rgba(110,185,240,0.82) 0%, rgba(55,145,210,0.78) 48%, rgba(40,110,175,0.8) 100%)"
              : kind === "cloudy"
                ? "linear-gradient(155deg, rgba(155,175,195,0.82) 0%, rgba(100,125,150,0.8) 100%)"
                : "linear-gradient(155deg, rgba(75,90,110,0.84) 0%, rgba(40,50,65,0.88) 100%)",
          boxShadow:
            "0 10px 28px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.28)",
          backdropFilter: "blur(18px) saturate(1.25)",
          WebkitBackdropFilter: "blur(18px) saturate(1.25)",
          border: "1px solid rgba(255,255,255,0.22)",
          transition:
            "background 1.2s ease, box-shadow 1.2s ease, transform 160ms ease",
        }}
        aria-label={`Weather ${LABEL[kind]}. Tap to change.`}
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
          {(kind === "rain" || kind === "cloudy") && (
            <>
              <span
                className="wx-cloud absolute -left-4 top-0 h-11 w-24 rounded-full blur-[8px]"
                style={{
                  background:
                    kind === "rain"
                      ? "rgba(160,175,195,0.45)"
                      : "rgba(255,255,255,0.32)",
                }}
              />
              <span
                className="wx-cloud-slow absolute left-[30%] top-2 h-9 w-28 rounded-full blur-[7px]"
                style={{
                  background:
                    kind === "rain"
                      ? "rgba(110,125,145,0.4)"
                      : "rgba(255,255,255,0.24)",
                  animationDelay: "-3s",
                }}
              />
              <span
                className="wx-cloud absolute -right-3 top-0 h-12 w-24 rounded-full blur-[9px]"
                style={{
                  background:
                    kind === "rain"
                      ? "rgba(80,95,115,0.45)"
                      : "rgba(255,255,255,0.28)",
                  animationDelay: "-6s",
                }}
              />
            </>
          )}
          {kind === "rain"
            ? drops.slice(0, 12).map((d) => (
                <span
                  key={`chip-${d.id}`}
                  className="wx-rain-drop absolute"
                  style={{
                    left: `${d.left}%`,
                    height: d.height * 0.5,
                    width: d.thick,
                    opacity: d.opacity * 0.85,
                    animationDelay: `${d.delay}s`,
                    animationDuration: `${d.duration}s`,
                  }}
                />
              ))
            : null}
          {kind === "sunny" ? (
            <>
              <span
                className="wx-sun-glow absolute -right-10 -top-12 h-28 w-28 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,248,220,0.95) 0%, rgba(255,225,120,0.4) 34%, rgba(255,200,80,0.12) 58%, transparent 72%)",
                }}
              />
              <span
                className="wx-sun-flare absolute right-1 top-0 h-9 w-9 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,235,180,0.3) 48%, transparent 72%)",
                }}
              />
            </>
          ) : null}
        </span>

        <span className="relative z-[1] flex items-start justify-between gap-1.5">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-[-0.2px]">
              {place}
            </span>
            <span className="mt-px block text-[10px] font-medium tracking-wide opacity-85">
              {timeLabel}
            </span>
          </span>
          <span className="shrink-0 text-[24px] font-extralight leading-none tracking-tight">
            {temps.now}°
          </span>
        </span>
        <span className="relative z-[1] mt-1.5 flex items-center justify-between text-[10px] font-medium leading-none tracking-wide">
          <span className="opacity-95">{LABEL[kind]}</span>
          <span className="opacity-90">
            H:{temps.high}° L:{temps.low}°
          </span>
        </span>
      </button>
    </div>
  );
}

function SunnyLayer() {
  return (
    <>
      {/* Sun locked to top-right corner — keep pump/field clear */}
      <div
        className="wx-sun-glow absolute right-[-18%] top-[-22%] h-52 w-52 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,248,220,0.7) 0%, rgba(255,220,110,0.3) 30%, rgba(255,190,70,0.1) 50%, transparent 70%)",
        }}
      />
      <div
        className="wx-sun-flare absolute right-[2%] top-[1%] h-16 w-16 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,235,170,0.2) 42%, transparent 70%)",
        }}
      />
      <div
        className="wx-sun-rays absolute right-[-28%] top-[-30%] h-64 w-64 opacity-26"
        style={{
          background:
            "conic-gradient(from 230deg at 82% 15%, transparent 0deg, rgba(255,240,190,0.4) 10deg, transparent 24deg, rgba(255,230,160,0.22) 40deg, transparent 58deg)",
        }}
      />
      <div
        className="wx-cloud-slow absolute left-[4%] top-[10%] h-12 w-32 rounded-[50%] blur-[18px]"
        style={{ background: "rgba(255,255,255,0.12)", animationDelay: "-5s" }}
      />
    </>
  );
}

function CloudyLayer({ storm = false }: { storm?: boolean }) {
  const soft = storm ? "rgba(100,116,139,0.48)" : "rgba(255,255,255,0.36)";
  const mid = storm ? "rgba(71,85,105,0.42)" : "rgba(255,255,255,0.26)";
  const deep = storm ? "rgba(51,65,85,0.5)" : "rgba(241,245,249,0.3)";
  const light = storm ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.2)";

  return (
    <>
      <div
        className="wx-cloud absolute -left-[10%] top-[4%] h-28 w-52 rounded-[50%] blur-[20px]"
        style={{ background: soft }}
      />
      <div
        className="wx-cloud-slow absolute left-[18%] top-[1%] h-24 w-60 rounded-[50%] blur-[18px]"
        style={{ background: mid }}
      />
      <div
        className="wx-cloud absolute right-[-10%] top-[8%] h-32 w-56 rounded-[50%] blur-[22px]"
        style={{ background: deep, animationDelay: "-4s" }}
      />
      <div
        className="wx-cloud-slow absolute left-[6%] top-[16%] h-20 w-44 rounded-[50%] blur-[16px]"
        style={{ background: light, animationDelay: "-7s" }}
      />
      <div
        className="wx-cloud absolute left-[35%] top-[10%] h-[5.5rem] w-48 rounded-[50%] blur-[18px]"
        style={{ background: mid, animationDelay: "-2s" }}
      />
    </>
  );
}

function RainLayer({
  drops,
}: {
  drops: ReturnType<typeof useRainDrops>;
}) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(60,75,95,0.28) 0%, transparent 55%)",
        }}
      />
      {drops.map((d) => (
        <span
          key={d.id}
          className="wx-rain-drop absolute top-[-40px] z-[1]"
          style={{
            left: `${d.left}%`,
            height: d.height,
            width: d.thick,
            opacity: d.opacity,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </>
  );
}
