import type {
  OrgDemoFile,
  OrgInventoryItem,
  OrgSensor,
} from "@/lib/orgTypes";
import { placeNameFromLocation } from "@/lib/orgLocations";
import { defaultPumpPrices, defaultSensorPrices } from "@/lib/orgPricing";

export type OrgInventoryLive = OrgInventoryItem & {
  deployed: number;
  inStock: number;
  owned: number;
  stockValue: number;
  retailValue: number;
  /** Average onboarded unit cost for devices in this SKU */
  avgUnitCost: number;
  avgUnitPrice: number;
};

export type OrgSummary = {
  farmers: number;
  pumps: number;
  sensors: number;
  assignedSensors: number;
  unassignedSensors: number;
  unassignedPumps: number;
  shares: number;
  inventorySkus: number;
  /** Live warehouse units (unassigned devices + accessory stock) */
  inventoryStockUnits: number;
  inventoryStockValue: number;
  inventoryRetailValue: number;
  inventoryMarginPotential: number;
};

function matchSensorSku(sensor: OrgSensor, item: OrgInventoryItem) {
  if (item.category !== "sensor") return false;
  const modelNo = (sensor.modelNo || "").toUpperCase();
  const sku = (item.modelNo || item.sku || "").toUpperCase();
  if (modelNo && sku && modelNo === sku) return true;
  return Boolean(sensor.model && item.name && sensor.model === item.name);
}

function matchPumpSku(model: string, item: OrgInventoryItem) {
  if (item.category !== "pump") return false;
  const m = model.toLowerCase();
  const name = item.name.toLowerCase();
  const sku = item.sku.toLowerCase();
  if (m.includes("pro") && (name.includes("pro") || sku.includes("4p"))) return true;
  if ((m.includes("4i") || m.endsWith("4i")) && (sku.includes("4i") || name.includes("4i"))) return true;
  if (!m.includes("pro") && !m.includes("4i") && (sku === "kr-4" || name === "kronis 4 pump")) return true;
  return m === name || m.includes(item.modelNo.toLowerCase());
}

function sensorCost(s: OrgSensor) {
  if (typeof s.unitCost === "number" && Number.isFinite(s.unitCost)) return s.unitCost;
  return defaultSensorPrices({ type: s.type, modelNo: s.modelNo }).unitCost;
}

function sensorPrice(s: OrgSensor) {
  if (typeof s.unitPrice === "number" && Number.isFinite(s.unitPrice)) return s.unitPrice;
  return defaultSensorPrices({ type: s.type, modelNo: s.modelNo }).unitPrice;
}

export function buildInventoryLive(file: OrgDemoFile): OrgInventoryLive[] {
  const inventory = file.inventory ?? [];
  return inventory.map((item) => {
    if (item.category === "sensor") {
      const matched = file.sensors.filter((s) => matchSensorSku(s, item));
      const stockUnits = matched.filter((s) => !s.farmerId);
      const deployed = matched.filter((s) => s.farmerId).length;
      const inStock = stockUnits.length;
      const owned = matched.length;
      const stockValue = stockUnits.reduce((n, s) => n + sensorCost(s), 0);
      const retailValue = stockUnits.reduce((n, s) => n + sensorPrice(s), 0);
      const avgUnitCost =
        owned > 0
          ? Math.round(matched.reduce((n, s) => n + sensorCost(s), 0) / owned)
          : item.unitCost;
      const avgUnitPrice =
        owned > 0
          ? Math.round(matched.reduce((n, s) => n + sensorPrice(s), 0) / owned)
          : item.unitPrice;
      return {
        ...item,
        unitCost: avgUnitCost,
        unitPrice: avgUnitPrice,
        stockQty: inStock,
        deployed,
        inStock,
        owned,
        stockValue,
        retailValue,
        avgUnitCost,
        avgUnitPrice,
      };
    }

    if (item.category === "pump") {
      const matched = file.pumps.filter((p) => matchPumpSku(p.model, item));
      const stockUnits = matched.filter((p) => !p.farmerId);
      const deployed = matched.filter((p) => p.farmerId).length;
      const inStock = stockUnits.length;
      const owned = matched.length;
      const priced = matched.map((p) => {
        const d = defaultPumpPrices(p.model);
        return {
          unitCost: typeof p.unitCost === "number" ? p.unitCost : d.unitCost,
          unitPrice: typeof p.unitPrice === "number" ? p.unitPrice : d.unitPrice,
        };
      });
      const stockPriced = matched
        .map((p, i) => ({ p, price: priced[i] }))
        .filter(({ p }) => !p.farmerId);
      const stockValue = stockPriced.reduce((n, x) => n + x.price.unitCost, 0);
      const retailValue = stockPriced.reduce((n, x) => n + x.price.unitPrice, 0);
      const avgUnitCost =
        owned > 0 ? Math.round(priced.reduce((n, x) => n + x.unitCost, 0) / owned) : item.unitCost;
      const avgUnitPrice =
        owned > 0 ? Math.round(priced.reduce((n, x) => n + x.unitPrice, 0) / owned) : item.unitPrice;
      return {
        ...item,
        unitCost: avgUnitCost,
        unitPrice: avgUnitPrice,
        stockQty: inStock,
        deployed,
        inStock,
        owned,
        stockValue,
        retailValue,
        avgUnitCost,
        avgUnitPrice,
      };
    }

    return {
      ...item,
      deployed: 0,
      inStock: item.stockQty,
      owned: item.stockQty,
      stockValue: item.stockQty * item.unitCost,
      retailValue: item.stockQty * item.unitPrice,
      avgUnitCost: item.unitCost,
      avgUnitPrice: item.unitPrice,
    };
  });
}

export function buildOrgSummary(file: OrgDemoFile): OrgSummary {
  const inventory = buildInventoryLive(file);
  const deviceInventory = inventory.filter((i) => i.category !== "accessory");
  const unassignedSensors = file.sensors.filter((s) => !s.farmerId).length;
  const assignedSensors = file.sensors.length - unassignedSensors;

  // Prefer summing live device prices for sensors + inventory rows for pumps/accessories mix
  const sensorStockValue = file.sensors
    .filter((s) => !s.farmerId)
    .reduce((n, s) => n + sensorCost(s), 0);
  const sensorRetailValue = file.sensors
    .filter((s) => !s.farmerId)
    .reduce((n, s) => n + sensorPrice(s), 0);
  const pumpRows = deviceInventory.filter((i) => i.category === "pump");
  const pumpStockValue = pumpRows.reduce((n, i) => n + i.stockValue, 0);
  const pumpRetailValue = pumpRows.reduce((n, i) => n + i.retailValue, 0);

  return {
    farmers: file.farmers.length,
    pumps: file.pumps.length,
    sensors: file.sensors.length,
    assignedSensors,
    unassignedSensors,
    unassignedPumps: file.pumps.filter((p) => !p.farmerId).length,
    shares: file.shares.length,
    inventorySkus: inventory.length,
    inventoryStockUnits: deviceInventory.reduce((n, i) => n + i.inStock, 0),
    inventoryStockValue: sensorStockValue + pumpStockValue,
    inventoryRetailValue: sensorRetailValue + pumpRetailValue,
    inventoryMarginPotential:
      sensorRetailValue + pumpRetailValue - (sensorStockValue + pumpStockValue),
  };
}

export function sensorCountsByFarmer(sensors: OrgSensor[]) {
  const map = new Map<string, number>();
  for (const s of sensors) {
    if (!s.farmerId) continue;
    map.set(s.farmerId, (map.get(s.farmerId) ?? 0) + 1);
  }
  return map;
}

export function locationUsage(file: OrgDemoFile) {
  const farmersById = new Map(file.farmers.map((f) => [f.id, f]));
  const locationCounts = new Map<string, number>();
  for (const s of file.sensors) {
    if (!s.farmerId) continue;
    const farmer = farmersById.get(s.farmerId);
    const place = placeNameFromLocation(s.installLocation, farmer?.village || "");
    if (!place) continue;
    locationCounts.set(place, (locationCounts.get(place) ?? 0) + 1);
  }
  return [...locationCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}
