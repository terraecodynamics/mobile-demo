/** Geodesic helpers + multi-radius farm boundary JSON */

import farmBoundariesJson from "@/data/farm-boundaries.json";

export const SQ_M_PER_ACRE = 4046.8564224;
export const MAX_FIELD_ACRES = 3;
export const MIN_RADIUS_ACRES = 0.05;
export const MAX_RADIUS_ACRES = MAX_FIELD_ACRES;
export const MIN_RADIUS_METERS = 8;
export const MAX_GEOFENCE_RADIUS_M = Math.floor(
  Math.sqrt((MAX_FIELD_ACRES * SQ_M_PER_ACRE) / Math.PI)
);

const EARTH_R_M = 6371000;

export type LatLng = { lat: number; lng: number };

export function clampAcres(acres: number) {
  const n = Number(acres);
  if (!Number.isFinite(n)) return MIN_RADIUS_ACRES;
  return Math.max(MIN_RADIUS_ACRES, Math.min(MAX_RADIUS_ACRES, n));
}

export function acresToRadiusMeters(acres: number) {
  const a = clampAcres(acres);
  return Math.sqrt((a * SQ_M_PER_ACRE) / Math.PI);
}

export function radiusMetersToAcres(meters: number) {
  if (!(meters > 0)) return 0;
  return (Math.PI * meters * meters) / SQ_M_PER_ACRE;
}

export function destinationPoint(
  lat: number,
  lng: number,
  distanceM: number,
  bearingDeg: number
): LatLng {
  const δ = distanceM / EARTH_R_M;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const φ2 = Math.asin(sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * sinδ * cosφ1, cosδ - sinφ1 * Math.cos(θ));
  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

export function circlePolygon(
  lat: number,
  lng: number,
  radiusMeters: number,
  sides = 48
): LatLng[] {
  const coords: LatLng[] = [];
  for (let i = 0; i < sides; i += 1) {
    coords.push(destinationPoint(lat, lng, radiusMeters, (i / sides) * 360));
  }
  return coords;
}

export function fieldLikePolygon(
  lat: number,
  lng: number,
  radiusMeters: number
): LatLng[] {
  const factors = [0.92, 0.78, 0.88, 0.7, 0.95, 0.74, 0.86, 0.68, 0.9, 0.76, 0.84, 0.72];
  return factors.map((f, i) => {
    const bearing = (i / factors.length) * 360 + 12;
    return destinationPoint(lat, lng, radiusMeters * f, bearing);
  });
}

export function polygonAreaAcres(coords: LatLng[]) {
  if (!coords?.length || coords.length < 3) return 0;
  const lat0 = (coords[0].lat * Math.PI) / 180;
  const mx = 111320 * Math.cos(lat0);
  const my = 110540;
  let a = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const q = coords[i];
    const r = coords[(i + 1) % coords.length];
    a += q.lng * mx * (r.lat * my) - r.lng * mx * (q.lat * my);
  }
  return Math.abs(a / 2) / SQ_M_PER_ACRE;
}

export function metersForAcres(acres: number) {
  return Math.min(
    MAX_GEOFENCE_RADIUS_M,
    Math.max(MIN_RADIUS_METERS, Math.round(acresToRadiusMeters(acres)))
  );
}

export const DEMO_AQUA_FARM = {
  lat: 19.9806389,
  lng: 86.0768889,
  name: "Puri Green Valley Farm",
  place: "Puri district, Odisha",
  coordsLabel: "19°58'50.3\"N, 86°04'36.8\"E",
} as const;

export type DummyFarmPlot = {
  id: string;
  name: string;
  crop: string;
  color: string;
  points: LatLng[];
  acres: number;
};

export const DEFAULT_FARM_ORANGE = "#FF6B35";
/** Selected geofence highlight on map + list */
export const GEOFENCE_YELLOW = "#F5C518";

export type BoundaryRing = {
  id: string;
  name?: string;
  crop?: string;
  color?: string;
  polygon: number[][];
};

export type RadiusBucket = {
  radiusAcres: number;
  boundaries: BoundaryRing[];
};

/** Multi-selected fields used as geofence areas (per analysis radius) */
export type GeofenceBucket = {
  radiusAcres: number;
  fieldIds: string[];
  boundaries: BoundaryRing[];
};

export type FarmBoundariesFile = {
  benchmark?: {
    lat?: number;
    lng?: number;
    dms?: string;
    place?: string;
    name?: string;
    analysisAcres?: number;
  };
  /** Last active slider value */
  radiusAcres?: number;
  analysisRadius?: {
    center: { x: number; y: number };
    radius: number;
  };
  /** Boundaries grouped by analysis radius (acres) */
  byRadius?: RadiusBucket[];
  /** Geofence selections grouped by analysis radius */
  geofences?: GeofenceBucket[];
  /** Pump ↔ field assignments (native FarmSetup multi-assign) */
  fieldPumpAssignments?: {
    fieldId: string;
    pumpIds: string[];
    stopIfLeaves?: boolean;
  }[];
  /** Legacy single-radius list */
  boundaries?: BoundaryRing[];
  plots?: DummyFarmPlot[];
};

const DEFAULT_NORM = { center: { x: 0.535, y: 0.447 }, radius: 0.208 };

/** Live copy — updated after each Save so multi-radius merge works without reload */
let liveFile: FarmBoundariesFile = structuredClone(
  farmBoundariesJson as unknown as FarmBoundariesFile
);

function normalizeAcresKey(acres: number) {
  return Number(clampAcres(acres).toFixed(2));
}

/** Match exact radius, else nearest saved bucket within tol acres. */
export function findRadiusBucket(
  acres: number,
  tol = 0.06
): RadiusBucket | undefined {
  const key = normalizeAcresKey(acres);
  const buckets = ensureByRadius(liveFile);
  const exact = buckets.find((b) => b.radiusAcres === key);
  if (exact) return exact;
  let best: RadiusBucket | undefined;
  let bestDist = Infinity;
  for (const b of buckets) {
    const d = Math.abs(b.radiusAcres - key);
    if (d <= tol && d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}

/** Migrate legacy { radiusAcres, boundaries } into byRadius[] */
export function ensureByRadius(file: FarmBoundariesFile): RadiusBucket[] {
  if (file.byRadius?.length) {
    return file.byRadius.map((b) => ({
      radiusAcres: normalizeAcresKey(b.radiusAcres),
      boundaries: Array.isArray(b.boundaries) ? b.boundaries : [],
    }));
  }
  if (file.boundaries?.length) {
    return [
      {
        radiusAcres: normalizeAcresKey(
          file.radiusAcres ?? file.benchmark?.analysisAcres ?? 0.84
        ),
        boundaries: file.boundaries,
      },
    ];
  }
  return [];
}

export function getLiveFarmFile(): FarmBoundariesFile {
  return liveFile;
}

export function setLiveFarmFile(file: FarmBoundariesFile) {
  liveFile = file;
}

export const BENCHMARK_ANALYSIS_ACRES = normalizeAcresKey(
  liveFile.radiusAcres ?? liveFile.benchmark?.analysisAcres ?? 0.84
);

let runtimeAnalysisAcres: number | null = null;

export function getAnalysisAcres() {
  const n = runtimeAnalysisAcres ?? BENCHMARK_ANALYSIS_ACRES;
  return normalizeAcresKey(Number.isFinite(n) ? n : BENCHMARK_ANALYSIS_ACRES);
}

export function setRuntimeAnalysisAcres(acres: number) {
  runtimeAnalysisAcres = normalizeAcresKey(acres);
}

/** Saved radii that actually have fields (empty buckets hidden). */
export function listSavedRadii(): number[] {
  return ensureByRadius(liveFile)
    .filter((b) => (b.boundaries?.length ?? 0) > 0)
    .map((b) => b.radiusAcres)
    .sort((a, b) => a - b);
}

export function countFieldsAtRadius(acres: number): number {
  const bucket = findRadiusBucket(acres);
  return bucket?.boundaries?.length ?? 0;
}

export function offsetMeters(pin: LatLng, eastM: number, northM: number): LatLng {
  const mLat = 1 / 110540;
  const mLng = 1 / (111320 * Math.cos((pin.lat * Math.PI) / 180) || 1);
  return { lat: pin.lat + northM * mLat, lng: pin.lng + eastM * mLng };
}

function normalizedToLatLng(
  x: number,
  y: number,
  pin: LatLng,
  radiusM: number,
  center: { x: number; y: number },
  normRadius: number
): LatLng {
  const eastM = ((x - center.x) / normRadius) * radiusM;
  const northM = ((center.y - y) / normRadius) * radiusM;
  return offsetMeters(pin, eastM, northM);
}

export function getAnalysisRadiusNorm() {
  return liveFile.analysisRadius ?? DEFAULT_NORM;
}

export function latLngToNormalized(
  pt: LatLng,
  pin: LatLng,
  radiusM: number,
  center: { x: number; y: number },
  normRadius: number
): [number, number] {
  const mLat = 1 / 110540;
  const mLng = 1 / (111320 * Math.cos((pin.lat * Math.PI) / 180) || 1);
  const eastM = (pt.lng - pin.lng) / mLng;
  const northM = (pt.lat - pin.lat) / mLat;
  const x = center.x + (eastM / radiusM) * normRadius;
  const y = center.y - (northM / radiusM) * normRadius;
  return [Number(x.toFixed(3)), Number(y.toFixed(3))];
}

function pinFromFile(): LatLng {
  return {
    lat: liveFile.benchmark?.lat ?? DEMO_AQUA_FARM.lat,
    lng: liveFile.benchmark?.lng ?? DEMO_AQUA_FARM.lng,
  };
}

function ringsToPlots(
  rings: BoundaryRing[],
  analysisAcres: number
): DummyFarmPlot[] {
  const pin = pinFromFile();
  const radiusM = metersForAcres(analysisAcres);
  const ar = getAnalysisRadiusNorm();
  return rings.map((b, i) => {
    const points = b.polygon.map(([x, y]) =>
      normalizedToLatLng(x, y, pin, radiusM, ar.center, ar.radius)
    );
    return {
      id: b.id || `field_${i + 1}`,
      name: b.name || `Field ${i + 1}`,
      crop: b.crop || "Paddy",
      color: b.color || DEFAULT_FARM_ORANGE,
      points,
      acres: Number(polygonAreaAcres(points).toFixed(2)),
    };
  });
}

/** Boundaries saved for this analysis radius (empty if none yet). */
export function confirmedFarmBoundaries(
  analysisAcres: number = getAnalysisAcres()
): DummyFarmPlot[] {
  const acres = normalizeAcresKey(analysisAcres);
  const bucket = findRadiusBucket(acres);
  if (bucket?.boundaries?.length) {
    // Project using the bucket's own radius key (stable match)
    return ringsToPlots(bucket.boundaries, bucket.radiusAcres);
  }
  // Legacy fallback only when no byRadius match
  if (!liveFile.byRadius?.length && liveFile.boundaries?.length) {
    return ringsToPlots(liveFile.boundaries, acres);
  }
  return [];
}

/** Snap slider value to nearest saved radius when close; else 2-decimal key. */
export function snapAnalysisAcres(acres: number, tol = 0.06): number {
  const key = normalizeAcresKey(acres);
  const bucket = findRadiusBucket(key, tol);
  return bucket ? bucket.radiusAcres : key;
}

/** Nearest saved radius with fields (for playback Confirm). */
export function nearestSavedRadius(acres: number): number {
  const key = normalizeAcresKey(acres);
  const radii = listSavedRadii();
  if (!radii.length) return key;
  let best = radii[0];
  let bestDist = Math.abs(radii[0] - key);
  for (const r of radii) {
    const d = Math.abs(r - key);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

/**
 * Merge farms for `analysisAcres` into byRadius (keeps other radii).
 * Returns the full file payload to POST.
 */
export function farmsToBoundaryJson(
  farms: DummyFarmPlot[],
  analysisAcres: number = getAnalysisAcres(),
  existing: FarmBoundariesFile = liveFile
) {
  const pin = {
    lat: existing.benchmark?.lat ?? DEMO_AQUA_FARM.lat,
    lng: existing.benchmark?.lng ?? DEMO_AQUA_FARM.lng,
  };
  const acres = normalizeAcresKey(analysisAcres);
  const radiusM = metersForAcres(acres);
  const ar = existing.analysisRadius ?? DEFAULT_NORM;

  const newBucket: RadiusBucket = {
    radiusAcres: acres,
    boundaries: farms.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      color: f.color || DEFAULT_FARM_ORANGE,
      polygon: f.points.map((pt) =>
        latLngToNormalized(pt, pin, radiusM, ar.center, ar.radius)
      ),
    })),
  };

  const prev = ensureByRadius(existing).filter((b) => b.radiusAcres !== acres);
  const byRadius = [...prev, newBucket].sort(
    (a, b) => a.radiusAcres - b.radiusAcres
  );

  const payload: FarmBoundariesFile = {
    benchmark: {
      lat: pin.lat,
      lng: pin.lng,
      dms: DEMO_AQUA_FARM.coordsLabel.replace(", ", " "),
      place: DEMO_AQUA_FARM.place,
      name: DEMO_AQUA_FARM.name,
      analysisAcres: acres,
    },
    radiusAcres: acres,
    analysisRadius: ar,
    byRadius,
    // Mirror active radius for simple readers
    boundaries: newBucket.boundaries,
  };

  liveFile = payload;
  return payload;
}

/** Saved geofence field ids for a radius (empty if none). */
export function getGeofenceFieldIds(
  analysisAcres: number = getAnalysisAcres()
): string[] {
  const key = normalizeAcresKey(analysisAcres);
  const buckets = liveFile.geofences ?? [];
  const exact = buckets.find((b) => b.radiusAcres === key);
  if (exact) return [...(exact.fieldIds ?? [])];
  let best: GeofenceBucket | undefined;
  let bestDist = Infinity;
  for (const b of buckets) {
    const d = Math.abs(b.radiusAcres - key);
    if (d <= 0.06 && d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best?.fieldIds ? [...best.fieldIds] : [];
}

/**
 * Build geofence payload for selected farms and merge into live file.
 * Does not wipe byRadius boundaries.
 */
export function geofencesToJson(
  farms: DummyFarmPlot[],
  fieldIds: string[],
  analysisAcres: number = getAnalysisAcres(),
  existing: FarmBoundariesFile = liveFile
): FarmBoundariesFile {
  const pin = {
    lat: existing.benchmark?.lat ?? DEMO_AQUA_FARM.lat,
    lng: existing.benchmark?.lng ?? DEMO_AQUA_FARM.lng,
  };
  const acres = normalizeAcresKey(analysisAcres);
  const radiusM = metersForAcres(acres);
  const ar = existing.analysisRadius ?? DEFAULT_NORM;
  const idSet = new Set(fieldIds);
  const selected = farms.filter((f) => idSet.has(f.id));

  const bucket: GeofenceBucket = {
    radiusAcres: acres,
    fieldIds: selected.map((f) => f.id),
    boundaries: selected.map((f) => ({
      id: f.id,
      name: f.name,
      crop: f.crop,
      color: GEOFENCE_YELLOW,
      polygon: f.points.map((pt) =>
        latLngToNormalized(pt, pin, radiusM, ar.center, ar.radius)
      ),
    })),
  };

  const prev = (existing.geofences ?? []).filter((b) => b.radiusAcres !== acres);
  const geofences = [...prev, bucket].sort(
    (a, b) => a.radiusAcres - b.radiusAcres
  );

  const payload: FarmBoundariesFile = {
    ...existing,
    radiusAcres: acres,
    geofences,
  };
  liveFile = payload;
  return payload;
}

/** Latest saved geofence bucket (prefers active radiusAcres). */
export function getActiveGeofenceBucket(): GeofenceBucket | undefined {
  const buckets = liveFile.geofences ?? [];
  if (!buckets.length) return undefined;
  const key = normalizeAcresKey(
    liveFile.radiusAcres ?? liveFile.benchmark?.analysisAcres ?? 0.84
  );
  const exact = buckets.find((b) => b.radiusAcres === key);
  if (exact?.boundaries?.length) return exact;
  return [...buckets].sort(
    (a, b) => (b.boundaries?.length ?? 0) - (a.boundaries?.length ?? 0)
  )[0];
}

/** Geofence polygons as farm plots (lat/lng) for the home map. */
export function getActiveGeofencePlots(): DummyFarmPlot[] {
  const bucket = getActiveGeofenceBucket();
  if (!bucket?.boundaries?.length) return [];
  return ringsToPlots(bucket.boundaries, bucket.radiusAcres);
}

export function polygonCentroid(points: LatLng[]): LatLng {
  if (!points.length) {
    return { lat: DEMO_AQUA_FARM.lat, lng: DEMO_AQUA_FARM.lng };
  }
  if (points.length < 3) {
    let lat = 0;
    let lng = 0;
    for (const p of points) {
      lat += p.lat;
      lng += p.lng;
    }
    return { lat: lat / points.length, lng: lng / points.length };
  }

  // Shoelace centroid in local meters (avoids outside-vertex bias)
  const o = points[0];
  const mLat = 111320;
  const mLng = 111320 * Math.cos((o.lat * Math.PI) / 180);
  const xy = points.map((p) => ({
    x: (p.lng - o.lng) * mLng,
    y: (p.lat - o.lat) * mLat,
  }));
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < xy.length; i += 1) {
    const j = (i + 1) % xy.length;
    const cross = xy[i].x * xy[j].y - xy[j].x * xy[i].y;
    area2 += cross;
    cx += (xy[i].x + xy[j].x) * cross;
    cy += (xy[i].y + xy[j].y) * cross;
  }
  if (Math.abs(area2) < 1e-9) {
    let lat = 0;
    let lng = 0;
    for (const p of points) {
      lat += p.lat;
      lng += p.lng;
    }
    return { lat: lat / points.length, lng: lng / points.length };
  }
  cx /= 3 * area2;
  cy /= 3 * area2;
  return {
    lat: o.lat + cy / mLat,
    lng: o.lng + cx / mLng,
  };
}

/**
 * Home map: when geofences are saved, show those polygons + a single pump
 * inside the largest field. Otherwise null (caller uses dummy pumps).
 */
export function buildHomeGeofenceScene(basePump?: {
  id?: string;
  name?: string;
  soilPct?: number;
  lastSeen?: string;
}): {
  fences: { id: string; name: string; points: LatLng[]; selected: boolean }[];
  pump: {
    id: string;
    name: string;
    number: number;
    online: boolean;
    running: boolean;
    flowLpm: number | null;
    soilPct: number;
    lastSeen: string;
    lat: number;
    lng: number;
    field: LatLng[];
  };
} | null {
  const plots = getActiveGeofencePlots();
  if (!plots.length) return null;

  const primary = plots.reduce((best, p) =>
    p.acres >= best.acres ? p : best
  );
  const center = polygonCentroid(primary.points);

  return {
    fences: plots.map((p) => ({
      id: p.id,
      name: p.name,
      points: p.points,
      selected: true,
    })),
    pump: {
      id: basePump?.id ?? "p1",
      name: basePump?.name ?? "Kronis 4 · KR-007",
      number: 1,
      online: true,
      running: false,
      flowLpm: 0,
      soilPct: basePump?.soilPct ?? 62,
      lastSeen: basePump?.lastSeen ?? "just now",
      lat: center.lat,
      lng: center.lng,
      field: primary.points,
    },
  };
}

export type FieldPumpAssignment = {
  fieldId: string;
  pumpIds: string[];
  stopIfLeaves?: boolean;
};

export type AssignablePump = {
  id: string;
  name: string;
  number: number;
};

/** Spread multiple pumps inside a field polygon (native placePumpInFence). */
export function placePumpInFence(
  points: LatLng[],
  index = 0
): LatLng | null {
  if (!points?.length) return null;
  const center = polygonCentroid(points);
  if (index === 0) return center;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latSpan = Math.max(Math.max(...lats) - Math.min(...lats), 0.00001);
  const lngSpan = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.00001);
  const alt: LatLng = {
    lat: center.lat + Math.floor(index / 2) * latSpan * 0.08,
    lng: center.lng + (index % 2 === 1 ? -1 : 1) * lngSpan * 0.1,
  };
  return pointInPolygon(alt, points) ? alt : center;
}

function pointInPolygon(pt: LatLng, polygon: LatLng[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const yi = polygon[i].lat;
    const xi = polygon[i].lng;
    const yj = polygon[j].lat;
    const xj = polygon[j].lng;
    const intersect =
      yi > pt.lat !== yj > pt.lat &&
      pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getFieldPumpAssignments(): FieldPumpAssignment[] {
  const raw = liveFile.fieldPumpAssignments;
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => ({
    fieldId: String(a.fieldId),
    pumpIds: Array.isArray(a.pumpIds) ? a.pumpIds.map(String) : [],
    stopIfLeaves: a.stopIfLeaves !== false,
  }));
}

export function getPumpsForField(fieldId: string): string[] {
  return (
    getFieldPumpAssignments().find((a) => a.fieldId === fieldId)?.pumpIds ?? []
  );
}

/** Merge field pump assignments into live file (does not wipe geofences). */
export function fieldPumpAssignmentsToJson(
  assignments: FieldPumpAssignment[],
  existing: FarmBoundariesFile = liveFile
): FarmBoundariesFile {
  const payload: FarmBoundariesFile = {
    ...existing,
    fieldPumpAssignments: assignments.map((a) => ({
      fieldId: a.fieldId,
      pumpIds: [...a.pumpIds],
      stopIfLeaves: a.stopIfLeaves !== false,
    })),
  };
  liveFile = payload;
  return payload;
}

/**
 * Home map pumps from geofences + field assignments.
 * Multiple pumps share a field polygon; seats via placePumpInFence.
 */
export function buildHomePumpsFromAssignments(
  catalog: AssignablePump[]
): {
  fences: { id: string; name: string; points: LatLng[]; selected: boolean }[];
  pumps: {
    id: string;
    name: string;
    number: number;
    online: boolean;
    running: boolean;
    flowLpm: number | null;
    soilPct: number;
    lastSeen: string;
    lat: number;
    lng: number;
    field: LatLng[];
  }[];
} | null {
  const plots = getActiveGeofencePlots();
  if (!plots.length) return null;

  const assignments = getFieldPumpAssignments();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const fences = plots.map((p) => ({
    id: p.id,
    name: p.name,
    points: p.points,
    selected: true,
  }));

  const pumps: {
    id: string;
    name: string;
    number: number;
    online: boolean;
    running: boolean;
    flowLpm: number | null;
    soilPct: number;
    lastSeen: string;
    lat: number;
    lng: number;
    field: LatLng[];
  }[] = [];

  let anyAssigned = false;
  for (const plot of plots) {
    const ids = assignments.find((a) => a.fieldId === plot.id)?.pumpIds ?? [];
    if (!ids.length) continue;
    anyAssigned = true;
    ids.forEach((pid, idx) => {
      const meta = byId.get(pid);
      const seat = placePumpInFence(plot.points, idx) ?? polygonCentroid(plot.points);
      pumps.push({
        id: pid,
        name: meta?.name ?? `Pump ${idx + 1}`,
        number: meta?.number ?? idx + 1,
        online: true,
        running: false,
        flowLpm: 0,
        soilPct: 62,
        lastSeen: "just now",
        lat: seat.lat,
        lng: seat.lng,
        field: plot.points,
      });
    });
  }

  // Fallback: one pump in largest field if none assigned yet
  if (!anyAssigned && catalog.length) {
    const primary = plots.reduce((best, p) =>
      p.acres >= best.acres ? p : best
    );
    const seat = placePumpInFence(primary.points, 0) ?? polygonCentroid(primary.points);
    const meta = catalog[0];
    pumps.push({
      id: meta.id,
      name: meta.name,
      number: meta.number,
      online: true,
      running: false,
      flowLpm: 0,
      soilPct: 62,
      lastSeen: "just now",
      lat: seat.lat,
      lng: seat.lng,
      field: primary.points,
    });
  }

  if (!pumps.length) return null;
  return { fences, pumps };
}
