"use client";

import { kronis } from "@/lib/kronis";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  icon?: "power" | "flash";
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
};

/**
 * Soft-UI rect mode button — matches the HTML notification-button reference:
 * outer inset well → raised ::before face → inner recessed cup.
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

  return (
    <button
      ref={hostRef}
      type="button"
      onClick={onClick}
      className="relative flex flex-1 items-center justify-center overflow-hidden active:scale-[0.985]"
      style={{
        height: outerH,
        borderRadius: outerR,
        background: "#d9dee7",
        /* HTML .notification-button outer inset */
        boxShadow: selected
          ? "inset 7px 8px 16px rgba(60,64,70,0.28), inset -6px -6px 14px rgba(255,255,255,0.2)"
          : "inset 7px 8px 16px rgba(126,134,149,0.18), inset -8px -8px 17px rgba(255,255,255,0.78)",
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
            /* HTML ::before raised surface — selected = dark press */
            background: selected
              ? "linear-gradient(145deg, #3A3F36 0%, #1E221A 45%, #10140E 100%)"
              : "linear-gradient(145deg, #f3f4f5 0%, #ececee 45%, #e1e2e5 100%)",
            border: selected
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid rgba(255,255,255,0.7)",
            boxShadow: selected
              ? "5px 6px 12px rgba(0,0,0,0.28), -2px -2px 8px rgba(255,255,255,0.1)"
              : "12px 16px 22px rgba(94,102,117,0.30), 4px 6px 10px rgba(116,123,137,0.12), -8px -8px 18px rgba(255,255,255,0.85)",
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
              /* HTML .icon-circle recessed */
              boxShadow: selected
                ? "inset 4px 5px 10px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.06)"
                : "inset 4px 5px 9px rgba(116,123,136,0.14), inset -4px -4px 9px rgba(255,255,255,0.72)",
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
