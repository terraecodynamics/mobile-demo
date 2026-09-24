"use client";

import { SoftChip } from "@/components/ui/SoftUi";
import { WeatherAtmosphere } from "@/components/weather/WeatherAtmosphere";
import { kronis } from "@/lib/kronis";
import { dummyWeather } from "@/data/dummy";
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
import { createEmpty, extend, isEmpty } from "ol/extent";
import { createSatelliteSource, SATELLITE_FIT_ZOOM, SATELLITE_MAX_ZOOM } from "@/lib/mapTiles";

/** Special picker / map focus: show every pump at once */
export const ALL_PUMPS_ID = "__all__";

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
  const showAll = selectedId === ALL_PUMPS_ID;

  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const overlaysRef = useRef<Record<string, Overlay>>({});
  const rootsRef = useRef<Record<string, Root>>({});
  const onSelectRef = useRef(onSelectPump);
  onSelectRef.current = onSelectPump;
  const [mapReady, setMapReady] = useState(0);
  /** After All-pumps initial framing, never re-fit until selection changes */
  const framedAllRef = useRef(false);
  const listRef = useRef(list);
  listRef.current = list;
  const sheetHRef = useRef(sheetHeight);
  sheetHRef.current = sheetHeight;
  /** Re-frame All when pump pins move (e.g. geofence seats load) */
  const pinsKey = list.map((p) => `${p.id}:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  const lastPinsKeyRef = useRef<string>("");

  useEffect(() => {
    framedAllRef.current = false;
  }, [mapReady]);

  useEffect(() => {
    if (pinsKey !== lastPinsKeyRef.current) {
      lastPinsKeyRef.current = pinsKey;
      if (showAll) framedAllRef.current = false;
    }
  }, [pinsKey, showAll]);

  const centerPump = useMemo(
    () => (showAll ? null : list.find((p) => p.id === selectedId) || list[0]),
    [list, selectedId, showAll]
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
          timeout: 80,
          duration: 0,
          maxDelta: 2,
          constrainResolution: false,
        }),
      ]),
    });

    // Prefer GPU-composited pan/zoom
    map.getViewport().style.willChange = "transform";
    map.getViewport().style.touchAction = "none";
    mapRef.current = map;
    setMapReady((n) => n + 1);

    // Let the user interrupt any fit animation (wheel / pinch / drag)
    const cancelFitAnim = () => {
      map.getView().cancelAnimations();
    };
    map.getViewport().addEventListener("wheel", cancelFitAnim, { passive: true });
    map.on("pointerdrag", cancelFitAnim);

    // Wheel zoom works without an extra click-to-focus
    host.tabIndex = 0;

    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(host);

    return () => {
      ro.disconnect();
      map.getViewport().removeEventListener("wheel", cancelFitAnim);
      map.un("pointerdrag", cancelFitAnim);
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
      feature.setStyle(fieldStyle(showAll || p.id === selectedId));
      source.addFeature(feature);
    });
  }, [list, selectedId, mapReady, fences, useGeofences, showAll]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    /** All pumps → every pin; single select → only that pump on the map */
    const visible = showAll
      ? list
      : list.filter((p) => p.id === selectedId);
    const active = new Set(visible.map((p) => p.id));

    visible.forEach((p) => {
      const isSel = showAll || p.id === selectedId;
      let overlay = overlaysRef.current[p.id];
      if (!overlay) {
        const el = document.createElement("div");
        el.className = "cursor-pointer drop-shadow-lg";
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
          stopEvent: !showAll,
        });
        overlaysRef.current[p.id] = overlay;
        map.addOverlay(overlay);
      } else {
        overlay.set("stopEvent", !showAll);
      }
      const el = overlay.getElement();
      if (el) el.style.pointerEvents = "auto";
      rootsRef.current[p.id]?.render(
        <PumpMapMarker
          number={p.number}
          selected={isSel}
          isRunning={showAll ? p.running : isSel && running}
        />
      );
      overlay.setPosition(fromLonLat([p.lng, p.lat]));
    });

    Object.keys(overlaysRef.current).forEach((id) => {
      if (active.has(id)) return;
      const o = overlaysRef.current[id];
      const root = rootsRef.current[id];
      if (o) {
        o.setPosition(undefined);
        map.removeOverlay(o);
      }
      delete overlaysRef.current[id];
      delete rootsRef.current[id];
      if (root) void Promise.resolve().then(() => root.unmount());
    });
  }, [list, selectedId, running, mapReady, showAll]);

  // All pumps = free zoom range; single pump keeps tighter farm zoom.
  useEffect(() => {
    if (!mapReady) return;
    const view = mapRef.current?.getView();
    if (!view) return;
    if (showAll) {
      view.setMinZoom(5);
      view.setMaxZoom(SATELLITE_MAX_ZOOM);
      view.setConstrainResolution(false);
    } else {
      view.setMinZoom(12);
      view.setMaxZoom(SATELLITE_MAX_ZOOM);
    }
  }, [showAll, mapReady]);

  // Fit map once when selection changes — then free zoom/pan (esp. All pumps).
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const view = map.getView();

    if (showAll) {
      const id = requestAnimationFrame(() => {
        // Frame once per All-pumps visit (set inside rAF so Strict Mode remount still fits)
        if (framedAllRef.current) return;
        framedAllRef.current = true;

        map.updateSize();
        const sz = map.getSize();
        if (!sz || sz[1] < 80) return;

        const pumps = listRef.current;
        const sheetPx = Number.isFinite(sheetHRef.current)
          ? Math.max(0, sheetHRef.current)
          : 320;

        const extent = createEmpty();
        pumps.forEach((p) => {
          const c = fromLonLat([p.lng, p.lat]);
          extend(extent, [c[0], c[1], c[0], c[1]]);
          if (p.field?.length) {
            const ring = p.field.map((pt) => fromLonLat([pt.lng, pt.lat]));
            if (ring.length) {
              ring.push(ring[0]);
              extend(extent, new Polygon([ring]).getExtent());
            }
          }
        });
        if (isEmpty(extent)) return;

        const w = extent[2] - extent[0];
        const h = extent[3] - extent[1];
        const padX = Math.max(w * 0.4, 36);
        const padY = Math.max(h * 0.4, 36);
        const padded: [number, number, number, number] = [
          extent[0] - padX,
          extent[1] - padY,
          extent[2] + padX,
          extent[3] + padY,
        ];

        const allPadTop = 56;
        const allPadSide = 44;
        const allPadBottom = Math.min(
          sheetPx + 36,
          Math.max(sheetPx, sz[1] * 0.52)
        );

        view.cancelAnimations();
        // Free zoom for All pumps only — no fixed lock after this framing
        view.setMinZoom(5);
        view.setMaxZoom(SATELLITE_MAX_ZOOM);
        view.setConstrainResolution(false);
        view.fit(padded, {
          size: sz,
          padding: [allPadTop, allPadSide, allPadBottom, allPadSide],
          // Overview start only — user can zoom freely past this after
          duration: 380,
        });
      });
      return () => cancelAnimationFrame(id);
    }

    // Left All mode — allow framing again next time
    framedAllRef.current = false;

    const pump = centerPump;
    if (!pump?.field?.length) return;

    const id = requestAnimationFrame(() => {
      map.updateSize();
      const sz = map.getSize();
      if (!sz || sz[1] < 80) return;

      const sheetPx = Number.isFinite(sheetHRef.current)
        ? Math.max(0, sheetHRef.current)
        : 320;
      const padTop = 28;
      const padSide = 28;
      const padBottom = Math.min(sheetPx + 8, Math.max(0, sz[1] - padTop - 140));

      const ring = pump.field.map((pt) => fromLonLat([pt.lng, pt.lat]));
      if (ring.length) ring.push(ring[0]);
      const extent = new Polygon([ring]).getExtent();
      const pumpCenter = fromLonLat([pump.lng, pump.lat]);

      view.cancelAnimations();
      view.setMinZoom(12);
      view.setMaxZoom(SATELLITE_MAX_ZOOM);
      view.fit(extent, {
        size: sz,
        padding: [padTop, padSide, padBottom, padSide],
        maxZoom: useGeofences ? Math.min(SATELLITE_MAX_ZOOM, 19.4) : SATELLITE_FIT_ZOOM,
        duration: 0,
      });

      const resolution = view.getResolution() ?? 1;
      const yBias = ((padBottom - padTop) / 2) * resolution;
      view.animate({
        center: [pumpCenter[0], pumpCenter[1] - yBias],
        duration: 380,
      });
    });

    return () => cancelAnimationFrame(id);
  }, [showAll, centerPump?.id, mapReady, useGeofences, pinsKey]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#2a3328" }}>
      <div ref={mapHostRef} className="absolute inset-0" />

      <WeatherAtmosphere
        initial={
          dummyWeather.condition === "Rain"
            ? "rain"
            : dummyWeather.condition === "Sunny"
              ? "sunny"
              : "cloudy"
        }
        place="Field"
        sheetHeight={sheetHeight}
      />

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
