"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import type { HandoffOffer } from "@/lib/handoffKeys";
import { kronis } from "@/lib/kronis";
import { Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  offer: HandoffOffer | null;
  onClose: () => void;
};

export function HandoffKeySheet({ open, offer, onClose }: Props) {
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

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      maxHeight="62%"
      dim
      header={
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Give this key
        </div>
      }
    >
      {offer ? (
        <>
          <p
            className="mb-4 text-[14px] font-semibold leading-snug"
            style={{ color: kronis.inkMuted }}
          >
            Tell the rentee this key — it works in any browser. They enter it in
            Find to attach{" "}
            <span style={{ color: kronis.ink }}>{offer.model}</span> · {offer.serial}.
          </p>

          <div
            className="mb-4 flex flex-col items-center rounded-[20px] border px-4 py-6"
            style={{ background: kronis.surface, borderColor: kronis.border }}
          >
            <div
              className="text-[11px] font-extrabold uppercase tracking-[1.2px]"
              style={{ color: kronis.inkMuted }}
            >
              Fixed key
            </div>
            <div
              className="mt-2 font-mono text-[36px] font-extrabold tracking-[0.28em]"
              style={{ color: kronis.ink }}
            >
              {offer.key}
            </div>
            <div className="mt-2 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
              ₹{offer.ratePerDayInr}/day · always the same
            </div>
          </div>

          <SoftButton
            label={copied ? "Copied" : "Copy"}
            icon={Copy}
            variant="soft"
            className="w-full"
            onClick={copy}
          />

          <SoftButton
            label="Done"
            variant="orange"
            className="mt-2.5 w-full"
            onClick={onClose}
          />
        </>
      ) : null}
    </SheetModal>
  );
}
