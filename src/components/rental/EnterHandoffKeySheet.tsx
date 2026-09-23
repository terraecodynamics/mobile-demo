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

  const submit = () => {
    setBusy(true);
    setError(null);
    const result = claimHandoffKey(code, {
      name: renteeName ?? "Rentee",
      phone: renteePhone ?? "",
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    onAttached(result.rental);
    onClose();
  };

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      maxHeight="55%"
      dim
      header={
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Enter key
        </div>
      }
    >
      <p
        className="mb-4 text-[14px] font-semibold leading-snug"
        style={{ color: kronis.inkMuted }}
      >
        Ask the owner for the unique key, then enter it here to attach the pump.
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
        <div className="mb-3 text-center text-[13px] font-bold" style={{ color: "#C2410C" }}>
          {error}
        </div>
      ) : (
        <div className="mb-3 h-5" />
      )}

      <SoftButton
        label={busy ? "…" : "Attach pump"}
        variant="orange"
        className="w-full"
        onClick={submit}
      />
    </SheetModal>
  );
}
