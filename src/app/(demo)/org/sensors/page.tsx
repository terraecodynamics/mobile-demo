"use client";

import { TypeableSelect } from "@/components/org/TypeableSelect";
import { ViewModeToggle, type OrgListView } from "@/components/org/ViewModeToggle";
import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import type { OrgFarmer, OrgSensor, OrgShare } from "@/lib/orgTypes";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Plus,
  Radio,
  Share2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

type OrgPayload = {
  farmers: OrgFarmer[];
  sensors: OrgSensor[];
  shares: OrgShare[];
  summary: {
    farmers: number;
    sensors: number;
    assignedSensors: number;
    unassignedSensors: number;
    shares: number;
  };
};

type Tab = "inventory" | "assign" | "shares";

function OrgSensorsPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const isWeb = useAppView() === "web";
  const presetFarmer = search.get("farmerId");
  const presetTab = search.get("tab");
  const initialTab: Tab =
    presetFarmer
      ? "assign"
      : presetTab === "assign" || presetTab === "shares" || presetTab === "inventory"
        ? presetTab
        : "inventory";

  const [data, setData] = useState<OrgPayload | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [listView, setListView] = useState<OrgListView>("card");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [sensorLabel, setSensorLabel] = useState("");
  const [sensorUnit, setSensorUnit] = useState("");
  const [sensorModel, setSensorModel] = useState("Kronis Sense Soil");
  const [sensorModelNo, setSensorModelNo] = useState("");
  const [sensorSerial, setSensorSerial] = useState("");
  const [sensorFirmware, setSensorFirmware] = useState("1.0.0");
  const [sensorLocation, setSensorLocation] = useState("");
  const [sensorPower, setSensorPower] = useState<"battery" | "solar" | "wired">("battery");
  const [sensorNotes, setSensorNotes] = useState("");
  const [sensorType, setSensorType] = useState<"soil" | "weather" | "environment">("soil");
  const [assignFarmerId, setAssignFarmerId] = useState(presetFarmer ?? "");
  const [onboardFarmerId, setOnboardFarmerId] = useState("");
  const [inlineAssign, setInlineAssign] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [lastShare, setLastShare] = useState<{
    token: string;
    apiUrl: string;
    viewUrl: string;
    label?: string;
    farmerName?: string;
  } | null>(null);
  const [shareFarmerFilter, setShareFarmerFilter] = useState("");
  const [shareLocationFilter, setShareLocationFilter] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const load = useCallback(async () => {
    const res = await fetch("/api/org", { cache: "no-store" });
    if (!res.ok) {
      setError("Could not load sensors");
      return;
    }
    const json = (await res.json()) as OrgPayload;
    setData(json);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (presetFarmer) {
      setAssignFarmerId(presetFarmer);
      setTab("assign");
      return;
    }
    if (presetTab === "assign" || presetTab === "shares" || presetTab === "inventory") {
      setTab(presetTab);
    }
  }, [presetFarmer, presetTab]);

  const farmersById = useMemo(() => {
    const map = new Map<string, OrgFarmer>();
    data?.farmers.forEach((f) => map.set(f.id, f));
    return map;
  }, [data]);

  const unassigned = useMemo(
    () => data?.sensors.filter((s) => !s.farmerId) ?? [],
    [data]
  );

  const farmerSensors = useMemo(
    () =>
      data?.sensors.filter((s) => assignFarmerId && s.farmerId === assignFarmerId) ?? [],
    [data, assignFarmerId]
  );

  const shareRows = useMemo(() => {
    if (!data) return [];
    return data.shares.map((share) => {
      const farmer = farmersById.get(share.farmerId) ?? null;
      return {
        share,
        farmer,
        farmerName: farmer?.name ?? "Unknown",
        location: farmer?.village || farmer?.farmName || "—",
      };
    });
  }, [data, farmersById]);

  const shareFarmerOptions = useMemo(() => {
    const names = [...new Set(shareRows.map((r) => r.farmerName))].sort((a, b) => a.localeCompare(b));
    return names;
  }, [shareRows]);

  const shareLocationOptions = useMemo(() => {
    const places = [...new Set(shareRows.map((r) => r.location).filter((x) => x && x !== "—"))].sort((a, b) =>
      a.localeCompare(b)
    );
    return places;
  }, [shareRows]);

  const filteredShareRows = useMemo(() => {
    const farmerQ = shareFarmerFilter.trim().toLowerCase();
    const locationQ = shareLocationFilter.trim().toLowerCase();
    return shareRows.filter((row) => {
      if (farmerQ && !row.farmerName.toLowerCase().includes(farmerQ)) return false;
      if (locationQ && !row.location.toLowerCase().includes(locationQ)) return false;
      return true;
    });
  }, [shareRows, shareFarmerFilter, shareLocationFilter]);

  useEffect(() => {
    if (tab !== "shares" || !filteredShareRows.length) return;
    const stillVisible = lastShare && filteredShareRows.some((r) => r.share.token === lastShare.token);
    if (stillVisible) return;
    const first = filteredShareRows[0];
    setLastShare({
      token: first.share.token,
      apiUrl: `/api/org/sensors?token=${encodeURIComponent(first.share.token)}`,
      viewUrl: `/share/${encodeURIComponent(first.share.token)}`,
      label: first.share.label,
      farmerName: first.farmer?.name,
    });
  }, [tab, filteredShareRows, lastShare]);

  useEffect(() => {
    setSelectedSensors(farmerSensors.map((s) => s.id));
  }, [farmerSensors]);

  const defaultModelFor = (type: "soil" | "weather" | "environment") =>
    type === "soil"
      ? "Kronis Sense Soil"
      : type === "weather"
        ? "Kronis Sense Weather"
        : "Kronis Sense Env";

  const addSensor = async () => {
    if (!sensorLabel.trim()) {
      setError("Enter sensor name");
      return;
    }
    if (!sensorModelNo.trim()) {
      setError("Enter model number");
      return;
    }
    if (!sensorSerial.trim() && !sensorUnit.trim()) {
      setError("Enter serial number");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/org/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-sensor",
          type: sensorType,
          label: sensorLabel,
          unitId: sensorUnit || sensorSerial,
          model: sensorModel || defaultModelFor(sensorType),
          modelNo: sensorModelNo,
          serial: sensorSerial || sensorUnit,
          firmware: sensorFirmware,
          installLocation: sensorLocation,
          powerSource: sensorPower,
          notes: sensorNotes,
          farmerId: onboardFarmerId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add sensor");
      setSensorLabel("");
      setSensorUnit("");
      setSensorModelNo("");
      setSensorSerial("");
      setSensorFirmware("1.0.0");
      setSensorLocation("");
      setSensorPower("battery");
      setSensorNotes("");
      setSensorModel(defaultModelFor(sensorType));
      const givenTo = onboardFarmerId;
      setOnboardFarmerId("");
      await load();
      showToast(givenTo ? "Sensor onboarded for farmer" : "Sensor onboarded to inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add sensor");
    } finally {
      setBusy(false);
    }
  };

  const assign = async (sensorId: string, farmerId: string | null) => {
    if (farmerId !== null && !farmerId.trim()) {
      setError("Pick a farmer to assign");
      return;
    }
    setBusy(true);
    setAssigningId(sensorId);
    setError("");
    try {
      const res = await fetch("/api/org/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          kind: "sensor",
          deviceId: sensorId,
          farmerId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Assign failed");
      setInlineAssign((prev) => {
        const next = { ...prev };
        delete next[sensorId];
        return next;
      });
      await load();
      showToast(farmerId ? "Sensor assigned to farmer" : "Sensor returned to inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setBusy(false);
      setAssigningId(null);
    }
  };

  const toggleSensor = (id: string) => {
    setSelectedSensors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createShare = async () => {
    if (!assignFarmerId) {
      setError("Pick a farmer first");
      return;
    }
    if (!selectedSensors.length) {
      setError("Select at least one sensor to share");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const farmer = farmersById.get(assignFarmerId);
      const res = await fetch("/api/org/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: assignFarmerId,
          sensorIds: selectedSensors,
          label: `${farmer?.name ?? "Farmer"} sensors`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Share failed");
      setLastShare({
        token: json.share.token,
        apiUrl: json.apiUrl,
        viewUrl: json.viewUrl,
        label: json.share.label ?? `${farmer?.name ?? "Farmer"} sensors`,
        farmerName: farmer?.name,
      });
      setTab("shares");
      await load();
      showToast("Share link ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(
        text.startsWith("http") ? text : `${window.location.origin}${text}`
      );
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ background: kronis.background }}>
        <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
          {error || "Loading sensors…"}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "inventory", label: "Inventory" },
    { id: "assign", label: "Assign to farmer" },
    { id: "shares", label: "Share" },
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className={`flex items-start gap-2.5 pb-2 pt-2 ${isWeb ? "px-8 pt-6" : "px-3.5"}`}>
        {!isWeb ? (
          <SoftChip icon={ArrowLeft} onClick={() => router.push("/org")} label="Back" flat />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: kronis.inkMuted }}>
            Sensors
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
            Sensor inventory
          </div>
          <div className="text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            Stock sensors, give them to farmers, manage share links
          </div>
        </div>
        <SoftChip
          icon={Plus}
          color={kronis.lime}
          label="Add sensor"
          onClick={() => setTab("inventory")}
        />
      </header>

      <div className={`flex gap-2 pb-3 ${isWeb ? "px-8" : "px-3.5"}`}>
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="rounded-full px-3.5 py-1.5 text-[12px] font-extrabold"
              style={{
                background: on ? kronis.ink : "#fff",
                color: on ? "#fff" : kronis.inkMuted,
                boxShadow: on ? "none" : "0 4px 12px rgba(23,26,18,0.06)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col ${isWeb ? "px-8" : "px-3.5"} ${
          tab === "inventory" ? "overflow-hidden pb-4" : "no-scrollbar overflow-y-auto pb-10"
        }`}
      >
        {error ? (
          <div className="mb-3 shrink-0 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
            {error}
          </div>
        ) : null}

        {tab !== "shares" ? (
          <div className={`mb-4 grid shrink-0 gap-2.5 ${isWeb ? "grid-cols-5" : "grid-cols-2"}`}>
            {[
              { label: "Farmers", value: data.summary.farmers },
              { label: "Sensors", value: data.summary.sensors },
              { label: "Assigned", value: data.summary.assignedSensors ?? data.sensors.filter((x) => x.farmerId).length },
              { label: "In stock", value: data.summary.unassignedSensors },
              { label: "Shares", value: data.summary.shares },
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
        ) : null}

        {tab === "inventory" ? (
          <div className={`min-h-0 flex-1 gap-5 ${isWeb ? "grid grid-cols-2 overflow-hidden" : "flex flex-col overflow-hidden"}`}>
            <SoftRaised
              className={`w-full p-4 ${isWeb ? "h-full min-h-0" : "shrink-0"}`}
              contentClassName="flex h-full min-h-0 flex-col"
              radius={18}
            >
              <div className="mb-3 shrink-0 text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                Onboard sensor
              </div>
              <div className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                <div>
                  <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                    Type
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["soil", "weather", "environment"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSensorType(t);
                          setSensorModel(defaultModelFor(t));
                        }}
                        className="rounded-full px-3 py-1.5 text-[11px] font-extrabold capitalize"
                        style={{
                          background: sensorType === t ? kronis.ink : "#fff",
                          color: sensorType === t ? "#fff" : kronis.inkMuted,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                    Sensor name
                  </label>
                  <input
                    value={sensorLabel}
                    onChange={(e) => setSensorLabel(e.target.value)}
                    placeholder="Soil · East plot"
                    className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                    Model
                  </label>
                  <select
                    value={sensorModel}
                    onChange={(e) => setSensorModel(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                  >
                    <option>Kronis Sense Soil</option>
                    <option>Kronis Sense Weather</option>
                    <option>Kronis Sense Env</option>
                    <option>Kronis Sense Pro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                      Model no.
                    </label>
                    <input
                      value={sensorModelNo}
                      onChange={(e) => setSensorModelNo(e.target.value)}
                      placeholder="KS-S-100"
                      className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                      style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                      Serial
                    </label>
                    <input
                      value={sensorSerial}
                      onChange={(e) => setSensorSerial(e.target.value)}
                      placeholder="SM-4500-A1"
                      className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                      style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                      Unit / asset id
                    </label>
                    <input
                      value={sensorUnit}
                      onChange={(e) => setSensorUnit(e.target.value)}
                      placeholder="SM-4500"
                      className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                      style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                      Firmware
                    </label>
                    <input
                      value={sensorFirmware}
                      onChange={(e) => setSensorFirmware(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                      style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                    Install location
                  </label>
                  <input
                    value={sensorLocation}
                    onChange={(e) => setSensorLocation(e.target.value)}
                    placeholder="East plot · bed 2"
                    className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                    Power
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["battery", "solar", "wired"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSensorPower(p)}
                        className="rounded-full px-3 py-1.5 text-[11px] font-extrabold capitalize"
                        style={{
                          background: sensorPower === p ? kronis.ink : "#fff",
                          color: sensorPower === p ? "#fff" : kronis.inkMuted,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                    Notes
                  </label>
                  <textarea
                    value={sensorNotes}
                    onChange={(e) => setSensorNotes(e.target.value)}
                    placeholder="Install notes, calibration, etc."
                    rows={2}
                    className="w-full resize-none rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
                    Assign to farmer (optional)
                  </label>
                  <select
                    value={onboardFarmerId}
                    onChange={(e) => setOnboardFarmerId(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                  >
                    <option value="">Keep in inventory</option>
                    {data.farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · {f.farmName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <SoftButton
                label={busy ? "Saving…" : "Onboard sensor"}
                variant="orange"
                className="mt-3 w-full shrink-0"
                onClick={addSensor}
              />
            </SoftRaised>

            <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                <div className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                  All sensors
                </div>
                <ViewModeToggle value={listView} onChange={setListView} />
              </div>
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
                {listView === "card" ? (
                  <div className="space-y-2">
                    {data.sensors.map((s) => {
                      const farmer = s.farmerId ? farmersById.get(s.farmerId) : null;
                      const latest = s.readings[0];
                      const pickFarmer = inlineAssign[s.id] ?? "";
                      const isAssigning = assigningId === s.id;
                      return (
                        <SoftRaised key={s.id} className="w-full p-3.5" radius={18}>
                          <div className="flex items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: kronis.limeSoft }}>
                              <Radio size={18} color={kronis.lime} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                                {s.label}
                              </div>
                              <div className="text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                                {(s.model || s.type) +
                                  (s.modelNo ? ` · ${s.modelNo}` : "") +
                                  ` · ${s.serial || s.unitId}`}
                              </div>
                              <div className="mt-1 text-[12px] font-semibold" style={{ color: farmer ? kronis.ink : kronis.lime }}>
                                {farmer ? `With ${farmer.name}` : "In stock"}
                                {s.installLocation ? ` · ${s.installLocation}` : ""}
                              </div>
                              {latest ? (
                                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                                  {latest.soilPct != null ? (
                                    <span className="rounded-full bg-white px-2 py-1">Soil {latest.soilPct}%</span>
                                  ) : null}
                                  {latest.tempC != null ? (
                                    <span className="rounded-full bg-white px-2 py-1">{latest.tempC}°C</span>
                                  ) : null}
                                  {latest.humidityPct != null ? (
                                    <span className="rounded-full bg-white px-2 py-1">RH {latest.humidityPct}%</span>
                                  ) : null}
                                </div>
                              ) : null}

                              {!s.farmerId ? (
                                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <select
                                    value={pickFarmer}
                                    onChange={(e) =>
                                      setInlineAssign((prev) => ({ ...prev, [s.id]: e.target.value }))
                                    }
                                    className="min-w-0 flex-1 rounded-xl border px-2.5 py-2 text-[12px] font-semibold outline-none"
                                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                                  >
                                    <option value="">Assign to farmer…</option>
                                    {data.farmers.map((f) => (
                                      <option key={f.id} value={f.id}>
                                        {f.name} · {f.farmName}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={busy || !pickFarmer}
                                    className="shrink-0 rounded-full px-3.5 py-2 text-[11px] font-extrabold disabled:opacity-40"
                                    style={{ background: kronis.lime, color: "#fff" }}
                                    onClick={() => assign(s.id, pickFarmer)}
                                  >
                                    {isAssigning ? "Assigning…" : "Assign"}
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <select
                                    value={pickFarmer || s.farmerId}
                                    onChange={(e) =>
                                      setInlineAssign((prev) => ({ ...prev, [s.id]: e.target.value }))
                                    }
                                    className="min-w-0 flex-1 rounded-xl border px-2.5 py-2 text-[12px] font-semibold outline-none"
                                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                                  >
                                    {data.farmers.map((f) => (
                                      <option key={f.id} value={f.id}>
                                        {f.name} · {f.farmName}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="flex shrink-0 gap-2">
                                    <button
                                      type="button"
                                      disabled={busy || !(pickFarmer && pickFarmer !== s.farmerId)}
                                      className="rounded-full px-3.5 py-2 text-[11px] font-extrabold disabled:opacity-40"
                                      style={{ background: kronis.ink, color: "#fff" }}
                                      onClick={() => assign(s.id, pickFarmer || s.farmerId)}
                                    >
                                      {isAssigning ? "…" : "Reassign"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      className="rounded-full px-3.5 py-2 text-[11px] font-extrabold"
                                      style={{ background: "#fff", color: kronis.inkMuted, boxShadow: "0 2px 8px rgba(23,26,18,0.06)" }}
                                      onClick={() => assign(s.id, null)}
                                    >
                                      Return
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </SoftRaised>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="h-full overflow-hidden rounded-[18px] border"
                    style={{ background: "#fff", borderColor: kronis.border }}
                  >
                    <div className="h-full overflow-auto">
                      <table className="w-full min-w-[820px] border-collapse text-left">
                        <thead className="sticky top-0 z-[1]">
                          <tr style={{ background: kronis.background }}>
                            {["Sensor", "Model no.", "Serial", "Type", "Location", "Farmer", "Reading", "Action"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
                                  style={{ color: kronis.inkMuted }}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {data.sensors.map((s) => {
                            const farmer = s.farmerId ? farmersById.get(s.farmerId) : null;
                            const latest = s.readings[0];
                            const pickFarmer = inlineAssign[s.id] ?? "";
                            const isAssigning = assigningId === s.id;
                            const reading =
                              latest == null
                                ? "—"
                                : [
                                    latest.soilPct != null ? `Soil ${latest.soilPct}%` : null,
                                    latest.tempC != null ? `${latest.tempC}°C` : null,
                                    latest.humidityPct != null ? `RH ${latest.humidityPct}%` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "—";
                            return (
                              <tr key={s.id} className="border-t" style={{ borderColor: kronis.border }}>
                                <td className="px-3 py-2.5 text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                                  {s.label}
                                </td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                                  {s.modelNo || "—"}
                                </td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                                  {s.serial || s.unitId || "—"}
                                </td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold capitalize" style={{ color: kronis.inkMuted }}>
                                  {s.type}
                                </td>
                                <td className="px-3 py-2.5 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                                  {s.installLocation || "—"}
                                </td>
                                <td className="px-3 py-2.5">
                                  <select
                                    value={pickFarmer || s.farmerId || ""}
                                    onChange={(e) =>
                                      setInlineAssign((prev) => ({ ...prev, [s.id]: e.target.value }))
                                    }
                                    className="max-w-[140px] rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none"
                                    style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                                  >
                                    <option value="">In stock</option>
                                    {data.farmers.map((f) => (
                                      <option key={f.id} value={f.id}>
                                        {f.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2.5 text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                                  {reading}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={
                                        busy ||
                                        !(pickFarmer || s.farmerId) ||
                                        (pickFarmer || "") === (s.farmerId || "")
                                      }
                                      className="rounded-full px-2.5 py-1 text-[10px] font-extrabold disabled:opacity-40"
                                      style={{ background: kronis.lime, color: "#fff" }}
                                      onClick={() => assign(s.id, pickFarmer || s.farmerId)}
                                    >
                                      {isAssigning ? "…" : s.farmerId ? "Update" : "Assign"}
                                    </button>
                                    {s.farmerId ? (
                                      <button
                                        type="button"
                                        disabled={busy}
                                        className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                                        style={{ background: kronis.background, color: kronis.inkMuted }}
                                        onClick={() => assign(s.id, null)}
                                      >
                                        Return
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "assign" ? (
          <div className={isWeb ? "grid grid-cols-2 gap-5" : "space-y-4"}>
            <section className="space-y-3">
              <SoftRaised className="w-full p-4" radius={18}>
                <div className="mb-2 text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                  Choose farmer
                </div>
                <select
                  value={assignFarmerId}
                  onChange={(e) => setAssignFarmerId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
                  style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
                >
                  <option value="">Select farmer</option>
                  {data.farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} · {f.farmName}
                    </option>
                  ))}
                </select>
              </SoftRaised>

              <div>
                <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                  Stock — give a sensor
                </div>
                {!assignFarmerId ? (
                  <div className="rounded-[18px] border px-4 py-4 text-[13px] font-semibold" style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}>
                    Select a farmer first.
                  </div>
                ) : unassigned.length === 0 ? (
                  <div className="rounded-[18px] border px-4 py-4 text-[13px] font-semibold" style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}>
                    No free sensors. Add one in Inventory.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unassigned.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={busy}
                        onClick={() => assign(s.id, assignFarmerId)}
                        className="flex w-full items-center justify-between rounded-[18px] border px-3.5 py-3 text-left"
                        style={{ background: kronis.surface, borderColor: kronis.border }}
                      >
                        <span>
                          <span className="block text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                            {s.label}
                          </span>
                          <span className="block text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                            {(s.modelNo || s.type) + ` · ${s.serial || s.unitId}`}
                          </span>
                        </span>
                        <span className="text-[12px] font-bold" style={{ color: kronis.lime }}>
                          Assign
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                  Sensors with this farmer
                </div>
                {assignFarmerId ? (
                  <button
                    type="button"
                    className="text-[12px] font-bold"
                    style={{ color: kronis.lime }}
                    onClick={() => router.push(`/org/farmers/${assignFarmerId}`)}
                  >
                    Farmer page
                  </button>
                ) : null}
              </div>

              {!assignFarmerId ? (
                <div className="rounded-[18px] border px-4 py-4 text-[13px] font-semibold" style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}>
                  Pick a farmer to see their sensors.
                </div>
              ) : farmerSensors.length === 0 ? (
                <div className="rounded-[18px] border px-4 py-4 text-[13px] font-semibold" style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}>
                  No sensors given yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {farmerSensors.map((s) => {
                    const selected = selectedSensors.includes(s.id);
                    const latest = s.readings[0];
                    return (
                      <SoftRaised key={s.id} className="w-full p-3.5" radius={18}>
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSensor(s.id)}
                            className="mt-0.5 grid h-6 w-6 place-items-center rounded-full"
                            style={{
                              background: selected ? kronis.lime : "#fff",
                              boxShadow: selected ? "none" : "inset 0 0 0 1.5px rgba(23,26,18,0.2)",
                            }}
                            aria-label={selected ? "Selected for share" : "Select for share"}
                          >
                            {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                              {s.label}
                            </div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                              {(s.modelNo || s.type) + ` · ${s.serial || s.unitId}`}
                            </div>
                            {latest ? (
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                                {latest.soilPct != null ? (
                                  <span className="rounded-full bg-white px-2 py-1">Soil {latest.soilPct}%</span>
                                ) : null}
                                {latest.tempC != null ? (
                                  <span className="rounded-full bg-white px-2 py-1">{latest.tempC}°C</span>
                                ) : null}
                                {latest.humidityPct != null ? (
                                  <span className="rounded-full bg-white px-2 py-1">RH {latest.humidityPct}%</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            className="text-[11px] font-bold"
                            style={{ color: kronis.inkMuted }}
                            onClick={() => assign(s.id, null)}
                          >
                            Return
                          </button>
                        </div>
                      </SoftRaised>
                    );
                  })}
                  <SoftButton
                    label={busy ? "Creating…" : "Share selected sensors"}
                    variant="orange"
                    className="w-full"
                    icon={Share2}
                    onClick={createShare}
                  />
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "shares" ? (
          <div className={`gap-5 ${isWeb ? "grid grid-cols-[1.1fr_0.9fr]" : "space-y-4"}`}>
            <SoftRaised className="w-full p-4" radius={18}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                    Share links
                  </div>
                  <div className="text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                    {filteredShareRows.length}
                    {filteredShareRows.length !== shareRows.length
                      ? ` of ${shareRows.length}`
                      : ""}{" "}
                    active
                  </div>
                </div>
                <SoftChip
                  icon={Plus}
                  color={kronis.lime}
                  label="New"
                  onClick={() => setTab("assign")}
                />
              </div>

              {shareRows.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                      Farmer
                    </label>
                    <TypeableSelect
                      value={shareFarmerFilter}
                      options={shareFarmerOptions}
                      placeholder="Type farmer name…"
                      allLabel="All farmers"
                      onChange={setShareFarmerFilter}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                      Location
                    </label>
                    <TypeableSelect
                      value={shareLocationFilter}
                      options={shareLocationOptions}
                      placeholder="Type location…"
                      allLabel="All locations"
                      onChange={setShareLocationFilter}
                    />
                  </div>
                </div>
              ) : null}

              {shareFarmerFilter || shareLocationFilter ? (
                <button
                  type="button"
                  className="mt-2 text-[11px] font-bold"
                  style={{ color: kronis.lime }}
                  onClick={() => {
                    setShareFarmerFilter("");
                    setShareLocationFilter("");
                  }}
                >
                  Clear filters
                </button>
              ) : null}

              {shareRows.length === 0 ? (
                <div className="mt-4 rounded-2xl px-4 py-5 text-center" style={{ background: kronis.background }}>
                  <div className="text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                    No shares yet
                  </div>
                  <p className="mt-1 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                    Assign sensors to a farmer, then create a share.
                  </p>
                  <SoftButton
                    label="Go to Assign"
                    variant="orange"
                    className="mt-3"
                    onClick={() => setTab("assign")}
                  />
                </div>
              ) : filteredShareRows.length === 0 ? (
                <div className="mt-4 rounded-2xl px-4 py-4 text-[13px] font-semibold" style={{ background: kronis.background, color: kronis.inkMuted }}>
                  No shares match these filters.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {filteredShareRows.map(({ share, farmer, location }) => {
                    const selected = lastShare?.token === share.token;
                    return (
                      <button
                        key={share.id}
                        type="button"
                        onClick={() =>
                          setLastShare({
                            token: share.token,
                            apiUrl: `/api/org/sensors?token=${encodeURIComponent(share.token)}`,
                            viewUrl: `/share/${encodeURIComponent(share.token)}`,
                            label: share.label,
                            farmerName: farmer?.name,
                          })
                        }
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors"
                        style={{
                          background: selected ? kronis.limeSoft : "#fff",
                          boxShadow: selected ? "inset 0 0 0 1.5px rgba(124,181,24,0.45)" : "none",
                        }}
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                          style={{ background: selected ? "#fff" : kronis.limeSoft }}
                        >
                          <Share2 size={16} color={kronis.lime} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                            {farmer?.name ?? "Farmer"}
                          </span>
                          <span className="block truncate text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                            {location}
                            {" · "}
                            {share.sensorIds.length} sensor{share.sensorIds.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </SoftRaised>

            <SoftRaised className="w-full p-4" radius={18}>
              {!lastShare ? (
                <div className="py-8 text-center text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  Select a share to copy or open it.
                </div>
              ) : (
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                    Selected
                  </div>
                  <div className="mt-1 text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                    {lastShare.farmerName ?? "Share"}
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                    {lastShare.label || "Sensor data share"}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <SoftButton
                      label="Open link"
                      variant="orange"
                      className="w-full"
                      icon={ExternalLink}
                      onClick={() => router.push(lastShare.viewUrl)}
                    />
                    <SoftButton
                      label="Copy share link"
                      variant="soft"
                      className="w-full"
                      icon={Link2}
                      onClick={() => copyText(lastShare.viewUrl)}
                    />
                    <SoftButton
                      label="Copy API link"
                      variant="soft"
                      className="w-full"
                      icon={Copy}
                      onClick={() => copyText(lastShare.apiUrl)}
                    />
                  </div>

                  <div
                    className="mt-4 rounded-2xl px-3.5 py-3"
                    style={{ background: kronis.background }}
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                      API
                    </div>
                    <code className="mt-1 block break-all text-[11px] font-semibold" style={{ color: kronis.ink }}>
                      {lastShare.apiUrl}
                    </code>
                  </div>
                </div>
              )}
            </SoftRaised>
          </div>
        ) : null}
      </div>

      {toast ? (
        <div
          className="pointer-events-none absolute inset-x-4 bottom-6 z-20 mx-auto max-w-sm rounded-2xl px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg"
          style={{ background: "rgba(23,26,18,0.92)" }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default function OrgSensorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center" style={{ background: kronis.background }}>
          <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
            Loading sensors…
          </div>
        </div>
      }
    >
      <OrgSensorsPageInner />
    </Suspense>
  );
}
