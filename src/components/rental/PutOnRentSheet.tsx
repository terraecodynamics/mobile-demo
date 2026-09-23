"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { kronis } from "@/lib/kronis";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export type RentPumpOption = {
  id: string;
  model: string;
  serial: string;
  number: number;
};

export type ListForRentPayload = {
  pumpId: string;
  model: string;
  serial: string;
  ratePerDayInr: number;
  available: boolean;
};

type Props = {
  open: boolean;
  pumps: RentPumpOption[];
  /** Currently selected / default pump id */
  selectedPumpId?: string;
  initialRate?: number;
  initialAvailable?: boolean;
  onClose: () => void;
  onSaved?: (payload: ListForRentPayload) => void;
};

export function PutOnRentSheet({
  open,
  pumps,
  selectedPumpId,
  initialRate = 700,
  initialAvailable = true,
  onClose,
  onSaved,
}: Props) {
  const [rate, setRate] = useState(String(initialRate));
  const [available, setAvailable] = useState(initialAvailable);
  const [pumpId, setPumpId] = useState(selectedPumpId ?? pumps[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRate(String(initialRate));
    setAvailable(initialAvailable);
    setPumpId(selectedPumpId ?? pumps[0]?.id ?? "");
    setSaving(false);
  }, [open, initialRate, initialAvailable, selectedPumpId, pumps]);

  const selected = pumps.find((p) => p.id === pumpId) ?? pumps[0];
  const rateNum = parseFloat(rate);
  const canSave = !!selected && Number.isFinite(rateNum) && rateNum > 0;

  const save = () => {
    if (!canSave || !selected) return;
    setSaving(true);
    window.setTimeout(() => {
      onSaved?.({
        pumpId: selected.id,
        model: selected.model,
        serial: selected.serial,
        ratePerDayInr: rateNum,
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
      maxHeight="72%"
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
        className="mb-3.5 flex w-full items-center justify-between rounded-[16px] border px-3.5 py-3.5"
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

      <div
        className="mb-2 text-[12px] font-bold uppercase tracking-[0.6px]"
        style={{ color: kronis.inkMuted }}
      >
        Pump · {pumps.length}
      </div>
      <div className="no-scrollbar mb-4 flex max-h-[200px] flex-col gap-1.5 overflow-y-auto">
        {pumps.map((p) => {
          const active = p.id === selected?.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPumpId(p.id)}
              className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left active:scale-[0.99]"
              style={{
                background: active ? kronis.limeSoft : "#e8eaed",
                border: active
                  ? `1.5px solid ${kronis.lime}`
                  : "1.5px solid transparent",
              }}
            >
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[15px] font-extrabold"
                  style={{ color: active ? kronis.lime : kronis.ink }}
                >
                  {p.model}
                </span>
                <span
                  className="mt-0.5 block text-[12px] font-semibold"
                  style={{ color: kronis.inkMuted }}
                >
                  {p.serial}
                </span>
              </span>
              {active ? (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: kronis.ink }}
                >
                  <Check size={14} color={kronis.lime} strokeWidth={3} />
                </span>
              ) : null}
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
