/** Real Puri-district sites used for org sensor placement demos */
export const ODISHA_SITES = {
  Sakhigopal: { lat: 19.9464, lng: 85.8138, district: "Puri" },
  Satyabadi: { lat: 19.952, lng: 85.825, district: "Puri" },
  Pipili: { lat: 20.12, lng: 85.83, district: "Puri" },
  Nimapada: { lat: 20.07, lng: 86.02, district: "Puri" },
  Delanga: { lat: 20.083, lng: 85.783, district: "Puri" },
  Kakatpur: { lat: 19.983, lng: 86.2, district: "Puri" },
  Konark: { lat: 19.8878, lng: 86.0945, district: "Puri" },
  Puri: { lat: 19.8135, lng: 85.8312, district: "Puri" },
  Chandanpur: { lat: 19.875, lng: 85.862, district: "Puri" },
  Brahmagiri: { lat: 19.796, lng: 85.645, district: "Puri" },
  Gop: { lat: 19.982, lng: 86.005, district: "Puri" },
  Astaranga: { lat: 19.98, lng: 86.27, district: "Puri" },
} as const;

export type OdishaSiteName = keyof typeof ODISHA_SITES;

export function placeNameFromLocation(installLocation?: string | null, fallback = "") {
  const raw = (installLocation || "").split("·")[0]?.trim() || fallback.trim();
  return raw;
}

export function coordsForPlace(name: string | null | undefined) {
  if (!name) return null;
  const key = Object.keys(ODISHA_SITES).find(
    (k) => k.toLowerCase() === name.trim().toLowerCase()
  ) as OdishaSiteName | undefined;
  if (!key) return null;
  return ODISHA_SITES[key];
}

export function resolveSensorCoords(input: {
  lat?: number | null;
  lng?: number | null;
  installLocation?: string | null;
  village?: string | null;
}) {
  if (
    typeof input.lat === "number" &&
    typeof input.lng === "number" &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    return { lat: input.lat, lng: input.lng };
  }
  const place = placeNameFromLocation(input.installLocation, input.village || "");
  const hit = coordsForPlace(place);
  if (!hit) return null;
  return { lat: hit.lat, lng: hit.lng };
}
