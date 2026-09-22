"use client";

import { SoftChip, SoftRaised, SoftButton } from "@/components/ui/SoftUi";
import { dummyRentals } from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const statusColor = {
  ACTIVE: kronis.lime,
  COMPLETED: "#6b7280",
  UPCOMING: "#4A7DBA",
} as const;

export default function RentalsPage() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [phone, setPhone] = useState("");

  const total = useMemo(
    () => dummyRentals.reduce((s, r) => s + r.amountInr, 0),
    []
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <div className="flex items-center gap-3 px-3.5 pb-3 pt-2">
        <SoftChip icon={ArrowLeft} onClick={() => router.push("/home")} label="Back" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
            Rentals
          </div>
          <div className="text-xs" style={{ color: kronis.inkMuted }}>
            Dummy data · UI only
          </div>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 pb-28">
        {dummyRentals.map((r) => (
          <SoftRaised key={r.id} className="w-full p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-extrabold" style={{ color: kronis.ink }}>
                  {r.pumpName}
                </div>
                <div className="mt-0.5 text-sm" style={{ color: kronis.inkMuted }}>
                  {r.renteeName} · {r.renteePhone}
                </div>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
                style={{ background: statusColor[r.status] }}
              >
                {r.status}
              </span>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span style={{ color: kronis.inkMuted }}>
                {r.startDate} → {r.endDate}
              </span>
              <span className="font-extrabold" style={{ color: kronis.ink }}>
                ₹{r.amountInr.toLocaleString("en-IN")}
              </span>
            </div>
          </SoftRaised>
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pb-5 pt-3"
        style={{
          background: `linear-gradient(180deg, transparent, ${kronis.background} 30%)`,
        }}
      >
        <div className="min-w-0 flex-1 text-sm font-semibold" style={{ color: kronis.inkMuted }}>
          {dummyRentals.length} rentals
        </div>
        <SoftChip
          icon={Plus}
          size={52}
          color={kronis.lime}
          onClick={() => setAddOpen(true)}
          label="Add rental"
        />
        <div className="min-w-0 flex-1 text-right text-sm font-extrabold" style={{ color: kronis.ink }}>
          ₹{total.toLocaleString("en-IN")}
        </div>
      </div>

      {addOpen ? (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/35">
          <button type="button" className="absolute inset-0" onClick={() => setAddOpen(false)} />
          <div
            className="relative rounded-t-[28px] px-4 pb-10 pt-3"
            style={{ background: kronis.background }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#c5ccd6]" />
            <div className="mb-3 text-[17px] font-extrabold" style={{ color: kronis.ink }}>
              Add rental
            </div>
            <label className="mb-1 block text-xs font-bold" style={{ color: kronis.inkMuted }}>
              Mobile number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91…"
              className="mb-4 w-full rounded-2xl border-0 px-4 py-3 text-[15px] outline-none"
              style={{
                background: "#fff",
                color: kronis.ink,
                boxShadow:
                  "inset 3px 3px 8px rgba(163,177,198,0.35), inset -2px -2px 6px rgba(255,255,255,0.9)",
              }}
            />
            <SoftButton
              label="Save (demo)"
              variant="orange"
              className="w-full"
              onClick={() => {
                setPhone("");
                setAddOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
