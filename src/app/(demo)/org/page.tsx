"use client";

import { OrgActiveSensorsMap } from "@/components/org/OrgActiveSensorsMap";
import { SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import { placeNameFromLocation, resolveSensorCoords } from "@/lib/orgLocations";
import type { OrgInventoryLive, OrgSummary } from "@/lib/orgMetrics";
import type {
  Organization,
  OrgFarmer,
  OrgSensor,
  OrgShare,
} from "@/lib/orgTypes";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Radio,
  Share2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type OrgOverview = {
  organization: Organization;
  farmers: OrgFarmer[];
  sensors: OrgSensor[];
  shares: OrgShare[];
  inventory?: OrgInventoryLive[];
  summary: OrgSummary;
};

const TYPE_COLORS = {
  soil: "#1FA97A",
  weather: "#1F8FBF",
  environment: "#C9892E",
} as const;

const PAGE_SIZE = 6;

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Last N month buckets from ISO dates → counts (oldest → newest). */
function monthlyCounts(dates: string[], months = 6): number[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const map = new Map(keys.map((k) => [k, 0]));
  for (const raw of dates) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return keys.map((k) => map.get(k) ?? 0);
}

function ChartTip({
  tip,
  children,
}: {
  tip: ReactNode;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tipW = 168;
    const pad = 10;
    const left = Math.min(
      Math.max(pad, r.right - tipW),
      window.innerWidth - tipW - pad
    );
    const below = r.bottom + 8;
    const above = r.top - 8;
    // Prefer below; flip above only when there is clearly more room
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < 120 && above > spaceBelow ? above : below;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  const flipUp = open && pos.top < (anchorRef.current?.getBoundingClientRect().top ?? 0);

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => {
        place();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        place();
        setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[9999] min-w-[168px] rounded-xl px-2.5 py-2 text-left shadow-xl"
              style={{
                top: pos.top,
                left: pos.left,
                transform: flipUp ? "translateY(-100%)" : undefined,
                background: "rgba(23,26,18,0.96)",
                color: "#F4F6EF",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              role="tooltip"
            >
              {tip}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

function TipRow({
  color,
  label,
  value,
  dimmed,
}: {
  color?: string;
  label: string;
  value: string | number;
  dimmed?: boolean;
}) {
  return (
    <span
      className="flex items-center justify-between gap-3 text-[11px] font-semibold leading-tight"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {color ? (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        ) : null}
        <span className="truncate capitalize">{label}</span>
      </span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </span>
  );
}

function MiniBars({
  values,
  colors,
  labels,
  title,
}: {
  values: number[];
  colors: string | string[];
  labels?: string[];
  title?: string;
}) {
  const max = Math.max(1, ...values);
  const tip = (
    <span className="flex flex-col gap-1.5">
      {title ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">{title}</span>
      ) : null}
      {values.map((v, i) => (
        <TipRow
          key={i}
          color={Array.isArray(colors) ? colors[i % colors.length] : colors}
          label={labels?.[i] ?? `Item ${i + 1}`}
          value={v}
        />
      ))}
    </span>
  );
  return (
    <ChartTip tip={tip}>
      <div className="flex h-9 items-end gap-[3px]" aria-hidden>
        {values.map((v, i) => {
          const color = Array.isArray(colors) ? colors[i % colors.length] : colors;
          const h = Math.max(v > 0 ? 18 : 8, Math.round((v / max) * 100));
          return (
            <span
              key={i}
              className="w-[5px] rounded-[2px] sm:w-1.5"
              style={{
                height: `${h}%`,
                background: color,
                opacity: v > 0 ? 0.9 : 0.25,
              }}
            />
          );
        })}
      </div>
    </ChartTip>
  );
}

function monthLabel(offsetFromOldest: number, months: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (months - 1 - offsetFromOldest));
  return d.toLocaleString("en", { month: "short" });
}

function MiniSpark({
  values,
  color,
  title,
}: {
  values: number[];
  color: string;
  title?: string;
}) {
  const w = 72;
  const h = 36;
  const pad = 3;
  const max = Math.max(1, ...values);
  const pts = values.length >= 2 ? values : [0, values[0] ?? 0];
  const coords = pts.map((v, i) => {
    const x = pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const tip = (
    <span className="flex flex-col gap-1.5">
      {title ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">{title}</span>
      ) : null}
      {values.map((v, i) => (
        <TipRow key={i} label={monthLabel(i, values.length)} value={v} />
      ))}
    </span>
  );
  return (
    <ChartTip tip={tip}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-[72px]" aria-hidden>
        <polygon points={area} fill={color} opacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </ChartTip>
  );
}

/** Compact SVG pie — type mix, with hover breakdown. */
function MiniPie({
  parts,
  title,
  size = 36,
}: {
  parts: { label: string; value: number; color: string }[];
  title?: string;
  size?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = parts.reduce((n, p) => n + p.value, 0);
  const r = size / 2;
  const cx = r;
  const cy = r;

  const tip = (
    <span className="flex flex-col gap-1.5">
      {title ? (
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">{title}</span>
      ) : null}
      {parts.map((p, i) => {
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
        return (
          <TipRow
            key={p.label}
            color={p.color}
            label={p.label}
            value={`${p.value} · ${pct}%`}
            dimmed={hoverIdx !== null && hoverIdx !== i}
          />
        );
      })}
      <span
        className="mt-0.5 flex items-center justify-between gap-3 border-t pt-1.5 text-[11px] font-bold"
        style={{ borderColor: "rgba(244,246,239,0.18)" }}
      >
        <span>Total</span>
        <span className="tabular-nums">{total}</span>
      </span>
    </span>
  );

  let body: ReactNode;
  if (total <= 0) {
    body = (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cy} r={r - 0.5} fill="rgba(23,26,18,0.08)" />
      </svg>
    );
  } else {
    const nonZero = parts
      .map((p, i) => ({ ...p, idx: i }))
      .filter((p) => p.value > 0);
    if (nonZero.length === 1) {
      const only = nonZero[0];
      body = (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r - 0.5}
            fill={only.color}
            onMouseEnter={() => setHoverIdx(only.idx)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        </svg>
      );
    } else {
      let angle = -Math.PI / 2;
      const slices = nonZero.map((p) => {
        const sweep = (p.value / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += sweep;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const large = sweep > Math.PI ? 1 : 0;
        return {
          idx: p.idx,
          color: p.color,
          d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
        };
      });
      body = (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {slices.map((s) => (
            <path
              key={s.idx}
              d={s.d}
              fill={s.color}
              opacity={hoverIdx === null || hoverIdx === s.idx ? 1 : 0.35}
              onMouseEnter={() => setHoverIdx(s.idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>
      );
    }
  }

  return <ChartTip tip={tip}>{body}</ChartTip>;
}

function Panel({
  title,
  hint,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex flex-col border bg-white/55 ${className}`}
      style={{ borderColor: "rgba(23,26,18,0.08)", borderRadius: 16 }}
    >
      {(title || action) && (
        <div
          className="flex shrink-0 items-end justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "rgba(23,26,18,0.06)" }}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[14px] font-extrabold tracking-[-0.2px]" style={{ color: kronis.ink }}>
                {title}
              </h2>
            ) : null}
            {hint ? (
              <p className="mt-0.5 text-[12px] font-medium" style={{ color: kronis.inkMuted }}>
                {hint}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      <div className={`min-h-0 flex-1 px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

function RankedList({
  items,
  emptyText,
}: {
  items: { label: string; value: number }[];
  emptyText: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  if (items.length === 0) {
    return (
      <p className="text-[13px] font-medium" style={{ color: kronis.inkMuted }}>
        {emptyText}
      </p>
    );
  }

  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <ul className="divide-y" style={{ borderColor: "rgba(23,26,18,0.06)" }}>
        {slice.map((item, i) => {
          const rank = safePage * PAGE_SIZE + i + 1;
          return (
            <li key={item.label} className="flex items-baseline gap-3 py-2.5 first:pt-0 last:pb-0">
              <span
                className="w-5 shrink-0 text-[11px] font-semibold tabular-nums"
                style={{ color: kronis.inkMuted }}
              >
                {String(rank).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: kronis.ink }}>
                {item.label}
              </span>
              <span className="shrink-0 text-[13px] font-extrabold tabular-nums" style={{ color: kronis.ink }}>
                {item.value}
              </span>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 ? (
        <div
          className="mt-3 flex items-center justify-between border-t pt-3"
          style={{ borderColor: "rgba(23,26,18,0.06)" }}
        >
          <button
            type="button"
            disabled={safePage <= 0}
            className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30"
            style={{ color: kronis.ink }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-30"
            style={{ color: kronis.ink }}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function OrgDashboardPage() {
  const router = useRouter();
  const isWeb = useAppView() === "web";
  const [data, setData] = useState<OrgOverview | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/org", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load organization");
      setData((await res.json()) as OrgOverview);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const charts = useMemo(() => {
    if (!data) return null;
    const farmersById = new Map(data.farmers.map((f) => [f.id, f]));
    const summary = data.summary;

    const byType = (["soil", "weather", "environment"] as const).map((type) => {
      const all = data.sensors.filter((s) => s.type === type);
      const active = all.filter((s) => s.farmerId);
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: all.length,
        active: active.length,
        stock: all.length - active.length,
        color: TYPE_COLORS[type],
      };
    });

    const byModel = Object.values(
      data.sensors.reduce<Record<string, { label: string; value: number; color?: string }>>((acc, s) => {
        const key = s.modelNo || s.model || s.type;
        if (!acc[key]) acc[key] = { label: key, value: 0, color: TYPE_COLORS[s.type] };
        acc[key].value += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.value - a.value);

    const locationCounts = new Map<string, number>();
    for (const s of data.sensors) {
      if (!s.farmerId) continue;
      const farmer = farmersById.get(s.farmerId);
      const place = placeNameFromLocation(s.installLocation, farmer?.village || farmer?.farmName || "");
      if (!place) continue;
      locationCounts.set(place, (locationCounts.get(place) ?? 0) + 1);
    }
    const byLocation = [...locationCounts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    const villageCounts = new Map<string, number>();
    for (const s of data.sensors) {
      if (!s.farmerId) continue;
      const village = farmersById.get(s.farmerId)?.village || "Unknown";
      villageCounts.set(village, (villageCounts.get(village) ?? 0) + 1);
    }
    const byVillage = [...villageCounts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const inventoryRows = data.inventory ?? [];

    const finance = {
      stockCost: summary.inventoryStockValue,
      stockRetail: summary.inventoryRetailValue,
      marginPotential: summary.inventoryMarginPotential,
      sensorInStock: summary.unassignedSensors,
    };

    const mapSensors = data.sensors
      .map((s) => {
        const farmer = s.farmerId ? farmersById.get(s.farmerId) : null;
        const coords = resolveSensorCoords({
          lat: s.lat,
          lng: s.lng,
          installLocation: s.installLocation,
          village: farmer?.village,
        });
        if (!s.farmerId || !coords) return null;
        const placeName = placeNameFromLocation(s.installLocation, farmer?.village || s.label);
        return {
          id: s.id,
          label: s.label,
          type: s.type,
          lat: coords.lat,
          lng: coords.lng,
          placeName,
          farmerName: farmer?.name ?? null,
          installLocation: s.installLocation,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s != null);

    return {
      assigned: summary.assignedSensors,
      stock: summary.unassignedSensors,
      byType,
      byModel,
      byLocation,
      byVillage,
      inventoryRows,
      finance,
      mapSensors,
    };
  }, [data]);

  if (!data || !charts) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ background: kronis.background }}>
        <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
          {error || "Loading organization…"}
        </div>
      </div>
    );
  }

  const deployTotal = Math.max(1, charts.assigned + charts.stock);
  const assignedPct = Math.round((charts.assigned / deployTotal) * 100);

  const farmerMonths = monthlyCounts(data.farmers.map((f) => f.createdAt));
  const shareMonths = monthlyCounts(data.shares.map((s) => s.createdAt));
  const stockByType = (["soil", "weather", "environment"] as const).map((type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: data.sensors.filter((s) => !s.farmerId && s.type === type).length,
    color: TYPE_COLORS[type],
  }));
  const sensorsByType = charts.byType.map((t) => ({
    label: t.label,
    value: t.value,
    color: t.color,
  }));

  const kpis: {
    label: string;
    value: number;
    href: string;
    Icon: typeof Users;
    hint: string;
    chart: ReactNode;
  }[] = [
    {
      label: "Farmers",
      value: data.summary.farmers,
      href: "/org/farmers",
      Icon: Users,
      hint: "Onboarded / month",
      chart: (
        <MiniSpark
          values={farmerMonths}
          color={TYPE_COLORS.soil}
          title="Onboarded / month"
        />
      ),
    },
    {
      label: "Sensors",
      value: data.summary.sensors,
      href: "/org/sensors",
      Icon: Radio,
      hint: "By type mix",
      chart: <MiniPie parts={sensorsByType} size={40} title="Sensors by type" />,
    },
    {
      label: "In stock",
      value: data.summary.unassignedSensors,
      href: "/org/sensors",
      Icon: Radio,
      hint: "Stock by type",
      chart: (
        <MiniBars
          values={stockByType.map((p) => p.value)}
          colors={stockByType.map((p) => p.color)}
          labels={stockByType.map((p) => p.label)}
          title="In stock by type"
        />
      ),
    },
    {
      label: "Shares",
      value: data.summary.shares,
      href: "/org/sensors?tab=shares",
      Icon: Share2,
      hint: "Created / month",
      chart: (
        <MiniSpark
          values={shareMonths}
          color={TYPE_COLORS.environment}
          title="Created / month"
        />
      ),
    },
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className="flex items-start gap-3 px-3.5 pb-3 pt-3 md:px-6 lg:px-8 lg:pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: kronis.inkMuted }}>
            Organization
          </p>
          <h1 className="mt-1 truncate text-[22px] font-extrabold tracking-[-0.4px] sm:text-[26px]" style={{ color: kronis.ink }}>
            {data.organization.name}
          </h1>
        </div>
        <SoftChip
          icon={Plus}
          label={isWeb ? "Onboard farmer" : "Onboard"}
          color={kronis.lime}
          onClick={() => router.push("/org/farmers?onboard=1")}
        />
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3.5 pb-10 md:px-6 lg:px-8">
        {error ? (
          <div
            className="mb-4 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
            style={{ background: kronis.alertBg, color: kronis.alert }}
          >
            {error}
          </div>
        ) : null}

        {/* KPI strip — SoftRaised tiles (same as farmers / sensors) */}
        <div className={`mb-4 grid gap-2.5 ${isWeb ? "grid-cols-4" : "grid-cols-2"}`}>
          {kpis.map((k) => (
            <SoftRaised
              key={k.label}
              className="w-full p-3"
              contentClassName="flex items-center justify-between gap-3"
              radius={16}
              onClick={() => router.push(k.href)}
            >
              <div className="min-w-0">
                <div className="truncate text-[18px] font-extrabold sm:text-[20px]" style={{ color: kronis.ink }}>
                  {k.value}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                  <k.Icon size={11} strokeWidth={2.2} className="shrink-0 opacity-70" />
                  {k.label}
                </div>
                <div className="mt-0.5 truncate text-[10px] font-medium" style={{ color: kronis.inkMuted }}>
                  {k.hint}
                </div>
              </div>
              <div className="shrink-0">{k.chart}</div>
            </SoftRaised>
          ))}
        </div>

        {/* Map + device mix — equal column height on xl */}
        <div className="mb-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Panel
            title="Field map"
            hint={`${charts.mapSensors.length} active placement${charts.mapSensors.length === 1 ? "" : "s"}`}
            className="h-full min-h-0"
            bodyClassName="flex min-h-0 flex-1 flex-col !px-3 !pb-3 pt-3 sm:!px-3"
          >
            <div className="relative min-h-[280px] w-full flex-1 xl:min-h-[320px]">
              <OrgActiveSensorsMap
                sensors={charts.mapSensors}
                fill
                className="absolute inset-0 rounded-xl"
              />
            </div>
          </Panel>

          <div className="flex h-full min-h-0 flex-col gap-5">
            <Panel
              title="Sensors by type"
              hint={`${data.summary.sensors} sensors total`}
              className="flex-1"
            >
              <ul className="space-y-0">
                {charts.byType.map((t) => (
                  <li
                    key={t.label}
                    className="flex items-start justify-between gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
                    style={{ borderColor: "rgba(23,26,18,0.06)" }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: t.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: kronis.ink }}>
                          {t.label}
                        </div>
                        <div className="mt-0.5 text-[12px] font-medium" style={{ color: kronis.inkMuted }}>
                          {t.active} with farmers · {t.stock} in stock
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[16px] font-extrabold tabular-nums leading-none" style={{ color: kronis.ink }}>
                        {t.value}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                        total
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Deployment" className="shrink-0">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[28px] font-extrabold leading-none tracking-[-0.6px]" style={{ color: kronis.ink }}>
                    {assignedPct}%
                  </div>
                  <p className="mt-1 text-[12px] font-medium" style={{ color: kronis.inkMuted }}>
                    of devices assigned to farmers
                  </p>
                </div>
                <div className="text-right text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                  <div>
                    <span style={{ color: kronis.ink }}>{charts.assigned}</span> assigned
                  </div>
                  <div className="mt-0.5">
                    <span style={{ color: kronis.ink }}>{charts.stock}</span> in stock
                  </div>
                </div>
              </div>
              <div
                className="mt-4 h-1 overflow-hidden rounded-full"
                style={{ background: "rgba(23,26,18,0.08)" }}
              >
                <div className="h-full" style={{ width: `${assignedPct}%`, background: kronis.ink }} />
              </div>
              <p className="mt-3 text-[12px] font-medium" style={{ color: kronis.inkMuted }}>
                {data.summary.shares} active share link{data.summary.shares === 1 ? "" : "s"}
              </p>
            </Panel>
          </div>
        </div>

        {/* Inventory + coverage */}
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel
            title="Inventory"
            hint="Stock value and catalog units"
            action={
              <button
                type="button"
                className="text-[12px] font-bold"
                style={{ color: kronis.lime }}
                onClick={() => router.push("/org/sensors")}
              >
                Manage
              </button>
            }
          >
            <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {[
                { label: "Stock cost", value: inr(charts.finance.stockCost) },
                { label: "Retail value", value: inr(charts.finance.stockRetail) },
                { label: "Margin", value: inr(charts.finance.marginPotential) },
                { label: "Sensors stock", value: String(charts.finance.sensorInStock) },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                    {m.label}
                  </div>
                  <div className="mt-1 text-[16px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="no-scrollbar -mx-1 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(23,26,18,0.08)" }}>
                    {["Product", "Owned", "Stock", "Out", "Value"].map((h) => (
                      <th
                        key={h}
                        className="pb-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: kronis.inkMuted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charts.inventoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-[13px] font-medium" style={{ color: kronis.inkMuted }}>
                        No inventory yet.
                      </td>
                    </tr>
                  ) : (
                    charts.inventoryRows.map((row) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid rgba(23,26,18,0.05)" }}>
                        <td className="py-2.5 pr-3">
                          <div className="text-[13px] font-semibold" style={{ color: kronis.ink }}>
                            {row.name}
                          </div>
                          <div className="text-[11px]" style={{ color: kronis.inkMuted }}>
                            {row.sku}
                          </div>
                        </td>
                        <td className="py-2.5 text-[13px] font-semibold tabular-nums" style={{ color: kronis.ink }}>
                          {row.owned}
                        </td>
                        <td className="py-2.5 text-[13px] font-semibold tabular-nums" style={{ color: kronis.ink }}>
                          {row.inStock}
                        </td>
                        <td className="py-2.5 text-[13px] font-semibold tabular-nums" style={{ color: kronis.inkMuted }}>
                          {row.category === "accessory" ? "—" : row.deployed}
                        </td>
                        <td className="py-2.5 text-[13px] font-extrabold tabular-nums" style={{ color: kronis.ink }}>
                          {inr(row.stockValue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="flex flex-col gap-5">
            <Panel title="Locations" hint="Install sites in use">
              <RankedList
                items={charts.byLocation}
                emptyText="Assign sensors to see locations."
              />
            </Panel>
            <Panel title="Villages" hint="Coverage by village">
              <RankedList items={charts.byVillage} emptyText="No village coverage yet." />
            </Panel>
          </div>
        </div>

        {/* Models — compact rows */}
        <Panel title="Models in use" hint={`${charts.byModel.length} SKUs across the fleet`}>
          {charts.byModel.length === 0 ? (
            <p className="text-[13px] font-medium" style={{ color: kronis.inkMuted }}>
              No models yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {charts.byModel.map((m) => (
                <li
                  key={m.label}
                  className="flex items-center justify-between gap-3 border-b py-2.5"
                  style={{ borderColor: "rgba(23,26,18,0.06)" }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: m.color ?? kronis.inkMuted }}
                    />
                    <span className="truncate text-[13px] font-semibold" style={{ color: kronis.ink }}>
                      {m.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-extrabold tabular-nums" style={{ color: kronis.ink }}>
                    {m.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
