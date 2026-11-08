import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  OrgDemoFile,
  OrgFarmer,
  OrgPump,
  OrgSensor,
  OrgShare,
} from "@/lib/orgTypes";
import { resolveSensorCoords } from "@/lib/orgLocations";
import { buildInventoryLive, buildOrgSummary } from "@/lib/orgMetrics";
import { defaultSensorPrices } from "@/lib/orgPricing";

const FILE = path.join(process.cwd(), "src/data/org-demo.json");

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shareToken() {
  return `share-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readOrgFile(): Promise<OrgDemoFile> {
  const raw = await fs.readFile(FILE, "utf8");
  const file = JSON.parse(raw) as OrgDemoFile;
  file.sensors = (file.sensors ?? []).map((s) => normalizeSensor(s));
  return file;
}

export async function writeOrgFile(file: OrgDemoFile): Promise<void> {
  await fs.writeFile(FILE, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

export async function listFarmers() {
  const file = await readOrgFile();
  return file.farmers;
}

export async function getFarmerBundle(farmerId: string) {
  const file = await readOrgFile();
  const farmer = file.farmers.find((f) => f.id === farmerId);
  if (!farmer) return null;
  const pumps = file.pumps.filter((p) => p.farmerId === farmerId);
  const sensors = file.sensors.filter((s) => s.farmerId === farmerId);
  const shares = file.shares.filter((s) => s.farmerId === farmerId);
  return { organization: file.organization, farmer, pumps, sensors, shares };
}

export async function addFarmer(input: {
  name: string;
  phone: string;
  village: string;
  farmName: string;
}) {
  const file = await readOrgFile();
  const farmer: OrgFarmer = {
    id: uid("farmer"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    village: input.village.trim() || "—",
    farmName: input.farmName.trim() || `${input.name.trim()} Farm`,
    createdAt: new Date().toISOString(),
  };
  file.farmers.unshift(farmer);
  await writeOrgFile(file);
  return farmer;
}

export async function addPump(input: {
  model: string;
  serial: string;
  farmerId?: string | null;
}) {
  const file = await readOrgFile();
  if (input.farmerId && !file.farmers.some((f) => f.id === input.farmerId)) {
    throw new Error("Farmer not found");
  }
  const pump: OrgPump = {
    id: uid("op"),
    model: input.model.trim() || "Kronis 4",
    serial: input.serial.trim().toUpperCase(),
    farmerId: input.farmerId ?? null,
    online: true,
    createdAt: new Date().toISOString(),
  };
  file.pumps.unshift(pump);
  await writeOrgFile(file);
  return pump;
}

const SENSOR_MODELS: Record<OrgSensor["type"], string> = {
  soil: "Kronis Sense Soil",
  weather: "Kronis Sense Weather",
  environment: "Kronis Sense Env",
};

function normalizeSensor(sensor: OrgSensor): OrgSensor {
  const installLocation = sensor.installLocation || "";
  const resolved = resolveSensorCoords({
    lat: sensor.lat,
    lng: sensor.lng,
    installLocation,
  });
  const defaults = defaultSensorPrices({
    type: sensor.type,
    modelNo: sensor.modelNo,
  });
  return {
    ...sensor,
    model: sensor.model || SENSOR_MODELS[sensor.type] || "Kronis Sense",
    modelNo: sensor.modelNo || "",
    serial: sensor.serial || sensor.unitId || "",
    firmware: sensor.firmware || "1.0.0",
    installLocation,
    powerSource: sensor.powerSource || "battery",
    notes: sensor.notes || "",
    unitCost:
      typeof sensor.unitCost === "number" && Number.isFinite(sensor.unitCost)
        ? sensor.unitCost
        : defaults.unitCost,
    unitPrice:
      typeof sensor.unitPrice === "number" && Number.isFinite(sensor.unitPrice)
        ? sensor.unitPrice
        : defaults.unitPrice,
    currency: "INR",
    lat: resolved?.lat ?? sensor.lat ?? null,
    lng: resolved?.lng ?? sensor.lng ?? null,
  };
}

export async function addSensor(input: {
  type: OrgSensor["type"];
  label: string;
  unitId: string;
  model?: string;
  modelNo?: string;
  serial?: string;
  firmware?: string;
  installLocation?: string;
  powerSource?: OrgSensor["powerSource"];
  notes?: string;
  unitCost?: number;
  unitPrice?: number;
  farmerId?: string | null;
}) {
  const file = await readOrgFile();
  if (input.farmerId && !file.farmers.some((f) => f.id === input.farmerId)) {
    throw new Error("Farmer not found");
  }
  const serial = (input.serial || input.unitId).trim().toUpperCase();
  const unitId = (input.unitId || serial).trim().toUpperCase();
  const installLocation = (input.installLocation || "").trim();
  const modelNo = (input.modelNo || "").trim().toUpperCase();
  const resolved = resolveSensorCoords({ installLocation });
  const catalog = (file.inventory ?? []).find(
    (i) => i.category === "sensor" && (i.modelNo || i.sku).toUpperCase() === modelNo
  );
  const defaults = defaultSensorPrices({ type: input.type, modelNo });
  const unitCost =
    typeof input.unitCost === "number" && Number.isFinite(input.unitCost)
      ? input.unitCost
      : catalog?.unitCost ?? defaults.unitCost;
  const unitPrice =
    typeof input.unitPrice === "number" && Number.isFinite(input.unitPrice)
      ? input.unitPrice
      : catalog?.unitPrice ?? defaults.unitPrice;
  if (unitCost < 0 || unitPrice < 0) {
    throw new Error("Prices must be zero or positive");
  }
  const sensor: OrgSensor = normalizeSensor({
    id: uid("os"),
    type: input.type,
    label: input.label.trim(),
    unitId,
    model: (input.model || SENSOR_MODELS[input.type]).trim(),
    modelNo,
    serial,
    firmware: (input.firmware || "1.0.0").trim(),
    installLocation,
    powerSource: input.powerSource || "battery",
    notes: (input.notes || "").trim(),
    unitCost,
    unitPrice,
    currency: "INR",
    farmerId: input.farmerId ?? null,
    lat: resolved?.lat ?? null,
    lng: resolved?.lng ?? null,
    createdAt: new Date().toISOString(),
    readings: [
      {
        at: new Date().toISOString(),
        soilPct: input.type === "soil" ? 40 : null,
        tempC: 28,
        humidityPct: 60,
        rainMm: input.type === "weather" ? 0 : null,
      },
    ],
  });
  file.sensors.unshift(sensor);
  await writeOrgFile(file);
  return sensor;
}

export async function assignDevice(input: {
  kind: "pump" | "sensor";
  deviceId: string;
  farmerId: string | null;
}) {
  const file = await readOrgFile();
  if (input.farmerId && !file.farmers.some((f) => f.id === input.farmerId)) {
    throw new Error("Farmer not found");
  }
  if (input.kind === "pump") {
    const pump = file.pumps.find((p) => p.id === input.deviceId);
    if (!pump) throw new Error("Pump not found");
    pump.farmerId = input.farmerId;
  } else {
    const sensor = file.sensors.find((s) => s.id === input.deviceId);
    if (!sensor) throw new Error("Sensor not found");
    sensor.farmerId = input.farmerId;
  }
  await writeOrgFile(file);
  return file;
}

export async function createShare(input: {
  farmerId: string;
  sensorIds: string[];
  label?: string;
}) {
  const file = await readOrgFile();
  const farmer = file.farmers.find((f) => f.id === input.farmerId);
  if (!farmer) throw new Error("Farmer not found");
  const owned = new Set(
    file.sensors.filter((s) => s.farmerId === input.farmerId).map((s) => s.id)
  );
  const sensorIds = input.sensorIds.filter((id) => owned.has(id));
  if (!sensorIds.length) throw new Error("Pick at least one sensor for this farmer");

  const share: OrgShare = {
    id: uid("share"),
    token: shareToken(),
    farmerId: input.farmerId,
    sensorIds,
    label: input.label?.trim() || `${farmer.name} sensors`,
    createdAt: new Date().toISOString(),
    expiresAt: null,
  };
  file.shares.unshift(share);
  await writeOrgFile(file);
  return share;
}

export async function getSensorPayload(opts: {
  farmerId?: string | null;
  token?: string | null;
  sensorId?: string | null;
}) {
  const file = await readOrgFile();

  if (opts.token) {
    const share = file.shares.find((s) => s.token === opts.token);
    if (!share) return { error: "Invalid share token", status: 404 as const };
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      return { error: "Share link expired", status: 410 as const };
    }
    const farmer = file.farmers.find((f) => f.id === share.farmerId);
    const sensors = file.sensors.filter((s) => share.sensorIds.includes(s.id));
    return {
      status: 200 as const,
      data: {
        source: "share" as const,
        share: {
          token: share.token,
          label: share.label,
          createdAt: share.createdAt,
        },
        organization: {
          id: file.organization.id,
          name: file.organization.name,
        },
        farmer: farmer
          ? {
              id: farmer.id,
              name: farmer.name,
              village: farmer.village,
              farmName: farmer.farmName,
            }
          : null,
        sensors: sensors.map(publicSensor),
      },
    };
  }

  if (opts.farmerId) {
    const farmer = file.farmers.find((f) => f.id === opts.farmerId);
    if (!farmer) return { error: "Farmer not found", status: 404 as const };
    const sensors = file.sensors.filter((s) => {
      if (s.farmerId !== opts.farmerId) return false;
      if (opts.sensorId) return s.id === opts.sensorId;
      return true;
    });
    return {
      status: 200 as const,
      data: {
        source: "farmer" as const,
        organization: {
          id: file.organization.id,
          name: file.organization.name,
        },
        farmer: {
          id: farmer.id,
          name: farmer.name,
          village: farmer.village,
          farmName: farmer.farmName,
          phone: farmer.phone,
        },
        sensors: sensors.map(publicSensor),
      },
    };
  }

  return {
    status: 200 as const,
    data: {
      source: "organization" as const,
      organization: file.organization,
      farmers: file.farmers,
      pumps: file.pumps,
      sensors: file.sensors.map(publicSensor),
      shares: file.shares,
      inventory: buildInventoryLive(file),
      summary: buildOrgSummary(file),
    },
  };
}

function publicSensor(sensor: OrgSensor) {
  const s = normalizeSensor(sensor);
  const latest = s.readings[0] ?? null;
  return {
    id: s.id,
    type: s.type,
    label: s.label,
    unitId: s.unitId,
    model: s.model,
    modelNo: s.modelNo,
    serial: s.serial,
    firmware: s.firmware,
    installLocation: s.installLocation,
    powerSource: s.powerSource,
    notes: s.notes,
    unitCost: s.unitCost,
    unitPrice: s.unitPrice,
    currency: s.currency ?? "INR",
    farmerId: s.farmerId,
    lat: s.lat,
    lng: s.lng,
    latest,
    readings: s.readings,
  };
}
