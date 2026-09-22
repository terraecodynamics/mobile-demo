"use client";

import { useId } from "react";

export const NEO_SURFACE = "#d9dee7";

type Props = {
  size: number;
  wellSize: number;
  running: boolean;
  offline: boolean;
  loading?: boolean;
  onClick: () => void;
};

/**
 * Neumorph Start / orange Stop — exact port of native NeumorphStartButton.js
 */
export function NeumorphStartButton({
  size,
  wellSize,
  running,
  offline,
  loading,
  onClick,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const faceDim = size;
  const indentSize = Math.round(faceDim * 0.72);
  const iconSize = Math.max(22, Math.round(faceDim * 0.34));
  const cx = wellSize / 2;
  const cy = wellSize / 2;
  const faceR = faceDim / 2;
  const wellR = wellSize / 2;
  const indentR = indentSize / 2;
  const pad = (wellSize - faceDim) / 2;

  const s = faceDim / 280;
  const darkOffX = Math.max(6, Math.round(12 * s));
  const darkOffY = Math.max(8, Math.round(16 * s));
  const darkBlur = Math.max(10, Math.round(22 * s));
  const softOffX = Math.max(1, Math.round(2 * s));
  const softOffY = Math.max(2, Math.round(4 * s));
  const softBlur = Math.max(4, Math.round(8 * s));
  const lightOff = Math.max(4, Math.round(8 * s));
  const lightBlur = Math.max(8, Math.round(18 * s));

  const id = {
    gD: `neoGD-${uid}`,
    gL: `neoGL-${uid}`,
    stop: `stopIcon-${uid}`,
  };

  const label = offline ? "Offline" : running ? "Stop" : "Start";
  const disabled = Boolean(loading || offline);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group relative overflow-visible active:[&_.neo-face]:translate-y-[4px] active:[&_.neo-face]:scale-[0.9]"
      style={{
        width: wellSize,
        height: wellSize,
        borderRadius: wellSize / 2,
        background: NEO_SURFACE,
      }}
    >
      {/* Outer recessed ring */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={wellSize}
        height={wellSize}
        aria-hidden
      >
        <defs>
          <radialGradient id={id.gD} cx="30%" cy="28%" r="75%">
            <stop offset="0%" stopColor="rgb(142,149,162)" stopOpacity={0.28} />
            <stop offset="50%" stopColor="rgb(142,149,162)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="rgb(142,149,162)" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={id.gL} cx="78%" cy="80%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={wellR} fill={NEO_SURFACE} />
        <circle cx={cx} cy={cy} r={wellR} fill={`url(#${id.gD})`} />
        <circle cx={cx} cy={cy} r={wellR} fill={`url(#${id.gL})`} />
        <circle cx={cx} cy={cy} r={faceR + 0.5} fill={NEO_SURFACE} />
      </svg>

      {/* White upper highlight */}
      <span
        className="pointer-events-none absolute transition-opacity group-active:opacity-20"
        style={{
          top: pad,
          left: pad,
          width: faceDim,
          height: faceDim,
          borderRadius: faceR,
          background: NEO_SURFACE,
          boxShadow: `${-lightOff}px ${-lightOff}px ${lightBlur}px rgba(255,255,255,0.82)`,
        }}
      />
      {/* Soft surround */}
      <span
        className="pointer-events-none absolute transition-opacity group-active:opacity-20"
        style={{
          top: pad,
          left: pad,
          width: faceDim,
          height: faceDim,
          borderRadius: faceR,
          background: NEO_SURFACE,
          boxShadow: `${softOffX}px ${softOffY}px ${softBlur}px rgba(120,127,140,0.12)`,
        }}
      />

      {/* Raised face */}
      <span
        className="neo-face absolute z-[2] flex items-center justify-center transition-transform duration-75"
        style={{
          top: pad,
          left: pad,
          width: faceDim,
          height: faceDim,
          borderRadius: faceR,
          overflow: running ? "hidden" : "visible",
          background: running
            ? "linear-gradient(145deg, #FFC266 0%, #FF6B35 48%, #E04E1C 100%)"
            : "linear-gradient(145deg, #f5f6f8 0%, #eceef1 48%, #e2e5ea 100%)",
          border: running
            ? "2px solid rgba(255,255,255,0.5)"
            : "1px solid rgba(255,255,255,0.85)",
          boxShadow: running
            ? "4px 10px 16px rgba(224,78,28,0.45)"
            : `${darkOffX}px ${darkOffY}px ${darkBlur}px rgba(102,109,122,0.34)`,
          opacity: loading ? 0.88 : 1,
        }}
      >
        {!running ? (
          <span
            className="absolute"
            style={{
              width: indentSize,
              height: indentSize,
              borderRadius: indentR,
              top: (faceDim - indentSize) / 2,
              left: (faceDim - indentSize) / 2,
              border: "0.5px solid rgba(255,255,255,0.65)",
              background: "linear-gradient(145deg, #e4e7ec 0%, #eef0f3 42%, #f7f8f9 100%)",
              boxShadow:
                "inset 2px 2px 5px rgba(120,126,138,0.22), inset -2px -2px 5px rgba(255,255,255,0.9)",
            }}
          />
        ) : (
          <>
            <span
              className="pointer-events-none absolute left-[10%] right-[10%] top-0 h-[42%] rounded-b-full"
              style={{ background: "rgba(255,255,255,0.28)" }}
            />
            <span
              className="pointer-events-none absolute inset-[3px] rounded-full border-2"
              style={{ borderColor: "rgba(255,255,255,0.35)" }}
            />
          </>
        )}

        <span className="relative z-[3] flex flex-col items-center justify-center">
          {loading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
              style={{
                borderTopColor: running ? "#fff" : "#ff6b35",
                borderRightColor: running ? "rgba(255,255,255,0.35)" : "rgba(255,107,53,0.35)",
              }}
            />
          ) : running ? (
            <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" aria-hidden>
              <defs>
                <linearGradient id={id.stop} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FFF0D6" />
                </linearGradient>
              </defs>
              <rect x="14" y="14" width="20" height="20" rx="4" fill={`url(#${id.stop})`} />
            </svg>
          ) : (
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 48 48"
              aria-hidden
              style={{ display: "block", overflow: "visible" }}
            >
              <line
                x1="24"
                y1="9"
                x2="24"
                y2="22"
                stroke="#FF6B35"
                strokeWidth={4}
                strokeLinecap="round"
              />
              <path
                d="M 14 17 A 13 13 0 1 0 34 17"
                stroke="#FF6B35"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
          {!loading ? (
            <span
              style={{
                marginTop: running ? -2 : 4,
                fontSize: running ? 16 : 15,
                fontWeight: 800,
                letterSpacing: 0.35,
                color: running ? "#FFFFFF" : "#171A12",
                lineHeight: 1,
              }}
            >
              {label}
            </span>
          ) : null}
        </span>
      </span>

      {running ? (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-[2.5px]"
          style={{
            width: faceDim + 18,
            height: faceDim + 18,
            borderColor: "rgba(255,107,53,0.4)",
          }}
        />
      ) : null}
    </button>
  );
}
