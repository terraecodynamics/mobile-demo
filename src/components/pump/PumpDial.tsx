"use client";

import { NeumorphStartButton } from "@/components/pump/NeumorphStartButton";
import { kronis } from "@/lib/kronis";
import { useMemo, useRef, useState } from "react";

const SWEEP = 270;
const MAX_MIN = 480;
const STEP_MIN = 30;
const STEPS = MAX_MIN / STEP_MIN;

function degToRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

type Props = {
  size?: number;
  timerMinutes: number;
  running: boolean;
  offline: boolean;
  powerLoading?: boolean;
  onToggle: () => void;
  onTimerChange: (m: number) => void;
};

/**
 * Kronis dial — geometry from native PumpDial.js.
 * Pointer math must undo PhoneShell CSS scale (getBoundingClientRect is visual).
 */
export function PumpDial({
  size = 260,
  timerMinutes,
  running,
  offline,
  powerLoading = false,
  onToggle,
  onTimerChange,
}: Props) {
  const edgePad = Math.max(22, Math.round(size * 0.1));
  const canvas = size + edgePad * 2;
  const cx = edgePad + size / 2;
  const cy = edgePad + size / 2;
  const r = size * (96 / 224);
  const buttonRadius = size * (66 / 224);
  const btnSize = Math.round(buttonRadius * 2);
  const trackInner = r - 10;
  const maxWell = Math.floor(trackInner * 2 - 6);
  const desiredPad = Math.max(8, Math.round(btnSize * 0.09));
  const wellPad = Math.max(8, Math.min(desiredPad, Math.floor((maxWell - btnSize) / 2)));
  const wellSize = Math.min(btnSize + wellPad * 2, maxWell);
  const grooveR = r + size * (4 / 224);
  /** Leave Start free — slightly inside well edge so the thumb at r is easy to grab */
  const deadZone = wellSize / 2 + 2;

  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const minutes = Math.max(0, Math.min(MAX_MIN, timerMinutes));
  const fillDeg = -SWEEP / 2 + (minutes / MAX_MIN) * SWEEP;
  const hasTimedDial = minutes > 0.5;
  const showHandle = !running || minutes > 0;

  const polar = (deg: number, radius = r) => ({
    x: cx + radius * Math.cos(degToRad(deg)),
    y: cy + radius * Math.sin(degToRad(deg)),
  });

  const arcPath = (fromDeg: number, toDeg: number, radius = r) => {
    if (toDeg - fromDeg < 0.5) return "";
    const start = polar(fromDeg, radius);
    const end = polar(toDeg, radius);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const handle = polar(fillDeg);
  const tickInner = r + 4;
  const tickOuter = r + 9;
  const end0 = polar(-SWEEP / 2, tickOuter);
  const end8 = polar(SWEEP / 2, tickOuter);
  const sideOut = size * 0.08;
  const label0 = { x: end0.x - sideOut, y: end0.y };
  const label8 = { x: end8.x + sideOut, y: end8.y };

  const ticks = useMemo(() => {
    const items: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      major: boolean;
      filled: boolean;
    }[] = [];
    for (let i = 0; i <= STEPS; i += 1) {
      const deg = -SWEEP / 2 + (i / STEPS) * SWEEP;
      const major = i % 4 === 0;
      const inner = polar(deg, tickInner - (major ? 1 : 0));
      const outer = polar(deg, tickOuter + (major ? 1.5 : 0));
      const filled = fillDeg > -SWEEP / 2 + 0.5 && deg <= fillDeg + 0.5;
      items.push({
        x1: inner.x,
        y1: inner.y,
        x2: outer.x,
        y2: outer.y,
        major,
        filled,
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillDeg, cx, cy, r]);

  /** Local CSS px relative to dial center (undo parent transform: scale) */
  const localFromClient = (clientX: number, clientY: number) => {
    const el = rootRef.current;
    if (!el) return { x: 0, y: 0, d: 0 };
    const rect = el.getBoundingClientRect();
    const sx = rect.width / canvas || 1;
    const sy = rect.height / canvas || 1;
    const x = (clientX - rect.left) / sx - canvas / 2;
    const y = (clientY - rect.top) / sy - canvas / 2;
    return { x, y, d: Math.hypot(x, y) };
  };

  const setFromLocal = (x: number, y: number) => {
    if (running || offline || powerLoading) return;
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg > 180) deg -= 360;
    const clamped = Math.max(-SWEEP / 2, Math.min(SWEEP / 2, deg));
    const m =
      Math.round((((clamped + SWEEP / 2) / SWEEP) * MAX_MIN) / STEP_MIN) * STEP_MIN;
    onTimerChange(m);
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragging(false);
  };

  const progress = arcPath(-SWEEP / 2, fillDeg);
  const canDrag = !running && !offline && !powerLoading;

  return (
    <div
      ref={rootRef}
      className="relative mx-auto overflow-visible"
      style={{
        width: canvas,
        height: canvas,
        background: "transparent",
      }}
    >
      <svg
        width={canvas}
        height={canvas}
        viewBox={`0 0 ${canvas} ${canvas}`}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="dialProgress" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={kronis.dialStart} />
            <stop offset="55%" stopColor={kronis.lime} />
            <stop offset="100%" stopColor={kronis.limeDark} />
          </linearGradient>
        </defs>

        <path
          d={arcPath(-SWEEP / 2, SWEEP / 2, grooveR)}
          fill="none"
          stroke="rgba(23,26,18,0.06)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={arcPath(-SWEEP / 2, SWEEP / 2)}
          fill="none"
          stroke={kronis.dialTrack}
          strokeWidth={10}
          strokeLinecap="round"
        />

        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={
              t.filled
                ? kronis.lime
                : t.major
                  ? "rgba(23,26,18,0.22)"
                  : "rgba(23,26,18,0.1)"
            }
            strokeWidth={t.major ? 2.6 : 1.8}
            strokeLinecap="round"
          />
        ))}

        {hasTimedDial && progress ? (
          <path
            d={progress}
            fill="none"
            stroke="url(#dialProgress)"
            strokeWidth={10}
            strokeLinecap="round"
          />
        ) : null}

        {showHandle ? (
          <g>
            <circle cx={handle.x} cy={handle.y} r={16} fill="rgba(255,107,53,0.18)" />
            <circle
              cx={handle.x}
              cy={handle.y}
              r={11}
              fill={hasTimedDial ? kronis.lime : kronis.ink}
              stroke="#fff"
              strokeWidth={3.5}
            />
            <circle cx={handle.x} cy={handle.y} r={3.2} fill="#fff" opacity={0.9} />
          </g>
        ) : null}

        <text
          x={label0.x}
          y={label0.y}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight={700}
          fill={kronis.inkMuted}
          letterSpacing={0.4}
        >
          0
        </text>
        <text
          x={label8.x}
          y={label8.y}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={12}
          fontWeight={700}
          fill={kronis.inkMuted}
          letterSpacing={0.4}
        >
          8h
        </text>
      </svg>

      {/* SVG donut hit-target (hole over Start) — masks don’t affect pointer hit-testing */}
      <svg
        width={canvas}
        height={canvas}
        viewBox={`0 0 ${canvas} ${canvas}`}
        className="absolute inset-0 z-[8] touch-none select-none"
        style={{
          cursor: canDrag ? (dragging ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          if (!canDrag) return;
          if (e.button !== 0 && e.pointerType === "mouse") return;
          const { x, y, d } = localFromClient(e.clientX, e.clientY);
          if (d < deadZone) return;
          draggingRef.current = true;
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          e.preventDefault();
          e.stopPropagation();
          setFromLocal(x, y);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          e.preventDefault();
          const { x, y } = localFromClient(e.clientX, e.clientY);
          setFromLocal(x, y);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <path
          fill="transparent"
          fillRule="evenodd"
          d={`M0 0H${canvas}V${canvas}H0Z M${canvas / 2} ${canvas / 2} m-${deadZone} 0 a${deadZone} ${deadZone} 0 1 0 ${deadZone * 2} 0 a${deadZone} ${deadZone} 0 1 0 -${deadZone * 2} 0`}
          style={{ pointerEvents: "fill" }}
        />
      </svg>

      <div
        className="absolute z-[6] flex items-center justify-center"
        style={{
          top: (canvas - wellSize) / 2,
          left: (canvas - wellSize) / 2,
          width: wellSize,
          height: wellSize,
          pointerEvents: "none",
        }}
      >
        <NeumorphStartButton
          size={btnSize}
          wellSize={wellSize}
          running={running}
          offline={offline}
          loading={powerLoading}
          onClick={onToggle}
        />
      </div>
    </div>
  );
}
