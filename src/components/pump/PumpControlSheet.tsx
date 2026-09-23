"use client";

import { NeoModeButton } from "@/components/ui/NeoModeButton";
import { SoftButton } from "@/components/ui/SoftUi";
import { PumpDial } from "@/components/pump/PumpDial";
import { MetricsPill } from "@/components/pump/MetricsPill";
import { kronis } from "@/lib/kronis";
import { CalendarDays, Clock, Droplets, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  mode: "manual" | "auto" | "rental";
  onModeChange: (m: "manual" | "auto" | "rental") => void;
  statusTitle: string;
  statusSubtitle: string;
  timerMinutes: number;
  onTimerChange: (m: number) => void;
  running: boolean;
  offline: boolean;
  powerLoading?: boolean;
  onToggle: () => void;
  flow: string;
  soil: string;
  onMetrics?: () => void;
  onOpenSoilMoisture?: () => void;
  onOpenSchedule?: () => void;
  onOpenRentals?: () => void;
  moistureEnabled?: boolean;
  moistureSubtitle?: string | null;
  scheduleEnabled?: boolean;
  scheduleActive?: boolean;
  scheduleCountdown?: string | null;
};

/** Native pumpDialSize — reserve status + metrics so nothing clips */
function pumpDialSize(bodyH: number, winW: number) {
  const reservedChrome = 190;
  const byHeight = Math.max(160, (bodyH || 340) - reservedChrome);
  const byWidth = Math.round(winW * 0.68);
  return Math.min(232, byWidth, byHeight);
}

function AutoCard({
  label,
  icon: Icon,
  selected,
  subtitle,
  onClick,
}: {
  label: string;
  icon: typeof Clock;
  selected: boolean;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex aspect-square max-h-[128px] flex-1 flex-col items-center justify-center overflow-hidden active:scale-[0.98]"
      style={{
        borderRadius: 18,
        background: selected
          ? "linear-gradient(180deg, #F4F7FA 0%, #E8EDF3 45%, #E0E5EC 100%)"
          : "linear-gradient(180deg, #E0E5EC 0%, #D8DEE8 45%, #CDD5E0 100%)",
        border: selected ? `1.5px solid ${kronis.ink}` : "1px solid transparent",
        boxShadow: selected
          ? "6px 8px 14px rgba(102,109,122,0.25), -3px -3px 8px rgba(255,255,255,0.8)"
          : "4px 5px 10px rgba(102,109,122,0.2)",
        transition:
          "background 220ms ease, box-shadow 220ms ease, border-color 220ms ease, transform 120ms ease",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[45%]"
        style={{ background: "rgba(255,255,255,0.35)" }}
      />
      {selected ? (
        <span className="absolute right-2 top-2">
          <Pencil size={13} color={kronis.lime} />
        </span>
      ) : null}
      <span
        className="mb-1.5 flex h-[44px] w-[44px] items-center justify-center rounded-xl"
        style={{ background: kronis.limeSoft }}
      >
        <Icon size={22} color={selected ? kronis.lime : kronis.inkMuted} />
      </span>
      <span
        className="relative text-[13px] font-bold"
        style={{ color: selected ? kronis.ink : kronis.inkMuted }}
      >
        {label}
      </span>
      <span
        className="relative mt-0.5 max-w-[90%] text-center text-[10px] font-medium leading-snug"
        style={{ color: kronis.inkMuted }}
      >
        {subtitle}
      </span>
    </button>
  );
}

export function PumpControlSheet({
  mode,
  onModeChange,
  statusTitle,
  statusSubtitle,
  timerMinutes,
  onTimerChange,
  running,
  offline,
  powerLoading = false,
  onToggle,
  flow,
  soil,
  onMetrics,
  onOpenSoilMoisture,
  onOpenSchedule,
  onOpenRentals,
  moistureEnabled = false,
  moistureSubtitle = null,
  scheduleEnabled = false,
  scheduleActive = false,
  scheduleCountdown = null,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dialSize, setDialSize] = useState(220);
  const [autoKind, setAutoKind] = useState<"schedule" | "moisture">("schedule");

  const scheduleSubtitle = scheduleActive
    ? scheduleCountdown
      ? `Active · ${scheduleCountdown}`
      : "Active now"
    : scheduleEnabled
      ? "Armed · waiting for window"
      : "Off · enable to run";

  const soilCardSubtitle =
    moistureSubtitle ||
    (moistureEnabled ? "Armed · watching soil" : "Off · enable to automate");

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      setDialSize(pumpDialSize(el.clientHeight, el.clientWidth || 360));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ background: kronis.background }}
    >
      {/* Mode row — Manual · Automatic · Rental */}
      <div className="relative z-[3] flex shrink-0 gap-2 overflow-hidden px-2.5 pb-1 pt-3">
        <NeoModeButton
          label="Manual"
          icon="power"
          selected={mode === "manual"}
          onClick={() => onModeChange("manual")}
          compact
        />
        <NeoModeButton
          label="Automatic"
          icon="flash"
          selected={mode === "auto"}
          onClick={() => onModeChange("auto")}
          compact
        />
        <NeoModeButton
          label="Rental"
          icon="calendar"
          selected={mode === "rental"}
          onClick={() => {
            onModeChange("rental");
            onOpenRentals?.();
          }}
          compact
        />
      </div>

      <div
        ref={bodyRef}
        className="relative z-[1] flex min-h-0 flex-1 flex-col px-5"
        style={{ paddingBottom: 12, gap: 10 }}
      >
        {/* Status — always fully visible (native statusBlock) */}
        <div
          className="relative z-[4] shrink-0 px-2 text-center"
          style={{ paddingTop: 4, paddingBottom: 2 }}
        >
          <div
            className="font-bold tracking-[-0.3px] transition-colors duration-300"
            style={{
              fontSize: 22,
              lineHeight: 1.15,
              color: running ? kronis.lime : kronis.ink,
            }}
          >
            {statusTitle}
          </div>
          <div
            className="font-semibold transition-opacity duration-200"
            style={{
              marginTop: 2,
              marginBottom: 0,
              fontSize: 13,
              lineHeight: 1.25,
              color: "#555B4E",
            }}
          >
            {statusSubtitle}
          </div>
        </div>

        {/* Dial / auto cards — crossfade like native mode switch */}
        <div className="relative z-[2] flex min-h-0 flex-1 items-center justify-center overflow-visible">
          <div
            key={mode}
            className="flex w-full items-center justify-center"
            style={{
              animation: "kronis-mode-in 280ms cubic-bezier(0.22, 1.2, 0.36, 1) both",
            }}
          >
            {mode === "manual" ? (
              <PumpDial
                size={dialSize}
                timerMinutes={timerMinutes}
                running={running}
                offline={offline}
                powerLoading={powerLoading}
                onToggle={onToggle}
                onTimerChange={onTimerChange}
              />
            ) : mode === "rental" ? (
              <div className="flex w-full max-w-[300px] flex-col items-center gap-3 self-center px-2 py-2 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: kronis.limeSoft }}
                >
                  <CalendarDays size={28} color={kronis.lime} strokeWidth={2.1} />
                </span>
                <div>
                  <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
                    List for rent
                  </div>
                </div>
                <SoftButton
                  label="List"
                  variant="orange"
                  className="w-full"
                  onClick={() => onOpenRentals?.()}
                />
              </div>
            ) : (
              <div className="flex w-full max-w-[320px] items-stretch gap-3 self-center py-1">
                <AutoCard
                  label="Schedule"
                  icon={Clock}
                  selected={autoKind === "schedule" || scheduleEnabled}
                  subtitle={scheduleSubtitle}
                  onClick={() => {
                    setAutoKind("schedule");
                    onOpenSchedule?.();
                  }}
                />
                <AutoCard
                  label="Soil moisture"
                  icon={Droplets}
                  selected={autoKind === "moisture" || moistureEnabled}
                  subtitle={soilCardSubtitle}
                  onClick={() => {
                    setAutoKind("moisture");
                    onOpenSoilMoisture?.();
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="relative z-[2] shrink-0 pt-1">
          <MetricsPill
            flow={flow}
            soil={soil}
            offline={offline}
            onClick={onMetrics}
          />
        </div>
      </div>
    </div>
  );
}
