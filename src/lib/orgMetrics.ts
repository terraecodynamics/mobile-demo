import type {
  OrgDemoFile,
  OrgInventoryItem,
  OrgSensor,
} from "@/lib/orgTypes";
import { placeNameFromLocation } from "@/lib/orgLocations";

export type OrgInventoryLive = OrgInventoryItem & {
  deployed: number;
  inStock: number;
  owned: number;
  stockValue: number;
  retailValue: number;
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

export function buildInventoryLive(file: OrgDemoFile): OrgInventoryLive[] {
  const inventory = file.inventory ?? [];
  return inventory.map((item) => {
    if (item.category === "sensor") {
      const matched = file.sensors.filter((s) => matchSensorSku(s, item));
      const deployed = matched.filter((s) => s.farmerId).length;
      const inStock = matched.filter((s) => !s.farmerId).length;
      const owned = matched.length;
      return {
        ...item,
        /** Keep catalog field aligned with live warehouse count */
        stockQty: inStock,
        deployed,
        inStock,
        owned,
        stockValue: inStock * item.unitCost,
        retailValue: inStock * item.unitPrice,
      };
    }

    if (item.category === "pump") {
      const matched = file.pumps.filter((p) => matchPumpSku(p.model, item));
      const deployed = matched.filter((p) => p.farmerId).length;
      const inStock = matched.filter((p) => !p.farmerId).length;
      const owned = matched.length;
      return {
        ...item,
        stockQty: inStock,
        deployed,
        inStock,
        owned,
        stockValue: inStock * item.unitCost,
        retailValue: inStock * item.unitPrice,
      };
    }

    // Accessories stay catalog-driven
    return {
      ...item,
      deployed: 0,
      inStock: item.stockQty,
      owned: item.stockQty,
      stockValue: item.stockQty * item.unitCost,
      retailValue: item.stockQty * item.unitPrice,
    };
  });
}

export function buildOrgSummary(file: OrgDemoFile): OrgSummary {
  const inventory = buildInventoryLive(file);
  const deviceInventory = inventory.filter((i) => i.category !== "accessory");
  const unassignedSensors = file.sensors.filter((s) => !s.farmerId).length;
  const assignedSensors = file.sensors.length - unassignedSensors;
  return {
    farmers: file.farmers.length,
    pumps: file.pumps.length,
    sensors: file.sensors.length,
    assignedSensors,
    unassignedSensors,
    unassignedPumps: file.pumps.filter((p) => !p.farmerId).length,
    shares: file.shares.length,
    inventorySkus: inventory.length,
    // Device warehouse only (sensors + pumps) so finance matches modules
    inventoryStockUnits: deviceInventory.reduce((n, i) => n + i.inStock, 0),
    inventoryStockValue: deviceInventory.reduce((n, i) => n + i.stockValue, 0),
    inventoryRetailValue: deviceInventory.reduce((n, i) => n + i.retailValue, 0),
    inventoryMarginPotential: deviceInventory.reduce(
      (n, i) => n + (i.unitPrice - i.unitCost) * i.inStock,
      0
    ),
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
