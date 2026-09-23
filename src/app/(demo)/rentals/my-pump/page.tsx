"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { PumpDial } from "@/components/pump/PumpDial";
import {
  getPrimaryAttached,
  setAttachedRunning,
  type AttachedRental,
} from "@/lib/handoffKeys";
import { kronis } from "@/lib/kronis";
import {
  playDialClick,
  playPumpStartSound,
  playPumpStopSound,
  preloadPumpSounds,
} from "@/lib/pumpSounds";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Rentee screen after key attach — onboarded pump, start / stop only.
 */
export default function MyPumpPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [rental, setRental] = useState<AttachedRental | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [powerLoading, setPowerLoading] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    preloadPumpSounds();
    setRental(getPrimaryAttached(session?.phone));
  }, [session?.phone]);

  const running = rental?.running === true;

  const toggle = () => {
    if (!rental || lock.current) return;
    lock.current = true;
    setPowerLoading(true);
    const next = !running;
    window.setTimeout(() => {
      const updated = setAttachedRunning(rental.id, next);
      if (updated) setRental(updated);
      if (next) playPumpStartSound();
      else playPumpStopSound();
      setPowerLoading(false);
      lock.current = false;
    }, 420);
  };

  if (!rental) {
    return (
      <div
        className="relative flex min-h-0 flex-1 flex-col px-3.5 pt-2"
        style={{ background: kronis.background }}
      >
        <div className="flex items-center gap-3 pb-3">
          <SoftChip
            icon={ArrowLeft}
            onClick={() => router.push("/rentals")}
            label="Back"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
              My pump
            </div>
            <div className="text-xs" style={{ color: kronis.inkMuted }}>
              No pump attached yet
            </div>
          </div>
        </div>

        <SoftRaised className="mt-6 p-6 text-center" radius={22}>
          <KeyRound size={28} color={kronis.lime} className="mx-auto" />
          <div className="mt-3 text-[16px] font-extrabold" style={{ color: kronis.ink }}>
            Enter the owner’s key
          </div>
          <div className="mt-1.5 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            After you pick up the pump, attach it with the unique key.
          </div>
          <SoftButton
            label="Enter key"
            variant="orange"
            className="mt-5 w-full"
            onClick={() => router.push("/rentals?attach=1")}
          />
        </SoftRaised>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ background: kronis.background }}
    >
      <div className="relative z-20 flex items-center gap-3 px-3.5 pb-2 pt-2">
        <SoftChip
          icon={ArrowLeft}
          onClick={() => router.push("/rentals")}
          label="Back"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-extrabold" style={{ color: kronis.ink }}>
            {rental.model}
          </div>
          <div className="truncate text-xs" style={{ color: kronis.inkMuted }}>
            {rental.serial} · {rental.ownerName}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
          style={{
            background: running ? kronis.limeSoft : "#e8eaed",
            color: running ? kronis.lime : "#6b7280",
          }}
        >
          {running ? "RUNNING" : "READY"}
        </span>
      </div>

      <div className="mx-3.5 mb-3 rounded-[18px] border px-3.5 py-3" style={{
        background: kronis.surface,
        borderColor: kronis.border,
      }}>
        <div className="flex justify-between text-[13px] font-semibold">
          <span style={{ color: kronis.inkMuted }}>Attached</span>
          <span style={{ color: kronis.ink }}>{rental.key}</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[13px] font-semibold">
          <span style={{ color: kronis.inkMuted }}>Rate</span>
          <span style={{ color: kronis.ink }}>₹{rental.ratePerDayInr}/day</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-8">
        <div
          className="mb-4 text-center text-[15px] font-extrabold"
          style={{ color: kronis.ink }}
        >
          {powerLoading ? "…" : running ? "Pump running" : "Ready to start"}
        </div>

        <PumpDial
          size={220}
          timerMinutes={timerMinutes}
          onTimerChange={(m) => {
            if (m !== timerMinutes) playDialClick();
            setTimerMinutes(m);
          }}
          running={running}
          offline={false}
          powerLoading={powerLoading}
          onToggle={toggle}
        />

        <p
          className="mt-5 max-w-[260px] text-center text-[12px] font-semibold"
          style={{ color: kronis.inkMuted }}
        >
          Tap the dial to start or stop. This pump is onboarded to your rental.
        </p>
      </div>
    </div>
  );
}
