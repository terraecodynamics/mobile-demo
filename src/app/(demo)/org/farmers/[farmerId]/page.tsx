"use client";

import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import type { OrgFarmer, OrgSensor, OrgShare } from "@/lib/orgTypes";
import { ArrowLeft, Check, Copy, Link2, Radio, Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Bundle = {
  farmer: OrgFarmer;
  sensors: OrgSensor[];
  shares: OrgShare[];
};

export default function OrgFarmerDetailPage() {
  const router = useRouter();
  const isWeb = useAppView() === "web";
  const params = useParams<{ farmerId: string }>();
  const farmerId = params.farmerId;

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [stock, setStock] = useState<OrgSensor[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [lastShare, setLastShare] = useState<{
    token: string;
    apiUrl: string;
    viewUrl: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const load = useCallback(async () => {
    const [farmerRes, orgRes] = await Promise.all([
      fetch(`/api/org/farmers?id=${encodeURIComponent(farmerId)}`, { cache: "no-store" }),
      fetch("/api/org", { cache: "no-store" }),
    ]);
    if (!farmerRes.ok) {
      setError("Farmer not found");
      return;
    }
    const farmerJson = (await farmerRes.json()) as Bundle;
    setBundle(farmerJson);
    setSelectedSensors(farmerJson.sensors.map((s) => s.id));
    if (orgRes.ok) {
      const orgJson = (await orgRes.json()) as { sensors: OrgSensor[] };
      setStock(orgJson.sensors.filter((s) => !s.farmerId));
    }
  }, [farmerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const apiUrl = useMemo(
    () => `/api/org/sensors?farmerId=${encodeURIComponent(farmerId)}`,
    [farmerId]
  );

  const assign = async (sensorId: string, assignTo: string | null) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/org/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          kind: "sensor",
          deviceId: sensorId,
          farmerId: assignTo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Assign failed");
      await load();
      showToast(assignTo ? "Sensor assigned" : "Sensor returned to stock");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleSensor = (id: string) => {
    setSelectedSensors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createShare = async () => {
    if (!selectedSensors.length) {
      setError("Select at least one sensor to share");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/org/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId,
          sensorIds: selectedSensors,
          label: `${bundle?.farmer.name ?? "Farmer"} sensors`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Share failed");
      setLastShare({
        token: json.share.token,
        apiUrl: json.apiUrl,
        viewUrl: json.viewUrl,
      });
      await load();
      showToast("Share ready");
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

  if (!bundle) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center" style={{ background: kronis.background }}>
        <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
          {error || "Loading farmer…"}
        </div>
      </div>
    );
  }

  const { farmer, sensors, shares } = bundle;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className={`flex items-start gap-2.5 pb-2 pt-2 ${isWeb ? "px-8 pt-6" : "px-3.5"}`}>
        <SoftChip icon={ArrowLeft} onClick={() => router.push("/org")} label="Back" flat />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
            {farmer.name}
          </div>
          <div className="text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            {farmer.farmName} · {farmer.village} · {farmer.phone}
          </div>
        </div>
      </header>

      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10 ${isWeb ? "grid grid-cols-[1.15fr_0.85fr] gap-6 px-8" : "space-y-4 px-3.5"}`}>
        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ background: kronis.alertBg, color: kronis.alert }}>
              {error}
            </div>
          ) : null}

          <section>
            <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
              Sensors & live data
            </div>
            {sensors.length === 0 ? (
              <div className="rounded-[18px] border px-4 py-5 text-[13px] font-semibold" style={{ background: kronis.surface, borderColor: kronis.border, color: kronis.inkMuted }}>
                No sensors on this farmer yet. Assign from stock on the right.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sensors.map((s) => {
                  const latest = s.readings[0];
                  const selected = selectedSensors.includes(s.id);
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
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: kronis.limeSoft }}>
                              <Radio size={16} color={kronis.lime} />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                                {s.label}
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                                {(s.modelNo || s.type) + ` · ${s.serial || s.unitId}`}
                              </div>
                            </div>
                          </div>

                          {latest ? (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="rounded-xl bg-white px-2 py-2 text-center">
                                <div className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                                  {latest.soilPct ?? "—"}
                                  {latest.soilPct != null ? "%" : ""}
                                </div>
                                <div className="text-[9px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                                  SOIL
                                </div>
                              </div>
                              <div className="rounded-xl bg-white px-2 py-2 text-center">
                                <div className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                                  {latest.tempC ?? "—"}
                                  {latest.tempC != null ? "°" : ""}
                                </div>
                                <div className="text-[9px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                                  TEMP
                                </div>
                              </div>
                              <div className="rounded-xl bg-white px-2 py-2 text-center">
                                <div className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                                  {latest.humidityPct ?? "—"}
                                  {latest.humidityPct != null ? "%" : ""}
                                </div>
                                <div className="text-[9px] font-bold tracking-[0.08em]" style={{ color: kronis.inkMuted }}>
                                  RH
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                              No readings yet
                            </p>
                          )}

                          {s.readings.length > 1 ? (
                            <div className="mt-2 text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                              {s.readings.length} readings · last {new Date(latest?.at ?? s.createdAt).toLocaleString()}
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
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <SoftRaised className="w-full p-4" radius={18}>
            <div className="mb-1 flex items-center gap-2">
              <Share2 size={18} color={kronis.lime} />
              <div className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                Share this farmer&apos;s data
              </div>
            </div>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
              Share selected sensors as a public link or API token.
            </p>
            <SoftButton
              label={busy ? "Creating…" : "Create share link"}
              variant="orange"
              className="w-full"
              icon={Link2}
              onClick={createShare}
            />

            <div className="mt-3 rounded-2xl bg-white p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                Farmer API
              </div>
              <code className="mt-1 block break-all text-[11px] font-semibold" style={{ color: kronis.ink }}>
                GET {apiUrl}
              </code>
              <SoftButton
                label="Copy API URL"
                variant="soft"
                className="mt-2 w-full"
                icon={Copy}
                onClick={() => copyText(apiUrl)}
              />
            </div>

            {lastShare ? (
              <div className="mt-3 space-y-2 rounded-2xl bg-white p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                  Latest share
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-[12px] font-semibold"
                  style={{ color: kronis.ink }}
                  onClick={() => copyText(lastShare.apiUrl)}
                >
                  <Copy size={14} />
                  <span className="truncate">{lastShare.apiUrl}</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-[12px] font-semibold"
                  style={{ color: kronis.ink }}
                  onClick={() => copyText(lastShare.viewUrl)}
                >
                  <Link2 size={14} />
                  <span className="truncate">{lastShare.viewUrl}</span>
                </button>
                <SoftButton
                  label="Open shared view"
                  variant="soft"
                  className="w-full"
                  onClick={() => router.push(lastShare.viewUrl)}
                />
              </div>
            ) : null}

            {shares.length ? (
              <div className="mt-3 space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kronis.inkMuted }}>
                  Existing shares
                </div>
                {shares.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left"
                    onClick={() =>
                      setLastShare({
                        token: s.token,
                        apiUrl: `/api/org/sensors?token=${encodeURIComponent(s.token)}`,
                        viewUrl: `/share/${encodeURIComponent(s.token)}`,
                      })
                    }
                  >
                    <span className="truncate text-[12px] font-bold" style={{ color: kronis.ink }}>
                      {s.label}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: kronis.lime }}>
                      {s.token}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </SoftRaised>

          <SoftRaised className="w-full p-4" radius={18}>
            <div className="mb-2 text-[14px] font-extrabold" style={{ color: kronis.ink }}>
              Assign sensor
            </div>
            <p className="mb-3 text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
              Give a sensor from organization stock to this farmer.
            </p>
            {stock.length === 0 ? (
              <div className="text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                No free sensors.{" "}
                <button
                  type="button"
                  className="font-bold"
                  style={{ color: kronis.lime }}
                  onClick={() => router.push("/org/sensors")}
                >
                  Add in Sensors
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {stock.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy}
                    onClick={() => assign(s.id, farmerId)}
                    className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left"
                  >
                    <span>
                      <span className="block text-[13px] font-extrabold" style={{ color: kronis.ink }}>
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
          </SoftRaised>
        </div>
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
