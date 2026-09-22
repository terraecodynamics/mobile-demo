"use client";

import { SoftRaised } from "@/components/ui/SoftUi";
import { kronis } from "@/lib/kronis";
import { ChevronRight } from "lucide-react";

type Props = {
  flow: string;
  soil: string;
  offline?: boolean;
  onClick?: () => void;
};

/**
 * Flow / Soil metrics — exact native SoftRaised pill (borderRadius 999).
 * Flat capsule — not a wavy top.
 */
export function MetricsPill({ flow, soil, offline, onClick }: Props) {
  return (
    <SoftRaised
      onClick={onClick}
      radius={999}
      className="relative z-[5] mt-2.5 w-full shrink-0"
      contentClassName="flex h-[54px] items-center px-3.5"
    >
      <div className="flex flex-1 items-center justify-center gap-4">
        <div className="text-center">
          <div
            className="font-extrabold leading-none"
            style={{ fontSize: 17, color: kronis.ink }}
          >
            {offline ? "—" : flow}
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.55 }}> L/min</span>
          </div>
          <div
            className="mt-1 font-extrabold uppercase tracking-[0.8px]"
            style={{ fontSize: 11, color: kronis.inkMuted }}
          >
            Flow
          </div>
        </div>
        <span style={{ fontSize: 18, color: kronis.ink, opacity: 0.28 }}>|</span>
        <div className="text-center">
          <div
            className="font-extrabold leading-none"
            style={{ fontSize: 17, color: kronis.ink }}
          >
            {soil}
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.55 }}> %</span>
          </div>
          <div
            className="mt-1 font-extrabold uppercase tracking-[0.8px]"
            style={{ fontSize: 11, color: kronis.inkMuted }}
          >
            Soil
          </div>
        </div>
      </div>
      <ChevronRight
        size={18}
        color={kronis.inkMuted}
        className="absolute right-2"
      />
    </SoftRaised>
  );
}
