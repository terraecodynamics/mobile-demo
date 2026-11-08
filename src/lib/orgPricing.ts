import type { OrgSensor } from "@/lib/orgTypes";

/** Default INR catalog prices by model number / type */
export const SENSOR_PRICE_DEFAULTS: Record<
  string,
  { unitCost: number; unitPrice: number }
> = {
  "KS-S-100": { unitCost: 4200, unitPrice: 6500 },
  "KS-W-200": { unitCost: 7800, unitPrice: 11900 },
  "KS-E-310": { unitCost: 5600, unitPrice: 8900 },
  soil: { unitCost: 4200, unitPrice: 6500 },
  weather: { unitCost: 7800, unitPrice: 11900 },
  environment: { unitCost: 5600, unitPrice: 8900 },
};

export function defaultSensorPrices(input: {
  type?: OrgSensor["type"];
  modelNo?: string;
}) {
  const byModel = input.modelNo
    ? SENSOR_PRICE_DEFAULTS[input.modelNo.trim().toUpperCase()]
    : null;
  if (byModel) return byModel;
  if (input.type && SENSOR_PRICE_DEFAULTS[input.type]) {
    return SENSOR_PRICE_DEFAULTS[input.type];
  }
  return { unitCost: 5000, unitPrice: 8000 };
}

export function defaultPumpPrices(model: string) {
  const m = model.toLowerCase();
  if (m.includes("pro")) return { unitCost: 24200, unitPrice: 31900 };
  if (m.includes("4i")) return { unitCost: 21000, unitPrice: 27900 };
  return { unitCost: 18500, unitPrice: 24900 };
}
