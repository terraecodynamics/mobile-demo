"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { PumpDial } from "@/components/pump/PumpDial";
import {
  getPrimaryAttached,
  setAttachedRunning,
  stopAttachedRent,
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
  const [confirmStop, setConfirmStop] = useState(false);
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

  const endRent = () => {
    if (!rental) return;
    if (running) {
      setAttachedRunning(rental.id, false);
      playPumpStopSound();
    }
    stopAttachedRent(rental.id);
    setRental(null);
    setConfirmStop(false);
    router.push("/rentals");
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

      <div
        className="mx-3.5 mb-3 rounded-[16px] border px-3.5 py-2.5"
        style={{
          background: kronis.surface,
          borderColor: kronis.border,
        }}
      >
        <div className="flex items-center gap-3 text-[13px] font-semibold">
          <span className="shrink-0" style={{ color: kronis.inkMuted }}>
            Attached
          </span>
          <span
            className="min-w-0 flex-1 text-right font-mono tracking-normal"
            style={{ color: kronis.ink }}
          >
            {rental.key}
          </span>
        </div>
        <div
          className="my-2 h-px"
          style={{ background: kronis.divider }}
        />
        <div className="flex items-center gap-3 text-[13px] font-semibold">
          <span className="shrink-0" style={{ color: kronis.inkMuted }}>
            Rate
          </span>
          <span className="min-w-0 flex-1 text-right" style={{ color: kronis.ink }}>
            ₹{rental.ratePerDayInr}/day
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-4">
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

      <div className="shrink-0 px-3.5 pb-5 pt-1">
        {confirmStop ? (
          <div
            className="rounded-[16px] px-3 py-3"
            style={{
              background: "#eef1f5",
              boxShadow:
                "inset 2px 2px 5px rgba(163,177,198,0.28), inset -1px -1px 4px rgba(255,255,255,0.85)",
            }}
          >
            <div
              className="mb-2.5 text-center text-[13px] font-extrabold"
              style={{ color: kronis.ink }}
            >
              Stop rent and detach this pump?
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-[12px] text-[13px] font-extrabold active:scale-[0.98]"
                style={{ background: "#fff", color: kronis.inkMuted }}
                onClick={() => setConfirmStop(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-[12px] text-[13px] font-extrabold text-white active:scale-[0.98]"
                style={{
                  background: `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`,
                }}
                onClick={endRent}
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <SoftButton
            label="Stop Rent"
            variant="ink"
            className="w-full"
            onClick={() => setConfirmStop(true)}
          />
        )}
      </div>
    </div>
  );
}
