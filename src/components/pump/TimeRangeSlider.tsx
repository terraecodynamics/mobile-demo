"use client";

import { kronis } from "@/lib/kronis";
import { useCallback, useRef, type PointerEvent } from "react";

/** Visible day window: 5 AM → 8 PM */
export const TRACK_START_MIN = 5 * 60;
export const TRACK_END_MIN = 20 * 60;
export const TRACK_SPAN = TRACK_END_MIN - TRACK_START_MIN;
const STEP = 30;
const THUMB = 24;
const THUMB_HIT = 48;
const RAIL_H = 44;

export function clampStep(mins: number) {
  const clamped = Math.max(TRACK_START_MIN, Math.min(TRACK_END_MIN, mins));
  return Math.round(clamped / STEP) * STEP;
}

export function hhmmToMins(hhmm: string | null | undefined) {
  if (!hhmm || typeof hhmm !== "string") return TRACK_START_MIN;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return TRACK_START_MIN;
  return h * 60 + m;
}

export function minsToHhmm(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Props = {
  start?: string;
  end?: string;
  enabled?: boolean;
  onChange?: (next: { start: string; end: string }) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

export function TimeRangeSlider({
  start = "09:00",
  end = "11:30",
  enabled = true,
  onChange,
  onDragStateChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(hhmmToMins(start));
  const endRef = useRef(hhmmToMins(end));
  const whichRef = useRef<"start" | "end">("start");
  const draggingRef = useRef(false);

  startRef.current = hhmmToMins(start);
  endRef.current = hhmmToMins(end);

  const startPct =
    ((hhmmToMins(start) - TRACK_START_MIN) / TRACK_SPAN) * 100;
  const endPct = ((hhmmToMins(end) - TRACK_START_MIN) / TRACK_SPAN) * 100;

  const emit = useCallback(
    (nextStart: number, nextEnd: number) => {
      startRef.current = nextStart;
      endRef.current = nextEnd;
      onChange?.({
        start: minsToHhmm(nextStart),
        end: minsToHhmm(nextEnd),
      });
    },
    [onChange]
  );

  const setDrag = useCallback(
    (v: boolean) => {
      draggingRef.current = v;
      onDragStateChange?.(v);
    },
    [onDragStateChange]
  );

  const minsFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return TRACK_START_MIN;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    return clampStep(TRACK_START_MIN + ratio * TRACK_SPAN);
  };

  const moveDrag = (clientX: number) => {
    if (!draggingRef.current || !enabled) return;
    const next = minsFromClientX(clientX);
    if (whichRef.current === "start") {
      emit(Math.min(next, endRef.current - STEP), endRef.current);
    } else {
      emit(startRef.current, Math.max(next, startRef.current + STEP));
    }
  };

  const endDrag = () => setDrag(false);

  const onRailPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const mins = minsFromClientX(e.clientX);
    const preferStart =
      Math.abs(mins - startRef.current) <= Math.abs(mins - endRef.current);
    whichRef.current = preferStart ? "start" : "end";
    if (preferStart) {
      const next = Math.min(mins, endRef.current - STEP);
      emit(next, endRef.current);
    } else {
      const next = Math.max(mins, startRef.current + STEP);
      emit(startRef.current, next);
    }
    setDrag(true);
  };

  const onThumbPointerDown =
    (which: "start" | "end") => (e: PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      whichRef.current = which;
      setDrag(true);
    };

  return (
    <div className="mt-3 select-none" style={{ touchAction: "none" }}>
      <div
        ref={wrapRef}
        className="relative"
        style={{ height: RAIL_H }}
        onPointerDown={onRailPointerDown}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="pointer-events-none absolute left-0 right-0 rounded-full"
          style={{
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: enabled ? kronis.limeSoft : kronis.surfaceMuted,
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(0, endPct - startPct)}%`,
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: enabled ? kronis.lime : "#C5C8BE",
          }}
        />

        {(["start", "end"] as const).map((which) => {
          const pct = which === "start" ? startPct : endPct;
          return (
            <div
              key={which}
              className="absolute z-[5] flex items-center justify-center"
              style={{
                left: `${pct}%`,
                width: THUMB_HIT,
                height: THUMB_HIT,
                marginLeft: -THUMB_HIT / 2,
                top: (RAIL_H - THUMB_HIT) / 2,
                cursor: enabled ? "grab" : "default",
              }}
              onPointerDown={onThumbPointerDown(which)}
              onPointerMove={(e) => moveDrag(e.clientX)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <span
                className="block rounded-full border-2"
                style={{
                  width: THUMB,
                  height: THUMB,
                  background: enabled ? kronis.ink : "#9AA095",
                  borderColor: enabled ? "#fff" : kronis.surfaceMuted,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none mt-0.5 flex justify-between text-[12px] font-semibold"
        style={{ color: enabled ? kronis.inkMuted : "#A8ADA3" }}
      >
        <span>5 AM</span>
        <span>Noon</span>
        <span>8 PM</span>
      </div>
    </div>
  );
}
