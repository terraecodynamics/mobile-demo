"use client";

import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { dummyRentals, type DummyRental } from "@/data/dummy";
import { getAllAttached } from "@/lib/handoffKeys";
import { kronis } from "@/lib/kronis";
import { Check, Phone, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onManageAll?: () => void;
};

const statusColor: Record<"ACTIVE" | "COMPLETED", string> = {
  ACTIVE: kronis.lime,
  COMPLETED: "#6b7280",
};

const statusOrder: Record<"ACTIVE" | "COMPLETED", number> = {
  ACTIVE: 0,
  COMPLETED: 1,
};

const cardStyle: CSSProperties = {
  background: "linear-gradient(145deg, #f1f2f3 0%, #e8e9eb 48%, #dfe1e4 100%)",
  border: "1px solid rgba(255,255,255,0.72)",
  boxShadow:
    "4px 6px 12px rgba(102,109,122,0.22), -3px -3px 8px rgba(255,255,255,0.85)",
};

function callPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  window.location.href = `tel:${digits}`;
}

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return `${start} → ${end}`;
  }
  return `${a.toLocaleDateString("en-IN", opts)} → ${b.toLocaleDateString("en-IN", opts)}`;
}

export function ActiveRenteesSheet({ open, onClose, onManageAll }: Props) {
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmId(null);
    }
  }, [open]);

  const rows = useMemo(() => {
    const attached = getAllAttached().map(
      (a): DummyRental => ({
        id: `att-${a.id}`,
        pumpName: `${a.model} · ${a.serial}`,
        renteeName: a.renteeName,
        renteePhone: a.renteePhone,
        startDate: a.attachedAt.slice(0, 10),
        endDate: a.attachedAt.slice(0, 10),
        status: "ACTIVE",
        amountInr: a.ratePerDayInr,
      })
    );

    const byKey = new Map<string, DummyRental>();
    for (const r of [...attached, ...dummyRentals]) {
      if (r.status !== "ACTIVE" && r.status !== "COMPLETED") continue;
      const key = `${r.renteePhone.replace(/[^\d]/g, "").slice(-10)}|${r.pumpName}`;
      if (!byKey.has(key)) byKey.set(key, r);
    }

    return [...byKey.values()]
      .map((r) =>
        closedIds.includes(r.id) ? { ...r, status: "COMPLETED" as const } : r
      )
      .sort(
        (a, b) =>
          statusOrder[a.status as "ACTIVE" | "COMPLETED"] -
          statusOrder[b.status as "ACTIVE" | "COMPLETED"]
      );
  }, [open, closedIds]);

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;
  const completedCount = rows.filter((r) => r.status === "COMPLETED").length;

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      height="72%"
      maxHeight="72%"
      header={
        <div>
          <div
            className="text-[22px] font-extrabold tracking-[-0.3px]"
            style={{ color: kronis.ink }}
          >
            Active rentees
          </div>
          <div className="mt-0.5 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
            {activeCount} on pump
            {completedCount > 0 ? ` · ${completedCount} completed` : ""}
          </div>
        </div>
      }
    >
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {rows.length === 0 ? (
          <div
            className="rounded-[18px] px-4 py-10 text-center text-sm font-semibold"
            style={{ color: kronis.inkMuted, background: "#e8eaed" }}
          >
            No rentees yet — list a pump and give a key.
          </div>
        ) : (
          rows.map((r) => {
            const done = r.status === "COMPLETED";
            const confirming = confirmId === r.id;
            return (
              <div
                key={r.id}
                className="w-full shrink-0 rounded-[18px] p-3.5"
                style={cardStyle}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: done ? "#e8eaed" : kronis.limeSoft,
                    }}
                  >
                    <UserRound
                      size={18}
                      color={done ? kronis.inkMuted : kronis.lime}
                      strokeWidth={2.4}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15px] font-extrabold"
                          style={{ color: kronis.ink }}
                        >
                          {r.renteeName}
                        </div>
                        <div
                          className="truncate text-[12px] font-semibold"
                          style={{ color: kronis.inkMuted }}
                        >
                          {r.pumpName}
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
                        style={{
                          background:
                            statusColor[r.status as "ACTIVE" | "COMPLETED"],
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 text-[12px] font-semibold"
                      style={{ color: kronis.inkMuted }}
                    >
                      {formatRange(r.startDate, r.endDate)}
                      {done ? " · finished" : " · on pump"}
                    </div>
                  </div>
                </div>

                {done ? (
                  <button
                    type="button"
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-[13px] font-extrabold active:scale-[0.98]"
                    style={{ background: "#e8eaed", color: kronis.inkMuted }}
                    onClick={() => callPhone(r.renteePhone)}
                  >
                    <Phone size={14} strokeWidth={2.4} />
                    <span>Call · {r.renteePhone}</span>
                  </button>
                ) : confirming ? (
                  <div
                    className="mt-2.5 rounded-[14px] px-3 py-3"
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
                      Close rental for {r.renteeName}?
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[13px] font-extrabold active:scale-[0.98]"
                        style={{ background: "#fff", color: kronis.inkMuted }}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[13px] font-extrabold text-white active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`,
                        }}
                        onClick={() => {
                          setClosedIds((ids) =>
                            ids.includes(r.id) ? ids : [...ids, r.id]
                          );
                          setConfirmId(null);
                        }}
                      >
                        <Check size={15} strokeWidth={2.6} />
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[13px] font-extrabold active:scale-[0.98]"
                      style={{ background: kronis.limeSoft, color: kronis.lime }}
                      onClick={() => callPhone(r.renteePhone)}
                    >
                      <Phone size={14} strokeWidth={2.4} />
                      Call
                    </button>
                    <button
                      type="button"
                      className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[13px] font-extrabold text-white active:scale-[0.98]"
                      style={{
                        background: `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`,
                      }}
                      onClick={() => setConfirmId(r.id)}
                    >
                      <Check size={14} strokeWidth={2.6} />
                      Close
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {onManageAll ? (
        <SoftButton
          label="Manage all rentals"
          variant="ink"
          className="mt-2 w-full shrink-0"
          onClick={() => {
            onClose();
            onManageAll();
          }}
        />
      ) : null}
    </SheetModal>
  );
}
