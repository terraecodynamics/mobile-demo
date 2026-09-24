"use client";

import { SoftChip, SoftButton, SoftRaised } from "@/components/ui/SoftUi";
import { kronis } from "@/lib/kronis";
import {
  clampAcres,
  metersForAcres,
  confirmedFarmBoundaries,
  farmsToBoundaryJson,
  geofencesToJson,
  getGeofenceFieldIds,
  getFieldPumpAssignments,
  fieldPumpAssignmentsToJson,
  placePumpInFence,
  polygonAreaAcres,
  getAnalysisAcres,
  setRuntimeAnalysisAcres,
  setLiveFarmFile,
  listSavedRadii,
  countFieldsAtRadius,
  snapAnalysisAcres,
  nearestSavedRadius,
  DEMO_AQUA_FARM,
  MIN_RADIUS_ACRES,
  MAX_RADIUS_ACRES,
  GEOFENCE_YELLOW,
  type LatLng,
  type DummyFarmPlot,
  type FarmBoundariesFile,
  type FieldPumpAssignment,
} from "@/lib/fieldGeometry";
import { FARM_BOUNDARY_COLLECTION_MODE } from "@/lib/farmDemoMode";
import { createSatelliteSource } from "@/lib/mapTiles";
import { dummyPumps } from "@/data/dummy";
import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import {
  ArrowLeft,
  MapPin,
  Sprout,
  Check,
  Plus,
  Minus,
  LocateFixed,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "ol/ol.css";
import OlMap from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import CircleGeom from "ol/geom/Circle";
import { fromLonLat, toLonLat, getPointResolution } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { defaults as defaultInteractions } from "ol/interaction/defaults";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import Draw from "ol/interaction/Draw";
import Collection from "ol/Collection";
import type { SelectEvent } from "ol/interaction/Select";
import type BaseEvent from "ol/events/Event";
import type { DrawEvent } from "ol/interaction/Draw";

const analysisStyle = new Style({
  fill: new Fill({ color: "rgba(30,107,255,0.08)" }),
  stroke: new Stroke({ color: "#1E6BFF", width: 2, lineDash: [7, 5] }),
});

/** Hide analysis ring during Kronis AI loading overlay */
const hiddenAnalysisStyle = new Style({});

/** Yellow circular fence ring (shown after Confirm in playback) */
const geofenceCircleStyle = new Style({
  fill: new Fill({ color: "rgba(245,197,24,0.10)" }),
  stroke: new Stroke({
    color: GEOFENCE_YELLOW,
    width: 3.5,
    lineDash: [10, 6],
  }),
});

function farmStyle(
  color: string,
  selected: boolean,
  editing = false,
  isGeofence = false
) {
  const stroke = isGeofence ? GEOFENCE_YELLOW : color;
  const fill = isGeofence
    ? "rgba(245,197,24,0.48)"
    : selected
      ? `${color}55`
      : `${color}38`;
  return new Style({
    fill: new Fill({ color: fill }),
    stroke: new Stroke({
      color: stroke,
      width: isGeofence || selected || editing ? 3.5 : 3,
    }),
  });
}

const vertexStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: "#fff" }),
    stroke: new Stroke({ color: "#FF6B35", width: 2.5 }),
  }),
});

function ringFromLatLng(pts: LatLng[]) {
  const ring = pts.map((pt) => fromLonLat([pt.lng, pt.lat]));
  if (ring.length) ring.push(ring[0]);
  return ring;
}

/** True screen-circle in Web Mercator (looks circular, not oval). */
function analysisCircleGeom(lat: number, lng: number, radiusMeters: number) {
  const center = fromLonLat([lng, lat]);
  // Convert ground meters → projection units at this latitude
  const mPerUnit = getPointResolution("EPSG:3857", 1, center);
  const radiusMap = radiusMeters / (mPerUnit || 1);
  return new CircleGeom(center, radiusMap);
}

export default function FarmPage() {
  const router = useRouter();
  /** Start on Odisha demo; replace with GPS when available */
  const [pin, setPin] = useState<LatLng>({
    lat: DEMO_AQUA_FARM.lat,
    lng: DEMO_AQUA_FARM.lng,
  });
  const [radiusAcres, setRadiusAcres] = useState(getAnalysisAcres);
  const [editing, setEditing] = useState(false);
  /** View mode always starts confirmed (JSON boundaries only) */
  const [confirmed, setConfirmed] = useState(false);
  /** Fake AI scan before revealing saved boundaries (playback) */
  const [aiDetecting, setAiDetecting] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  /** Manual vertex edit after Confirm — drag rings, Save writes JSON */
  const [editingFarms, setEditingFarms] = useState(false);
  /** Adjust → draw new polygons by tapping corners */
  const [drawingFarms, setDrawingFarms] = useState(false);
  const collectMode = FARM_BOUNDARY_COLLECTION_MODE;
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [farms, setFarms] = useState<DummyFarmPlot[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  /** Playback: multi-select fields as geofence areas (yellow) */
  const [geofenceIds, setGeofenceIds] = useState<string[]>([]);
  const [geofenceStatus, setGeofenceStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  /** Native FarmSetup: multi-pump assign per field */
  const [fieldAssignments, setFieldAssignments] = useState<FieldPumpAssignment[]>(
    () => getFieldPumpAssignments()
  );
  const [assignFieldId, setAssignFieldId] = useState<string | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);
  const [stopIfLeaves, setStopIfLeaves] = useState(true);
  const [assignSaving, setAssignSaving] = useState(false);
  const [savedRadii, setSavedRadii] = useState<number[]>(() => listSavedRadii());
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "ok" | "denied" | "error">(
    "idle"
  );
  const aiTimersRef = useRef<number[]>([]);

  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  /** Farm polygons only (separate from analysis ring for reliable tap hits) */
  const vectorRef = useRef<VectorSource | null>(null);
  const farmLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const analysisFeatRef = useRef<Feature | null>(null);
  const farmFeatsRef = useRef<Feature[]>([]);
  const pinElRef = useRef<HTMLDivElement | null>(null);
  const pinHostRef = useRef<HTMLDivElement | null>(null);
  const pinOverlayRef = useRef<Overlay | null>(null);
  const pumpRootsRef = useRef<Record<string, Root>>({});
  const pumpOverlaysRef = useRef<Record<string, Overlay>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  const confirmedRef = useRef(false);
  confirmedRef.current = confirmed;
  const editingFarmsRef = useRef(false);
  editingFarmsRef.current = editingFarms;
  const drawingFarmsRef = useRef(false);
  drawingFarmsRef.current = drawingFarms;
  const farmsRef = useRef(farms);
  farmsRef.current = farms;
  const geofenceIdsRef = useRef(geofenceIds);
  geofenceIdsRef.current = geofenceIds;
  /** Unsaved drawings — don't wipe when slider/chip changes */
  const farmsDirtyRef = useRef(false);
  const selectRef = useRef<Select | null>(null);
  const modifyRef = useRef<Modify | null>(null);
  const drawRef = useRef<Draw | null>(null);

  const toggleGeofence = useCallback((id: string) => {
    if (!id) return;
    setGeofenceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setGeofenceStatus("idle");
  }, []);
  const toggleGeofenceRef = useRef(toggleGeofence);
  toggleGeofenceRef.current = toggleGeofence;

  const clearAiTimers = useCallback(() => {
    aiTimersRef.current.forEach((id) => window.clearTimeout(id));
    aiTimersRef.current = [];
  }, []);

  const goToLocation = useCallback((lat: number, lng: number, animate = true) => {
    clearAiTimers();
    setAiDetecting(false);
    setAiStep(0);
    setPin({ lat, lng });
    setConfirmed(false);
    setFarms([]);
    setSelectedFarmId(null);
    setGeofenceIds([]);
    setGeofenceStatus("idle");
    setEditing(false);
    setEditingFarms(false);
    setDrawingFarms(false);
    setSaveStatus("idle");
    const map = mapRef.current;
    const coord = fromLonLat([lng, lat]);
    pinOverlayRef.current?.setPosition(coord);
    if (map) {
      map.getView().animate({
        center: coord,
        zoom: Math.max(map.getView().getZoom() ?? 17, 17.5),
        duration: animate ? 500 : 0,
      });
    }
  }, [clearAiTimers]);

  const requestCurrentLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoStatus("ok");
        goToLocation(lat, lng, true);
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [goToLocation]);

  // Prefer Puri demo farm on open. GPS is opt-in via the locate chip.
  // (Auto-GPS was jumping to Keonjhar / other districts.)
  useEffect(() => {
    setGeoStatus("idle");
  }, []);

  useEffect(() => () => clearAiTimers(), [clearAiTimers]);

  const AI_STEPS = [
    "Scanning satellite imagery…",
    "Detecting field edges…",
    "Matching crop parcels…",
    "Finalizing boundaries…",
  ] as const;

  const radiusM = useMemo(() => metersForAcres(radiusAcres), [radiusAcres]);

  const syncAnalysis = useCallback(() => {
    const analysis = analysisFeatRef.current;
    if (!analysis) return;
    analysis.setGeometry(analysisCircleGeom(pin.lat, pin.lng, radiusM));
    // Hide blue analysis ring while Kronis AI overlay is up
    if (aiDetecting) {
      analysis.setStyle(hiddenAnalysisStyle);
      return;
    }
    // Playback after Confirm: yellow fence circle; otherwise blue analysis ring
    const showFence = !collectMode && confirmedRef.current;
    analysis.setStyle(showFence ? geofenceCircleStyle : analysisStyle);
  }, [pin.lat, pin.lng, radiusM, collectMode, confirmed, aiDetecting]);

  const syncFarmFeatures = useCallback(
    (
      plots: DummyFarmPlot[],
      selectedId: string | null,
      isEditing = false,
      fenceIds?: string[]
    ) => {
      const source = vectorRef.current;
      if (!source) return;
      const fences = new Set(fenceIds ?? geofenceIdsRef.current);

      // During vertex edit, keep live geometries — only refresh styles
      if (isEditing && farmFeatsRef.current.length === plots.length) {
        farmFeatsRef.current.forEach((f) => {
          const id = String(f.get("farmId") ?? "");
          const plot = plots.find((p) => p.id === id);
          if (!plot) return;
          f.setStyle(
            farmStyle(plot.color, id === selectedId, true, fences.has(id))
          );
        });
        return;
      }

      source.clear();
      farmFeatsRef.current = [];

      plots.forEach((plot) => {
        const feat = new Feature({
          geometry: new Polygon([ringFromLatLng(plot.points)]),
          farmId: plot.id,
        });
        feat.setStyle(
          farmStyle(
            plot.color,
            plot.id === selectedId,
            isEditing,
            fences.has(plot.id)
          )
        );
        source.addFeature(feat);
        farmFeatsRef.current.push(feat);
      });
    },
    []
  );

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) return;

    const analysisSource = new VectorSource();
    const farmSource = new VectorSource();
    vectorRef.current = farmSource;

    const analysis = new Feature({
      geometry: analysisCircleGeom(
        DEMO_AQUA_FARM.lat,
        DEMO_AQUA_FARM.lng,
        metersForAcres(getAnalysisAcres())
      ),
    });
    analysis.setStyle(analysisStyle);
    analysisFeatRef.current = analysis;
    analysisSource.addFeature(analysis);

    const farmLayer = new VectorLayer({
      source: farmSource,
      zIndex: 3,
      // Keep fields clickable even when fill is semi-transparent
      style: undefined,
    });
    farmLayerRef.current = farmLayer;

    const map = new OlMap({
      target: host,
      layers: [
        new TileLayer({ source: createSatelliteSource(), preload: 2 }),
        new VectorLayer({
          source: analysisSource,
          zIndex: 4,
          // Fence / analysis ring draws above field fills so the circle stays visible
          properties: { name: "analysis" },
        }),
        farmLayer,
      ],
      view: new View({
        center: fromLonLat([DEMO_AQUA_FARM.lng, DEMO_AQUA_FARM.lat]),
        zoom: 17.8,
        maxZoom: 20,
        minZoom: 0,
        constrainResolution: false,
        smoothResolutionConstraint: true,
      }),
      controls: [],
      interactions: defaultInteractions({
        mouseWheelZoom: false,
        pinchZoom: true,
        doubleClickZoom: true,
        dragPan: true,
        keyboard: true,
        zoomDuration: 280,
      }).extend([
        new MouseWheelZoom({
          useAnchor: true,
          timeout: 120,
          duration: 220,
          // Larger steps so zooming out to country is practical
          maxDelta: 2.5,
          constrainResolution: false,
        }),
      ]),
    });
    host.tabIndex = 0;
    host.style.cursor = "default";
    mapRef.current = map;

    if (pinElRef.current) {
      const overlay = new Overlay({
        element: pinElRef.current,
        positioning: "bottom-center",
        offset: [0, 4],
        stopEvent: false,
      });
      pinOverlayRef.current = overlay;
      map.addOverlay(overlay);
      overlay.setPosition(fromLonLat([pin.lng, pin.lat]));
    }

    const farmIdAtPixel = (pixel: number[]): string | null => {
      let farmId: string | null = null;
      map.forEachFeatureAtPixel(
        pixel,
        (f, layer) => {
          if (layer !== farmLayer) return undefined;
          const id = f.get("farmId");
          if (id != null && id !== "") {
            farmId = String(id);
            return true;
          }
          return undefined;
        },
        { hitTolerance: 14, layerFilter: (layer) => layer === farmLayer }
      );
      return farmId;
    };

    const onPointerMove = (evt: { dragging: boolean; pixel: number[] }) => {
      if (evt.dragging) return;
      if (
        !confirmedRef.current ||
        collectMode ||
        editingFarmsRef.current ||
        drawingFarmsRef.current
      ) {
        host.style.cursor = "default";
        return;
      }
      host.style.cursor = farmIdAtPixel(evt.pixel) ? "pointer" : "default";
    };

    const onClick = (evt: { coordinate: number[]; pixel: number[] }) => {
      // Playback: tap / click a field on the map to add / remove geofence
      if (
        confirmedRef.current &&
        !collectMode &&
        !editingFarmsRef.current &&
        !drawingFarmsRef.current
      ) {
        const id = farmIdAtPixel(evt.pixel);
        if (id) toggleGeofenceRef.current(id);
        return;
      }
      if (confirmedRef.current) return;
      const [lng, lat] = toLonLat(evt.coordinate);
      setPin({ lat, lng });
      setEditing(false);
      pinOverlayRef.current?.setPosition(evt.coordinate);
    };
    map.on("click", onClick as never);
    map.on("pointermove", onPointerMove as never);

    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(host);

    return () => {
      ro.disconnect();
      map.un("click", onClick as never);
      map.un("pointermove", onPointerMove as never);
      clearPumpOverlays(map);
      // Return pin node to React host before OL tears down — avoids removeChild crash
      const pinOverlay = pinOverlayRef.current;
      const pinEl = pinOverlay?.getElement() ?? pinElRef.current;
      if (pinOverlay) map.removeOverlay(pinOverlay);
      if (pinEl && pinHostRef.current && pinEl.parentNode !== pinHostRef.current) {
        pinHostRef.current.appendChild(pinEl);
      }
      map.setTarget(undefined);
      mapRef.current = null;
      vectorRef.current = null;
      farmLayerRef.current = null;
      analysisFeatRef.current = null;
      farmFeatsRef.current = [];
      pinOverlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncAnalysis();
    pinOverlayRef.current?.setPosition(fromLonLat([pin.lng, pin.lat]));
  }, [syncAnalysis, pin.lat, pin.lng]);

  useEffect(() => {
    syncFarmFeatures(farms, selectedFarmId, editingFarms, geofenceIds);
  }, [farms, selectedFarmId, syncFarmFeatures, editingFarms, geofenceIds]);

  /** Clickable vertex edit after Confirm — Modify all farm rings (no redraw) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const tearDown = () => {
      if (selectRef.current) {
        map.removeInteraction(selectRef.current);
        selectRef.current = null;
      }
      if (modifyRef.current) {
        map.removeInteraction(modifyRef.current);
        modifyRef.current = null;
      }
    };

    tearDown();
    if (!confirmed || !editingFarms || drawingFarms) return;

    // Modify every existing farm polygon — drag vertices without redrawing
    const editable = new Collection(farmFeatsRef.current.slice());
    const modify = new Modify({
      features: editable,
      style: vertexStyle,
      pixelTolerance: 22,
      insertVertexCondition: () => true,
    });

    const select = new Select({
      hitTolerance: 14,
      filter: (feature) =>
        farmFeatsRef.current.includes(feature as Feature),
      style: (feature) => {
        const id = String(feature.get("farmId") ?? "");
        const plot = farmsRef.current.find((p) => p.id === id);
        return [
          farmStyle(plot?.color ?? "#FF6B35", true, true),
          vertexStyle,
        ];
      },
    });

    const onSelect = (evt: SelectEvent) => {
      const feat = evt.selected[0] as Feature | undefined;
      if (feat) {
        setSelectedFarmId(String(feat.get("farmId") ?? ""));
      }
    };

    const readFarmsFromMap = () => {
      const next = farmFeatsRef.current.map((f) => {
        const id = String(f.get("farmId") ?? "");
        const existing = farmsRef.current.find((p) => p.id === id);
        const geom = f.getGeometry() as Polygon | undefined;
        const ring = geom?.getCoordinates()?.[0] ?? [];
        const open =
          ring.length > 1 &&
          ring[0][0] === ring[ring.length - 1][0] &&
          ring[0][1] === ring[ring.length - 1][1]
            ? ring.slice(0, -1)
            : ring;
        const points: LatLng[] = open.map((c) => {
          const [lng, lat] = toLonLat(c);
          return { lat, lng };
        });
        return {
          id,
          name: existing?.name ?? id,
          crop: existing?.crop ?? "Paddy",
          color: existing?.color ?? "#FF6B35",
          points,
          acres: Number(polygonAreaAcres(points).toFixed(2)),
        } satisfies DummyFarmPlot;
      });
      setFarms(next);
      setSaveStatus("idle");
    };

    select.on("select", onSelect);
    modify.on("modifyend", readFarmsFromMap as (e: BaseEvent) => void);
    // Select first so tap highlights; Modify on top so vertex drag wins
    map.addInteraction(select);
    map.addInteraction(modify);
    selectRef.current = select;
    modifyRef.current = modify;

    const active = farmFeatsRef.current.find(
      (f) => f.get("farmId") === selectedFarmId
    );
    if (active) {
      select.getFeatures().clear();
      select.getFeatures().push(active);
    }

    return tearDown;
    // Re-bind when a field is deleted/added while modifying
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, editingFarms, drawingFarms, farms.length]);

  /** Adjust — manual polygon draw (tap corners, double-tap to close) */
  useEffect(() => {
    const map = mapRef.current;
    const source = vectorRef.current;
    if (!map || !source) return;

    const tearDown = () => {
      if (drawRef.current) {
        map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };

    tearDown();
    if (!confirmed || !drawingFarms) return;

    const draw = new Draw({
      // No source — feature only lives in the sketch layer until we accept it
      type: "Polygon",
      style: new Style({
        fill: new Fill({ color: "rgba(255,107,53,0.22)" }),
        stroke: new Stroke({ color: "#FF6B35", width: 2.5 }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#fff" }),
          stroke: new Stroke({ color: "#FF6B35", width: 2 }),
        }),
      }),
    });

    const onDrawEnd = (evt: DrawEvent) => {
      const geom = evt.feature.getGeometry() as Polygon | undefined;
      if (!geom) return;

      const ring = geom.getCoordinates()[0] ?? [];
      const open =
        ring.length > 1 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring;
      if (open.length < 3) return;

      const points: LatLng[] = open.map((c) => {
        const [lng, lat] = toLonLat(c);
        return { lat, lng };
      });
      const maxN = farmsRef.current.reduce((m, f) => {
        const n = Number(String(f.id).replace(/\D/g, "")) || 0;
        return Math.max(m, n);
      }, 0);
      const n = maxN + 1;
      const id = `field_${String(n).padStart(2, "0")}`;
      const plot: DummyFarmPlot = {
        id,
        name: `Field ${n}`,
        crop: "Paddy",
        color: "#FF6B35",
        points,
        acres: Number(polygonAreaAcres(points).toFixed(2)),
      };
      farmsDirtyRef.current = true;
      setFarms((prev) => [...prev, plot]);
      setSelectedFarmId(id);
      setSaveStatus("idle");
    };

    draw.on("drawend", onDrawEnd);
    map.addInteraction(draw);
    drawRef.current = draw;

    return tearDown;
  }, [confirmed, drawingFarms]);

  /** Frame the analysis circle tightly (native fitPinRadius style) */
  const fitAnalysis = useCallback((animated = true) => {
    const map = mapRef.current;
    const analysis = analysisFeatRef.current;
    if (!map || !analysis) return;
    const geom = analysis.getGeometry();
    if (!geom) return;
    map.updateSize();
    map.getView().fit(geom.getExtent(), {
      size: map.getSize(),
      padding: [36, 36, 36, 36],
      // Stay near native Google tile resolution — past ~18 looks soft here
      maxZoom: 18,
      duration: animated ? 380 : 0,
    });
  }, []);

  // Initial frame only — do NOT re-fit on radius drag (that blocked country zoom-out)
  useEffect(() => {
    const t = window.setTimeout(() => fitAnalysis(false), 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync multi-radius JSON from disk on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/farm-boundaries");
        if (!res.ok) return;
        const file = (await res.json()) as FarmBoundariesFile;
        if (cancelled) return;
        setLiveFarmFile(file);
        const radii = listSavedRadii();
        setSavedRadii(radii);
        const acres = clampAcres(
          Number(
            file.radiusAcres ??
              file.benchmark?.analysisAcres ??
              radii[0] ??
              getAnalysisAcres()
          )
        );
        setRadiusAcres(acres);
        setRuntimeAnalysisAcres(acres);
        // Playback: stay on slider until user taps Confirm
        if (!FARM_BOUNDARY_COLLECTION_MODE) {
          setConfirmed(false);
          setFarms([]);
          setSelectedFarmId(null);
        }
      } catch {
        /* keep bundled JSON */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slider / chip radius change → load that radius's saved fields
  useEffect(() => {
    if (!confirmed || drawingFarms || editingFarms) return;
    if (farmsDirtyRef.current) return;
    const acres = snapAnalysisAcres(radiusAcres);
    if (Math.abs(acres - radiusAcres) > 0.001) {
      setRadiusAcres(acres);
      return;
    }
    setRuntimeAnalysisAcres(acres);
    const plots = confirmedFarmBoundaries(acres);
    setFarms(plots);
    setSelectedFarmId(plots[0]?.id ?? null);
  }, [radiusAcres, confirmed, drawingFarms, editingFarms]);

  const bumpZoom = (delta: number) => {
    const view = mapRef.current?.getView();
    if (!view) return;
    const z = view.getZoom() ?? 17;
    view.animate({ zoom: z + delta, duration: 220 });
  };

  const handleConfirm = async () => {
    // Playback: snap to nearest saved radius and show its JSON boundaries
    // Collection: keep exact slider value (and optionally write JSON)
    const acres = collectMode
      ? clampAcres(radiusAcres)
      : nearestSavedRadius(radiusAcres);
    const plots = confirmedFarmBoundaries(acres);
    setRadiusAcres(acres);
    setRuntimeAnalysisAcres(acres);
    setPin({ lat: DEMO_AQUA_FARM.lat, lng: DEMO_AQUA_FARM.lng });
    setEditing(false);
    setEditingFarms(false);
    setDrawingFarms(false);
    farmsDirtyRef.current = false;
    pinOverlayRef.current?.setPosition(
      fromLonLat([DEMO_AQUA_FARM.lng, DEMO_AQUA_FARM.lat])
    );
    const map = mapRef.current;
    if (map) {
      map.getView().animate({
        center: fromLonLat([DEMO_AQUA_FARM.lng, DEMO_AQUA_FARM.lat]),
        duration: 380,
      });
    }
    window.setTimeout(() => fitAnalysis(true), 100);

    // Playback: fake AI scan, then reveal boundaries
    if (!collectMode) {
      clearAiTimers();
      setFarms([]);
      setSelectedFarmId(null);
      setGeofenceIds([]);
      setGeofenceStatus("idle");
      setConfirmed(false);
      setAiDetecting(true);
      setAiStep(0);
      setSaveStatus("idle");

      const steps = [0, 1, 2, 3];
      steps.forEach((step, i) => {
        const id = window.setTimeout(() => setAiStep(step), i * 700);
        aiTimersRef.current.push(id);
      });
      const doneId = window.setTimeout(() => {
        const savedFences = getGeofenceFieldIds(acres).filter((id) =>
          plots.some((p) => p.id === id)
        );
        setFarms(plots);
        setSelectedFarmId(plots[0]?.id ?? null);
        setGeofenceIds(savedFences);
        setFieldAssignments(getFieldPumpAssignments());
        setGeofenceStatus("idle");
        setConfirmed(true);
        setAiDetecting(false);
        setAiStep(0);
        window.setTimeout(() => fitAnalysis(true), 80);
      }, 2800);
      aiTimersRef.current.push(doneId);
      return;
    }

    setFarms(plots);
    setSelectedFarmId(plots[0]?.id ?? null);
    setConfirmed(true);

    // Collection only: persist radius bucket
    setSaveStatus("saving");
    try {
      try {
        const existingRes = await fetch("/api/farm-boundaries");
        if (existingRes.ok) {
          setLiveFarmFile((await existingRes.json()) as FarmBoundariesFile);
        }
      } catch {
        /* ignore */
      }
      const payload = farmsToBoundaryJson(
        plots.length ? plots : farmsRef.current,
        acres
      );
      const res = await fetch("/api/farm-boundaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      const result = await res.json().catch(() => null);
      setSavedRadii(
        Array.isArray(result?.radii) ? result.radii : listSavedRadii()
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const startFarmEdit = () => {
    setDrawingFarms(false);
    setEditingFarms(true);
    setSaveStatus("idle");
  };

  const startManualDraw = () => {
    setEditingFarms(false);
    setDrawingFarms(true);
    farmsDirtyRef.current = true;
    setSaveStatus("idle");
  };

  /** Wipe all and redraw from scratch at current radius */
  const startRedrawAll = () => {
    const acres = clampAcres(radiusAcres);
    setRadiusAcres(acres);
    setRuntimeAnalysisAcres(acres);
    setPin({ lat: DEMO_AQUA_FARM.lat, lng: DEMO_AQUA_FARM.lng });
    setEditingFarms(false);
    setDrawingFarms(true);
    setConfirmed(true);
    farmsDirtyRef.current = true;
    setFarms([]);
    setSelectedFarmId(null);
    syncFarmFeatures([], null, false);
    setSaveStatus("idle");
    pinOverlayRef.current?.setPosition(
      fromLonLat([DEMO_AQUA_FARM.lng, DEMO_AQUA_FARM.lat])
    );
    window.setTimeout(() => fitAnalysis(true), 80);
  };

  /** Pre-confirm: set radius (e.g. 3 ac) and start drawing fresh boundaries */
  const startDrawAtRadius = () => {
    startRedrawAll();
  };

  const cancelFarmEdit = () => {
    setEditingFarms(false);
    setDrawingFarms(false);
    farmsDirtyRef.current = false;
    const acres = getAnalysisAcres();
    setRadiusAcres(acres);
    const plots = confirmedFarmBoundaries(acres);
    setFarms(plots);
    setSelectedFarmId(plots[0]?.id ?? null);
    syncFarmFeatures(plots, plots[0]?.id ?? null, false);
    setSaveStatus("idle");
  };

  const undoLastDrawn = () => {
    setFarms((prev) => {
      const next = prev.slice(0, -1);
      setSelectedFarmId(next[next.length - 1]?.id ?? null);
      return next;
    });
    setSaveStatus("idle");
  };

  const deleteSelectedFarm = () => {
    if (!selectedFarmId) return;
    setFarms((prev) => {
      const next = prev.filter((f) => f.id !== selectedFarmId);
      setSelectedFarmId(next[0]?.id ?? null);
      return next;
    });
    setSaveStatus("idle");
  };

  const saveFarmsToJson = async () => {
    if (farmsRef.current.length === 0) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    try {
      const acres = clampAcres(radiusAcres);
      // Pull latest file so other radii are not wiped
      try {
        const existingRes = await fetch("/api/farm-boundaries");
        if (existingRes.ok) {
          setLiveFarmFile((await existingRes.json()) as FarmBoundariesFile);
        }
      } catch {
        /* use in-memory live file */
      }
      const payload = farmsToBoundaryJson(farmsRef.current, acres);
      const res = await fetch("/api/farm-boundaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      const result = await res.json().catch(() => null);
      setRuntimeAnalysisAcres(acres);
      setRadiusAcres(acres);
      setSavedRadii(
        Array.isArray(result?.radii) ? result.radii : listSavedRadii()
      );
      setEditingFarms(false);
      setDrawingFarms(false);
      setSaveStatus("saved");
      farmsDirtyRef.current = false;
      syncFarmFeatures(farmsRef.current, selectedFarmId, false);
    } catch {
      setSaveStatus("error");
    }
  };

  const selectFarm = (id: string) => {
    // Playback: multi-select geofence (yellow) — list or map
    if (!collectMode) {
      toggleGeofence(id);
      return;
    }

    setSelectedFarmId(id);
    const plot = farms.find((f) => f.id === id);
    const map = mapRef.current;
    if (!plot || !map) return;

    if (editingFarms && selectRef.current) {
      const feat = farmFeatsRef.current.find((f) => f.get("farmId") === id);
      if (feat) {
        selectRef.current.getFeatures().clear();
        selectRef.current.getFeatures().push(feat);
      }
    }

    const extent = new Polygon([ringFromLatLng(plot.points)]).getExtent();
    map.getView().fit(extent, {
      size: map.getSize(),
      padding: [40, 40, 40, 40],
      maxZoom: 18.5,
      duration: 350,
    });
  };

  const saveGeofences = async () => {
    setGeofenceStatus("saving");
    try {
      try {
        const existingRes = await fetch("/api/farm-boundaries");
        if (existingRes.ok) {
          setLiveFarmFile((await existingRes.json()) as FarmBoundariesFile);
        }
      } catch {
        /* ignore */
      }
      const acres = clampAcres(radiusAcres);
      const payload = geofencesToJson(farmsRef.current, geofenceIdsRef.current, acres);
      const bucket = payload.geofences?.find((g) => g.radiusAcres === acres);
      const res = await fetch("/api/farm-geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radiusAcres: acres,
          fieldIds: bucket?.fieldIds ?? geofenceIdsRef.current,
          boundaries: bucket?.boundaries ?? [],
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setGeofenceStatus("saved");
      return true;
    } catch {
      setGeofenceStatus("error");
      return false;
    }
  };

  const selectSavedRadius = useCallback(
    (r: number) => {
      const acres = snapAnalysisAcres(r);
      farmsDirtyRef.current = false;
      setRadiusAcres(acres);
      setRuntimeAnalysisAcres(acres);
      setConfirmed(true);
      setDrawingFarms(false);
      setEditingFarms(false);
      setSaveStatus("idle");
      const plots = confirmedFarmBoundaries(acres);
      setFarms(plots);
      setSelectedFarmId(plots[0]?.id ?? null);
      const savedFences = getGeofenceFieldIds(acres).filter((id) =>
        plots.some((p) => p.id === id)
      );
      setGeofenceIds(savedFences);
      syncFarmFeatures(plots, plots[0]?.id ?? null, false, savedFences);
      window.setTimeout(() => fitAnalysis(true), 80);
    },
    [fitAnalysis, syncFarmFeatures]
  );

  const setAcresFromClientX = useCallback(
    (clientX: number, snap = false) => {
      if (drawingFarms || editingFarms) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const t = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
      );
      const raw = clampAcres(
        MIN_RADIUS_ACRES + t * (MAX_RADIUS_ACRES - MIN_RADIUS_ACRES)
      );
      const acres = snap ? snapAnalysisAcres(raw) : Number(raw.toFixed(2));
      if (snap) farmsDirtyRef.current = false;
      setRadiusAcres(acres);
      setRuntimeAnalysisAcres(acres);
      setEditing(false);
      setSaveStatus("idle");
    },
    [drawingFarms, editingFarms]
  );

  const fillPct =
    ((radiusAcres - MIN_RADIUS_ACRES) / (MAX_RADIUS_ACRES - MIN_RADIUS_ACRES)) * 100;

  const totalFarmAcres = farms.reduce((s, f) => s + f.acres, 0);

  /** Preview / saved pumps seated inside assigned fields */
  const mapPumps = useMemo(() => {
    if (!confirmed || collectMode) return [];
    const liveAssign =
      assignFieldId != null
        ? fieldAssignments.map((a) =>
            a.fieldId === assignFieldId
              ? { ...a, pumpIds: assignSelectedIds, stopIfLeaves }
              : {
                  ...a,
                  pumpIds: a.pumpIds.filter((id) => !assignSelectedIds.includes(id)),
                }
          )
        : fieldAssignments;

    // Ensure assign field entry exists while picking
    let assigns = liveAssign;
    if (assignFieldId && !assigns.some((a) => a.fieldId === assignFieldId)) {
      assigns = [
        ...assigns,
        { fieldId: assignFieldId, pumpIds: assignSelectedIds, stopIfLeaves },
      ];
    }

    const out: {
      key: string;
      id: string;
      number: number;
      name: string;
      lat: number;
      lng: number;
      selected: boolean;
    }[] = [];

    for (const farm of farms) {
      if (!geofenceIds.includes(farm.id) && assignFieldId !== farm.id) continue;
      const ids =
        assigns.find((a) => a.fieldId === farm.id)?.pumpIds ?? [];
      ids.forEach((pid, idx) => {
        const meta = dummyPumps.find((p) => p.id === pid);
        const seat =
          placePumpInFence(farm.points, idx) ??
          farm.points[0] ??
          { lat: pin.lat, lng: pin.lng };
        out.push({
          key: `${farm.id}-${pid}`,
          id: pid,
          number: meta?.number ?? idx + 1,
          name: meta?.name ?? pid,
          lat: seat.lat,
          lng: seat.lng,
          selected: assignSelectedIds.includes(pid),
        });
      });
    }
    return out;
  }, [
    confirmed,
    collectMode,
    farms,
    geofenceIds,
    fieldAssignments,
    assignFieldId,
    assignSelectedIds,
    stopIfLeaves,
    pin.lat,
    pin.lng,
  ]);

  const clearPumpOverlays = useCallback((map: OlMap | null) => {
    Object.entries(pumpOverlaysRef.current).forEach(([key, overlay]) => {
      map?.removeOverlay(overlay);
      const root = pumpRootsRef.current[key];
      delete pumpRootsRef.current[key];
      // Defer unmount so it doesn't race OL's DOM move
      if (root) void Promise.resolve().then(() => root.unmount());
    });
    pumpOverlaysRef.current = {};
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !confirmed) {
      clearPumpOverlays(map);
      return;
    }

    const activeKeys = new Set(mapPumps.map((p) => p.key));

    mapPumps.forEach((p) => {
      let overlay = pumpOverlaysRef.current[p.key];
      if (!overlay) {
        const el = document.createElement("div");
        el.className = "pointer-events-none drop-shadow-lg";
        const root = createRoot(el);
        pumpRootsRef.current[p.key] = root;
        overlay = new Overlay({
          element: el,
          positioning: "center-center",
          stopEvent: false,
        });
        pumpOverlaysRef.current[p.key] = overlay;
        map.addOverlay(overlay);
      }
      pumpRootsRef.current[p.key]?.render(
        <PumpMapMarker number={p.number} selected={p.selected} />
      );
      overlay.setPosition(fromLonLat([p.lng, p.lat]));
    });

    Object.keys(pumpOverlaysRef.current).forEach((key) => {
      if (activeKeys.has(key)) return;
      const overlay = pumpOverlaysRef.current[key];
      const root = pumpRootsRef.current[key];
      map.removeOverlay(overlay);
      delete pumpOverlaysRef.current[key];
      delete pumpRootsRef.current[key];
      if (root) void Promise.resolve().then(() => root.unmount());
    });
  }, [mapPumps, confirmed, clearPumpOverlays]);

  const openAssignPicker = (fieldId: string) => {
    if (collectMode || !confirmed) return;
    const existing = fieldAssignments.find((a) => a.fieldId === fieldId);
    setAssignFieldId(fieldId);
    setAssignSelectedIds(existing?.pumpIds ? [...existing.pumpIds] : []);
    setStopIfLeaves(existing?.stopIfLeaves !== false);
    if (!geofenceIds.includes(fieldId)) {
      setGeofenceIds((prev) => [...prev, fieldId]);
    }
    const plot = farms.find((f) => f.id === fieldId);
    const map = mapRef.current;
    if (plot && map) {
      const extent = new Polygon([ringFromLatLng(plot.points)]).getExtent();
      map.getView().fit(extent, {
        size: map.getSize(),
        padding: [48, 40, 40, 40],
        maxZoom: 19,
        duration: 320,
      });
    }
  };

  const cancelAssignPicker = () => {
    setAssignFieldId(null);
    setAssignSelectedIds([]);
  };

  const toggleAssignPump = (pumpId: string) => {
    setAssignSelectedIds((prev) =>
      prev.includes(pumpId) ? prev.filter((id) => id !== pumpId) : [...prev, pumpId]
    );
  };

  const applyAssignSheet = async () => {
    if (!assignFieldId) return;
    setAssignSaving(true);
    try {
      const selected = new Set(assignSelectedIds);
      let next = fieldAssignments
        .map((a) => ({
          ...a,
          // A pump can only live on one field
          pumpIds:
            a.fieldId === assignFieldId
              ? [...assignSelectedIds]
              : a.pumpIds.filter((id) => !selected.has(id)),
          stopIfLeaves:
            a.fieldId === assignFieldId ? stopIfLeaves : a.stopIfLeaves,
        }))
        .filter((a) => a.pumpIds.length > 0 || a.fieldId === assignFieldId);

      if (!next.some((a) => a.fieldId === assignFieldId)) {
        next = [
          ...next,
          {
            fieldId: assignFieldId,
            pumpIds: [...assignSelectedIds],
            stopIfLeaves,
          },
        ];
      } else {
        next = next.map((a) =>
          a.fieldId === assignFieldId
            ? { ...a, pumpIds: [...assignSelectedIds], stopIfLeaves }
            : a
        );
      }
      next = next.filter((a) => a.pumpIds.length > 0);

      try {
        const existingRes = await fetch("/api/farm-boundaries");
        if (existingRes.ok) {
          setLiveFarmFile((await existingRes.json()) as FarmBoundariesFile);
        }
      } catch {
        /* ignore */
      }
      fieldPumpAssignmentsToJson(next);
      const res = await fetch("/api/farm-pump-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldPumpAssignments: next }),
      });
      if (!res.ok) throw new Error("save failed");
      setFieldAssignments(next);
      setAssignFieldId(null);
      setAssignSelectedIds([]);
    } catch {
      /* keep sheet open */
    } finally {
      setAssignSaving(false);
    }
  };

  const assignField = farms.find((f) => f.id === assignFieldId);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className="flex items-center gap-3 px-3.5 pb-3 pt-2">
        <SoftChip icon={ArrowLeft} onClick={() => router.push("/home")} label="Back" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
            Farm boundary
          </div>
        </div>
        <SoftChip
          icon={LocateFixed}
          onClick={requestCurrentLocation}
          label="Use current location"
          color={geoStatus === "ok" ? kronis.lime : "#8b90a0"}
        />
      </header>

      <div
        className="relative mx-3.5 mb-3 min-h-0 flex-1 overflow-hidden rounded-2xl"
        style={{ boxShadow: "inset 0 0 0 1px rgba(23,26,18,0.08)" }}
      >
        <div ref={mapHostRef} className="absolute inset-0" />
        <div ref={pinHostRef} className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-visible">
          <div
            ref={pinElRef}
            className="pointer-events-none"
            style={{ display: confirmed || aiDetecting ? "none" : "block" }}
          >
            <MapPin size={28} color="#E53935" fill="#E53935" />
          </div>
        </div>
        {aiDetecting ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,14,12,0.08) 0%, rgba(10,14,12,0.48) 75%)",
            }}
          >
            <style>{`
              @keyframes ai-ring {
                0% { transform: scale(0.78); opacity: 0.55; }
                100% { transform: scale(1.55); opacity: 0; }
              }
              @keyframes ai-orbit {
                to { transform: rotate(360deg); }
              }
              @keyframes ai-logo-in {
                0% { opacity: 0; transform: scale(0.88); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes ai-bar {
                0% { transform: scaleX(0.14); }
                55% { transform: scaleX(0.72); }
                100% { transform: scaleX(0.94); }
              }
              @keyframes ai-step-fade {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.72; }
              }
            `}</style>

            <div className="relative mb-6 flex h-[148px] w-[148px] items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1.5px solid rgba(236,83,51,0.45)",
                  animation: "ai-ring 2.1s ease-out infinite",
                }}
              />
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1.5px solid rgba(236,83,51,0.28)",
                  animation: "ai-ring 2.1s ease-out 0.7s infinite",
                }}
              />
              <span
                className="absolute inset-[10px] rounded-full"
                style={{
                  border: "2px solid transparent",
                  borderTopColor: "#EC5333",
                  borderRightColor: "rgba(236,83,51,0.35)",
                  animation: "ai-orbit 1.35s linear infinite",
                }}
              />
              <div
                className="relative flex items-center justify-center"
                style={{
                  animation: "ai-logo-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/kronis-logo.svg"
                  alt="Kronis"
                  width={88}
                  height={32}
                  draggable={false}
                  style={{
                    display: "block",
                    width: 88,
                    height: "auto",
                    filter:
                      "brightness(0) invert(1) drop-shadow(0 4px 14px rgba(0,0,0,0.45))",
                  }}
                />
              </div>
            </div>

            <div
              className="w-full max-w-[268px] rounded-[22px] px-5 py-4 text-center"
              style={{
                background: "rgba(18,22,20,0.86)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              <div
                className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: "#EC5333" }}
              >
                Kronis AI
              </div>
              <div
                className="mt-1.5 text-[14px] font-semibold leading-snug text-white"
                style={{ animation: "ai-step-fade 2.4s ease-in-out infinite" }}
              >
                {AI_STEPS[Math.min(aiStep, AI_STEPS.length - 1)]}
              </div>
              <div className="mx-auto mt-3.5 h-[3px] w-full max-w-[168px] overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full origin-left rounded-full"
                  style={{
                    width: "100%",
                    background: "linear-gradient(90deg, #EC5333, #ff8a5c)",
                    animation: "ai-bar 2.8s ease-in-out forwards",
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
        {/* Zoom +/- only — no preset India/Farm locks */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => bumpZoom(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full active:scale-95"
            style={{
              background: "linear-gradient(145deg, #f5f6f8, #dfe1e4)",
              boxShadow: "3px 4px 8px rgba(102,109,122,0.28)",
            }}
          >
            <Plus size={18} color={kronis.ink} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => bumpZoom(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full active:scale-95"
            style={{
              background: "linear-gradient(145deg, #f5f6f8, #dfe1e4)",
              boxShadow: "3px 4px 8px rgba(102,109,122,0.28)",
            }}
          >
            <Minus size={18} color={kronis.ink} />
          </button>
        </div>
        {(() => {
          const mapHint = !collectMode
            ? aiDetecting
              ? "Kronis AI detecting farm boundaries…"
              : null
            : drawingFarms
              ? `Draw at ${radiusAcres.toFixed(2)} ac · tap corners · double-tap to close · ${farms.length} drawn`
              : editingFarms
                ? "Modify · drag orange corner dots · then Save JSON"
                : confirmed
                  ? `${farms.length} farm boundaries · ${totalFarmAcres.toFixed(2)} ac total`
                  : editing
                    ? "Edit mode · adjust radius or move pin"
                    : `Analysis radius · ${radiusAcres.toFixed(2)} ac · Draw to trace fields`;
          if (!mapHint) return null;
          return (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 rounded-full bg-black/55 px-3 py-2 text-center text-[11px] font-semibold text-white">
              {mapHint}
            </div>
          );
        })()}
        {!collectMode && confirmed && !aiDetecting && geofenceIds.length > 0 ? (
          <div
            className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
            style={{ background: "rgba(23,26,18,0.78)" }}
          >
            {geofenceIds.length} in fence
          </div>
        ) : null}
      </div>

      {/* Slider: collection always (when not drawing); playback only before Confirm */}
      {!drawingFarms && !editingFarms && !aiDetecting && (collectMode || !confirmed) ? (
        <SoftRaised className="mx-3.5 mb-3 px-3.5 py-3" radius={18}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px] font-bold" style={{ color: kronis.ink }}>
              Analysis area
            </span>
            <span className="text-[13px] font-extrabold" style={{ color: kronis.lime }}>
              {radiusAcres.toFixed(2)} ac
            </span>
          </div>
          <div
            ref={trackRef}
            role="slider"
            aria-label="Boundary radius in acres"
            aria-valuemin={MIN_RADIUS_ACRES}
            aria-valuemax={MAX_RADIUS_ACRES}
            aria-valuenow={Number(radiusAcres.toFixed(2))}
            tabIndex={0}
            className="relative h-9 cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setAcresFromClientX(e.clientX, false);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              setAcresFromClientX(e.clientX, false);
            }}
            onPointerUp={(e) => {
              // Collection snaps to saved chips; playback keeps free drag until Confirm
              setAcresFromClientX(e.clientX, collectMode);
            }}
            onPointerCancel={(e) => {
              setAcresFromClientX(e.clientX, collectMode);
            }}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.25 : 0.05;
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                setRadiusAcres((v) =>
                  collectMode ? snapAnalysisAcres(v + step) : clampAcres(v + step)
                );
                farmsDirtyRef.current = false;
                setEditing(false);
                setSaveStatus("idle");
              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                setRadiusAcres((v) =>
                  collectMode ? snapAnalysisAcres(v - step) : clampAcres(v - step)
                );
                farmsDirtyRef.current = false;
                setEditing(false);
                setSaveStatus("idle");
              }
            }}
          >
            <span
              className="absolute left-0 right-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
              style={{
                background: kronis.neo,
                boxShadow:
                  "inset 2px 2px 4px rgba(150,155,165,0.35), inset -2px -2px 4px rgba(255,255,255,0.75)",
              }}
            />
            <span
              className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
              style={{
                width: `${fillPct}%`,
                background: `linear-gradient(90deg, ${kronis.lime}, ${kronis.limeDark})`,
              }}
            />
            <span
              className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${fillPct}%`,
                background: "linear-gradient(145deg, #f5f6f8, #dfe1e4)",
                boxShadow:
                  "3px 4px 8px rgba(102,109,122,0.35), -2px -2px 6px rgba(255,255,255,0.95)",
                border: `2px solid ${kronis.lime}`,
              }}
            />
          </div>
          <div
            className="mt-1.5 flex justify-between text-[10px] font-semibold"
            style={{ color: kronis.inkMuted }}
          >
            <span>{MIN_RADIUS_ACRES} ac</span>
            <span>{MAX_RADIUS_ACRES} ac</span>
          </div>
          {collectMode && savedRadii.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {savedRadii.map((r) => {
                const active = Math.abs(r - radiusAcres) < 0.001;
                const n = countFieldsAtRadius(r);
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={drawingFarms || editingFarms}
                    onClick={() => selectSavedRadius(r)}
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold active:scale-95"
                    style={{
                      background: active
                        ? kronis.lime
                        : "linear-gradient(145deg, #f5f6f8, #e4e7ec)",
                      color: active ? "#fff" : kronis.ink,
                      boxShadow: "2px 2px 5px rgba(102,109,122,0.2)",
                    }}
                  >
                    {r.toFixed(2)} ac · {n}
                  </button>
                );
              })}
            </div>
          ) : null}
        </SoftRaised>
      ) : null}

      {confirmed ? (
        <div className="no-scrollbar mx-3.5 mb-3 max-h-[160px] space-y-2 overflow-y-auto">
          {farms.map((farm) => {
            const active = collectMode
              ? farm.id === selectedFarmId
              : geofenceIds.includes(farm.id);
            const accent = active && !collectMode ? GEOFENCE_YELLOW : farm.color;
            const assigned =
              fieldAssignments.find((a) => a.fieldId === farm.id)?.pumpIds ?? [];
            return (
              <div
                key={farm.id}
                className="flex w-full items-center gap-2 px-2.5 py-2"
                style={{
                  borderRadius: 16,
                  background: active
                    ? "linear-gradient(145deg, #f4f6f8, #e8ebef)"
                    : "linear-gradient(145deg, #eef1f5, #e2e6ec)",
                  boxShadow: active
                    ? `inset 0 0 0 1.5px ${accent}, 4px 5px 10px rgba(102,109,122,0.2)`
                    : "4px 5px 10px rgba(102,109,122,0.18)",
                }}
              >
                <button
                  type="button"
                  onClick={() => selectFarm(farm.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:scale-[0.99]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${accent}22` }}
                  >
                    <Sprout size={20} color={accent} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[14px] font-bold"
                      style={{ color: kronis.ink }}
                    >
                      {farm.name}
                    </span>
                    <span
                      className="block text-[11px] font-medium"
                      style={{ color: kronis.inkMuted }}
                    >
                      {farm.crop} · {farm.acres.toFixed(2)} ac
                      {assigned.length ? ` · ${assigned.length} pump` : ""}
                    </span>
                  </span>
                  {active && !collectMode ? (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: accent }}
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        boxShadow: "inset 0 0 0 1.5px rgba(102,109,122,0.35)",
                        background: "#eef1f5",
                      }}
                    />
                  )}
                </button>
                {!collectMode ? (
                  <>
                    <span className="flex items-center -space-x-1.5">
                      {assigned.slice(0, 3).map((pid) => {
                        const meta = dummyPumps.find((p) => p.id === pid);
                        return (
                          <span
                            key={pid}
                            className="relative flex h-8 w-8 items-center justify-center overflow-hidden"
                          >
                            <PumpMapMarker
                              number={meta?.number ?? 1}
                              selected={false}
                              compact
                            />
                          </span>
                        );
                      })}
                    </span>
                    <SoftChip
                      icon={Plus}
                      size={36}
                      onClick={() => openAssignPicker(farm.id)}
                      label={`Assign pump to ${farm.name}`}
                      color={kronis.lime}
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex gap-2.5 px-3.5 pb-3">
        {!collectMode ? (
          aiDetecting ? (
            <SoftButton
              label="Kronis AI detecting…"
              variant="orange"
              className="flex-1 opacity-90"
            />
          ) : !confirmed ? (
            <SoftButton
              label="Confirm"
              variant="orange"
              className="flex-1"
              onClick={handleConfirm}
            />
          ) : (
            <>
              <SoftButton
                label="Adjust"
                variant="soft"
                className="flex-1"
                onClick={() => {
                  clearAiTimers();
                  setAiDetecting(false);
                  setAiStep(0);
                  setConfirmed(false);
                  setFarms([]);
                  setSelectedFarmId(null);
                  setGeofenceIds([]);
                  setGeofenceStatus("idle");
                  syncFarmFeatures([], null, false, []);
                  farmsDirtyRef.current = false;
                }}
              />
              <SoftButton
                label={
                  geofenceStatus === "saving"
                    ? "Saving…"
                    : geofenceIds.length
                      ? `Done · ${geofenceIds.length}`
                      : "Done"
                }
                variant="orange"
                className="flex-[1.4]"
                onClick={async () => {
                  const ok = await saveGeofences();
                  if (ok) router.push("/home");
                }}
              />
            </>
          )
        ) : !confirmed ? (
          <>
            <SoftButton
              label="Draw"
              variant="soft"
              className="flex-1"
              onClick={startDrawAtRadius}
            />
            <SoftButton
              label="Edit"
              variant="soft"
              className="flex-1"
              onClick={() => setEditing(true)}
            />
            <SoftButton
              label="Confirm"
              variant="orange"
              className="flex-1"
              onClick={handleConfirm}
            />
          </>
        ) : (
          <>
            {drawingFarms ? (
              <>
                <SoftButton
                  label="Undo"
                  variant="soft"
                  className="flex-1"
                  onClick={undoLastDrawn}
                />
                <SoftButton
                  label="Cancel"
                  variant="soft"
                  className="flex-1"
                  onClick={cancelFarmEdit}
                />
                <SoftButton
                  label={
                    saveStatus === "saving"
                      ? "Saving…"
                      : saveStatus === "error"
                        ? "Retry"
                        : farms.length === 0
                          ? "Draw first"
                          : "Save JSON"
                  }
                  variant="orange"
                  className="flex-[1.3]"
                  onClick={saveFarmsToJson}
                />
              </>
            ) : editingFarms ? (
              <>
                <SoftButton
                  label="Delete"
                  variant="soft"
                  className="flex-1"
                  onClick={deleteSelectedFarm}
                />
                <SoftButton
                  label="Cancel"
                  variant="soft"
                  className="flex-1"
                  onClick={cancelFarmEdit}
                />
                <SoftButton
                  label={
                    saveStatus === "saving"
                      ? "Saving…"
                      : saveStatus === "error"
                        ? "Retry save"
                        : "Save JSON"
                  }
                  variant="orange"
                  className="flex-[1.4]"
                  onClick={saveFarmsToJson}
                />
              </>
            ) : (
              <>
                <SoftButton
                  label="Modify"
                  variant="soft"
                  className="flex-1"
                  onClick={startFarmEdit}
                />
                <SoftButton
                  label="Draw more"
                  variant="soft"
                  className="flex-1"
                  onClick={startManualDraw}
                />
                <SoftButton
                  label={
                    saveStatus === "saving"
                      ? "Saving…"
                      : saveStatus === "saved"
                        ? "Saved ✓"
                        : saveStatus === "error"
                          ? "Retry save"
                          : "Save JSON"
                  }
                  variant="orange"
                  className="flex-[1.2]"
                  onClick={saveFarmsToJson}
                />
              </>
            )}
          </>
        )}
      </div>
      {collectMode && confirmed && !drawingFarms && !editingFarms ? (
        <button
          type="button"
          onClick={startRedrawAll}
          className="mb-1 px-4 text-center text-[11px] font-semibold underline"
          style={{ color: kronis.inkMuted }}
        >
          Clear all & redraw from scratch
        </button>
      ) : null}
      {collectMode ? (
        <p className="px-4 pb-4 text-center text-[11px]" style={{ color: kronis.inkMuted }}>
          {saveStatus === "saved"
            ? `Saved ${farms.length} fields @ ${radiusAcres.toFixed(2)} ac · other radii kept`
            : confirmed
              ? editingFarms
                ? "Drag corners to fix a field · Save JSON when done"
                : drawingFarms
                  ? `Drawing @ ${radiusAcres.toFixed(2)} ac · then Save JSON (keeps other radii)`
                  : farms.length
                    ? `${farms.length} fields @ ${radiusAcres.toFixed(2)} ac · change slider for another radius`
                    : `No fields @ ${radiusAcres.toFixed(2)} ac yet · tap Draw`
              : `Pick radius → Draw → Save · repeat for each radius`}
        </p>
      ) : (
        <div className="pb-4" />
      )}

      {/* Native-style: Pump in {field} multi-assign sheet */}
      {assignFieldId && !collectMode ? (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close assign"
            onClick={cancelAssignPicker}
          />
          <div
            className="relative flex max-h-[72%] flex-col rounded-t-[28px] px-4 pb-5 pt-3"
            style={{ background: kronis.background }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#c5ccd6]" />
            <div className="mb-1 flex items-start justify-between gap-2">
              <div>
                <div
                  className="text-[17px] font-extrabold"
                  style={{ color: kronis.ink }}
                >
                  Pump in {assignField?.name || "field"}
                </div>
                <div className="text-[11px] font-medium" style={{ color: kronis.inkMuted }}>
                  Changes show on the map — tap Done to save
                </div>
              </div>
              <SoftChip icon={X} size={36} onClick={cancelAssignPicker} label="Close" />
            </div>
            <div className="no-scrollbar mb-3 max-h-[240px] space-y-2 overflow-y-auto">
              {dummyPumps.map((p) => {
                const checked = assignSelectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleAssignPump(p.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:scale-[0.99]"
                    style={{
                      borderRadius: 16,
                      background: "linear-gradient(145deg, #f1f2f3, #e4e7ec)",
                      boxShadow: checked
                        ? `inset 0 0 0 1.5px ${kronis.lime}, 4px 5px 10px rgba(102,109,122,0.18)`
                        : "4px 5px 10px rgba(102,109,122,0.16)",
                    }}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
                      <PumpMapMarker
                        number={p.number}
                        selected={checked}
                        compact
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-bold"
                        style={{ color: kronis.ink }}
                      >
                        {p.model}
                      </span>
                      <span
                        className="mt-0.5 block text-[11px] font-semibold"
                        style={{ color: kronis.inkMuted }}
                      >
                        {p.serial}
                      </span>
                    </span>
                    {checked ? (
                      <Check size={20} color={kronis.ink} strokeWidth={2.5} />
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                  </button>
                );
              })}
            </div>
            <label
              className="mb-3 flex items-center justify-between gap-3 px-1"
              style={{ color: kronis.ink }}
            >
              <span className="text-[13px] font-semibold">
                Stop pump if it leaves field
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={stopIfLeaves}
                onClick={() => setStopIfLeaves((v) => !v)}
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
                style={{
                  background: stopIfLeaves ? kronis.lime : "#c5ccd6",
                }}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                  style={{ left: stopIfLeaves ? 22 : 2 }}
                />
              </button>
            </label>
            <SoftButton
              label={
                assignSaving
                  ? "Saving…"
                  : assignSelectedIds.length
                    ? `Done · ${assignSelectedIds.length}`
                    : "Done"
              }
              variant="orange"
              className="w-full"
              onClick={applyAssignSheet}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
