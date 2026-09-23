"use client";

import { kronis } from "@/lib/kronis";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  icon?: "power" | "flash" | "calendar";
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
};

/**
 * Soft-UI rect mode button — matches the HTML notification-button reference:
 * outer inset well → raised ::before face → inner recessed cup.
 * Hold (mouse/touch): face pushes in; release restores raised / selected dark.
 */
export function NeoModeButton({
  label,
  icon = "power",
  selected = false,
  onClick,
  compact = false,
}: Props) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pressed, setPressed] = useState(false);

  const outerH = compact ? 64 : 72;
  /** HTML: height 180 → radius 38 */
  const outerR = Math.round(outerH * (38 / 180));
  /** Equal inset so raised face sits centered (native mode buttons) */
  const outerPad = compact ? 7 : 8;
  const cupPad = compact ? 5 : 6;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const measure = () => {
      // Use layout size, not getBoundingClientRect — PhoneShell CSS scale()
      // would otherwise shrink the raised face and pin it top-left.
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      setSize((prev) =>
        prev.w === width && prev.h === height ? prev : { w: width, h: height }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const release = () => setPressed(false);

  const ow = size.w;
  const oh = size.h || outerH;
  const raisedW = ow > 0 ? Math.max(0, ow - outerPad * 2) : 0;
  const raisedH = oh > 0 ? Math.max(0, oh - outerPad * 2) : 0;
  /** HTML: raised 125 → radius 30 */
  const raisedR = Math.max(12, Math.round(raisedH * (30 / 125)));
  const cupW = raisedW > 0 ? Math.max(0, raisedW - cupPad * 2) : 0;
  const cupH = raisedH > 0 ? Math.max(0, raisedH - cupPad * 2) : 0;
  /** HTML: cup 90 → radius 24 */
  const cupR = Math.max(10, Math.round(cupH * (24 / 90)));

  const ink = selected ? kronis.lime : "#858b9c";
  const iconPx = compact ? 15 : 17;

  /** While held: deeper well + face sunk (inset). On release: raised again. */
  const outerShadow = pressed
    ? selected
      ? "inset 9px 10px 18px rgba(40,44,48,0.45), inset -4px -4px 10px rgba(255,255,255,0.08)"
      : "inset 9px 10px 18px rgba(100,108,122,0.32), inset -5px -5px 12px rgba(255,255,255,0.55)"
    : selected
      ? "inset 7px 8px 16px rgba(60,64,70,0.28), inset -6px -6px 14px rgba(255,255,255,0.2)"
      : "inset 7px 8px 16px rgba(126,134,149,0.18), inset -8px -8px 17px rgba(255,255,255,0.78)";

  const faceBg = selected
    ? "linear-gradient(145deg, #3A3F36 0%, #1E221A 45%, #10140E 100%)"
    : "linear-gradient(145deg, #f3f4f5 0%, #ececee 45%, #e1e2e5 100%)";

  const faceShadow = pressed
    ? selected
      ? "inset 5px 6px 12px rgba(0,0,0,0.55), inset -2px -2px 6px rgba(255,255,255,0.04)"
      : "inset 6px 7px 14px rgba(94,102,117,0.35), inset -3px -3px 8px rgba(255,255,255,0.7)"
    : selected
      ? "5px 6px 12px rgba(0,0,0,0.28), -2px -2px 8px rgba(255,255,255,0.1)"
      : "12px 16px 22px rgba(94,102,117,0.30), 4px 6px 10px rgba(116,123,137,0.12), -8px -8px 18px rgba(255,255,255,0.85)";

  const faceTransform = pressed
    ? "translateY(1.5px) scale(0.97)"
    : "translateY(0) scale(1)";

  return (
    <button
      ref={hostRef}
      type="button"
      onClick={onClick}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        setPressed(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onBlur={release}
      className="relative flex flex-1 items-center justify-center overflow-hidden"
      style={{
        height: outerH,
        borderRadius: outerR,
        background: "#d9dee7",
        boxShadow: outerShadow,
        transition: "box-shadow 120ms ease",
        touchAction: "manipulation",
      }}
    >
      {raisedW > 0 ? (
        <span
          className="absolute flex items-center justify-center"
          style={{
            top: outerPad,
            left: outerPad,
            width: raisedW,
            height: raisedH,
            borderRadius: raisedR,
            background: faceBg,
            border: selected
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid rgba(255,255,255,0.7)",
            boxShadow: faceShadow,
            transform: faceTransform,
            transition:
              "box-shadow 120ms ease, transform 120ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span
            className="relative z-[2] flex items-center justify-center gap-[5px] overflow-hidden px-1.5"
            style={{
              width: cupW,
              height: cupH,
              borderRadius: cupR,
              background: selected ? "#161A14" : "#e9eaec",
              border: selected
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.72)",
              boxShadow: pressed
                ? selected
                  ? "inset 5px 6px 11px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(255,255,255,0.04)"
                  : "inset 5px 6px 10px rgba(116,123,136,0.22), inset -3px -3px 8px rgba(255,255,255,0.65)"
                : selected
                  ? "inset 4px 5px 10px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.06)"
                  : "inset 4px 5px 9px rgba(116,123,136,0.14), inset -4px -4px 9px rgba(255,255,255,0.72)",
              transition: "box-shadow 120ms ease",
            }}
          >
            {icon === "flash" ? (
              <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" className="shrink-0">
                <path
                  d="M13 2 4.8 13.2h6.2L11 22l8.2-11.2h-6.2L13 2z"
                  fill="none"
                  stroke={ink}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            ) : icon === "calendar" ? (
              <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" className="shrink-0">
                <rect
                  x="3.5"
                  y="5"
                  width="17"
                  height="15"
                  rx="2.5"
                  fill="none"
                  stroke={ink}
                  strokeWidth={2}
                />
                <path
                  d="M8 3.5v3.5M16 3.5v3.5M3.5 10h17"
                  fill="none"
                  stroke={ink}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" className="shrink-0">
                <path
                  d="M12 2v8"
                  fill="none"
                  stroke={ink}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
                <path
                  d="M7.2 6.2a7.2 7.2 0 1 0 9.6 0"
                  fill="none"
                  stroke={ink}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              </svg>
            )}
            <span
              className="truncate font-bold leading-none tracking-[0.1px]"
              style={{ fontSize: compact ? 11 : 12, color: ink }}
            >
              {label}
            </span>
          </span>
        </span>
      ) : null}
    </button>
  );
}
