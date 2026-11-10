"use client";

import { OnboardFarmerSheet } from "@/components/org/OnboardFarmerSheet";
import { ViewModeToggle, type OrgListView } from "@/components/org/ViewModeToggle";
import { SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import type { OrgFarmer, OrgSensor } from "@/lib/orgTypes";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 12;

function OrgFarmersPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const isWeb = useAppView() === "web";
  const [farmers, setFarmers] = useState<OrgFarmer[]>([]);
  const [sensors, setSensors] = useState<OrgSensor[]>([]);
  const [summary, setSummary] = useState({
    farmers: 0,
    sensors: 0,
    assignedSensors: 0,
    unassignedSensors: 0,
    shares: 0,
  });
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(search.get("onboard") === "1");
  const [view, setView] = useState<OrgListView>("card");
  const [farmerSearch, setFarmerSearch] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const orgRes = await fetch("/api/org", { cache: "no-store" });
    if (!orgRes.ok) {
      setError("Could not load farmers");
      return;
    }
    const orgJson = (await orgRes.json()) as {
      farmers: OrgFarmer[];
      sensors: OrgSensor[];
      summary: {
        farmers: number;
        sensors: number;
        assignedSensors: number;
        unassignedSensors: number;
        shares: number;
      };
    };
    setFarmers(orgJson.farmers);
    setSensors(orgJson.sensors);
    setSummary(orgJson.summary);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (search.get("onboard") === "1") setShowForm(true);
  }, [search]);

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    if (search.get("onboard") === "1") {
      router.replace("/org/farmers");
    }
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sensors) {
      if (!s.farmerId) continue;
      map.set(s.farmerId, (map.get(s.farmerId) ?? 0) + 1);
    }
    return map;
  }, [sensors]);

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.trim().toLowerCase();
    if (!q) return farmers;
    return farmers.filter((f) => {
      const hay = [f.name, f.phone, f.village, f.farmName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [farmers, farmerSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedFarmers = useMemo(
    () =>
      filteredFarmers.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filteredFarmers, safePage]
  );

  useEffect(() => {
    setPage(0);
  }, [farmerSearch]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const onboard = async (payload: {
    name: string;
    phone: string;
    village: string;
    farmName: string;
  }) => {
    if (!payload.name.trim() || !payload.phone.trim()) {
      setFormError("Name and phone are required");
      return;
    }
    setBusy(true);
    setFormError("");
    setError("");
    try {
      const res = await fetch("/api/org/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Onboard failed");
      setShowForm(false);
      await load();
      router.push(`/org/farmers/${json.farmer.id}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Onboard failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className={`flex items-center gap-2.5 pb-2 pt-2 ${isWeb ? "px-8 pt-6" : "px-3.5"}`}>
        {!isWeb ? (
          <SoftChip icon={ArrowLeft} onClick={() => router.push("/org")} label="Back" flat />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
            Farmers
          </div>
          <div className="text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            Onboard farmers, open one to assign sensors and share data
          </div>
        </div>
        <SoftChip
          icon={Plus}
          color={kronis.lime}
          label="Onboard"
          onClick={() => {
            setFormError("");
            setShowForm(true);
          }}
        />
      </header>

      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-8 ${isWeb ? "px-8" : "px-3.5"}`}>
        {error ? (
          <div className="mb-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
            {error}
          </div>
        ) : null}

        <div className={`mb-4 grid gap-2.5 ${isWeb ? "grid-cols-4" : "grid-cols-2"}`}>
          {[
            { label: "Farmers", value: summary.farmers || farmers.length },
            { label: "Sensors", value: summary.sensors || sensors.length },
            { label: "Assigned", value: summary.assignedSensors },
            { label: "In stock", value: summary.unassignedSensors },
          ].map((s) => (
            <SoftRaised key={s.label} className="w-full p-3" radius={16}>
              <div className="text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                {s.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                {s.label}
              </div>
            </SoftRaised>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
            {farmerSearch.trim()
              ? `${filteredFarmers.length} of ${farmers.length}`
              : `${farmers.length} farmer${farmers.length === 1 ? "" : "s"}`}
          </div>
          <ViewModeToggle value={view} onChange={setView} />
        </div>

        <div className="relative mb-3">
          <Search
            size={15}
            color={kronis.inkMuted}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            value={farmerSearch}
            onChange={(e) => setFarmerSearch(e.target.value)}
            placeholder="Search name, farm, village, phone…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-[13px] font-semibold outline-none"
            style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
          />
        </div>

        {farmers.length === 0 ? (
          <div
            className="rounded-[18px] border px-4 py-5 text-[13px] font-semibold"
            style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}
          >
            No farmers onboarded yet.
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div
            className="rounded-[18px] border px-4 py-5 text-[13px] font-semibold"
            style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}
          >
            No farmers match “{farmerSearch.trim()}”.
          </div>
        ) : (
          <>
            {view === "card" ? (
              <div
                className={`grid gap-2.5 ${
                  isWeb ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {pagedFarmers.map((f) => {
                  const sensorCount = counts.get(f.id) ?? 0;
                  const initials = f.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");
                  return (
                    <SoftRaised
                      key={f.id}
                      className="w-full p-3.5"
                      contentClassName="flex h-full flex-col gap-3"
                      radius={16}
                      onClick={() => router.push(`/org/farmers/${f.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-extrabold"
                          style={{ background: kronis.ink, color: kronis.lime }}
                        >
                          {initials || "?"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-extrabold leading-tight" style={{ color: kronis.ink }}>
                            {f.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                            {f.farmName || "No farm name"}
                          </span>
                        </span>
                        <ChevronRight size={16} color={kronis.inkMuted} className="mt-1 shrink-0 opacity-70" />
                      </div>
                      <div
                        className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5"
                        style={{ borderColor: "rgba(23,26,18,0.08)" }}
                      >
                        <span className="min-w-0 truncate text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                          {f.village || "—"}
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em]"
                          style={{
                            background: sensorCount > 0 ? "rgba(31,169,122,0.14)" : "rgba(23,26,18,0.06)",
                            color: sensorCount > 0 ? "#1FA97A" : kronis.inkMuted,
                          }}
                        >
                          {sensorCount} sensor{sensorCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </SoftRaised>
                  );
                })}
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-[18px] border"
                style={{ background: "#fff", borderColor: kronis.border }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr style={{ background: kronis.background }}>
                        {["Farmer", "Farm", "Village", "Phone", "Sensors", ""].map((h) => (
                          <th
                            key={h || "action"}
                            className="px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
                            style={{ color: kronis.inkMuted }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedFarmers.map((f) => {
                        const sensorCount = counts.get(f.id) ?? 0;
                        return (
                          <tr
                            key={f.id}
                            className="cursor-pointer border-t transition-colors hover:bg-[rgba(23,26,18,0.02)]"
                            style={{ borderColor: kronis.border }}
                            onClick={() => router.push(`/org/farmers/${f.id}`)}
                          >
                            <td className="px-3.5 py-3 text-[13px] font-extrabold" style={{ color: kronis.ink }}>
                              {f.name}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                              {f.farmName || "—"}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                              {f.village || "—"}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                              {f.phone || "—"}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                              {sensorCount}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <ChevronRight size={16} color={kronis.inkMuted} className="inline" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalPages > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  aria-label="Previous farmers page"
                  className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-35"
                  style={{
                    background: "#fff",
                    color: kronis.ink,
                    boxShadow: "0 2px 8px rgba(23,26,18,0.06)",
                  }}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={16} strokeWidth={2.4} />
                </button>
                <div className="text-[11px] font-extrabold" style={{ color: kronis.inkMuted }}>
                  {safePage + 1} / {totalPages}
                  <span className="ml-1.5 font-semibold">· {filteredFarmers.length} total</span>
                </div>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  aria-label="Next farmers page"
                  className="grid h-8 w-8 place-items-center rounded-full disabled:opacity-35"
                  style={{
                    background: "#fff",
                    color: kronis.ink,
                    boxShadow: "0 2px 8px rgba(23,26,18,0.06)",
                  }}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <ChevronRight size={16} strokeWidth={2.4} />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <OnboardFarmerSheet
        open={showForm}
        busy={busy}
        error={formError}
        onClose={closeForm}
        onSave={onboard}
      />
    </div>
  );
}

export default function OrgFarmersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center" style={{ background: kronis.background }}>
          <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
            Loading farmers…
          </div>
        </div>
      }
    >
      <OrgFarmersPageInner />
    </Suspense>
  );
}
