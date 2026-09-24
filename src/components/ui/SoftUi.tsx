"use client";

import { kronis } from "@/lib/kronis";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

const NEO = kronis.neo;

type SoftChipProps = {
  icon?: LucideIcon;
  children?: React.ReactNode;
  onClick?: () => void;
  size?: number;
  color?: string;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
  /** Flat chip for dark map overlays — no white halo glow */
  flat?: boolean;
  /** Solid single-color face (matches page bar chrome) */
  solid?: boolean;
  solidColor?: string;
};

/** Exact SkeuomorphicChip: raised face + recessed cup */
export function SoftChip({
  icon: Icon,
  children,
  onClick,
  size = 42,
  color = "#8b90a0",
  className = "",
  label,
  style,
  flat = false,
  solid = false,
  solidColor = NEO,
}: SoftChipProps) {
  const cup = Math.round(size * 0.62);
  const s = size / 48;
  const darkOff = Math.max(3, Math.round(6 * s));
  const darkBlur = Math.max(6, Math.round(12 * s));
  const lightOff = Math.max(2, Math.round(4 * s));

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`group relative inline-flex shrink-0 items-center justify-center transition-transform active:translate-y-[1.2px] active:scale-[0.96] ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {/* Raised face */}
      <span
        className="absolute inset-0 transition-opacity group-active:opacity-20"
        style={{
          borderRadius: size / 2,
          background: solid
            ? solidColor
            : "linear-gradient(145deg, #f1f2f3 0%, #e8e9eb 45%, #dfe1e4 100%)",
          boxShadow: solid
            ? "2px 3px 8px rgba(102,109,122,0.16)"
            : flat
              ? "0 2px 6px rgba(0,0,0,0.28)"
              : `${darkOff}px ${darkOff + 2}px ${darkBlur}px rgba(102,109,122,0.34), ${-lightOff}px ${-lightOff}px ${darkBlur}px rgba(255,255,255,0.9)`,
        }}
      />
      {/* Recessed cup */}
      <span
        className="relative z-[1] flex items-center justify-center"
        style={{
          width: cup,
          height: cup,
          borderRadius: cup / 2,
          background: solid ? solidColor : NEO,
          boxShadow: solid
            ? "inset 1.5px 1.5px 3px rgba(120,125,135,0.18)"
            : flat
              ? "inset 1px 1px 2px rgba(120,125,135,0.2)"
              : "inset 3px 3px 7px rgba(150,155,165,0.28), inset -3px -3px 7px rgba(255,255,255,0.75)",
        }}
      >
        {Icon ? <Icon size={Math.round(size * 0.42)} color={color} strokeWidth={2.1} /> : children}
      </span>
    </button>
  );
}

type SoftRaisedProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  radius?: number;
};

export function SoftRaised({
  children,
  className = "",
  contentClassName = "",
  onClick,
  radius = 18,
}: SoftRaisedProps) {
  const Comp = onClick ? "button" : "div";
  const isPill = radius >= 999;
  const r = isPill ? 9999 : radius;
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative text-left transition-transform ${onClick ? "active:scale-[0.985]" : ""} ${className}`}
      style={{
        borderRadius: r,
        background: "linear-gradient(145deg, #f1f2f3 0%, #e8e9eb 48%, #dfe1e4 100%)",
        border: "1px solid rgba(255,255,255,0.72)",
        boxShadow:
          "4px 6px 12px rgba(102,109,122,0.22), -3px -3px 8px rgba(255,255,255,0.85)",
        // Keep soft corners — clipping cuts badge/edge highlights
        overflow: "visible",
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[10%] top-0 h-[40%]"
        style={{
          borderRadius: isPill ? "9999px 9999px 14px 14px" : `${radius}px ${radius}px 0 0`,
          background: "rgba(255,255,255,0.35)",
        }}
      />
      <span className={`relative z-[1] block ${contentClassName}`}>{children}</span>
    </Comp>
  );
}

type SoftButtonProps = {
  label: string;
  onClick?: () => void;
  variant?: "ink" | "soft" | "orange";
  className?: string;
  icon?: LucideIcon;
  /** Native SkeuomorphicButton size="pill" */
  size?: "default" | "pill";
};

export function SoftButton({
  label,
  onClick,
  variant = "soft",
  className = "",
  icon: Icon,
  size = "default",
}: SoftButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isSoft = variant === "soft";
  const isInk = variant === "ink";
  const isPill = size === "pill";

  const release = () => setPressed(false);

  const idleShadow = isSoft
    ? "4px 5px 10px rgba(102,109,122,0.22), -3px -3px 8px rgba(255,255,255,0.85)"
    : "0 6px 14px rgba(10,12,8,0.35)";

  const pressedShadow = isSoft
    ? "inset 4px 5px 10px rgba(102,109,122,0.28), inset -2px -2px 6px rgba(255,255,255,0.75)"
    : "inset 4px 5px 12px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.08)";

  return (
    <button
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
      className={`relative inline-flex items-center justify-center gap-1.5 overflow-hidden font-bold ${
        isPill ? "px-3.5 py-2 text-[12px]" : "px-5 py-3 text-[14px]"
      } ${className}`}
      style={{
        borderRadius: isPill ? 9999 : 16,
        color: isSoft ? (isPill ? kronis.lime : kronis.ink) : isInk ? kronis.lime : "#fff",
        background: isSoft
          ? "linear-gradient(145deg, #f1f2f3, #e8e9eb, #dfe1e4)"
          : variant === "orange"
            ? `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`
            : "linear-gradient(145deg, #2C3026, #1C2018, #12150F)",
        boxShadow: pressed ? pressedShadow : idleShadow,
        transform: pressed ? "translateY(1.5px) scale(0.985)" : "translateY(0) scale(1)",
        transition:
          "box-shadow 120ms ease, transform 120ms cubic-bezier(0.22, 1, 0.36, 1)",
        touchAction: "manipulation",
      }}
    >
      {Icon ? <Icon size={isPill ? 14 : 18} /> : null}
      {label}
    </button>
  );
}
