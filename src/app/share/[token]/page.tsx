"use client";

import { SoftRaised } from "@/components/ui/SoftUi";
import { kronis } from "@/lib/kronis";
import { Radio } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Reading = {
  at: string;
  soilPct: number | null;
  tempC: number | null;
  humidityPct: number | null;
  rainMm?: number | null;
};

type SharedPayload = {
  source: "share";
  share: { token: string; label: string; createdAt: string };
  organization: { id: string; name: string };
  farmer: {
    id: string;
    name: string;
    village: string;
    farmName: string;
  } | null;
  sensors: Array<{
    id: string;
    type: string;
    label: string;
    unitId: string;
    latest: Reading | null;
    readings: Reading[];
  }>;
};

type ViewMode = "current" | "continuous";

function Sparkline({
  points,
  color = kronis.lime,
}: {
  points: number[];
  color?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-[72px] items-center justify-center text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
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

export default function SharedSensorPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const [data, setData] = useState<SharedPayload | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ViewMode>("continuous");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/org/sensors?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Share not found");
        if (!cancelled) setData(json as SharedPayload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const modes: { id: ViewMode; label: string; hint: string }[] = [
    { id: "current", label: "Current", hint: "Latest reading only" },
    { id: "continuous", label: "Continuous", hint: "History + trend" },
  ];

  return (
    <div className="min-h-dvh px-4 py-8 sm:px-6" style={{ background: kronis.background }}>
      <div className="mx-auto w-full max-w-[640px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kronis-logo.svg" alt="Kronis" className="mx-auto mb-6 h-8 w-auto" />

        {error ? (
          <div className="rounded-2xl px-4 py-3 text-center text-[14px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
            {error}
          </div>
        ) : !data ? (
          <div className="text-center text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
            Loading shared sensors…
          </div>
        ) : (
          <>
            <div className="mb-1 text-center text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: kronis.inkMuted }}>
              Shared by {data.organization.name}
            </div>
            <h1 className="text-center text-[24px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
              {data.share.label}
            </h1>
            {data.farmer ? (
              <p className="mt-1 text-center text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                {data.farmer.name} · {data.farmer.farmName} · {data.farmer.village}
              </p>
            ) : null}

            <div className="mx-auto mt-5 flex w-fit rounded-full p-1" style={{ background: "#fff", boxShadow: "0 4px 12px rgba(23,26,18,0.06)" }}>
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
            <p className="mt-2 text-center text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
              {modes.find((m) => m.id === mode)?.hint}
            </p>

            <div className="mt-5 space-y-3">
              {data.sensors.map((s) => (
                <SensorShareCard key={s.id} sensor={s} mode={mode} />
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
              API · /api/org/sensors?token={data.share.token}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SensorShareCard({
  sensor,
  mode,
}: {
  sensor: SharedPayload["sensors"][number];
  mode: ViewMode;
}) {
  const latest = sensor.latest ?? sensor.readings[0] ?? null;
  const history = useMemo(() => {
    const rows = [...(sensor.readings ?? [])];
    rows.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return rows;
  }, [sensor.readings]);

  const soilSeries = history.map((r) => r.soilPct).filter((v): v is number => v != null);
  const tempSeries = history.map((r) => r.tempC).filter((v): v is number => v != null);
  const humSeries = history.map((r) => r.humidityPct).filter((v): v is number => v != null);

  const primarySeries =
    soilSeries.length >= 2
      ? { label: "Soil moisture", points: soilSeries, color: "#7CB518", unit: "%" }
      : tempSeries.length >= 2
        ? { label: "Temperature", points: tempSeries, color: "#2F80ED", unit: "°C" }
        : humSeries.length >= 2
          ? { label: "Humidity", points: humSeries, color: "#F2994A", unit: "%" }
          : null;

  return (
    <SoftRaised className="w-full p-4" radius={18}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: kronis.limeSoft }}>
          <Radio size={18} color={kronis.lime} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-extrabold" style={{ color: kronis.ink }}>
            {sensor.label}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
            {sensor.type} · {sensor.unitId}
          </div>
        </div>
        {latest ? (
          <div className="shrink-0 text-right text-[10px] font-semibold" style={{ color: kronis.inkMuted }}>
            {formatWhen(latest.at)}
          </div>
        ) : null}
      </div>

      {latest ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white px-2.5 py-2 text-center">
            <div className="text-[16px] font-extrabold" style={{ color: kronis.ink }}>
              {latest.soilPct ?? "—"}
              {latest.soilPct != null ? "%" : ""}
            </div>
            <div className="text-[10px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              SOIL
            </div>
          </div>
          <div className="rounded-xl bg-white px-2.5 py-2 text-center">
            <div className="text-[16px] font-extrabold" style={{ color: kronis.ink }}>
              {latest.tempC ?? "—"}
              {latest.tempC != null ? "°" : ""}
            </div>
            <div className="text-[10px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              TEMP
            </div>
          </div>
          <div className="rounded-xl bg-white px-2.5 py-2 text-center">
            <div className="text-[16px] font-extrabold" style={{ color: kronis.ink }}>
              {latest.humidityPct ?? "—"}
              {latest.humidityPct != null ? "%" : ""}
            </div>
            <div className="text-[10px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              RH
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
          No readings yet
        </p>
      )}

      {mode === "continuous" ? (
        <div className="mt-3 space-y-3">
          {primarySeries ? (
            <div className="rounded-2xl bg-white px-3 py-2.5">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <div className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                  {primarySeries.label}
                </div>
                <div className="text-[10px] font-bold" style={{ color: kronis.inkMuted }}>
                  {primarySeries.points.length} points · {primarySeries.unit}
                </div>
              </div>
              <Sparkline points={primarySeries.points} color={primarySeries.color} />
            </div>
          ) : null}

          <div>
            <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              Reading history
            </div>
            <div className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
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
                  <span className="text-[11px] font-extrabold" style={{ color: kronis.ink }}>
                    {[
                      r.soilPct != null ? `Soil ${r.soilPct}%` : null,
                      r.tempC != null ? `${r.tempC}°C` : null,
                      r.humidityPct != null ? `RH ${r.humidityPct}%` : null,
                      r.rainMm != null ? `Rain ${r.rainMm}mm` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SoftRaised>
  );
}
