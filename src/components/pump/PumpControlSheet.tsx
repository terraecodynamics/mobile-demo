"use client";

import { NeoModeButton } from "@/components/ui/NeoModeButton";
import { PumpDial } from "@/components/pump/PumpDial";
import { MetricsPill } from "@/components/pump/MetricsPill";
import { kronis } from "@/lib/kronis";
import { Clock, Droplets, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  mode: "manual" | "auto";
  onModeChange: (m: "manual" | "auto") => void;
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
}: {
  label: string;
  icon: typeof Clock;
  selected: boolean;
  subtitle: string;
}) {
  return (
    <button
      type="button"
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
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dialSize, setDialSize] = useState(220);

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
      {/* Mode row — clip raised shadows so they don't cover status */}
      <div className="relative z-[3] flex shrink-0 gap-3 overflow-hidden px-3 pb-1 pt-3">
        <NeoModeButton
          label="Manual"
          icon="power"
          selected={mode === "manual"}
          onClick={() => onModeChange("manual")}
        />
        <NeoModeButton
          label="Automatic"
          icon="flash"
          selected={mode === "auto"}
          onClick={() => onModeChange("auto")}
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
            className="font-bold tracking-[-0.3px]"
            style={{
              fontSize: 22,
              lineHeight: 1.15,
              color: running ? kronis.lime : kronis.ink,
            }}
          >
            {statusTitle}
          </div>
          <div
            className="font-semibold"
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

        {/* Dial / auto cards — sized to fit between status and metrics */}
        <div className="relative z-[2] flex min-h-0 flex-1 items-center justify-center overflow-visible">
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
          ) : (
            <div className="flex w-full max-w-[320px] items-stretch gap-3 self-center py-1">
              <AutoCard label="Schedule" icon={Clock} selected subtitle="Off · enable to run" />
              <AutoCard
                label="Soil moisture"
                icon={Droplets}
                selected={false}
                subtitle="Off · enable to automate"
              />
            </div>
          )}
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
