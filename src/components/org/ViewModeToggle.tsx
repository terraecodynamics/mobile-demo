"use client";

import { kronis } from "@/lib/kronis";
import { LayoutGrid, Table2 } from "lucide-react";

export type OrgListView = "card" | "table";

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: OrgListView;
  onChange: (next: OrgListView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1"
      style={{ background: "#fff", boxShadow: "0 4px 12px rgba(23,26,18,0.06)" }}
      role="group"
      aria-label="List view"
    >
      {(
        [
          { id: "card" as const, label: "Cards", Icon: LayoutGrid },
          { id: "table" as const, label: "Table", Icon: Table2 },
        ] as const
      ).map(({ id, label, Icon }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold"
            style={{
              background: on ? kronis.ink : "transparent",
              color: on ? "#fff" : kronis.inkMuted,
            }}
          >
            <Icon size={14} strokeWidth={2.4} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
