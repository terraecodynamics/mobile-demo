"use client";

import { kronis } from "@/lib/kronis";
import { useEffect, useId, useState } from "react";

/** Marker canvas — submersible body + longer water spray to the right (native PumpMapMarker) */
const VIEW_W = 118;
const VIEW_H = 102;
const BODY_W = 92;

export const MARKER_WIDTH_SELECTED = Math.round(64 * (VIEW_W / BODY_W));
export const MARKER_WIDTH_UNSELECTED = Math.round(46 * (VIEW_W / BODY_W));
export const MARKER_HEIGHT_RATIO = VIEW_H / VIEW_W;

/** Diamond mesh lines inside strainer panel */
function MeshPanel({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g opacity={0.85}>
      <rect x={x} y={y} width={w} height={h} fill="#1E1E1E" stroke="#333" strokeWidth={0.3} />
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`mx-${i}`}
          x1={x + i * (w / 4)}
          y1={y}
          x2={x + i * (w / 4) + h * 0.35}
          y2={y + h}
          stroke="#666"
          strokeWidth={0.45}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`my-${i}`}
          x1={x + w - i * (w / 4)}
          y1={y}
          x2={x + w - i * (w / 4) - h * 0.35}
          y2={y + h}
          stroke="#666"
          strokeWidth={0.45}
        />
      ))}
    </g>
  );
}

type Props = {
  number?: number;
  selected?: boolean;
  isRunning?: boolean;
  /** Crop to pump body only (list / app-bar); hides spray canvas */
  compact?: boolean;
  className?: string;
};

/**
 * Submersible pump marker — exact port of native PumpMapMarker.js
 * (3D CAD strainer cage + animated discharge when running).
 */
export function PumpMapMarker({
  number = 1,
  selected = false,
  isRunning = false,
  compact = false,
  className = "",
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const [flowTick, setFlowTick] = useState(0);

  const width = compact
    ? selected
      ? 54
      : 38
    : selected
      ? MARKER_WIDTH_SELECTED
      : MARKER_WIDTH_UNSELECTED;
  const height = compact
    ? Math.round(width * (VIEW_H / BODY_W))
    : Math.round(width * MARKER_HEIGHT_RATIO);

  const compactViewBox = `${38 - BODY_W / 2} 0 ${BODY_W} ${VIEW_H}`;
  const viewBox = compact ? compactViewBox : `0 0 ${VIEW_W} ${VIEW_H}`;
  const showSpray = isRunning && !compact;

  useEffect(() => {
    if (!isRunning) {
      setFlowTick(0);
      return undefined;
    }
    const start = Date.now();
    let frame: number | null = null;
    let lastPaint = 0;
    const paint = (now: number) => {
      if (now - lastPaint >= 32) {
        lastPaint = now;
        setFlowTick(Date.now() - start);
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [isRunning]);

  const dash1 = ((flowTick / 320) * 20) % 20;
  const dash2 = ((flowTick / 400) * 20) % 20;
  const dash3 = ((flowTick / 480) * 20) % 20;
  const splashPhase = (Math.sin(flowTick / 190) + 1) / 2;
  const splashRx = 2.4 + splashPhase * 3.0;
  const splashRy = 1.0 + splashPhase * 1.5;
  const splashOpacity = 0.8 - splashPhase * 0.55;
  const splash2Rx = 1.5 + splashPhase * 2.2;
  const splash2Ry = 0.7 + splashPhase * 1.0;
  const splash2Opacity = 0.5 - splashPhase * 0.38;

  const uid = (part: string) => `sub-${reactId}-${number}-${selected ? "s" : "n"}-${part}`;
  const metal = uid("metal");
  const motor = uid("motor");
  const cage = uid("cage");
  const base = uid("base");
  const flange = uid("flange");
  const clip = uid("clip");
  const inner = uid("inner");

  return (
    <div
      className={className}
      style={{
        width,
        height,
        overflow: "visible",
        background: "transparent",
        transform: !compact && selected ? "scale(1.04)" : undefined,
        transformOrigin: "center center",
      }}
    >
      <svg width={width} height={height} viewBox={viewBox} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4F4F4" />
            <stop offset="0.4" stopColor="#D0D0D0" />
            <stop offset="1" stopColor="#A8A8A8" />
          </linearGradient>
          <linearGradient id={motor} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#FAFAFA" />
            <stop offset="0.45" stopColor="#D8D8D8" />
            <stop offset="1" stopColor="#9E9E9E" />
          </linearGradient>
          <linearGradient id={cage} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ECECEC" />
            <stop offset="1" stopColor="#B4B4B4" />
          </linearGradient>
          <linearGradient id={base} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B0B0B0" />
            <stop offset="0.5" stopColor="#EEEEEE" />
            <stop offset="1" stopColor="#B0B0B0" />
          </linearGradient>
          <linearGradient id={flange} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#333" />
            <stop offset="0.5" stopColor="#111" />
            <stop offset="1" stopColor="#222" />
          </linearGradient>
          <radialGradient id={inner} cx="50%" cy="40%" r="50%" fy="40%">
            <stop offset="0" stopColor="#555" />
            <stop offset="1" stopColor="#1A1A1A" />
          </radialGradient>
          <clipPath id={clip}>
            <rect x="0" y="0" width={BODY_W} height={VIEW_H} />
          </clipPath>
        </defs>

        <g opacity={selected ? 1 : 0.9} clipPath={`url(#${clip})`}>
          <ellipse cx="38" cy="99" rx="28" ry="3.2" fill="rgba(0,0,0,0.28)" />
          <ellipse
            cx="38"
            cy="95"
            rx="30"
            ry="4.5"
            fill={`url(#${base})`}
            stroke="#333"
            strokeWidth={0.4}
          />

          <path
            d="M14 95 L22 74 L54 74 L62 95 Z"
            fill={`url(#${cage})`}
            stroke="#444"
            strokeWidth={0.5}
            strokeLinejoin="round"
          />
          <line x1="22" y1="74" x2="22" y2="94" stroke="#888" strokeWidth={0.6} />
          <line x1="38" y1="74" x2="38" y2="94" stroke="#AAA" strokeWidth={0.5} />
          <line x1="54" y1="74" x2="54" y2="94" stroke="#888" strokeWidth={0.6} />
          <MeshPanel x={24} y={78} w={12} h={14} />
          <MeshPanel x={42} y={78} w={12} h={14} />

          <ellipse cx="38" cy="84" rx="9" ry="7" fill={`url(#${inner})`} opacity={0.7} />

          <rect
            x="48"
            y="86"
            width="5"
            height="5"
            rx="0.6"
            fill={kronis.lime}
            stroke="#fff"
            strokeWidth={0.25}
          />

          <path
            d="M18 72 H58 C60 72 62 70 62 68 V66 C62 64 60 62 58 62 H18 C16 62 14 64 14 66 V68 C14 70 16 72 18 72 Z"
            fill="#111"
            stroke="#000"
            strokeWidth={0.35}
          />
          <ellipse cx="38" cy="62" rx="22" ry="3" fill="#222" stroke="#000" strokeWidth={0.3} />

          <ellipse
            cx="38"
            cy="60"
            rx="24"
            ry="3.5"
            fill={`url(#${metal})`}
            stroke="#555"
            strokeWidth={0.4}
          />

          <rect
            x="22"
            y="16"
            width="32"
            height="44"
            rx="1.5"
            fill={`url(#${motor})`}
            stroke="#222"
            strokeWidth={0.55}
          />
          <line x1="38" y1="18" x2="38" y2="58" stroke="#999" strokeWidth={0.35} opacity={0.5} />
          <rect x="24" y="18" width="6" height="40" rx="0.8" fill="#FFF" opacity={0.28} />
          {[22, 58].map((x) => (
            <circle
              key={`hb-${x}`}
              cx={x}
              cy="38"
              r="1.4"
              fill="#CCC"
              stroke="#666"
              strokeWidth={0.25}
            />
          ))}

          <rect
            x="20"
            y="12"
            width="36"
            height="5"
            rx="0.8"
            fill={`url(#${metal})`}
            stroke="#333"
            strokeWidth={0.4}
          />
          {[
            [24, 14],
            [52, 14],
            [24, 16],
            [52, 16],
          ].map(([cx, cy], i) => (
            <circle
              key={`eye-${i}`}
              cx={cx}
              cy={cy}
              r="1.5"
              fill="none"
              stroke="#444"
              strokeWidth={0.7}
            />
          ))}

          <path
            d="M30 12 C30 7 46 7 46 12"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx="30" cy="12" r="2.2" fill="#222" stroke="#111" strokeWidth={0.35} />
          <circle cx="46" cy="12" r="2.2" fill="#222" stroke="#111" strokeWidth={0.35} />

          <rect
            x="52"
            y="36"
            width="15"
            height="16"
            rx="0.6"
            fill={`url(#${flange})`}
            stroke="#000"
            strokeWidth={0.45}
          />
          {[
            [54, 38],
            [65, 38],
            [54, 50],
            [65, 50],
          ].map(([cx, cy], i) => (
            <circle
              key={`fb-${i}`}
              cx={cx}
              cy={cy}
              r="1.1"
              fill="#555"
              stroke="#888"
              strokeWidth={0.2}
            />
          ))}
          <circle cx="59.5" cy="44" r="4.5" fill="#050505" stroke="#333" strokeWidth={0.4} />
          <circle cx="59.5" cy="44" r="3" fill="#151515" />

          <text
            x="38"
            y="40"
            fontSize={selected ? 14 : 12}
            fontWeight={800}
            fill="#171A12"
            stroke="#FFFFFF"
            strokeWidth={0.5}
            textAnchor="middle"
          >
            {number}
          </text>
        </g>

        {showSpray ? (
          <g>
            <path
              d="M63 44 C70 42.5 78 44 86 50 C90 53.5 94 58 97 63"
              stroke="#2B8FD6"
              strokeWidth={4.6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5 1.8"
              strokeDashoffset={20 - dash1}
              opacity={0.5}
            />
            <path
              d="M64 43 C71 41 79 43 87 49 C91 52.5 95 57 98 62"
              stroke="#3FA4EF"
              strokeWidth={3.6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4.5 1.6"
              strokeDashoffset={20 - dash1}
              opacity={0.9}
            />
            <path
              d="M64 44.5 C70.5 42.5 78 45 86 51 C89.5 54.5 93.5 59 96.5 63"
              stroke="#7EC8F8"
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="3.5 1.8"
              strokeDashoffset={20 - dash2}
              opacity={0.85}
            />
            <path
              d="M65 45.5 C71 44.5 78 47.5 84 53 C88 56.5 91.5 60.5 94 64"
              stroke="#B8E4FF"
              strokeWidth={1.9}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="2.8 2"
              strokeDashoffset={20 - dash3}
              opacity={0.8}
            />
            <path
              d="M63.5 42.8 C69 40.5 76 41.5 82 46 C86 49 90 53 93 57"
              stroke="#E8F6FF"
              strokeWidth={1.4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="2 2.2"
              strokeDashoffset={20 - dash2}
              opacity={0.7}
            />
            <ellipse
              cx={96}
              cy={62}
              rx={splashRx}
              ry={splashRy}
              fill="#3FA4EF"
              opacity={splashOpacity}
            />
            <ellipse
              cx={91}
              cy={58}
              rx={splash2Rx}
              ry={splash2Ry}
              fill="#9BD5FF"
              opacity={splash2Opacity}
            />
            <circle
              cx={87}
              cy={55}
              r={1.1}
              fill="#3FA4EF"
              opacity={0.55 + splashPhase * 0.35}
            />
            <circle
              cx={99}
              cy={64}
              r={0.9}
              fill="#7EC8F8"
              opacity={0.45 + splashPhase * 0.35}
            />
            <circle
              cx={94}
              cy={65}
              r={0.75}
              fill="#B8E4FF"
              opacity={0.4 + splashPhase * 0.35}
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export default PumpMapMarker;
