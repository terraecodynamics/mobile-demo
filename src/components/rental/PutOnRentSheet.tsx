"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { kronis } from "@/lib/kronis";
import { useEffect, useState } from "react";

export type ListForRentPayload = {
  ratePerDayInr: number;
  model: string;
  available: boolean;
};

type Props = {
  open: boolean;
  /** Kronis 4 | Kronis 4 – Pro */
  model?: string;
  initialRate?: number;
  initialAvailable?: boolean;
  onClose: () => void;
  onSaved?: (payload: ListForRentPayload) => void;
};

export function PutOnRentSheet({
  open,
  model = "Kronis 4",
  initialRate = 700,
  initialAvailable = true,
  onClose,
  onSaved,
}: Props) {
  const [rate, setRate] = useState(String(initialRate));
  const [available, setAvailable] = useState(initialAvailable);
  const [pumpModel, setPumpModel] = useState(model);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRate(String(initialRate));
    setAvailable(initialAvailable);
    setPumpModel(model);
    setSaving(false);
  }, [open, initialRate, initialAvailable, model]);

  const rateNum = parseFloat(rate);
  const canSave = Number.isFinite(rateNum) && rateNum > 0;

  const save = () => {
    if (!canSave) return;
    setSaving(true);
    window.setTimeout(() => {
      onSaved?.({
        ratePerDayInr: rateNum,
        model: pumpModel,
        available,
      });
      setSaving(false);
      onClose();
    }, 180);
  };

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      maxHeight="68%"
      dim
      header={
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          List for rent
        </div>
      }
    >
      <button
        type="button"
        onClick={() => setAvailable((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded-[16px] border px-3.5 py-3.5"
        style={{ background: kronis.surface, borderColor: kronis.border }}
      >
        <span className="text-[15px] font-extrabold" style={{ color: kronis.ink }}>
          Available
        </span>
        <span
          className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
          style={{ background: available ? kronis.lime : "#c5ccd6" }}
        >
          <span
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
            style={{ left: available ? 22 : 2 }}
          />
        </span>
      </button>

      <div className="mb-4 flex gap-2">
        {(["Kronis 4", "Kronis 4 – Pro"] as const).map((m) => {
          const active = pumpModel === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setPumpModel(m)}
              className="flex-1 rounded-[14px] py-2.5 text-[13px] font-extrabold"
              style={{
                background: active ? kronis.limeSoft : "#e8eaed",
                color: active ? kronis.lime : kronis.inkMuted,
                border: active ? `1.5px solid ${kronis.lime}` : "1.5px solid transparent",
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="mb-1.5 text-[12px] font-bold" style={{ color: kronis.inkMuted }}>
        ₹ / day
      </div>
      <input
        value={rate}
        onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
        inputMode="decimal"
        placeholder="700"
        className="mb-5 w-full rounded-xl border-0 px-3 py-3 text-[18px] font-extrabold outline-none"
        style={{
          background: kronis.background,
          color: kronis.ink,
          boxShadow:
            "inset 2px 2px 6px rgba(163,177,198,0.3), inset -1px -1px 4px rgba(255,255,255,0.9)",
        }}
      />

      <SoftButton
        label={saving ? "…" : "List"}
        variant="orange"
        className="w-full"
        onClick={save}
      />
    </SheetModal>
  );
}
