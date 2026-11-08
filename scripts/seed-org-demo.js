const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "../src/data/org-demo.json");

const SITES = {
  Sakhigopal: { lat: 19.9464, lng: 85.8138 },
  Satyabadi: { lat: 19.952, lng: 85.825 },
  Pipili: { lat: 20.12, lng: 85.83 },
  Nimapada: { lat: 20.07, lng: 86.02 },
  Delanga: { lat: 20.083, lng: 85.783 },
  Kakatpur: { lat: 19.983, lng: 86.2 },
  Konark: { lat: 19.8878, lng: 86.0945 },
  Puri: { lat: 19.8135, lng: 85.8312 },
  Chandanpur: { lat: 19.875, lng: 85.862 },
  Brahmagiri: { lat: 19.796, lng: 85.645 },
  Gop: { lat: 19.982, lng: 86.005 },
  Astaranga: { lat: 19.98, lng: 86.27 },
};

const farmers = [
  ["farmer-1", "Ravi Kumar", "+91 98765 11111", "Satyabadi", "Ravi Fields", "2026-09-05T08:00:00.000Z"],
  ["farmer-2", "Anita Patel", "+91 98765 22222", "Pipili", "Patel Farm", "2026-09-12T09:30:00.000Z"],
  ["farmer-3", "Bikash Mohanty", "+91 98765 33333", "Nimapada", "Mohanty Orchard", "2026-09-20T10:00:00.000Z"],
  ["farmer-4", "Sita Jena", "+91 98765 44444", "Konark", "Jena Coastal Farm", "2026-09-28T11:00:00.000Z"],
  ["farmer-5", "Pradeep Das", "+91 98765 55555", "Delanga", "Das Paddy Co-op", "2026-10-02T08:00:00.000Z"],
  ["farmer-6", "Mamata Sahu", "+91 98765 66666", "Kakatpur", "Sahu Coastal Plots", "2026-10-05T09:00:00.000Z"],
  ["farmer-7", "Hari Behera", "+91 98765 77777", "Chandanpur", "Behera Fields", "2026-10-08T10:00:00.000Z"],
  ["farmer-8", "Laxmi Nayak", "+91 98765 88888", "Brahmagiri", "Nayak Wetlands", "2026-10-12T11:00:00.000Z"],
  ["farmer-9", "Suresh Pradhan", "+91 98765 99999", "Gop", "Pradhan Farm", "2026-10-15T08:30:00.000Z"],
  ["farmer-10", "Kabita Rout", "+91 98765 10101", "Astaranga", "Rout Fishery Farm", "2026-10-18T09:15:00.000Z"],
  ["farmer-11", "Niranjan Mishra", "+91 98765 12121", "Puri", "Mishra Backyard Farm", "2026-10-22T10:00:00.000Z"],
  ["farmer-12", "Geeta Swain", "+91 98765 13131", "Sakhigopal", "Swain Temple Fields", "2026-10-25T11:20:00.000Z"],
].map(([id, name, phone, village, farmName, createdAt]) => ({
  id,
  name,
  phone,
  village,
  farmName,
  createdAt,
  lat: SITES[village].lat,
  lng: SITES[village].lng,
}));

function hoursBack(h) {
  const d = new Date("2026-11-08T05:00:00.000Z");
  d.setUTCHours(d.getUTCHours() - h);
  return d.toISOString();
}

/** Newest-first continuous series for share / dashboard trends */
function soilReading(base = 40) {
  const rows = [];
  for (let h = 0; h < 12; h++) {
    const wobble = Math.sin(h / 2.2) * 2.4 + (h % 3) * 0.4;
    rows.push({
      at: hoursBack(h),
      soilPct: Math.round((base + wobble) * 10) / 10,
      tempC: Math.round((28.2 - h * 0.18 + (h % 2) * 0.3) * 10) / 10,
      humidityPct: Math.round(56 + h * 0.7 + (h % 4)),
    });
  }
  return rows;
}
function weatherReading(temp = 29) {
  const rows = [];
  for (let h = 0; h < 12; h++) {
    rows.push({
      at: hoursBack(h),
      soilPct: null,
      tempC: Math.round((temp - h * 0.22 + Math.sin(h / 3) * 0.8) * 10) / 10,
      humidityPct: Math.round(58 + h * 0.5 + (h % 3)),
      rainMm: h === 3 || h === 8 ? Math.round((0.4 + h * 0.1) * 10) / 10 : 0,
    });
  }
  return rows;
}
function envReading(temp = 30) {
  const rows = [];
  for (let h = 0; h < 12; h++) {
    rows.push({
      at: hoursBack(h),
      soilPct: null,
      tempC: Math.round((temp - h * 0.15 + Math.cos(h / 2.5) * 0.6) * 10) / 10,
      humidityPct: Math.round(50 + h * 0.6 + (h % 2)),
    });
  }
  return rows;
}

const sensorDefs = [
  ["os-1", "soil", "Soil · Sakhigopal", "farmer-1", "SM-4410", "KS-S-100", "SM-4410-A1", "Sakhigopal · paddy block", "battery", 1.2],
  ["os-2", "weather", "Weather · Satyabadi", "farmer-1", "WX-2201", "KS-W-200", "WX-2201-B2", "Satyabadi · canal bund", "solar", 1.1],
  ["os-3", "soil", "Soil · Pipili", "farmer-2", "SM-4418", "KS-S-100", "SM-4418-C3", "Pipili · vegetable patch", "battery", 1.2],
  ["os-4", "environment", "Env · Nimapada", "farmer-3", "EN-1102", "KS-E-310", "EN-1102-D4", "Nimapada · orchard edge", "wired", 1.0],
  ["os-5", "weather", "Weather · Konark", "farmer-4", "WX-2210", "KS-W-200", "WX-2210-E5", "Konark · coastal field", "solar", 1.1],
  ["os-6", "soil", "Soil · Delanga", "farmer-5", "SM-4422", "KS-S-100", "SM-4422-F6", "Delanga · rice field", "battery", 1.2],
  ["os-7", "soil", "Soil · Kakatpur East", "farmer-6", "SM-4430", "KS-S-100", "SM-4430-G7", "Kakatpur · east plot", "battery", 1.2],
  ["os-8", "weather", "Weather · Chandanpur", "farmer-7", "WX-2215", "KS-W-200", "WX-2215-H8", "Chandanpur · farm hub", "solar", 1.1],
  ["os-9", "soil", "Soil · Brahmagiri", "farmer-8", "SM-4435", "KS-S-100", "SM-4435-I9", "Brahmagiri · wetland", "battery", 1.2],
  ["os-10", "environment", "Env · Gop", "farmer-9", "EN-1110", "KS-E-310", "EN-1110-J1", "Gop · canopy rail", "wired", 1.0],
  ["os-11", "soil", "Soil · Astaranga", "farmer-10", "SM-4440", "KS-S-100", "SM-4440-K2", "Astaranga · creek side", "battery", 1.2],
  ["os-12", "weather", "Weather · Puri", "farmer-11", "WX-2220", "KS-W-200", "WX-2220-L3", "Puri · backyard mast", "solar", 1.1],
  ["os-13", "soil", "Soil · Sakhigopal West", "farmer-12", "SM-4445", "KS-S-100", "SM-4445-M4", "Sakhigopal · west block", "battery", 1.2],
  ["os-14", "environment", "Env · Pipili", "farmer-2", "EN-1115", "KS-E-310", "EN-1115-N5", "Pipili · shade house", "wired", 1.0],
  ["os-15", "soil", "Soil · Nimapada North", "farmer-3", "SM-4450", "KS-S-100", "SM-4450-O6", "Nimapada · north acre", "battery", 1.2],
  ["os-16", "weather", "Weather · Delanga", "farmer-5", "WX-2225", "KS-W-200", "WX-2225-P7", "Delanga · block hub", "solar", 1.1],
  ["os-17", "soil", "Soil · Stock A1", null, "SM-4501", "KS-S-100", "SM-4501-Q1", "Puri · warehouse A", "battery", 1.2],
  ["os-18", "soil", "Soil · Stock A2", null, "SM-4502", "KS-S-100", "SM-4502-Q2", "Puri · warehouse A", "battery", 1.2],
  ["os-19", "soil", "Soil · Stock A3", null, "SM-4503", "KS-S-100", "SM-4503-Q3", "Puri · warehouse A", "battery", 1.2],
  ["os-20", "soil", "Soil · Stock A4", null, "SM-4504", "KS-S-100", "SM-4504-Q4", "Puri · warehouse A", "battery", 1.2],
  ["os-21", "soil", "Soil · Stock A5", null, "SM-4505", "KS-S-100", "SM-4505-Q5", "Puri · warehouse A", "battery", 1.2],
  ["os-22", "soil", "Soil · Stock A6", null, "SM-4506", "KS-S-100", "SM-4506-Q6", "Puri · warehouse B", "battery", 1.2],
  ["os-23", "soil", "Soil · Stock A7", null, "SM-4507", "KS-S-100", "SM-4507-Q7", "Puri · warehouse B", "battery", 1.2],
  ["os-24", "soil", "Soil · Stock A8", null, "SM-4508", "KS-S-100", "SM-4508-Q8", "Puri · warehouse B", "battery", 1.2],
  ["os-25", "weather", "Weather · Stock B1", null, "WX-2301", "KS-W-200", "WX-2301-R1", "Puri · warehouse A", "solar", 1.1],
  ["os-26", "weather", "Weather · Stock B2", null, "WX-2302", "KS-W-200", "WX-2302-R2", "Puri · warehouse A", "solar", 1.1],
  ["os-27", "weather", "Weather · Stock B3", null, "WX-2303", "KS-W-200", "WX-2303-R3", "Puri · warehouse B", "solar", 1.1],
  ["os-28", "weather", "Weather · Stock B4", null, "WX-2304", "KS-W-200", "WX-2304-R4", "Puri · warehouse B", "solar", 1.1],
  ["os-29", "environment", "Env · Stock C1", null, "EN-1201", "KS-E-310", "EN-1201-S1", "Puri · warehouse A", "wired", 1.0],
  ["os-30", "environment", "Env · Stock C2", null, "EN-1202", "KS-E-310", "EN-1202-S2", "Puri · warehouse A", "wired", 1.0],
  ["os-31", "environment", "Env · Stock C3", null, "EN-1203", "KS-E-310", "EN-1203-S3", "Puri · warehouse B", "wired", 1.0],
  ["os-32", "environment", "Env · Stock C4", null, "EN-1204", "KS-E-310", "EN-1204-S4", "Puri · warehouse B", "wired", 1.0],
  ["os-33", "soil", "Soil · Stock A9", null, "SM-4509", "KS-S-100", "SM-4509-Q9", "Chandanpur · staging", "battery", 1.2],
  ["os-34", "soil", "Soil · Stock A10", null, "SM-4510", "KS-S-100", "SM-4510-QA", "Nimapada · staging", "battery", 1.2],
  ["os-35", "weather", "Weather · Stock B5", null, "WX-2305", "KS-W-200", "WX-2305-R5", "Konark · staging", "solar", 1.1],
];

const modelName = {
  "KS-S-100": "Kronis Sense Soil",
  "KS-W-200": "Kronis Sense Weather",
  "KS-E-310": "Kronis Sense Env",
};

const sensors = sensorDefs.map((d, i) => {
  const [id, type, label, farmerId, unitId, modelNo, serial, installLocation, powerSource, fw] = d;
  const place = installLocation.split("·")[0].trim();
  const site = SITES[place] || SITES.Puri;
  const readings =
    type === "soil" ? soilReading(36 + (i % 10)) : type === "weather" ? weatherReading(28 + (i % 4)) : envReading(29 + (i % 3));
  return {
    id,
    type,
    label,
    farmerId,
    unitId,
    createdAt: `2026-09-${String(7 + (i % 20)).padStart(2, "0")}T08:00:00.000Z`,
    readings,
    model: modelName[modelNo],
    modelNo,
    serial,
    firmware: fw === 1.2 ? "1.2.0" : fw === 1.1 ? "1.1.4" : "1.0.8",
    installLocation,
    powerSource,
    notes: farmerId ? "" : "Ready for assignment",
    lat: site.lat,
    lng: site.lng,
  };
});

const pumps = [
  ["op-1", "Kronis 4", "ORG-P-101", "farmer-1", true],
  ["op-2", "Kronis 4 – Pro", "ORG-P-102", "farmer-1", true],
  ["op-3", "Kronis 4", "ORG-P-201", "farmer-2", false],
  ["op-4", "Kronis 4", "ORG-P-301", "farmer-3", true],
  ["op-5", "Kronis 4 – Pro", "ORG-P-302", "farmer-4", true],
  ["op-6", "Kronis 4", "ORG-P-401", "farmer-5", true],
  ["op-7", "Kronis 4i", "ORG-P-402", "farmer-6", false],
  ["op-8", "Kronis 4", "ORG-P-501", "farmer-7", true],
  ["op-9", "Kronis 4", "ORG-P-601", null, true],
  ["op-10", "Kronis 4", "ORG-P-602", null, true],
  ["op-11", "Kronis 4 – Pro", "ORG-P-603", null, true],
  ["op-12", "Kronis 4i", "ORG-P-604", null, true],
  ["op-13", "Kronis 4", "ORG-P-605", null, true],
  ["op-14", "Kronis 4 – Pro", "ORG-P-606", null, true],
].map(([id, model, serial, farmerId, online], i) => ({
  id,
  model,
  serial,
  farmerId,
  online,
  createdAt: `2026-09-${String(6 + (i % 20)).padStart(2, "0")}T10:00:00.000Z`,
}));

const inventory = [
  { id: "inv-1", sku: "KS-S-100", name: "Kronis Sense Soil", category: "sensor", modelNo: "KS-S-100", unitCost: 4200, unitPrice: 6500, stockQty: 0, currency: "INR" },
  { id: "inv-2", sku: "KS-W-200", name: "Kronis Sense Weather", category: "sensor", modelNo: "KS-W-200", unitCost: 7800, unitPrice: 11900, stockQty: 0, currency: "INR" },
  { id: "inv-3", sku: "KS-E-310", name: "Kronis Sense Env", category: "sensor", modelNo: "KS-E-310", unitCost: 5600, unitPrice: 8900, stockQty: 0, currency: "INR" },
  { id: "inv-4", sku: "KR-4", name: "Kronis 4 Pump", category: "pump", modelNo: "KR-4", unitCost: 18500, unitPrice: 24900, stockQty: 0, currency: "INR" },
  { id: "inv-5", sku: "KR-4P", name: "Kronis 4 – Pro", category: "pump", modelNo: "KR-4P", unitCost: 24200, unitPrice: 31900, stockQty: 0, currency: "INR" },
  { id: "inv-6", sku: "KR-4I", name: "Kronis 4i", category: "pump", modelNo: "KR-4I", unitCost: 21000, unitPrice: 27900, stockQty: 0, currency: "INR" },
  { id: "inv-7", sku: "ACC-MOUNT", name: "Pole mount kit", category: "accessory", modelNo: "ACC-MOUNT", unitCost: 450, unitPrice: 890, stockQty: 120, currency: "INR" },
  { id: "inv-8", sku: "ACC-SOLAR", name: "Solar kit 20W", category: "accessory", modelNo: "ACC-SOLAR", unitCost: 1800, unitPrice: 2900, stockQty: 45, currency: "INR" },
];

const shares = [
  { id: "share-1", token: "gv-ravi-soil", farmerId: "farmer-1", sensorIds: ["os-1", "os-2"], label: "Ravi field sensors", createdAt: "2026-10-20T12:00:00.000Z", expiresAt: null },
  { id: "share-2", token: "gv-anita-pipili", farmerId: "farmer-2", sensorIds: ["os-3", "os-14"], label: "Anita Pipili sensors", createdAt: "2026-10-22T12:00:00.000Z", expiresAt: null },
  { id: "share-3", token: "gv-bikash-orchard", farmerId: "farmer-3", sensorIds: ["os-4", "os-15"], label: "Mohanty orchard feed", createdAt: "2026-10-25T09:00:00.000Z", expiresAt: null },
  { id: "share-4", token: "gv-sita-konark", farmerId: "farmer-4", sensorIds: ["os-5"], label: "Konark coastal weather", createdAt: "2026-10-28T10:00:00.000Z", expiresAt: null },
  { id: "share-5", token: "gv-delanga-block", farmerId: "farmer-5", sensorIds: ["os-6", "os-16"], label: "Delanga block share", createdAt: "2026-11-01T08:00:00.000Z", expiresAt: null },
  { id: "share-6", token: "gv-kakatpur", farmerId: "farmer-6", sensorIds: ["os-7"], label: "Kakatpur soil API", createdAt: "2026-11-03T11:00:00.000Z", expiresAt: null },
];

const data = {
  organization: {
    id: "org-1",
    name: "Green Valley Co-op",
    email: "org@terraeco.app",
    phone: "+91 98765 10000",
    city: "Puri",
    onboardedAt: "2026-09-01T10:00:00.000Z",
  },
  farmers,
  inventory,
  pumps,
  sensors,
  shares,
};

fs.writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
console.log({
  farmers: farmers.length,
  sensors: sensors.length,
  assigned: sensors.filter((s) => s.farmerId).length,
  stock: sensors.filter((s) => !s.farmerId).length,
  pumps: pumps.length,
  pumpsStock: pumps.filter((p) => !p.farmerId).length,
  shares: shares.length,
});
