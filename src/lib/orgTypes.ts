export type OrgSensorType = "soil" | "weather" | "environment";

export type OrgReading = {
  at: string;
  soilPct: number | null;
  tempC: number | null;
  humidityPct: number | null;
  rainMm?: number | null;
};

export type OrgFarmer = {
  id: string;
  name: string;
  phone: string;
  village: string;
  farmName: string;
  lat?: number;
  lng?: number;
  createdAt: string;
};

export type OrgPump = {
  id: string;
  model: string;
  serial: string;
  farmerId: string | null;
  online: boolean;
  /** Purchase / warehouse cost (INR) */
  unitCost?: number;
  /** List / sell price (INR) */
  unitPrice?: number;
  createdAt: string;
};

export type OrgSensorPower = "battery" | "solar" | "wired";

export type OrgSensor = {
  id: string;
  type: OrgSensorType;
  label: string;
  farmerId: string | null;
  /** Asset / unit tag shown in lists */
  unitId: string;
  model: string;
  modelNo: string;
  serial: string;
  firmware: string;
  installLocation: string;
  powerSource: OrgSensorPower;
  notes: string;
  /** Purchase / warehouse cost (INR) */
  unitCost: number;
  /** List / sell price (INR) */
  unitPrice: number;
  currency?: "INR";
  /** Map pin — active field placement */
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  readings: OrgReading[];
};

export type OrgInventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: "sensor" | "pump" | "accessory";
  modelNo: string;
  unitCost: number;
  unitPrice: number;
  /** Units sitting in warehouse / org stock */
  stockQty: number;
  currency: "INR";
};

export type OrgShare = {
  id: string;
  token: string;
  farmerId: string;
  sensorIds: string[];
  label: string;
  createdAt: string;
  expiresAt: string | null;
};

export type Organization = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  onboardedAt: string;
};

export type OrgDemoFile = {
  organization: Organization;
  farmers: OrgFarmer[];
  pumps: OrgPump[];
  sensors: OrgSensor[];
  shares: OrgShare[];
  inventory?: OrgInventoryItem[];
};
