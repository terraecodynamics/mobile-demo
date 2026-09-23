/** Shared rent-market listings — owner publishes, rentee Find pumps reads */

import {
  dummyUser,
  rentalListings as seedListings,
  type RentalListing,
} from "@/data/dummy";

const STORAGE_KEY = "terraeco.demo.rentListings.v3";

export type ListForRentInput = {
  pumpId: string;
  pumpName: string;
  lat: number;
  lng: number;
  model: string;
  serial: string;
  ratePerDayInr: number;
  available: boolean;
};

function load(): RentalListing[] {
  if (typeof window === "undefined") return [...seedListings];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = [...seedListings];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as RentalListing[];
  } catch {
    return [...seedListings];
  }
}

function save(list: RentalListing[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getRentListings(): RentalListing[] {
  return load();
}

/** Owner puts a pump on the Find-pumps map (or updates rate / availability). */
export function publishPumpForRent(input: ListForRentInput): RentalListing {
  const list = load();
  const id = `owner-${input.pumpId}`;
  const existing = list.findIndex((l) => l.id === id);
  const next: RentalListing = {
    id,
    pumpName: input.pumpName,
    ownerName: dummyUser.name,
    ownerPhone: dummyUser.mobile.replace(/\s/g, ""),
    village: `${dummyUser.city} · ${dummyUser.farmName}`,
    ratePerDayInr: input.ratePerDayInr,
    model: input.model,
    serial: input.serial,
    available: input.available,
    lat: input.lat,
    lng: input.lng,
    distanceKm: 0.2,
  };
  if (existing >= 0) list[existing] = next;
  else list.unshift(next);
  save(list);
  return next;
}

export function getPublishedForPump(pumpId: string): RentalListing | null {
  return load().find((l) => l.id === `owner-${pumpId}`) ?? null;
}
