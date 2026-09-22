"use client";

import {
  TimeRangeSlider,
  hhmmToMins,
} from "@/components/pump/TimeRangeSlider";
import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { kronis } from "@/lib/kronis";
import { useCallback, useEffect, useState } from "react";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof ALL_DAYS)[number];

export type WateringSlot = {
  id: string;
  start: string;
  end: string;
  days: Day[];
  enabled: boolean;
};

export type SchedulePayload = {
  selectedDays: Day[];
  timeRanges: { start: string; end: string; days: Day[] }[];
  slots: WateringSlot[];
  isEnabled: boolean;
};

const DEFAULT_SLOTS: WateringSlot[] = [
  {
    id: "slot-1",
    start: "09:00",
    end: "11:30",
    days: [...ALL_DAYS],
    enabled: true,
  },
  {
    id: "slot-2",
    start: "14:00",
    end: "16:00",
    days: ["Mon", "Wed", "Fri"] as Day[],
    enabled: false,
  },
];

const formatTimeLabel = (hhmm: string) => {
  const mins = hhmmToMins(hhmm);
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
};

const formatDaysLabel = (days: string[] = []) => {
  if (!days.length) return "No days";
  if (days.length === 7) return "Mon – Sun";
  const order = ALL_DAYS.filter((d) => days.includes(d));
  const idxs = order.map((d) => ALL_DAYS.indexOf(d));
  let consecutive = idxs.length > 1;
  for (let i = 1; i < idxs.length; i += 1) {
    if (idxs[i] !== idxs[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive) return `${order[0]} – ${order[order.length - 1]}`;
  return order.join(" · ");
};

const buildSavePayload = (slots: WateringSlot[]): SchedulePayload => {
  const enabledSlots = slots.filter((s) => s.enabled);
  const working = enabledSlots.length > 0 ? enabledSlots : slots;
  const daySet = new Set<string>();
  working.forEach((s) => (s.days || []).forEach((d) => daySet.add(d)));
  const selectedDays = ALL_DAYS.filter((d) => daySet.has(d));

  return {
    selectedDays: selectedDays.length ? selectedDays : [...ALL_DAYS],
    timeRanges: working.map((s) => ({
      start: s.start,
      end: s.end,
      days: s.days,
    })),
    slots,
    isEnabled: enabledSlots.length > 0,
  };
};

function SlotCard({
  slot,
  onChange,
  onToggleDay,
  onDragStateChange,
}: {
  slot: WateringSlot;
  onChange: (next: WateringSlot) => void;
  onToggleDay: (day: Day) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  return (
    <div
      className="mb-3 rounded-[18px] border p-4"
      style={{
        background: kronis.surface,
        borderColor: kronis.border,
        opacity: slot.enabled ? 1 : 0.78,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="text-[18px] font-extrabold tracking-[-0.2px]"
            style={{ color: slot.enabled ? kronis.ink : "#8B9084" }}
          >
            {formatTimeLabel(slot.start)} – {formatTimeLabel(slot.end)}
          </div>
          <div
            className="mt-1 text-[14px] font-semibold"
            style={{ color: slot.enabled ? kronis.inkMuted : "#8B9084" }}
          >
            {formatDaysLabel(slot.days)}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={slot.enabled}
          aria-label="Enable time slot"
          onClick={() => onChange({ ...slot, enabled: !slot.enabled })}
          className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
          style={{ background: slot.enabled ? kronis.lime : "#D5D8CF" }}
        >
          <span
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 ease-out"
            style={{ left: slot.enabled ? 22 : 2 }}
          />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {ALL_DAYS.map((day) => {
          const on = slot.days.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggleDay(day)}
              className="flex h-8 flex-1 items-center justify-center rounded-[10px] text-[12px] font-bold transition-colors duration-150"
              style={{
                background: on ? kronis.ink : kronis.surfaceMuted,
                color: on ? "#fff" : kronis.inkMuted,
                opacity: slot.enabled ? 1 : 0.7,
              }}
            >
              {day[0]}
            </button>
          );
        })}
      </div>

      <TimeRangeSlider
        start={slot.start}
        end={slot.end}
        enabled={slot.enabled}
        onChange={({ start, end }) => onChange({ ...slot, start, end })}
        onDragStateChange={onDragStateChange}
      />
    </div>
  );
}

type Props = {
  open: boolean;
  deviceName?: string;
  initial?: SchedulePayload | null;
  onClose: () => void;
  onSaved?: (payload: SchedulePayload) => void;
};

export function WateringTimesSheet({
  open,
  deviceName = "Pump",
  initial,
  onClose,
  onSaved,
}: Props) {
  const [slots, setSlots] = useState<WateringSlot[]>(DEFAULT_SLOTS);
  const [saving, setSaving] = useState(false);
  const [sliderDragging, setSliderDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial?.slots?.length) {
      setSlots(initial.slots.map((s) => ({ ...s, days: [...s.days] })));
    } else {
      setSlots(
        DEFAULT_SLOTS.map((s, i) => ({ ...s, id: `slot-${Date.now()}-${i}` }))
      );
    }
    // Seed only when sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateSlot = useCallback((id: string, next: WateringSlot) => {
    setSlots((list) => list.map((s) => (s.id === id ? next : s)));
  }, []);

  const toggleDay = useCallback((id: string, day: Day) => {
    setSlots((list) =>
      list.map((s) => {
        if (s.id !== id) return s;
        const has = s.days.includes(day);
        const days = has
          ? s.days.filter((d) => d !== day)
          : [...s.days, day];
        return {
          ...s,
          days: ALL_DAYS.filter((d) => days.includes(d)),
        };
      })
    );
  }, []);

  const addTime = () => {
    setSlots((list) => [
      ...list,
      {
        id: `slot-${Date.now()}`,
        start: "10:00",
        end: "12:00",
        days: [...ALL_DAYS],
        enabled: true,
      },
    ]);
  };

  const handleDone = () => {
    const invalid = slots.some(
      (s) => hhmmToMins(s.start) >= hhmmToMins(s.end)
    );
    if (invalid) return;
    const emptyDays = slots.filter(
      (s) => s.enabled && (!s.days || s.days.length === 0)
    );
    if (emptyDays.length) return;

    setSaving(true);
    const payload = buildSavePayload(slots);
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
          Watering times · {deviceName}
        </div>
      }
    >
      <div
        className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain"
        style={{ maxHeight: "min(420px, 48vh)" }}
      >
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onChange={(next) => updateSlot(slot.id, next)}
            onToggleDay={(day) => toggleDay(slot.id, day)}
            onDragStateChange={setSliderDragging}
          />
        ))}

        <button
          type="button"
          onClick={addTime}
          className="mt-1 w-full rounded-2xl border-[1.5px] border-dashed py-3.5 text-center text-[15px] font-bold active:scale-[0.99]"
          style={{
            borderColor: "#C5C8BE",
            color: kronis.inkMuted,
          }}
        >
          + Add time
        </button>
      </div>

      <SoftButton
        label={saving ? "Saving…" : "Done"}
        variant="ink"
        className="mt-3 w-full py-4 text-[17px]"
        onClick={handleDone}
      />
    </SheetModal>
  );
}
