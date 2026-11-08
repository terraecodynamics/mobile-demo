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
  MapPinned,
  Plus,
  Radio,
  Share2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrgOverview = {
  organization: Organization;
  farmers: OrgFarmer[];
  sensors: OrgSensor[];
  shares: OrgShare[];
  inventory?: OrgInventoryLive[];
  summary: OrgSummary;
};

const TYPE_COLORS = {
  soil: "#7CB518",
  weather: "#2F80ED",
  environment: "#F2994A",
} as const;

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function BarChart({
  items,
  max,
  color = kronis.lime,
  valueFormat,
}: {
  items: { label: string; value: number; color?: string; hint?: string }[];
  max: number;
  color?: string;
  valueFormat?: (n: number) => string;
}) {
  const scale = max > 0 ? max : 1;
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-[12px] font-bold" style={{ color: kronis.ink }}>
              {item.label}
              {item.hint ? (
                <span className="ml-1.5 font-semibold" style={{ color: kronis.inkMuted }}>
                  {item.hint}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-[12px] font-extrabold" style={{ color: kronis.inkMuted }}>
              {valueFormat ? valueFormat(item.value) : item.value}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(23,26,18,0.06)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(4, (item.value / scale) * 100)}%`,
                background: item.color ?? color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 5;

function PaginatedBarChart({
  items,
  color = kronis.lime,
  emptyText,
}: {
  items: { label: string; value: number; color?: string }[];
  color?: string;
  emptyText: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  if (items.length === 0) {
    return (
      <div className="text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
        {emptyText}
      </div>
    );
  }

  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const max = Math.max(1, ...items.map((x) => x.value));

  return (
    <div>
      <BarChart items={slice} max={max} color={color} />
      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={safePage <= 0}
            aria-label="Previous page"
            className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-35"
            style={{ background: "#fff", color: kronis.ink, boxShadow: "0 2px 8px rgba(23,26,18,0.06)" }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={16} strokeWidth={2.4} />
          </button>
          <div className="text-[11px] font-extrabold" style={{ color: kronis.inkMuted }}>
            {safePage + 1} / {totalPages}
            <span className="ml-1.5 font-semibold">
              · {items.length} total
            </span>
          </div>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
            className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-35"
            style={{ background: "#fff", color: kronis.ink, boxShadow: "0 2px 8px rgba(23,26,18,0.06)" }}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { value: number; color: string; label: string }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(23,26,18,0.06)" strokeWidth="14" />
          {segments.map((seg) => {
            const len = (seg.value / total) * c;
            const el = (
              <circle
                key={seg.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[18px] font-extrabold leading-none" style={{ color: kronis.ink }}>
              {centerValue}
            </div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              {centerLabel}
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seg.color }} />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
              {seg.label}
            </span>
            <span className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
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
    const sensorStockRows = inventoryRows.filter((i) => i.category === "sensor");

    const finance = {
      stockCost: summary.inventoryStockValue,
      stockRetail: summary.inventoryRetailValue,
      units: summary.inventoryStockUnits,
      marginPotential: summary.inventoryMarginPotential,
      sensorInStock: summary.unassignedSensors,
      sensorStockCost: sensorStockRows.reduce((n, i) => n + i.stockValue, 0),
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

  const typeMax = Math.max(1, ...charts.byType.map((x) => x.value));
  const modelMax = Math.max(1, ...charts.byModel.map((x) => x.value), 1);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className={`flex items-start gap-3 pb-2 pt-2 ${isWeb ? "px-8 pt-6" : "px-3.5"}`}>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: kronis.inkMuted }}>
            Dashboard
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
            {data.organization.name}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            Devices · inventory finance · locations · live map
          </div>
        </div>
        <SoftChip
          icon={Plus}
          label="Onboard farmer"
          color={kronis.lime}
          onClick={() => router.push("/org/farmers?onboard=1")}
        />
      </header>

      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-8 ${isWeb ? "px-8" : "px-3.5"}`}>
        {error ? (
          <div className="mb-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
            {error}
          </div>
        ) : null}

        <div className={`mb-5 grid gap-2.5 ${isWeb ? "grid-cols-4" : "grid-cols-2"}`}>
          {[
            { label: "Farmers", value: data.summary.farmers, Icon: Users, href: "/org/farmers" },
            { label: "Sensors", value: data.summary.sensors, Icon: Radio, href: "/org/sensors" },
            { label: "In stock", value: data.summary.unassignedSensors, Icon: Radio, href: "/org/sensors" },
            { label: "Shares", value: data.summary.shares, Icon: Share2, href: "/org/sensors?tab=shares" },
          ].map((s) => (
            <button key={s.label} type="button" onClick={() => router.push(s.href)} className="text-left">
              <SoftRaised className="w-full p-3.5" radius={18}>
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: kronis.limeSoft }}>
                    <s.Icon size={18} color={kronis.lime} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-extrabold" style={{ color: kronis.ink }}>
                      {s.value}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              </SoftRaised>
            </button>
          ))}
        </div>

        <div className={`mb-4 grid gap-3.5 ${isWeb ? "grid-cols-[1.45fr_1fr] items-stretch" : "grid-cols-1"}`}>
          <SoftRaised
            className={`w-full overflow-hidden p-0 ${isWeb ? "h-full min-h-[520px]" : ""}`}
            contentClassName={isWeb ? "flex h-full min-h-0 flex-col" : undefined}
            radius={18}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
              <div>
                <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                  Active sensors map
                </div>
                <div className="text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                  Field placements currently assigned to farmers
                </div>
              </div>
              <MapPinned size={18} color={kronis.lime} />
            </div>
            <div className={`min-h-0 px-3 pb-3 ${isWeb ? "flex flex-1 flex-col" : ""}`}>
              <OrgActiveSensorsMap
                sensors={charts.mapSensors}
                height={isWeb ? undefined : 300}
                className={isWeb ? "min-h-[440px] flex-1" : undefined}
              />
            </div>
          </SoftRaised>

          <div className="flex flex-col gap-3.5">
            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-3 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                Device types
              </div>
              <Donut
                centerLabel="Devices"
                centerValue={data.summary.sensors}
                segments={charts.byType.map((t) => ({
                  label: t.label,
                  value: t.value,
                  color: t.color,
                }))}
              />
              <div className="mt-3 space-y-1.5">
                {charts.byType.map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold"
                    style={{ background: kronis.background }}
                  >
                    <span style={{ color: kronis.ink }}>{t.label}</span>
                    <span style={{ color: kronis.inkMuted }}>
                      {t.active} active · {t.stock} stock
                    </span>
                  </div>
                ))}
              </div>
            </SoftRaised>

            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-3 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                Models in use
              </div>
              <BarChart items={charts.byModel} max={modelMax} />
            </SoftRaised>
          </div>
        </div>

        <div className={`mb-4 grid gap-3.5 ${isWeb ? "grid-cols-2" : "grid-cols-1"}`}>
          <SoftRaised className="w-full p-4" radius={18}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                Inventory finance
              </div>
              <Share2 size={16} color={kronis.inkMuted} />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl px-3 py-3" style={{ background: kronis.limeSoft }}>
                <div className="text-[11px] font-bold" style={{ color: kronis.inkMuted }}>
                  Stock cost
                </div>
                <div className="mt-0.5 text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {inr(charts.finance.stockCost)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-3 py-3">
                <div className="text-[11px] font-bold" style={{ color: kronis.inkMuted }}>
                  Retail value
                </div>
                <div className="mt-0.5 text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {inr(charts.finance.stockRetail)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-3 py-3">
                <div className="text-[11px] font-bold" style={{ color: kronis.inkMuted }}>
                  Margin potential
                </div>
                <div className="mt-0.5 text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {inr(charts.finance.marginPotential)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-3 py-3">
                <div className="text-[11px] font-bold" style={{ color: kronis.inkMuted }}>
                  Sensors in stock
                </div>
                <div className="mt-0.5 text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {charts.finance.sensorInStock}
                </div>
              </div>
            </div>
            <p className="mb-3 text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
              Sensor / pump stock matches device records. Accessories use catalog qty.
            </p>

            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: kronis.border }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr style={{ background: kronis.background }}>
                      {["Product", "Owned", "In stock", "Deployed", "Avg cost", "Stock value"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.08em]"
                          style={{ color: kronis.inkMuted }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {charts.inventoryRows.map((row) => (
                      <tr key={row.id} className="border-t" style={{ borderColor: kronis.border }}>
                        <td className="px-3 py-2.5">
                          <div className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                            {row.name}
                          </div>
                          <div className="text-[10px] font-semibold" style={{ color: kronis.inkMuted }}>
                            {row.sku} · {row.category}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                          {row.owned}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                          {row.inStock}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] font-bold" style={{ color: kronis.lime }}>
                          {row.category === "accessory" ? "—" : row.deployed}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                          {inr(row.unitCost)}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-extrabold" style={{ color: kronis.ink }}>
                          {inr(row.stockValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SoftRaised>

          <div className="space-y-3.5">
            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-3 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                Locations used most
              </div>
              <PaginatedBarChart
                items={charts.byLocation}
                color="#2F80ED"
                emptyText="Assign sensors to see install locations."
              />
            </SoftRaised>

            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-3 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                By village
              </div>
              <PaginatedBarChart
                items={charts.byVillage}
                emptyText="No village coverage yet."
              />
            </SoftRaised>

            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-3 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                Deployment mix
              </div>
              <BarChart
                items={[
                  { label: "Assigned", value: charts.assigned, color: kronis.lime },
                  { label: "In stock", value: charts.stock, color: "#A0A8B0" },
                ]}
                max={Math.max(1, charts.assigned, charts.stock)}
              />
              <div className="mt-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                {data.summary.shares} active share link{data.summary.shares === 1 ? "" : "s"}
              </div>
            </SoftRaised>
          </div>
        </div>
      </div>
    </div>
  );
}
