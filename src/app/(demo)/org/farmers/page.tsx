"use client";

import { ViewModeToggle, type OrgListView } from "@/components/org/ViewModeToggle";
import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import type { OrgFarmer, OrgSensor } from "@/lib/orgTypes";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(search.get("onboard") === "1");
  const [view, setView] = useState<OrgListView>("card");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [farmName, setFarmName] = useState("");

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

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sensors) {
      if (!s.farmerId) continue;
      map.set(s.farmerId, (map.get(s.farmerId) ?? 0) + 1);
    }
    return map;
  }, [sensors]);

  const onboard = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/org/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, village, farmName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Onboard failed");
      setName("");
      setPhone("");
      setVillage("");
      setFarmName("");
      setShowForm(false);
      await load();
      router.push(`/org/farmers/${json.farmer.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onboard failed");
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
            Onboard farmers, then open one to see sensors and share data
          </div>
        </div>
        <SoftChip icon={Plus} color={kronis.lime} label="Onboard" onClick={() => setShowForm((v) => !v)} />
      </header>

      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-8 ${isWeb ? "px-8" : "px-3.5"}`}>
        {error ? (
          <div className="mb-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
            {error}
          </div>
        ) : null}

        {showForm ? (
          <SoftRaised className="mb-4 w-full p-4" radius={18}>
            <div className="mb-3 text-[15px] font-extrabold" style={{ color: kronis.ink }}>
              Onboard farmer
            </div>
            <div className={isWeb ? "grid grid-cols-2 gap-3" : "space-y-2.5"}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
              />
              <input
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Farm name"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
              />
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
              />
            </div>
            <SoftButton
              label={busy ? "Saving…" : "Save farmer"}
              variant="orange"
              className="mt-3.5 w-full"
              onClick={onboard}
            />
          </SoftRaised>
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
            {farmers.length} farmer{farmers.length === 1 ? "" : "s"}
          </div>
          <ViewModeToggle value={view} onChange={setView} />
        </div>

        {view === "card" ? (
          <div className="space-y-2.5">
            {farmers.map((f) => {
              const sensorCount = counts.get(f.id) ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => router.push(`/org/farmers/${f.id}`)}
                  className="flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left"
                  style={{ background: kronis.surface, borderColor: kronis.border }}
                >
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full text-[12px] font-extrabold"
                    style={{ background: kronis.ink, color: kronis.lime }}
                  >
                    {f.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                      {f.name}
                    </span>
                    <span className="block text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                      {f.farmName} · {f.village} · {sensorCount} sensor{sensorCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight size={18} color={kronis.inkMuted} />
                </button>
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
                  {farmers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3.5 py-6 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                        No farmers onboarded yet.
                      </td>
                    </tr>
                  ) : (
                    farmers.map((f) => {
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
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
