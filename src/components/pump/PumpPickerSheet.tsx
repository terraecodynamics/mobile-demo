"use client";

import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { SoftButton } from "@/components/ui/SoftUi";
import { SheetModal } from "@/components/ui/SheetModal";
import { ALL_PUMPS_ID } from "@/components/pump/MapStage";
import { kronis } from "@/lib/kronis";
import { Check, ChevronRight, LayoutGrid, Plus } from "lucide-react";

export type PickerPump = {
  id: string;
  name: string;
  model?: string;
  serial?: string;
  number: number;
  online: boolean;
  running: boolean;
};

/** Matches native PumpPickerModal deviceStatus */
function deviceStatus(device: PickerPump) {
  if (!device.online) {
    return { label: "Offline", color: kronis.inkMuted, bg: kronis.offline };
  }
  if (device.running) {
    return { label: "Running", color: kronis.lime, bg: kronis.limeSoft };
  }
  return {
    label: "Online",
    color: "#2F6B3A",
    bg: "rgba(47,107,58,0.12)",
  };
}

type Props = {
  open: boolean;
  pumps: PickerPump[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onAddPump?: () => void;
  onViewAll?: () => void;
  /** Match home control sheet height when provided */
  sheetHeight?: number;
};

export function PumpPickerSheet({
  open,
  pumps,
  selectedId,
  onSelect,
  onClose,
  onAddPump,
  onViewAll,
  sheetHeight,
}: Props) {
  return (
    <SheetModal
      open={open}
      onClose={onClose}
      height={sheetHeight ? `${sheetHeight}px` : "62%"}
      maxHeight={sheetHeight ? `${sheetHeight}px` : "62%"}
      header={
        <div
          className="px-1 text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Select pump
        </div>
      }
    >
      <div className="flex min-h-0 flex-col">
        <div
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
          style={{ maxHeight: sheetHeight ? Math.max(160, sheetHeight - 200) : 280 }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(ALL_PUMPS_ID);
              onClose();
            }}
            className="mb-1 flex w-full items-center gap-3 rounded-2xl px-2.5 py-3 text-left active:scale-[0.99]"
            style={{
              background: selectedId === ALL_PUMPS_ID ? kronis.limeSoft : "transparent",
            }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
              style={{
                background:
                  selectedId === ALL_PUMPS_ID
                    ? "rgba(255,107,53,0.16)"
                    : kronis.surfaceMuted,
              }}
            >
              <LayoutGrid
                size={20}
                color={selectedId === ALL_PUMPS_ID ? kronis.lime : kronis.ink}
                strokeWidth={2.2}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-[16px] font-bold"
                style={{ color: kronis.ink }}
              >
                All pumps
              </span>
              <span
                className="mt-1 block text-[12px] font-semibold"
                style={{ color: kronis.inkMuted }}
              >
                Show all on map · {pumps.length}
              </span>
            </span>
            {selectedId === ALL_PUMPS_ID ? (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: kronis.ink }}
              >
                <Check size={16} color={kronis.lime} strokeWidth={3} />
              </span>
            ) : (
              <span className="h-7 w-7 shrink-0" />
            )}
          </button>

          {pumps.map((p) => {
            const selected = p.id === selectedId;
            const status = deviceStatus(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  onClose();
                }}
                className="mb-1 flex w-full items-center gap-3 rounded-2xl px-2.5 py-3 text-left active:scale-[0.99]"
                style={{
                  background: selected ? kronis.limeSoft : "transparent",
                }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
                  style={{
                    background: selected
                      ? "rgba(255,107,53,0.16)"
                      : kronis.surfaceMuted,
                  }}
                >
                  <PumpMapMarker
                    number={p.number}
                    selected={selected}
                    isRunning={p.running}
                    compact
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[16px] font-bold"
                    style={{ color: kronis.ink }}
                  >
                    {p.model ?? p.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.serial ? (
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: kronis.inkMuted }}
                      >
                        {p.serial}
                      </span>
                    ) : null}
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
                      style={{ background: status.bg }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: status.color }}
                      />
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </span>
                    </span>
                  </span>
                </span>

                {selected ? (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: kronis.ink }}
                  >
                    <Check size={16} color={kronis.lime} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-7 w-7 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-col gap-2.5 pt-2">
          {onViewAll ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewAll();
              }}
              className="flex w-full items-center gap-2.5 rounded-[14px] border px-2.5 py-3 active:scale-[0.99]"
              style={{
                background: kronis.surface,
                borderColor: kronis.border,
              }}
            >
              <LayoutGrid size={18} color={kronis.ink} />
              <span
                className="flex-1 text-left text-[14px] font-bold"
                style={{ color: kronis.ink }}
              >
                View all devices
              </span>
              <ChevronRight size={18} color={kronis.inkMuted} />
            </button>
          ) : null}

          <SoftButton
            label="Add a pump"
            icon={Plus}
            variant="ink"
            className="w-full"
            onClick={() => {
              onClose();
              onAddPump?.();
            }}
          />
        </div>
      </div>
    </SheetModal>
  );
}
