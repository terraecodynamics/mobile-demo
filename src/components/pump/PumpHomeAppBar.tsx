"use client";

import { SoftChip } from "@/components/ui/SoftUi";
import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { kronis } from "@/lib/kronis";
import { Bell } from "lucide-react";

function SwitchArrows() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E04E1C" />
          <stop offset="45%" stopColor="#FF6B35" />
          <stop offset="55%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E04E1C" />
        </linearGradient>
      </defs>
      <path d="M10 8h7V5l4 4-4 4v-3h-7z" fill="url(#sw)" />
      <path d="M14 16H7v3l-4-4 4-4v3h7z" fill="url(#sw)" />
    </svg>
  );
}

type Props = {
  initials: string;
  deviceName: string;
  deviceNumber: number;
  running?: boolean;
  unread?: number;
  onProfile?: () => void;
  onPicker?: () => void;
  onNotifications?: () => void;
};

export function PumpHomeAppBar({
  initials,
  deviceName,
  deviceNumber,
  running = false,
  unread = 0,
  onProfile,
  onPicker,
  onNotifications,
}: Props) {
  return (
    <header
      className="relative z-30 flex items-center gap-2.5 overflow-hidden px-3.5 pb-3 pt-2"
      style={{
        background: "linear-gradient(180deg, #F4F7FA 0%, #E0E5EC 55%, #D5DDE8 100%)",
        borderBottom: "1px solid rgba(23,26,18,0.08)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{ background: "rgba(255,255,255,0.35)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
        style={{ background: "rgba(255,255,255,0.5)" }}
      />

      <SoftChip onClick={onProfile} label="Profile" color={kronis.ink}>
        <span className="text-[13px] font-bold" style={{ color: kronis.ink }}>
          {initials}
        </span>
      </SoftChip>

      <button
        type="button"
        onClick={onPicker}
        className="relative flex h-[56px] min-w-0 flex-1 items-center gap-2 overflow-hidden px-2.5 active:scale-[0.98]"
        style={{
          borderRadius: 22,
          background: "linear-gradient(180deg, #FFFFFF 0%, #F4F5F0 50%, #E6E8E1 100%)",
          border: "2px solid rgba(255,255,255,0.95)",
          boxShadow:
            "0 0 0 3px rgba(255,107,53,0.35), 5px 6px 12px rgba(102,109,122,0.28), -3px -3px 8px rgba(255,255,255,0.9)",
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[50%]"
          style={{ background: "rgba(255,255,255,0.45)" }}
        />
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden">
          <PumpMapMarker number={deviceNumber} selected={false} compact isRunning={running} />
        </span>
        <span
          className="relative min-w-0 flex-1 truncate text-left text-[15px] font-extrabold"
          style={{ color: kronis.ink }}
        >
          {deviceName}
        </span>
        <span className="relative shrink-0">
          <SwitchArrows />
        </span>
      </button>

      <div className="relative">
        <SoftChip
          icon={Bell}
          onClick={onNotifications}
          color={kronis.lime}
          label="Notifications"
        />
        {unread > 0 ? (
          <span
            className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full"
            style={{
              background: kronis.lime,
              boxShadow: "0 0 0 1.5px #fff",
            }}
          />
        ) : null}
      </div>
    </header>
  );
}
