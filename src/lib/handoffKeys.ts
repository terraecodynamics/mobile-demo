/** Owner issues a short unique key; rentee enters it to attach the pump */

import { DEMO_OWNER, DEMO_RENTEE } from "@/lib/auth";
import { markListingUnavailable } from "@/lib/rentListings";

const OFFERS_KEY = "terraeco.demo.handoffOffers.v1";
const ATTACHED_KEY = "terraeco.demo.attachedRentals.v1";

/** Easy to read aloud — no 0/O/1/I */
const KEY_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export type HandoffOffer = {
  key: string;
  pumpId: string;
  model: string;
  serial: string;
  ownerName: string;
  ownerPhone: string;
  ratePerDayInr: number;
  createdAt: string;
  status: "open" | "claimed";
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

function loadOffers(): HandoffOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HandoffOffer[];
  } catch {
    return [];
  }
}

function saveOffers(list: HandoffOffer[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFERS_KEY, JSON.stringify(list));
}

function loadAttached(): AttachedRental[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ATTACHED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttachedRental[];
  } catch {
    return [];
  }
}

function saveAttached(list: AttachedRental[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATTACHED_KEY, JSON.stringify(list));
}

function makeKey(): string {
  const existing = new Set(loadOffers().map((o) => o.key));
  for (let attempt = 0; attempt < 40; attempt++) {
    let key = "";
    for (let i = 0; i < 6; i++) {
      key += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
    }
    if (!existing.has(key)) return key;
  }
  return `K${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export function normalizeHandoffKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

export type IssueHandoffInput = {
  pumpId: string;
  model: string;
  serial: string;
  ratePerDayInr: number;
  ownerName?: string;
  ownerPhone?: string;
};

/** Owner portal: create (or refresh) a unique key for this pump. */
export function issueHandoffKey(input: IssueHandoffInput): HandoffOffer {
  const list = loadOffers().filter(
    (o) => !(o.pumpId === input.pumpId && o.status === "open")
  );
  const offer: HandoffOffer = {
    key: makeKey(),
    pumpId: input.pumpId,
    model: input.model,
    serial: input.serial,
    ownerName: input.ownerName ?? DEMO_OWNER.name,
    ownerPhone: input.ownerPhone ?? DEMO_OWNER.phone,
    ratePerDayInr: input.ratePerDayInr,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  list.unshift(offer);
  saveOffers(list);
  return offer;
}

export function getOpenOfferForPump(pumpId: string): HandoffOffer | null {
  return (
    loadOffers().find((o) => o.pumpId === pumpId && o.status === "open") ?? null
  );
}

export function getOfferByKey(rawKey: string): HandoffOffer | null {
  const key = normalizeHandoffKey(rawKey);
  if (key.length < 4) return null;
  return loadOffers().find((o) => o.key === key) ?? null;
}

export type ClaimResult =
  | { ok: true; rental: AttachedRental }
  | { ok: false; error: string };

/** Rentee enters key → pump attaches to both. */
export function claimHandoffKey(
  rawKey: string,
  rentee?: { name: string; phone: string }
): ClaimResult {
  const key = normalizeHandoffKey(rawKey);
  if (key.length < 4) {
    return { ok: false, error: "Enter the 6-character key" };
  }

  const offers = loadOffers();
  const idx = offers.findIndex((o) => o.key === key);
  if (idx < 0) return { ok: false, error: "Key not found" };

  const offer = offers[idx];
  if (offer.status === "claimed") {
    const existing = loadAttached().find((a) => a.key === key);
    if (existing) return { ok: true, rental: existing };
    return { ok: false, error: "Key already used" };
  }

  offers[idx] = { ...offer, status: "claimed" };
  saveOffers(offers);

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

  const attached = loadAttached().filter((a) => a.pumpId !== offer.pumpId);
  attached.unshift(rental);
  saveAttached(attached);

  markListingUnavailable(offer.pumpId, offer.serial);

  return { ok: true, rental };
}

export function getAttachedForRentee(phone?: string): AttachedRental[] {
  const list = loadAttached();
  if (!phone) return list;
  const digits = phone.replace(/[^\d]/g, "").slice(-10);
  return list.filter(
    (a) => a.renteePhone.replace(/[^\d]/g, "").slice(-10) === digits
  );
}

export function getPrimaryAttached(phone?: string): AttachedRental | null {
  return getAttachedForRentee(phone)[0] ?? null;
}

export function setAttachedRunning(id: string, running: boolean): AttachedRental | null {
  const list = loadAttached();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], running };
  saveAttached(list);
  return list[idx];
}

export function getAttachedById(id: string): AttachedRental | null {
  return loadAttached().find((a) => a.id === id) ?? null;
}
