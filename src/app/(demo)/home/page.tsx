"use client";

import { PumpHomeAppBar } from "@/components/pump/PumpHomeAppBar";
import { MapStage } from "@/components/pump/MapStage";
import { PumpControlSheet } from "@/components/pump/PumpControlSheet";
import { PumpPickerSheet } from "@/components/pump/PumpPickerSheet";
import {
  SoilTargetSheet,
  type SoilTargetPayload,
} from "@/components/pump/SoilTargetSheet";
import {
  WateringTimesSheet,
  type SchedulePayload,
} from "@/components/pump/WateringTimesSheet";
import { SoftButton, SoftChip } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import {
  dummyNotifications,
  dummyPumps,
  dummyUser,
  dummyWeeklyStats,
  type DummyPump,
} from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import {
  buildHomePumpsFromAssignments,
  setLiveFarmFile,
  type FarmBoundariesFile,
} from "@/lib/fieldGeometry";
import {
  playDialClick,
  playPumpStartSound,
  playPumpStopSound,
  preloadPumpSounds,
  togglePumpSoundMuted,
} from "@/lib/pumpSounds";
import { Expand } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Native pumpHomeSheetHeight, but never taller than the stage.
 * Always leave a map strip (~130px) so mute/rentals/expand sit on the map.
 */
function sheetHeightFor(stageH: number) {
  const usable = Math.max(1, stageH);
  const mapReserve = 150;
  let sheet: number;
  if (usable < 600) sheet = Math.round(usable * 0.62);
  else if (usable < 700) sheet = Math.round(usable * 0.58);
  else sheet = Math.min(Math.round(usable * 0.54), usable - 160);
  return Math.min(sheet, Math.max(240, usable - mapReserve));
}

function formatRemaining(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Landing screen — Start/Stop bound like native Pump Home:
 * optimistic running → map water spray → start/stop SFX → dial clicks → mute.
 */
export default function HomePage() {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageH, setStageH] = useState(640);
  const [selectedId, setSelectedId] = useState(dummyPumps[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [soilTargetOpen, setSoilTargetOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [moistureRule, setMoistureRule] = useState<SoilTargetPayload>({
    startBelow: 30,
    stopAbove: 60,
    isEnabled: true,
  });
  const [scheduleRule, setScheduleRule] = useState<SchedulePayload | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [runningOverride, setRunningOverride] = useState<boolean | null>(null);
  const [powerLoading, setPowerLoading] = useState(false);
  const [flowOverride, setFlowOverride] = useState<number | null>(null);
  const [geoTick, setGeoTick] = useState(0);
  const toggleLock = useRef(false);

  useEffect(() => {
    preloadPumpSounds();
  }, []);

  // Pull latest farm-boundaries.json so Done geofences show on this map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/farm-boundaries");
        if (!res.ok) return;
        const file = (await res.json()) as FarmBoundariesFile;
        if (cancelled) return;
        setLiveFarmFile(file);
        setGeoTick((n) => n + 1);
      } catch {
        /* keep bundled JSON */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const geofenceScene = useMemo(
    () =>
      buildHomePumpsFromAssignments(
        dummyPumps.map((p) => ({
          id: p.id,
          name: p.name,
          number: p.number,
        }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geoTick]
  );

  const pumps: DummyPump[] = useMemo(() => {
    if (geofenceScene?.pumps?.length) return geofenceScene.pumps;
    return dummyPumps;
  }, [geofenceScene]);

  const fenceFields = geofenceScene?.fences;

  useEffect(() => {
    if (!geofenceScene?.pumps?.length) return;
    setSelectedId(geofenceScene.pumps[0].id);
  }, [geofenceScene]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setStageH(entry.contentRect.height);
    });
    ro.observe(el);
    setStageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const pump = useMemo(
    () => pumps.find((p) => p.id === selectedId) || pumps[0],
    [pumps, selectedId]
  );

  const running = runningOverride ?? pump.running;
  const offline = !pump.online;
  const unread = dummyNotifications.filter((n) => n.unread).length;
  const sheetH = sheetHeightFor(stageH);

  const displayFlow =
    flowOverride != null
      ? flowOverride
      : running
        ? pump.flowLpm && pump.flowLpm > 0
          ? pump.flowLpm
          : 42
        : pump.flowLpm;

  // Countdown while running with a dial timer (native remainingMinutes)
  useEffect(() => {
    if (!running || remainingMinutes == null || remainingMinutes <= 0) return;
    const id = window.setInterval(() => {
      setRemainingMinutes((prev) => {
        if (prev == null) return prev;
        const next = Math.max(0, prev - 1 / 60);
        if (next <= 0) {
          playPumpStopSound();
          setRunningOverride(false);
          setFlowOverride(0);
          setTimerMinutes(0);
          return null;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, remainingMinutes]);

  // Simulated live flow jitter while running
  useEffect(() => {
    if (!running || offline) {
      if (!running) setFlowOverride(null);
      return;
    }
    setFlowOverride(displayFlow || 42);
    const id = window.setInterval(() => {
      setFlowOverride((prev) => {
        const base = prev ?? 42;
        const wobble = (Math.random() - 0.5) * 2.4;
        return Math.max(18, Math.min(72, Math.round((base + wobble) * 10) / 10));
      });
    }, 1800);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, offline, selectedId]);

  const statusTitle = offline
    ? "Pump is offline"
    : running
      ? "Pump is on"
      : "Pump is off";
  const statusSubtitle = offline
    ? `Last seen ${pump.lastSeen}`
    : running
      ? remainingMinutes != null && remainingMinutes > 0
        ? `Running · ${formatRemaining(remainingMinutes)} left`
        : timerMinutes > 0
          ? `Running · ${formatRemaining(timerMinutes)}`
          : "Running"
      : "Tap Start to run";

  const handleTogglePower = async () => {
    if (offline || powerLoading || toggleLock.current) return;
    toggleLock.current = true;
    setPowerLoading(true);

    const nextRunning = !running;

    // Immediate SFX + optimistic UI (native handleTogglePower)
    if (nextRunning) playPumpStartSound();
    else playPumpStopSound();

    setRunningOverride(nextRunning);
    if (nextRunning) {
      setFlowOverride(timerMinutes > 0 ? 38 : 42);
      if (timerMinutes > 0) setRemainingMinutes(timerMinutes);
      else setRemainingMinutes(null);
    } else {
      setFlowOverride(0);
      setRemainingMinutes(null);
    }

    // Brief loading pulse like native power request
    await new Promise((r) => setTimeout(r, 280));
    setPowerLoading(false);
    toggleLock.current = false;
  };

  const handleTimerChange = (m: number) => {
    if (m !== timerMinutes) playDialClick();
    setTimerMinutes(m);
    if (running && m > 0) setRemainingMinutes(m);
  };

  const handleMute = () => {
    const next = togglePumpSoundMuted();
    setMuted(next);
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ background: kronis.mapBackground }}
    >
      <PumpHomeAppBar
        initials={dummyUser.initials}
        deviceName={pump.name}
        deviceNumber={pump.number}
        running={running}
        unread={unread}
        onProfile={() => router.push("/profile")}
        onPicker={() => setPickerOpen(true)}
        onNotifications={() => router.push("/notifications")}
      />

      <div ref={stageRef} className="relative min-h-0 flex-1">
        <MapStage
          pumps={pumps}
          selectedId={selectedId}
          running={running}
          muted={muted}
          onMute={handleMute}
          onRentals={() => router.push("/rentals")}
          onSelectPump={(id) => {
            setSelectedId(id);
            setRunningOverride(null);
            setRemainingMinutes(null);
            setFlowOverride(null);
            setTimerMinutes(0);
            setPowerLoading(false);
            toggleLock.current = false;
          }}
          sheetHeight={sheetH}
          fenceFields={fenceFields}
        />

        {/*
          Expand MUST sit above the sheet in the stage stacking order.
          SoftChip is position:relative — wrap in an absolute host.
        */}
        <div
          className="pointer-events-auto absolute right-3.5 z-30"
          style={{ bottom: Math.max(52, sheetH + 18) }}
        >
          <SoftChip
            icon={Expand}
            size={42}
            onClick={() => router.push("/farm")}
            label="Expand map"
            flat
          />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 z-20"
          style={{
            height: sheetH,
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            background: kronis.background,
            boxShadow: "0 -14px 28px rgba(23,26,18,0.14)",
            overflow: "hidden",
          }}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <PumpControlSheet
              mode={mode}
              onModeChange={setMode}
              statusTitle={statusTitle}
              statusSubtitle={statusSubtitle}
              timerMinutes={
                running && remainingMinutes != null
                  ? Math.max(0, Math.round(remainingMinutes))
                  : timerMinutes
              }
              onTimerChange={handleTimerChange}
              running={running}
              offline={offline}
              powerLoading={powerLoading}
              onToggle={handleTogglePower}
              flow={
                offline
                  ? "—"
                  : displayFlow == null
                    ? "—"
                    : String(displayFlow)
              }
              soil={String(pump.soilPct)}
              onMetrics={() => setMetricsOpen(true)}
              onOpenSoilMoisture={() => setSoilTargetOpen(true)}
              onOpenSchedule={() => setScheduleOpen(true)}
              onOpenRentals={() => router.push("/rentals")}
              moistureEnabled={moistureRule.isEnabled}
              moistureSubtitle={
                moistureRule.isEnabled
                  ? `Armed · ${moistureRule.startBelow}–${moistureRule.stopAbove}%`
                  : null
              }
              scheduleEnabled={scheduleRule?.isEnabled === true}
            />
          </div>
        </div>
      </div>

      <PumpPickerSheet
        open={pickerOpen}
        pumps={pumps.map((p) => ({
          id: p.id,
          name: p.name,
          number: p.number,
          online: p.online,
          running: p.id === selectedId ? running : p.running,
        }))}
        selectedId={selectedId}
        sheetHeight={sheetH}
        onSelect={(id) => {
          setSelectedId(id);
          setRunningOverride(null);
          setRemainingMinutes(null);
          setFlowOverride(null);
          setTimerMinutes(0);
          setPowerLoading(false);
          toggleLock.current = false;
        }}
        onClose={() => setPickerOpen(false)}
        onAddPump={() => router.push("/add-pump")}
        onViewAll={() => router.push("/profile")}
      />

      <SheetModal
        open={metricsOpen}
        onClose={() => setMetricsOpen(false)}
        dim
        header={
          <div>
            <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
              This week
            </div>
            <div className="mt-0.5 text-sm" style={{ color: kronis.inkMuted }}>
              {pump.name}
            </div>
          </div>
        }
      >
        <div className="mb-5 flex h-28 items-end gap-2 px-1">
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
        <SoftButton
          label="Close"
          variant="soft"
          className="w-full"
          onClick={() => setMetricsOpen(false)}
        />
      </SheetModal>

      <SoilTargetSheet
        open={soilTargetOpen}
        deviceName={pump.name}
        soilNow={pump.soilPct}
        initial={moistureRule}
        onClose={() => setSoilTargetOpen(false)}
        onSaved={(payload) => setMoistureRule(payload)}
      />

      <WateringTimesSheet
        open={scheduleOpen}
        deviceName={pump.name}
        initial={scheduleRule}
        onClose={() => setScheduleOpen(false)}
        onSaved={(payload) => setScheduleRule(payload)}
      />
    </div>
  );
}
