"use client";

import { SoftChip } from "@/components/ui/SoftUi";
import { kronis } from "@/lib/kronis";
import type { DummyPump } from "@/data/dummy";
import { PumpMapMarker, MARKER_WIDTH_SELECTED } from "@/components/pump/PumpMapMarker";
import { CalendarClock, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import { fromLonLat } from "ol/proj";
import { Fill, Stroke, Style } from "ol/style";
import type { Map as OlMap } from "ol";
import { defaults as defaultInteractions } from "ol/interaction/defaults";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom";
import { createSatelliteSource, SATELLITE_FIT_ZOOM, SATELLITE_MAX_ZOOM } from "@/lib/mapTiles";

/** Pump body sits left of the SVG center (spray canvas on the right) */
const PUMP_MARKER_OFFSET_X = Math.round(
  ((118 / 2 - 92 / 2) / 118) * MARKER_WIDTH_SELECTED
);

function fieldStyle(selected: boolean) {
  return new Style({
    fill: new Fill({
      color: selected
        ? `rgba(${kronis.brandRgb},0.28)`
        : "rgba(255,255,255,0.08)",
    }),
    stroke: new Stroke({
      color: selected ? kronis.lime : "rgba(255,255,255,0.9)",
      width: selected ? 3 : 1.5,
      lineDash: selected ? undefined : [6, 5],
    }),
  });
}

type FenceField = {
  id: string;
  points: { lat: number; lng: number }[];
  selected?: boolean;
};

type Props = {
  pumps: DummyPump[];
  selectedId: string;
  running: boolean;
  muted: boolean;
  onMute: () => void;
  onRentals: () => void;
  onSelectPump: (id: string) => void;
  /** Used to bias map center into the visible band above the sheet */
  sheetHeight?: number;
  /** Saved farm geofences — drawn as orange fields on the home map */
  fenceFields?: FenceField[];
};

/**
 * Landing map — OpenLayers Google satellite + field polygons + native pump markers.
 */
export function MapStage({
  pumps,
  selectedId,
  running,
  muted,
  onMute,
  onRentals,
  onSelectPump,
  sheetHeight = 320,
  fenceFields,
}: Props) {
  const list = pumps ?? [];
  const fences = fenceFields;
  const useGeofences = (fences?.length ?? 0) > 0;

  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const overlaysRef = useRef<Record<string, Overlay>>({});
  const rootsRef = useRef<Record<string, Root>>({});
  const onSelectRef = useRef(onSelectPump);
  onSelectRef.current = onSelectPump;
  const [mapReady, setMapReady] = useState(0);

  const centerPump = useMemo(
    () => list.find((p) => p.id === selectedId) || list[0],
    [list, selectedId]
  );

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const map = new Map({
      target: host,
      layers: [
        new TileLayer({
          source: createSatelliteSource(),
          preload: 2,
          useInterimTilesOnError: true,
        }),
        new VectorLayer({
          source: vectorSource,
          zIndex: 2,
        }),
      ],
      view: new View({
        center: fromLonLat([86.02015, 19.884193]),
        zoom: 16.5,
        maxZoom: SATELLITE_MAX_ZOOM,
        minZoom: 12,
        // Allow fractional zooms while scrolling (Google Maps–like)
        constrainResolution: false,
        smoothResolutionConstraint: true,
      }),
      controls: [],
      // Explicit wheel + pinch — globals.css must keep .ol-viewport { touch-action: none }
      interactions: defaultInteractions({
        doubleClickZoom: true,
        shiftDragZoom: true,
        mouseWheelZoom: false, // tuned instance below
        pinchZoom: true,
        dragPan: true,
        zoomDuration: 280,
      }).extend([
        new MouseWheelZoom({
          useAnchor: true,
          // Trackpad/wheel gesture window — higher = smoother continuous zoom
          timeout: 160,
          // Animate discrete mouse-wheel ticks
          duration: 280,
          maxDelta: 1,
          constrainResolution: false,
        }),
      ]),
    });

    // Prefer GPU-composited pan/zoom
    map.getViewport().style.willChange = "transform";
    mapRef.current = map;
    setMapReady((n) => n + 1);

    // Wheel zoom works without an extra click-to-focus
    host.tabIndex = 0;

    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(host);

    return () => {
      ro.disconnect();
      Object.entries(overlaysRef.current).forEach(([id, o]) => {
        map.removeOverlay(o);
        const root = rootsRef.current[id];
        if (root) void Promise.resolve().then(() => root.unmount());
      });
      overlaysRef.current = {};
      rootsRef.current = {};
      map.setTarget(undefined);
      mapRef.current = null;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const source = vectorSourceRef.current;
    if (!source) return;

    source.clear();

    if (useGeofences) {
      fences!.forEach((f) => {
        const ring = f.points.map((pt) => fromLonLat([pt.lng, pt.lat]));
        if (ring.length > 0) ring.push(ring[0]);
        const feature = new Feature({
          geometry: new Polygon([ring]),
          fenceId: f.id,
        });
        feature.setStyle(fieldStyle(f.selected !== false));
        source.addFeature(feature);
      });
      return;
    }

    list.forEach((p) => {
      const ring = p.field.map((pt) => fromLonLat([pt.lng, pt.lat]));
      if (ring.length > 0) ring.push(ring[0]);
      const feature = new Feature({
        geometry: new Polygon([ring]),
        pumpId: p.id,
      });
      feature.setStyle(fieldStyle(p.id === selectedId));
      source.addFeature(feature);
    });
  }, [list, selectedId, mapReady, fences, useGeofences]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const active = new Set(list.map((p) => p.id));

    list.forEach((p) => {
      const isSel = p.id === selectedId;
      let overlay = overlaysRef.current[p.id];
      if (!overlay) {
        const el = document.createElement("div");
        el.className = "pointer-events-auto cursor-pointer drop-shadow-lg";
        el.setAttribute("role", "button");
        el.tabIndex = 0;
        el.setAttribute("aria-label", p.name);
        el.addEventListener("click", () => onSelectRef.current(p.id));
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") onSelectRef.current(p.id);
        });
        const root = createRoot(el);
        rootsRef.current[p.id] = root;
        overlay = new Overlay({
          element: el,
          positioning: "center-center",
          offset: [PUMP_MARKER_OFFSET_X, 0],
          stopEvent: true,
        });
        overlaysRef.current[p.id] = overlay;
        map.addOverlay(overlay);
      }
      rootsRef.current[p.id]?.render(
        <PumpMapMarker
          number={p.number}
          selected={isSel}
          isRunning={isSel && running}
        />
      );
      overlay.setPosition(fromLonLat([p.lng, p.lat]));
    });

    Object.keys(overlaysRef.current).forEach((id) => {
      if (active.has(id)) return;
      const o = overlaysRef.current[id];
      const root = rootsRef.current[id];
      if (o) map.removeOverlay(o);
      delete overlaysRef.current[id];
      delete rootsRef.current[id];
      if (root) void Promise.resolve().then(() => root.unmount());
    });
  }, [list, selectedId, running, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const pump = centerPump;
    if (!map || !pump?.field?.length) return;

    // Zoom to the pump's farm boundary (primary field), not the whole multi-field spread
    const ring = pump.field.map((pt) => fromLonLat([pt.lng, pt.lat]));
    if (ring.length) ring.push(ring[0]);
    const extent = new Polygon([ring]).getExtent();
    const pumpCenter = fromLonLat([pump.lng, pump.lat]);

    const view = map.getView();
    const id = requestAnimationFrame(() => {
      map.updateSize();
      const sz = map.getSize();
      if (!sz || sz[1] < 80) return;

      const sheetPx = Number.isFinite(sheetHeight) ? Math.max(0, sheetHeight) : 320;
      const padTop = 28;
      const padSide = 28;
      // Leave map band above the sheet; keep field comfortably framed
      const padBottom = Math.min(sheetPx + 8, Math.max(0, sz[1] - padTop - 140));

      view.fit(extent, {
        size: sz,
        padding: [padTop, padSide, padBottom, padSide],
        // Geofence plots are small — allow tighter zoom than default demo fences
        maxZoom: useGeofences ? Math.min(SATELLITE_MAX_ZOOM, 19.4) : SATELLITE_FIT_ZOOM,
        duration: 0,
      });

      // Pin the pump in the visual center of the visible map band (above sheet)
      const resolution = view.getResolution() ?? 1;
      const yBias = ((padBottom - padTop) / 2) * resolution;
      view.animate({
        center: [pumpCenter[0], pumpCenter[1] - yBias],
        duration: 380,
      });
    });

    return () => cancelAnimationFrame(id);
  }, [centerPump?.id, centerPump?.lat, centerPump?.lng, sheetHeight, mapReady, useGeofences]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#2a3328" }}>
      <div ref={mapHostRef} className="absolute inset-0" />

      {/* Map overlay chips — wrappers must be absolute (SoftChip itself is relative) */}
      <div className="pointer-events-auto absolute left-3.5 top-3.5 z-[40]">
        <SoftChip
          icon={muted ? VolumeX : Volume2}
          onClick={onMute}
          label={muted ? "Unmute" : "Mute"}
          flat
        />
      </div>
      <div className="pointer-events-auto absolute right-3.5 top-3.5 z-[40]">
        <SoftChip
          icon={CalendarClock}
          color={kronis.lime}
          onClick={onRentals}
          label="Rentals"
          flat
        />
        <span
          className="pointer-events-none absolute right-0.5 top-0.5 h-2 w-2 rounded-full"
          style={{
            background: kronis.lime,
            boxShadow: "0 0 0 1.5px #fff",
          }}
        />
      </div>
    </div>
  );
}
