"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { useAppView } from "@/components/phone/AppViewProvider";
import type { HandoffOffer } from "@/lib/handoffKeys";
import { kronis } from "@/lib/kronis";
import { Copy, X } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  offer: HandoffOffer | null;
  onClose: () => void;
};

export function HandoffKeySheet({ open, offer, onClose }: Props) {
  const isWeb = useAppView() === "web";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!offer) return;
    try {
      await navigator.clipboard.writeText(offer.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const body = offer ? (
    <div className={isWeb ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <p className="text-[14px] font-semibold leading-snug" style={{ color: kronis.inkMuted }}>
        Tell the rentee this key. They enter it in Find to attach the pump. The same code works in any browser.
      </p>

      <div
        className="mt-4 rounded-[20px] px-4 py-6 text-center"
        style={{ background: "#fff", boxShadow: "inset 0 0 0 1px rgba(23,26,18,0.06)" }}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: kronis.inkMuted }}>
          Key
        </div>
        <div className="mt-2 font-mono text-[40px] font-extrabold tracking-[0.22em]" style={{ color: kronis.ink }}>
          {offer.key}
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-[14px]">
        <div className="flex justify-between gap-3">
          <dt style={{ color: kronis.inkMuted }}>Pump</dt>
          <dd className="font-extrabold" style={{ color: kronis.ink }}>
            {offer.model}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={{ color: kronis.inkMuted }}>Serial</dt>
          <dd className="font-extrabold" style={{ color: kronis.ink }}>
            {offer.serial}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={{ color: kronis.inkMuted }}>Rate</dt>
          <dd className="font-extrabold" style={{ color: kronis.ink }}>
            ₹{offer.ratePerDayInr}/day
          </dd>
        </div>
      </dl>

      <div className={isWeb ? "mt-auto flex flex-col gap-2.5 pt-6" : "mt-4 flex flex-col gap-2.5"}>
        <SoftButton
          label={copied ? "Copied" : "Copy key"}
          icon={Copy}
          variant="orange"
          className="w-full"
          onClick={copy}
        />
        <SoftButton label="Done" variant="soft" className="w-full" onClick={onClose} />
      </div>
    </div>
  ) : null;

  if (isWeb) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[80]">
        <button type="button" aria-label="Close give key" className="absolute inset-0 bg-black/30" onClick={onClose} />
        <aside
          className="absolute inset-y-0 right-0 flex w-[400px] max-w-[92vw] flex-col border-l p-5 shadow-[-24px_0_60px_rgba(23,26,18,0.22)]"
          style={{
            background: kronis.background,
            borderColor: "rgba(23,26,18,0.08)",
            animation: "kronis-drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <style>{`@keyframes kronis-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: kronis.inkMuted }}>
                Handoff
              </div>
              <div className="mt-1 text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Give this key
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: kronis.surface }}
              aria-label="Close"
            >
              <X size={16} color={kronis.ink} />
            </button>
          </div>
          {body}
        </aside>
      </div>
    );
  }

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      maxHeight="78%"
      dim
      header={
        <div className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
          Give this key
        </div>
      }
    >
      {body}
    </SheetModal>
  );
}
