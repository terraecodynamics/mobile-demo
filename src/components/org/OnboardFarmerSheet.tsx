"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { useAppView } from "@/components/phone/AppViewProvider";
import { kronis } from "@/lib/kronis";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type OnboardFarmerPayload = {
  name: string;
  phone: string;
  village: string;
  farmName: string;
};

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: OnboardFarmerPayload) => void | Promise<void>;
};

export function OnboardFarmerSheet({
  open,
  busy = false,
  error = "",
  onClose,
  onSave,
}: Props) {
  const isWeb = useAppView() === "web";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [farmName, setFarmName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setVillage("");
    setFarmName("");
  }, [open]);

  const save = () => {
    void onSave({ name, phone, village, farmName });
  };

  const header = (
    <div>
      <div
        className={isWeb ? "text-[22px] font-extrabold tracking-[-0.3px]" : "text-[17px] font-extrabold"}
        style={{ color: kronis.ink }}
      >
        Onboard farmer
      </div>
      <div className="mt-0.5 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
        Add a farmer to your organization
      </div>
    </div>
  );

  const body = (
    <div className={isWeb ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {error ? (
        <div
          className="mb-3 shrink-0 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold"
          style={{ background: kronis.alertBg, color: kronis.alert }}
        >
          {error}
        </div>
      ) : null}

      <div className={isWeb ? "no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto" : "space-y-2.5"}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
          style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile"
          className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
          style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
        />
        <input
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          placeholder="Farm name"
          className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
          style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
        />
        <input
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          placeholder="Village"
          className="w-full rounded-xl border px-3 py-2.5 text-[14px] font-semibold outline-none"
          style={{ background: "#fff", borderColor: kronis.border, color: kronis.ink }}
        />
      </div>

      <SoftButton
        label={busy ? "Saving…" : "Save farmer"}
        variant="orange"
        className={isWeb ? "mt-auto w-full shrink-0 pt-4" : "mt-3.5 w-full"}
        onClick={save}
      />
    </div>
  );

  if (isWeb) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[80]">
        <button
          type="button"
          aria-label="Close onboard farmer"
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />
        <aside
          className="absolute inset-y-0 right-0 flex w-[400px] max-w-[92vw] flex-col border-l p-5 shadow-[-24px_0_60px_rgba(23,26,18,0.22)]"
          style={{
            background: kronis.background,
            borderColor: "rgba(23,26,18,0.08)",
            animation: "kronis-drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <style>{`@keyframes kronis-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
            {header}
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
    <SheetModal open={open} onClose={onClose} dim maxHeight="85%" header={header}>
      {body}
    </SheetModal>
  );
}
