"use client";

import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { createSatelliteSource, SATELLITE_MAX_ZOOM } from "@/lib/mapTiles";
import type { RentalListing } from "@/data/dummy";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import "ol/ol.css";
import OlMap from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import CircleGeom from "ol/geom/Circle";
import { Fill, Stroke, Style } from "ol/style";
import { fromLonLat, getPointResolution } from "ol/proj";
import { defaults as defaultInteractions } from "ol/interaction/defaults";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom";

type Props = {
  listings: RentalListing[];
  selectedId: string | null;
  /** Demo “you are here” — kept on the farm map (not live GPS) */
  myLocation: { lat: number; lng: number };
  radiusMeters?: number;
  onSelect: (id: string) => void;
};

const DEFAULT_RADIUS_M = 900;

function safeUnmount(root: Root | undefined) {
  if (!root) return;
  void Promise.resolve().then(() => {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
  });
}

function circleGeom(lat: number, lng: number, radiusMeters: number) {
  const center = fromLonLat([lng, lat]);
  const mPerUnit = getPointResolution("EPSG:3857", 1, center);
  return new CircleGeom(center, radiusMeters / (mPerUnit || 1));
}

function createMeMarkerEl() {
  const el = document.createElement("div");
  el.className = "rental-me-marker";
  el.setAttribute("aria-label", "Your location");
  el.innerHTML = `
    <span class="rental-me-ring rental-me-ring--a" aria-hidden="true"></span>
    <span class="rental-me-ring rental-me-ring--b" aria-hidden="true"></span>
    <span class="rental-me-dot">
      <span class="rental-me-dot-core"></span>
    </span>
    <span class="rental-me-label">You</span>
  `;
  return el;
}

/** Frame the radius circle in the map — centered, not zoomed into the pin */
function fitRadiusCentered(
  map: OlMap,
  lat: number,
  lng: number,
  radiusMeters: number
) {
  map.updateSize();
  const extent = circleGeom(lat, lng, radiusMeters).getExtent();
  map.getView().fit(extent, {
    // Top padding clears the search bar so the circle looks centered
    padding: [72, 36, 36, 36],
    duration: 0,
    maxZoom: 14.8,
  });
}

export function RentalDiscoverMap({
  listings,
  selectedId,
  myLocation,
  radiusMeters = DEFAULT_RADIUS_M,
  onSelect,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const overlaysRef = useRef<Record<string, Overlay>>({});
  const rootsRef = useRef<Record<string, Root>>({});
  const meOverlayRef = useRef<Overlay | null>(null);
  const radiusFeatRef = useRef<Feature | null>(null);
  const radiusBaseMRef = useRef(radiusMeters);
  const myLocRef = useRef(myLocation);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  radiusBaseMRef.current = radiusMeters;
  myLocRef.current = myLocation;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const me = myLocRef.current;
    const baseR = radiusMeters;

    const baseFeat = new Feature({
      geometry: circleGeom(me.lat, me.lng, baseR),
    });
    baseFeat.setStyle(
      new Style({
        fill: new Fill({ color: "rgba(37, 99, 235, 0.10)" }),
        stroke: new Stroke({ color: "rgba(37, 99, 235, 0.35)", width: 1.5 }),
      })
    );

    const pulseA = new Feature({
      geometry: circleGeom(me.lat, me.lng, baseR * 0.45),
    });
    const pulseB = new Feature({
      geometry: circleGeom(me.lat, me.lng, baseR * 0.45),
    });
    radiusFeatRef.current = pulseA;

    const radiusLayer = new VectorLayer({
      source: new VectorSource({ features: [baseFeat, pulseA, pulseB] }),
      zIndex: 2,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
    });

    const map = new OlMap({
      target: host,
      layers: [
        new TileLayer({ source: createSatelliteSource() }),
        radiusLayer,
      ],
      view: new View({
        center: fromLonLat([me.lng, me.lat]),
        zoom: 14.2,
        maxZoom: SATELLITE_MAX_ZOOM,
      }),
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }).extend([new MouseWheelZoom({ useAnchor: true, duration: 120 })]),
    });
    mapRef.current = map;

    const meEl = createMeMarkerEl();
    const meOverlay = new Overlay({
      element: meEl,
      positioning: "center-center",
      stopEvent: false,
      className: "ol-overlay-container rental-me-overlay",
    });
    meOverlay.setPosition(fromLonLat([me.lng, me.lat]));
    map.addOverlay(meOverlay);
    meOverlayRef.current = meOverlay;

    // Frame the max pulse size so the circle stays centered while animating
    const fitPad = baseR * 1.2;
    const centerView = () => fitRadiusCentered(map, me.lat, me.lng, fitPad);
    centerView();
    requestAnimationFrame(centerView);

    // Expanding radar rings (rental-app style)
    const PERIOD_MS = 2800;
    let raf = 0;
    const start = performance.now();

    const paintPulse = (feat: Feature, phase: number) => {
      // phase 0→1: grow + fade out
      const t = ((phase % 1) + 1) % 1;
      const scale = 0.42 + t * 0.78;
      const alpha = Math.max(0, 1 - t);
      feat.setGeometry(circleGeom(me.lat, me.lng, baseR * scale));
      feat.setStyle(
        new Style({
          fill: new Fill({ color: `rgba(37, 99, 235, ${0.16 * alpha})` }),
          stroke: new Stroke({
            color: `rgba(37, 99, 235, ${0.75 * alpha})`,
            width: 2.5,
          }),
        })
      );
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      paintPulse(pulseA, elapsed / PERIOD_MS);
      paintPulse(pulseB, elapsed / PERIOD_MS + 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      map.updateSize();
      centerView();
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      const roots = Object.values(rootsRef.current);
      rootsRef.current = {};
      roots.forEach((r) => safeUnmount(r));
      Object.values(overlaysRef.current).forEach((o) => map.removeOverlay(o));
      overlaysRef.current = {};
      if (meOverlayRef.current) {
        map.removeOverlay(meOverlayRef.current);
        meOverlayRef.current = null;
      }
      radiusFeatRef.current = null;
      map.setTarget(undefined);
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const ids = new Set(listings.map((l) => l.id));

    listings.forEach((listing, index) => {
      let overlay = overlaysRef.current[listing.id];
      if (!overlay) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(listing.id);
        });
        overlay = new Overlay({
          element: el,
          positioning: "bottom-center",
          offset: [0, 4],
          stopEvent: true,
        });
        overlaysRef.current[listing.id] = overlay;
        map.addOverlay(overlay);
        rootsRef.current[listing.id] = createRoot(el);
      }

      overlay.setPosition(fromLonLat([listing.lng, listing.lat]));
      const selected = listing.id === selectedId;
      rootsRef.current[listing.id]?.render(
        <div
          style={{
            opacity: listing.available ? 1 : 0.55,
            filter: listing.available ? undefined : "grayscale(0.35)",
            transform: selected ? "scale(1.08)" : "scale(1)",
            transition: "transform 160ms ease",
          }}
        >
          <PumpMapMarker
            number={index + 1}
            selected={selected}
            isRunning={listing.available && selected}
            compact
          />
        </div>
      );
    });

    Object.keys(overlaysRef.current).forEach((id) => {
      if (ids.has(id)) return;
      const o = overlaysRef.current[id];
      map.removeOverlay(o);
      safeUnmount(rootsRef.current[id]);
      delete rootsRef.current[id];
      delete overlaysRef.current[id];
    });

    const me = meOverlayRef.current;
    if (me) {
      map.removeOverlay(me);
      map.addOverlay(me);
    }
  }, [listings, selectedId]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
