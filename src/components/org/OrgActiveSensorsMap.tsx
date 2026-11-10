"use client";

import { createSatelliteSource, SATELLITE_MAX_ZOOM } from "@/lib/mapTiles";
import { kronis } from "@/lib/kronis";
import { placeNameFromLocation } from "@/lib/orgLocations";
import type { OrgSensorType } from "@/lib/orgTypes";
import { Radio } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "ol/ol.css";
import OlMap from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { defaults as defaultInteractions } from "ol/interaction/defaults";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom";
import { createEmpty, extend, isEmpty } from "ol/extent";

export type OrgMapSensor = {
  id: string;
  label: string;
  type: OrgSensorType;
  lat: number;
  lng: number;
  placeName?: string;
  farmerName?: string | null;
  installLocation?: string;
};

const TYPE_COLOR: Record<OrgSensorType, string> = {
  soil: "#1FA97A",
  weather: "#1F8FBF",
  environment: "#E8A317",
};

/** Rough center of Puri district coverage */
const FALLBACK_CENTER = { lat: 19.98, lng: 85.92 };

function markerEl(sensor: OrgMapSensor, selected: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "org-sensor-marker";
  const place =
    sensor.placeName ||
    placeNameFromLocation(sensor.installLocation, sensor.label);
  el.setAttribute("aria-label", `${place} — ${sensor.label}`);
  el.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:4px",
    "border:0",
    "background:transparent",
    "cursor:pointer",
    "padding:0",
    "transform:translateY(-6px)",
  ].join(";");
  const color = TYPE_COLOR[sensor.type];
  el.innerHTML = `
    <span style="
      width:${selected ? 18 : 14}px;
      height:${selected ? 18 : 14}px;
      border-radius:999px;
      background:${color};
      box-shadow:0 0 0 3px rgba(255,255,255,0.95), 0 6px 16px rgba(23,26,18,0.35);
      ${selected ? `outline:2px solid ${kronis.ink}; outline-offset:2px;` : ""}
    "></span>
    <span style="
      max-width:120px;
      padding:4px 8px;
      border-radius:999px;
      background:rgba(23,26,18,0.9);
      color:#fff;
      font:800 11px/1.15 system-ui,sans-serif;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      letter-spacing:-0.2px;
    ">${place}</span>
  `;
  return el;
}

export function OrgActiveSensorsMap({
  sensors,
  height = 320,
  className,
  fill = false,
}: {
  sensors: OrgMapSensor[];
  height?: number;
  className?: string;
  /** Stretch to parent height (use with a sized flex/absolute parent). */
  fill?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const overlaysRef = useRef<Record<string, Overlay>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => sensors.find((s) => s.id === selectedId) ?? null,
    [sensors, selectedId]
  );

  const typeCounts = useMemo(() => {
    const counts: Record<OrgSensorType, number> = { soil: 0, weather: 0, environment: 0 };
    for (const s of sensors) counts[s.type] += 1;
    return counts;
  }, [sensors]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const map = new OlMap({
      target: host,
      layers: [new TileLayer({ source: createSatelliteSource() })],
      view: new View({
        center: fromLonLat([FALLBACK_CENTER.lng, FALLBACK_CENTER.lat]),
        zoom: 17.2,
        maxZoom: SATELLITE_MAX_ZOOM,
      }),
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }).extend([new MouseWheelZoom({ useAnchor: true, duration: 120 })]),
    });
    mapRef.current = map;

    const fit = () => map.updateSize();
    requestAnimationFrame(fit);
    window.addEventListener("resize", fit);

    return () => {
      window.removeEventListener("resize", fit);
      Object.values(overlaysRef.current).forEach((o) => map.removeOverlay(o));
      overlaysRef.current = {};
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const host = hostRef.current;
    if (!map || !host) return;
    const ro = new ResizeObserver(() => {
      map.updateSize();
    });
    ro.observe(host);
    map.updateSize();
    return () => ro.disconnect();
  }, [height, className]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const keep = new Set(sensors.map((s) => s.id));
    for (const [id, overlay] of Object.entries(overlaysRef.current)) {
      if (!keep.has(id)) {
        map.removeOverlay(overlay);
        delete overlaysRef.current[id];
      }
    }

    const extent = createEmpty();
    for (const sensor of sensors) {
      const coord = fromLonLat([sensor.lng, sensor.lat]);
      extend(extent, [...coord, ...coord]);

      let overlay = overlaysRef.current[sensor.id];
      if (!overlay) {
        const el = markerEl(sensor, sensor.id === selectedId);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedId(sensor.id);
        });
        overlay = new Overlay({
          element: el,
          positioning: "bottom-center",
          stopEvent: true,
        });
        map.addOverlay(overlay);
        overlaysRef.current[sensor.id] = overlay;
      } else {
        const el = overlay.getElement();
        if (el) {
          const next = markerEl(sensor, sensor.id === selectedId);
          next.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedId(sensor.id);
          });
          overlay.setElement(next);
        }
      }
      overlay.setPosition(coord);
    }

    if (!isEmpty(extent) && sensors.length) {
      map.getView().fit(extent, {
        padding: [56, 56, 120, 56],
        // District-level view so distant Odisha sites stay readable
        maxZoom: sensors.length > 1 ? 11.6 : 14.5,
        duration: 280,
      });
    }
  }, [sensors, selectedId]);

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] ${className ?? ""}`}
      style={
        fill
          ? { height: "100%", minHeight: 0 }
          : height != null
            ? { height }
            : { height: "100%", minHeight: 440 }
      }
    >
      <div ref={hostRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        {(Object.keys(TYPE_COLOR) as OrgSensorType[]).map((t) => (
          <span
            key={t}
            className="rounded-full px-2 py-1 text-[10px] font-extrabold capitalize text-white"
            style={{ background: "rgba(23,26,18,0.78)" }}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ background: TYPE_COLOR[t] }}
            />
            {t}
          </span>
        ))}
      </div>
      <div
        className="absolute bottom-3 left-3 max-w-[min(100%-1.5rem,320px)] overflow-hidden rounded-[18px]"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 10px 28px rgba(23,26,18,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.65)",
        }}
      >
        {selected ? (
          <div className="flex items-center gap-3 px-3.5 py-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
              style={{ background: `${TYPE_COLOR[selected.type]}22` }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: TYPE_COLOR[selected.type], boxShadow: `0 0 0 4px ${TYPE_COLOR[selected.type]}33` }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-extrabold" style={{ color: kronis.ink }}>
                {selected.placeName ||
                  placeNameFromLocation(selected.installLocation, selected.label)}
              </div>
              <div className="truncate text-[11px] font-semibold capitalize" style={{ color: kronis.inkMuted }}>
                {selected.label}
                {selected.farmerName ? ` · ${selected.farmerName}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold"
              style={{ background: kronis.background, color: kronis.inkMuted }}
              onClick={() => setSelectedId(null)}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <span
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
                style={{ background: kronis.limeSoft }}
              >
                <span
                  className="absolute h-7 w-7 animate-ping rounded-full opacity-35"
                  style={{ background: kronis.lime }}
                />
                <Radio size={18} color={kronis.lime} className="relative" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[20px] font-extrabold leading-none tracking-[-0.4px]" style={{ color: kronis.ink }}>
                    {sensors.length}
                  </span>
                  <span className="text-[12px] font-extrabold" style={{ color: kronis.ink }}>
                    active sensor{sensors.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-semibold" style={{ color: kronis.inkMuted }}>
                  {sensors.length ? "Live on field map · tap a pin for details" : "Assign sensors with locations to see them here"}
                </div>
              </div>
            </div>
            {sensors.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t pt-2.5" style={{ borderColor: "rgba(23,26,18,0.06)" }}>
                {(Object.keys(TYPE_COLOR) as OrgSensorType[])
                  .filter((t) => typeCounts[t] > 0)
                  .map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize"
                      style={{ background: kronis.background, color: kronis.ink }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                      {t}
                      <span style={{ color: kronis.inkMuted }}>{typeCounts[t]}</span>
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
