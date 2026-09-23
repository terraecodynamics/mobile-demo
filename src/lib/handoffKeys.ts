/** Owner shows a fixed key; rentee enters it in any browser to attach */

import { DEMO_OWNER, DEMO_RENTEE } from "@/lib/auth";
import { dummyPumps } from "@/data/dummy";
import { markListingUnavailable } from "@/lib/rentListings";

const ATTACHED_KEY = "terraeco.demo.attachedRentals.v3";

/**
 * Fixed attach codes — same on every browser / device.
 * Owner “Give key” shows this; rentee types it to attach.
 */
const FIXED_KEYS: Record<
  string,
  { pumpId: string; model: string; serial: string; ratePerDayInr: number }
> = {
  KR007A: {
    pumpId: "p1",
    model: "Kronis 4",
    serial: "KR-007",
    ratePerDayInr: 700,
  },
  KR014B: {
    pumpId: "p2",
    model: "Kronis 4",
    serial: "KR-014",
    ratePerDayInr: 700,
  },
  KR021C: {
    pumpId: "p3",
    model: "Kronis 4 – Pro",
    serial: "KR-021",
    ratePerDayInr: 800,
  },
};

/** Demo shortcut that always attaches pump 1 */
export const DEMO_ATTACH_KEY = "TERRA1";

export type HandoffOffer = {
  key: string;
  pumpId: string;
  model: string;
  serial: string;
  ownerName: string;
  ownerPhone: string;
  ratePerDayInr: number;
  createdAt: string;
  status: "open" | "revoked" | "claimed";
};

export type AttachedRental = {
  id: string;
  key: string;
  pumpId: string;
  model: string;
  serial: string;
  ownerName: string;
  ownerPhone: string;
  ratePerDayInr: number;
  renteeName: string;
  renteePhone: string;
  attachedAt: string;
  running: boolean;
};

let memoryAttached: AttachedRental[] = [];

function readAttached(): AttachedRental[] {
  if (typeof window === "undefined") return [...memoryAttached];
  try {
    const raw = window.localStorage.getItem(ATTACHED_KEY);
    const disk = raw ? (JSON.parse(raw) as AttachedRental[]) : [];
    const byId = new Map<string, AttachedRental>();
    for (const a of disk) byId.set(a.id, a);
    for (const a of memoryAttached) byId.set(a.id, a);
    return Array.from(byId.values()).sort((a, b) =>
      a.attachedAt < b.attachedAt ? 1 : -1
    );
  } catch {
    return [...memoryAttached];
  }
}

function writeAttached(list: AttachedRental[]) {
  memoryAttached = list;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTACHED_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function normalizeHandoffKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

/** Fixed 6-char key for a pump id — same forever, all browsers */
export function fixedKeyForPump(pumpId: string): string {
  const entry = Object.entries(FIXED_KEYS).find(([, v]) => v.pumpId === pumpId);
  if (entry) return entry[0];
  const p = dummyPumps.find((d) => d.id === pumpId) ?? dummyPumps[0];
  return normalizeHandoffKey(p.serial.padEnd(6, "X"));
}

export type IssueHandoffInput = {
  pumpId: string;
  model: string;
  serial: string;
  ratePerDayInr: number;
  ownerName?: string;
  ownerPhone?: string;
};

/** Owner portal: show the pump’s fixed key (works across browsers). */
export function issueHandoffKey(input: IssueHandoffInput): HandoffOffer {
  const key = fixedKeyForPump(input.pumpId);
  const meta = FIXED_KEYS[key];
  return {
    key,
    pumpId: input.pumpId,
    model: meta?.model ?? input.model,
    serial: meta?.serial ?? input.serial,
    ownerName: input.ownerName ?? DEMO_OWNER.name,
    ownerPhone: input.ownerPhone ?? DEMO_OWNER.phone,
    ratePerDayInr: input.ratePerDayInr || meta?.ratePerDayInr || 700,
    createdAt: new Date().toISOString(),
    status: "open",
  };
}

export function getOpenOfferForPump(pumpId: string): HandoffOffer | null {
  return issueHandoffKey({
    pumpId,
    model: dummyPumps.find((p) => p.id === pumpId)?.model ?? "Kronis 4",
    serial: dummyPumps.find((p) => p.id === pumpId)?.serial ?? "",
    ratePerDayInr: 700,
  });
}

export function getLatestOpenOffer(): HandoffOffer | null {
  return null;
}

export type ClaimResult =
  | { ok: true; rental: AttachedRental }
  | { ok: false; error: string };

function resolveOffer(key: string): HandoffOffer | null {
  if (key === DEMO_ATTACH_KEY) {
    const p = dummyPumps[0];
    return {
      key: DEMO_ATTACH_KEY,
      pumpId: p.id,
      model: p.model,
      serial: p.serial,
      ownerName: DEMO_OWNER.name,
      ownerPhone: DEMO_OWNER.phone,
      ratePerDayInr: 700,
      createdAt: new Date().toISOString(),
      status: "open",
    };
  }
  const meta = FIXED_KEYS[key];
  if (!meta) return null;
  return {
    key,
    pumpId: meta.pumpId,
    model: meta.model,
    serial: meta.serial,
    ownerName: DEMO_OWNER.name,
    ownerPhone: DEMO_OWNER.phone,
    ratePerDayInr: meta.ratePerDayInr,
    createdAt: new Date().toISOString(),
    status: "open",
  };
}

/** Rentee enters fixed key (any browser) → pump attaches. */
export function claimHandoffKey(
  rawKey: string,
  rentee?: { name: string; phone: string }
): ClaimResult {
  const key = normalizeHandoffKey(rawKey);
  if (key.length < 4) {
    return { ok: false, error: "Enter the 6-character key" };
  }

  const offer = resolveOffer(key);
  if (!offer) {
    return {
      ok: false,
      error: "Key not found — use KR007A / KR014B / KR021C",
    };
  }

  const existing = readAttached().find(
    (a) =>
      a.pumpId === offer.pumpId &&
      a.renteePhone.replace(/[^\d]/g, "").slice(-10) ===
        (rentee?.phone ?? DEMO_RENTEE.phone).replace(/[^\d]/g, "").slice(-10)
  );
  if (existing) return { ok: true, rental: existing };

  const rental: AttachedRental = {
    id: `att-${offer.pumpId}-${Date.now()}`,
    key: offer.key,
    pumpId: offer.pumpId,
    model: offer.model,
    serial: offer.serial,
    ownerName: offer.ownerName,
    ownerPhone: offer.ownerPhone,
    ratePerDayInr: offer.ratePerDayInr,
    renteeName: rentee?.name ?? DEMO_RENTEE.name,
    renteePhone: rentee?.phone ?? DEMO_RENTEE.phone,
    attachedAt: new Date().toISOString(),
    running: false,
  };

  const attached = readAttached().filter((a) => a.pumpId !== offer.pumpId);
  attached.unshift(rental);
  writeAttached(attached);
  markListingUnavailable(offer.pumpId, offer.serial);

  return { ok: true, rental };
}

export function getAttachedForRentee(phone?: string): AttachedRental[] {
  const list = readAttached();
  if (!phone) return list;
  const digits = phone.replace(/[^\d]/g, "").slice(-10);
  return list.filter(
    (a) => a.renteePhone.replace(/[^\d]/g, "").slice(-10) === digits
  );
}

export function getPrimaryAttached(phone?: string): AttachedRental | null {
  return getAttachedForRentee(phone)[0] ?? null;
}

export function setAttachedRunning(
  id: string,
  running: boolean
): AttachedRental | null {
  const list = readAttached();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], running };
  writeAttached(list);
  return list[idx];
}

export function getAttachedById(id: string): AttachedRental | null {
  return readAttached().find((a) => a.id === id) ?? null;
}
