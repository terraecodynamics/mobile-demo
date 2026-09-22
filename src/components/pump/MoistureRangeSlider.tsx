"use client";

import { kronis } from "@/lib/kronis";
import { useCallback, useRef, type PointerEvent } from "react";

const MIN = 0;
const MAX = 100;
const STEP = 1;
const THUMB = 24;
const THUMB_HIT = 48;
const RAIL_H = 44;

const DRY = "#D2B48C";
const TARGET = "#B7D9A8";
const WET = "#A8C8E8";

export function clampPct(v: number | string | null | undefined) {
  const n = Math.round(Number(v) / STEP) * STEP;
  return Math.max(MIN, Math.min(MAX, Number.isFinite(n) ? n : MIN));
}

type Props = {
  dry?: number;
  wet?: number;
  soilNow?: number | null;
  enabled?: boolean;
  onChange?: (next: { dry: number; wet: number }) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

export function MoistureRangeSlider({
  dry = 30,
  wet = 60,
  soilNow = null,
  enabled = true,
  onChange,
  onDragStateChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dryRef = useRef(clampPct(dry));
  const wetRef = useRef(clampPct(wet));
  const whichRef = useRef<"dry" | "wet">("dry");
  const originRef = useRef(0);
  const draggingRef = useRef(false);

  dryRef.current = clampPct(dry);
  wetRef.current = clampPct(wet);

  const dryPct = (clampPct(dry) / MAX) * 100;
  const wetPct = (clampPct(wet) / MAX) * 100;
  const soilPct =
    soilNow != null && !Number.isNaN(Number(soilNow))
      ? Math.max(0, Math.min(100, Number(soilNow)))
      : null;

  const emit = useCallback(
    (nextDry: number, nextWet: number) => {
      dryRef.current = nextDry;
      wetRef.current = nextWet;
      onChange?.({ dry: nextDry, wet: nextWet });
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

  const pctFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    return clampPct(ratio * MAX);
  };

  const moveDrag = (clientX: number) => {
    if (!draggingRef.current || !enabled) return;
    const next = pctFromClientX(clientX);
    if (whichRef.current === "dry") {
      emit(Math.min(next, wetRef.current - STEP), wetRef.current);
    } else {
      emit(dryRef.current, Math.max(next, dryRef.current + STEP));
    }
  };

  const endDrag = () => setDrag(false);

  const onRailPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const mins = pctFromClientX(e.clientX);
    const preferDry =
      Math.abs(mins - dryRef.current) <= Math.abs(mins - wetRef.current);
    whichRef.current = preferDry ? "dry" : "wet";
    if (preferDry) {
      const next = Math.min(mins, wetRef.current - STEP);
      emit(next, wetRef.current);
      originRef.current = next;
    } else {
      const next = Math.max(mins, dryRef.current + STEP);
      emit(dryRef.current, next);
      originRef.current = next;
    }
    setDrag(true);
  };

  const onThumbPointerDown =
    (which: "dry" | "wet") => (e: PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      whichRef.current = which;
      originRef.current = which === "dry" ? dryRef.current : wetRef.current;
      setDrag(true);
    };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    moveDrag(e.clientX);
  };

  return (
    <div className="mt-3.5 select-none" style={{ touchAction: "none" }}>
      <div
        ref={wrapRef}
        className="relative"
        style={{ height: RAIL_H }}
        onPointerDown={onRailPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Base rail */}
        <div
          className="pointer-events-none absolute left-0 right-0 rounded-full"
          style={{
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: kronis.surfaceMuted,
          }}
        />
        {/* Dry segment */}
        <div
          className="pointer-events-none absolute rounded-l-full"
          style={{
            left: 0,
            width: `${dryPct}%`,
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: DRY,
          }}
        />
        {/* Target segment */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${dryPct}%`,
            width: `${Math.max(0, wetPct - dryPct)}%`,
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: TARGET,
          }}
        />
        {/* Wet segment */}
        <div
          className="pointer-events-none absolute rounded-r-full"
          style={{
            left: `${wetPct}%`,
            width: `${Math.max(0, 100 - wetPct)}%`,
            height: 10,
            top: (RAIL_H - 10) / 2,
            background: WET,
          }}
        />
        {soilPct != null ? (
          <div
            className="pointer-events-none absolute rounded-sm"
            style={{
              left: `${soilPct}%`,
              width: 2,
              height: 18,
              marginLeft: -1,
              top: (RAIL_H - 18) / 2,
              background: kronis.ink,
              opacity: 0.35,
            }}
          />
        ) : null}

        {/* Dry thumb */}
        <div
          className="absolute z-[5] flex items-center justify-center"
          style={{
            left: `${dryPct}%`,
            width: THUMB_HIT,
            height: THUMB_HIT,
            marginLeft: -THUMB_HIT / 2,
            top: (RAIL_H - THUMB_HIT) / 2,
            cursor: enabled ? "grab" : "default",
          }}
          onPointerDown={onThumbPointerDown("dry")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span
            className="block rounded-full border-2 border-white"
            style={{
              width: THUMB,
              height: THUMB,
              background: enabled ? kronis.ink : "#9AA095",
              boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
            }}
          />
        </div>

        {/* Wet thumb */}
        <div
          className="absolute z-[5] flex items-center justify-center"
          style={{
            left: `${wetPct}%`,
            width: THUMB_HIT,
            height: THUMB_HIT,
            marginLeft: -THUMB_HIT / 2,
            top: (RAIL_H - THUMB_HIT) / 2,
            cursor: enabled ? "grab" : "default",
          }}
          onPointerDown={onThumbPointerDown("wet")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span
            className="block rounded-full border-2 border-white"
            style={{
              width: THUMB,
              height: THUMB,
              background: enabled ? kronis.ink : "#9AA095",
              boxShadow: "0 1px 2px rgba(0,0,0,0.22)",
            }}
          />
        </div>
      </div>

      <div className="pointer-events-none mt-1.5 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: "#A67C52" }}>
          Dry
        </span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: kronis.inkMuted }}
        >
          {soilPct != null ? `soil now: ${Math.round(soilPct)}%` : "soil now: —"}
        </span>
        <span className="text-[13px] font-bold" style={{ color: "#4A7FB5" }}>
          Wet
        </span>
      </div>
    </div>
  );
}
