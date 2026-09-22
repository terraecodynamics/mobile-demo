import XYZ from "ol/source/XYZ";

/**
 * Satellite basemap — Google imagery via same-origin proxy (matches Google Earth look).
 * `scale=2` + 512px tiles = sharper detail than Esri World Imagery at this Odisha site.
 */
export function createSatelliteSource() {
  return new XYZ({
    url: "/api/sat/{z}/{x}/{y}",
    attributions: "© Google",
    maxZoom: 20,
    tileSize: 512,
    crossOrigin: "anonymous",
    transition: 0,
    interpolate: true,
  });
}

/** Prefer this zoom when framing a selected field (native home is very tight) */
export const SATELLITE_FIT_ZOOM = 18;

/** Allow scroll / pinch a bit past select fit */
export const SATELLITE_MAX_ZOOM = 20;

/**
 * Zoom used when selecting a pump — native fitHomeRegion zooms as tight as
 * the field allows (≈ latSpan×1.08).
 */
export const SATELLITE_SELECT_ZOOM = 18;
