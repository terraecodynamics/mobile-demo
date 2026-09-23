"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import {
  claimHandoffKey,
  normalizeHandoffKey,
  type AttachedRental,
} from "@/lib/handoffKeys";
import { kronis } from "@/lib/kronis";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  renteeName?: string;
  renteePhone?: string;
  onClose: () => void;
  onAttached: (rental: AttachedRental) => void;
};

const HINTS = ["KR007A", "KR014B", "KR021C"];

export function EnterHandoffKeySheet({
  open,
  renteeName,
  renteePhone,
  onClose,
  onAttached,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
    setBusy(false);
  }, [open]);

  const submit = (raw = code) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = claimHandoffKey(raw, {
      name: renteeName ?? "Rentee",
      phone: renteePhone ?? "",
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    onAttached(result.rental);
    setBusy(false);
    onClose();
  };

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      height="100%"
      maxHeight="100%"
      className="min-h-0 rounded-t-[22px]"
      header={
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Enter key
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <p
          className="mb-3 text-[14px] font-semibold leading-snug"
          style={{ color: kronis.inkMuted }}
        >
          Enter the owner’s key (same code works in any browser).
        </p>

        <input
          value={code}
          onChange={(e) => {
            setCode(normalizeHandoffKey(e.target.value));
            setError(null);
          }}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="······"
          className="mb-2 w-full rounded-xl border-0 px-3 py-4 text-center font-mono text-[28px] font-extrabold tracking-[0.35em] outline-none"
          style={{
            background: kronis.background,
            color: kronis.ink,
            boxShadow:
              "inset 2px 2px 6px rgba(163,177,198,0.3), inset -1px -1px 4px rgba(255,255,255,0.9)",
          }}
        />

        {error ? (
          <div
            className="mb-2 text-center text-[13px] font-bold"
            style={{ color: "#C2410C" }}
          >
            {error}
          </div>
        ) : (
          <div className="mb-2 h-5" />
        )}

        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
          {HINTS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setCode(k);
                setError(null);
              }}
              className="rounded-full px-2.5 py-1 font-mono text-[11px] font-bold active:scale-[0.98]"
              style={{ background: "#e8eaed", color: kronis.inkMuted }}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <SoftButton
            label={busy ? "…" : "Attach pump"}
            variant="orange"
            className="w-full"
            onClick={() => submit()}
          />
        </div>
      </div>
    </SheetModal>
  );
}
