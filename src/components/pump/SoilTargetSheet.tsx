"use client";

import {
  MoistureRangeSlider,
  clampPct,
} from "@/components/pump/MoistureRangeSlider";
import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { kronis } from "@/lib/kronis";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_DRY = 30;
const DEFAULT_WET = 60;

const statusMessageFor = (
  soil: number | null | undefined,
  dry: number,
  wet: number
) => {
  if (soil == null || Number.isNaN(Number(soil))) {
    return "Set the moisture band the pump should keep";
  }
  const s = Number(soil);
  if (s < dry) return "Soil dry — pump will water until wet limit";
  if (s > wet) return "Soil wet — pump will stop until dry again";
  return "Soil in target range — pump holds current state";
};

export type SoilTargetPayload = {
  startBelow: number;
  stopAbove: number;
  isEnabled: boolean;
};

type Props = {
  open: boolean;
  deviceName?: string;
  soilNow?: number | null;
  /** Demo: seed enabled / range without a backend */
  initial?: Partial<SoilTargetPayload>;
  onClose: () => void;
  onSaved?: (payload: SoilTargetPayload) => void;
};

export function SoilTargetSheet({
  open,
  deviceName = "Pump",
  soilNow = null,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [dry, setDry] = useState(DEFAULT_DRY);
  const [wet, setWet] = useState(DEFAULT_WET);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sliderDragging, setSliderDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDry(clampPct(initial?.startBelow ?? DEFAULT_DRY));
    setWet(clampPct(initial?.stopAbove ?? DEFAULT_WET));
    setEnabled(initial?.isEnabled !== false);
  }, [open, initial?.startBelow, initial?.stopAbove, initial?.isEnabled]);

  const hint = useMemo(
    () => statusMessageFor(soilNow, dry, wet),
    [soilNow, dry, wet]
  );

  const handleDone = () => {
    if (dry >= wet) return;
    setSaving(true);
    const payload: SoilTargetPayload = {
      startBelow: dry,
      stopAbove: wet,
      isEnabled: enabled,
    };
    window.setTimeout(() => {
      onSaved?.(payload);
      setSaving(false);
      onClose();
    }, 180);
  };

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      maxHeight="85%"
      dragEnabled={!sliderDragging}
      header={
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Soil target · {deviceName}
        </div>
      }
    >
      <div
        className="mb-3 flex min-h-[280px] flex-col justify-center rounded-[18px] border px-[18px] py-[18px]"
        style={{
          background: kronis.surface,
          borderColor: kronis.border,
        }}
      >
        <div
          className="mb-4 flex items-center gap-3 border-b pb-3.5"
          style={{ borderColor: kronis.divider }}
        >
          <div className="min-w-0 flex-1">
            <div
              className="text-[15px] font-extrabold"
              style={{ color: kronis.ink }}
            >
              Automate with soil
            </div>
            <div
              className="mt-0.5 text-[12px] font-semibold"
              style={{ color: kronis.inkMuted }}
            >
              Pump starts when dry, stops when wet
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Automate with soil"
            onClick={() => setEnabled((v) => !v)}
            className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
            style={{ background: enabled ? kronis.lime : "#D5D8CF" }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ease-out"
              style={{ left: enabled ? 22 : 2 }}
            />
          </button>
        </div>

        <div className="mb-1.5 flex items-center justify-between">
          <span
            className="text-[14px] font-semibold"
            style={{ color: kronis.inkMuted }}
          >
            Target range
          </span>
          <span
            className="text-[18px] font-extrabold tabular-nums transition-all duration-150"
            style={{ color: kronis.ink }}
          >
            {dry}–{wet}%
          </span>
        </div>

        <MoistureRangeSlider
          dry={dry}
          wet={wet}
          soilNow={soilNow}
          enabled={enabled}
          onChange={({ dry: d, wet: w }) => {
            setDry(d);
            setWet(w);
          }}
          onDragStateChange={setSliderDragging}
        />

        <div
          className="mt-[22px] rounded-xl px-3.5 py-4 transition-colors duration-200"
          style={{ background: kronis.background }}
        >
          <p
            className="text-[14px] font-semibold leading-5"
            style={{ color: kronis.ink }}
          >
            {hint}
          </p>
        </div>
      </div>

      <SoftButton
        label={saving ? "Saving…" : "Done"}
        variant="ink"
        className="mt-1 w-full py-3.5 text-[16px]"
        onClick={handleDone}
      />
    </SheetModal>
  );
}
