"use client";

import { kronis } from "@/lib/kronis";
import type { LucideIcon } from "lucide-react";

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
          background: "linear-gradient(145deg, #f1f2f3 0%, #e8e9eb 45%, #dfe1e4 100%)",
          boxShadow: flat
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
          background: NEO,
          boxShadow: flat
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
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative text-left transition-transform ${onClick ? "active:scale-[0.985]" : ""} ${className}`}
      style={{
        borderRadius: isPill ? 9999 : radius,
        // Keep pill shadows visible; clip only squared cards
        overflow: isPill ? "visible" : "hidden",
      }}
    >
      <span
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: isPill ? 9999 : radius,
          background: "linear-gradient(145deg, #f1f2f3 0%, #e8e9eb 48%, #dfe1e4 100%)",
          border: "1px solid rgba(255,255,255,0.72)",
          boxShadow:
            "4px 6px 12px rgba(102,109,122,0.22), -3px -3px 8px rgba(255,255,255,0.85)",
        }}
      />
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
};

export function SoftButton({
  label,
  onClick,
  variant = "soft",
  className = "",
  icon: Icon,
}: SoftButtonProps) {
  const isSoft = variant === "soft";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden px-5 py-3 text-[14px] font-bold active:scale-[0.98] ${className}`}
      style={{
        borderRadius: 16,
        color: isSoft ? kronis.ink : "#fff",
        background: isSoft
          ? "linear-gradient(145deg, #f1f2f3, #e8e9eb, #dfe1e4)"
          : variant === "orange"
            ? `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`
            : kronis.ink,
        boxShadow: isSoft
          ? "6px 8px 14px rgba(102,109,122,0.28), -4px -4px 10px rgba(255,255,255,0.9)"
          : "0 8px 18px rgba(23,26,18,0.22)",
      }}
    >
      {Icon ? <Icon size={18} /> : null}
      {label}
    </button>
  );
}
