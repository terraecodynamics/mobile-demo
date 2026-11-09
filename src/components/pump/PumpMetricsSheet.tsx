"use client";

import { useAppView } from "@/components/phone/AppViewProvider";
import { SoftButton, SoftRaised } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { dummyWeeklyStats, dummyWeather } from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import { Activity, Droplets, Gauge, X } from "lucide-react";
import { useMemo, useState } from "react";

type ViewMode = "current" | "continuous";

type MetricReading = {
  at: string;
  flowLpm: number | null;
  soilPct: number;
  tempC: number;
  humidityPct: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  pumpName: string;
  pumpSerial?: string;
  online: boolean;
  running: boolean;
  flowLpm: number | null;
  soilPct: number;
  moistureArmed?: boolean;
  moistureRange?: { startBelow: number; stopAbove: number } | null;
};

function formatWhen(at: string) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Sparkline({
  points,
  color = kronis.lime,
}: {
  points: number[];
  color?: string;
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex h-[72px] items-center justify-center text-[11px] font-semibold"
        style={{ color: kronis.inkMuted }}
      >
        Not enough history
      </div>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 280;
  const h = 72;
  const pad = 4;
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[72px] w-full" preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity="0.14" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Demo continuous series seeded from live flow/soil so the sheet feels live. */
function buildHistory(
  soilPct: number,
  flowLpm: number | null,
  running: boolean
): MetricReading[] {
  const now = Date.now();
  const baseFlow = flowLpm != null && flowLpm > 0 ? flowLpm : running ? 42 : 0;
  const rows: MetricReading[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const wobble = Math.sin(i * 0.9) * 4 + ((i * 3) % 5) - 2;
    const soil = Math.max(18, Math.min(92, Math.round(soilPct + wobble - (11 - i) * 0.4)));
    const flow =
      baseFlow <= 0
        ? i < 3
          ? null
          : Math.max(0, Math.round(8 + (i % 4) * 3))
        : Math.max(0, Math.round(baseFlow + Math.sin(i * 1.1) * 5 + ((i * 2) % 3) - 1));
    rows.push({
      at: new Date(now - i * 45 * 60 * 1000).toISOString(),
      flowLpm: flow === 0 ? (running && i === 0 ? baseFlow : 0) : flow,
      soilPct: soil,
      tempC: Math.round(dummyWeather.temperature + Math.sin(i * 0.7) * 1.5),
      humidityPct: Math.max(
        40,
        Math.min(95, Math.round(dummyWeather.humidity + Math.cos(i * 0.55) * 6))
      ),
    });
  }
  // Pin latest to live values
  rows[rows.length - 1] = {
    ...rows[rows.length - 1],
    at: new Date(now).toISOString(),
    flowLpm,
    soilPct,
    tempC: dummyWeather.temperature,
    humidityPct: dummyWeather.humidity,
  };
  return rows;
}

function StatTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white px-2.5 py-2.5 text-center">
      <div className="text-[17px] font-extrabold leading-none" style={{ color: accent ?? kronis.ink }}>
        {value}
        {unit ? (
          <span className="text-[11px] font-semibold opacity-55">{unit}</span>
        ) : null}
      </div>
      <div
        className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
        style={{ color: kronis.inkMuted }}
      >
        {label}
      </div>
    </div>
  );
}

export function PumpMetricsSheet({
  open,
  onClose,
  pumpName,
  pumpSerial,
  online,
  running,
  flowLpm,
  soilPct,
  moistureArmed,
  moistureRange,
}: Props) {
  const isWeb = useAppView() === "web";
  const [mode, setMode] = useState<ViewMode>("current");

  const history = useMemo(
    () => buildHistory(soilPct, flowLpm, running),
    [soilPct, flowLpm, running]
  );
  const latest = history[history.length - 1];

  const soilSeries = history.map((r) => r.soilPct);
  const flowSeries = history
    .map((r) => r.flowLpm)
    .filter((v): v is number => v != null);

  const weekTotal = dummyWeeklyStats.reduce((sum, d) => sum + d.hours, 0);
  const soilStatus =
    !online
      ? "Sensor offline — last known soil"
      : moistureArmed && moistureRange
        ? soilPct < moistureRange.startBelow
          ? "Below target — watering would start"
          : soilPct > moistureRange.stopAbove
            ? "Above wet limit — pump holds off"
            : "In target moisture band"
        : soilPct < 35
          ? "Soil on the dry side"
          : soilPct > 70
            ? "Soil holding well"
            : "Soil moisture steady";

  const modes: { id: ViewMode; label: string; hint: string }[] = [
    { id: "current", label: "Current", hint: "Live flow + soil snapshot" },
    { id: "continuous", label: "Continuous", hint: "History + trend" },
  ];

  const header = (
    <div>
      <div
        className={isWeb ? "text-[22px] font-extrabold tracking-[-0.3px]" : "text-[17px] font-extrabold"}
        style={{ color: kronis.ink }}
      >
        Flow & soil
      </div>
      <div className="mt-0.5 text-sm font-semibold" style={{ color: kronis.inkMuted }}>
        {pumpName}
        {pumpSerial ? ` · ${pumpSerial}` : ""}
      </div>
    </div>
  );

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="mx-auto mb-4 flex w-fit shrink-0 rounded-full p-1"
        style={{ background: "#fff", boxShadow: "0 4px 12px rgba(23,26,18,0.06)" }}
      >
        {modes.map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className="rounded-full px-4 py-1.5 text-[12px] font-extrabold"
              style={{
                background: on ? kronis.ink : "transparent",
                color: on ? "#fff" : kronis.inkMuted,
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p
        className="mb-4 shrink-0 text-center text-[11px] font-semibold"
        style={{ color: kronis.inkMuted }}
      >
        {modes.find((m) => m.id === mode)?.hint}
      </p>

      <div
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      >
        <SoftRaised className="mb-3 w-full p-4" radius={18}>
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-2xl"
              style={{ background: kronis.limeSoft }}
            >
              {running ? (
                <Activity size={18} color={kronis.lime} />
              ) : (
                <Droplets size={18} color={kronis.lime} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                {online ? (running ? "Pump running" : "Pump idle") : "Pump offline"}
              </div>
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: kronis.inkMuted }}
              >
                {online ? "Live sensors" : "Cached reading"} · {formatWhen(latest.at)}
              </div>
            </div>
            <Gauge size={18} color={kronis.inkMuted} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatTile
              label="Flow"
              value={online && flowLpm != null ? String(Math.round(flowLpm)) : "—"}
              unit={online && flowLpm != null ? " L/min" : undefined}
              accent={running ? kronis.lime : undefined}
            />
            <StatTile label="Soil" value={String(soilPct)} unit="%" />
            <StatTile label="Temp" value={String(latest.tempC)} unit="°" />
            <StatTile label="RH" value={String(latest.humidityPct)} unit="%" />
          </div>

          <p className="mt-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
            {soilStatus}
            {moistureArmed && moistureRange
              ? ` · Target ${moistureRange.startBelow}–${moistureRange.stopAbove}%`
              : ""}
          </p>
        </SoftRaised>

        {mode === "continuous" ? (
          <div className="mb-3 space-y-3">
            <SoftRaised className="w-full p-3.5" radius={18}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <div className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                  Soil moisture
                </div>
                <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                  {soilSeries.length} points · %
                </div>
              </div>
              <Sparkline points={soilSeries} color="#7CB518" />
            </SoftRaised>

            {flowSeries.length >= 2 ? (
              <SoftRaised className="w-full p-3.5" radius={18}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <div className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                    Flow rate
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                    {flowSeries.length} points · L/min
                  </div>
                </div>
                <Sparkline points={flowSeries} color={kronis.lime} />
              </SoftRaised>
            ) : null}

            <div>
              <div
                className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]"
                style={{ color: kronis.inkMuted }}
              >
                Reading history
              </div>
              <div className="space-y-1.5 pb-1 pr-0.5">
                {[...history].reverse().map((r, idx) => (
                  <div
                    key={`${r.at}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    style={{ background: idx === 0 ? kronis.limeSoft : "#fff" }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                      {formatWhen(r.at)}
                      {idx === 0 ? " · now" : ""}
                    </span>
                    <span
                      className="text-right text-[11px] font-extrabold"
                      style={{ color: kronis.ink }}
                    >
                      {[
                        r.flowLpm != null ? `${Math.round(r.flowLpm)} L/min` : null,
                        `Soil ${r.soilPct}%`,
                        `${r.tempC}°C`,
                        `RH ${r.humidityPct}%`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <SoftRaised className="mb-3 w-full p-4" radius={18}>
            <div className="mb-1 flex items-baseline justify-between">
              <div className="text-[13px] font-extrabold" style={{ color: kronis.ink }}>
                This week · runtime
              </div>
              <div className="text-[11px] font-bold" style={{ color: kronis.inkMuted }}>
                {weekTotal.toFixed(1)} h total
              </div>
            </div>
            <div className="mt-3 flex h-28 items-end gap-2 px-1">
              {dummyWeeklyStats.map((d, i) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full origin-bottom rounded-t-md"
                    style={{
                      height: `${Math.max(8, d.hours * 28)}px`,
                      background: `linear-gradient(180deg, ${kronis.lime}, ${kronis.limeDark})`,
                      animation: `kronis-bar-in 400ms cubic-bezier(0.22, 1.2, 0.36, 1) both`,
                      animationDelay: `${i * 45}ms`,
                    }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: kronis.inkMuted }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div
                className="rounded-xl px-2 py-2 text-center"
                style={{ background: kronis.limeSoft }}
              >
                <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                  {Math.max(...dummyWeeklyStats.map((d) => d.hours)).toFixed(1)}h
                </div>
                <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                  Peak day
                </div>
              </div>
              <div className="rounded-xl bg-white px-2 py-2 text-center">
                <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                  {(weekTotal / 7).toFixed(1)}h
                </div>
                <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                  Daily avg
                </div>
              </div>
              <div className="rounded-xl bg-white px-2 py-2 text-center">
                <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                  {dummyWeeklyStats.filter((d) => d.hours > 0).length}
                </div>
                <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                  Active days
                </div>
              </div>
            </div>
          </SoftRaised>
        )}
      </div>

      <SoftButton
        label="Close"
        variant="soft"
        className="mt-auto w-full shrink-0 pt-3"
        onClick={onClose}
      />
    </div>
  );

  if (isWeb) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[80]">
        <button
          type="button"
          aria-label="Close flow and soil"
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />
        <aside
          className="absolute inset-y-0 right-0 flex w-[400px] max-w-[92vw] flex-col border-l p-5 shadow-[-24px_0_60px_rgba(23,26,18,0.22)]"
          style={{
            background: kronis.background,
            borderColor: "rgba(23,26,18,0.08)",
            animation: "kronis-drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <style>{`@keyframes kronis-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
            {header}
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: kronis.surface }}
              aria-label="Close"
            >
              <X size={16} color={kronis.ink} />
            </button>
          </div>
          {body}
        </aside>
      </div>
    );
  }

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      dim
      height="85%"
      maxHeight="85%"
      header={header}
    >
      {body}
    </SheetModal>
  );
}
