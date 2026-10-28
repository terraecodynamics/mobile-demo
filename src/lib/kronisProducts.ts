export type KronisProduct = {
  slug: string;
  id: string;
  image: string;
  label: string;
  name: string;
  lede: string;
  specs: string[];
  highlights: string[];
  priceInr: number;
  priceNote: string;
  includes: string[];
  features: { name: string; value: string }[];
};

export const KRONIS_SHARED = [
  { label: "0 m head", value: "18000 LPH" },
  { label: "10 m head", value: "6000 LPH" },
  { label: "Delivery head", value: "38 mm" },
  { label: "Power", value: "0.53 Hp" },
  { label: "Pump + controller", value: "12 kg" },
  { label: "Solar array", value: "480W (120W × 4)" },
] as const;

export const KRONIS_PRODUCTS: KronisProduct[] = [
  {
    slug: "micro-4",
    id: "core",
    image: "/pump-prototype.png",
    label: "Core",
    name: "Kronis Micro 4",
    lede: "Compact solar micro pump for everyday irrigation.",
    specs: ["Mono PERC Bi-Cut", "28 kg panels", "0.53 Hp"],
    highlights: ["Practical flow 18000 LPH at 0 m head", "6000 LPH at 10 m head"],
    priceInr: 79000,
    priceNote: "Introductory booking price, excl. GST",
    includes: [
      "Pump and controller (12 kg)",
      "480W solar array (120W × 4 Mono PERC Bi-Cut)",
      "2-year pump warranty + 1 year extended",
      "15-year solar panel warranty (≥80% rated output)",
    ],
    features: [
      { name: "Solar panel type", value: "Mono PERC Bi-Cut" },
      { name: "Solar panel efficiency", value: "19%" },
      { name: "Solar panel weight", value: "28 kg" },
      { name: "Foldable solar panel", value: "No" },
      { name: "Advanced IoT integration", value: "No" },
      { name: "Access to portal & app", value: "No" },
      { name: "Integration with sensor modules", value: "No" },
    ],
  },
  {
    slug: "micro-4i",
    id: "iot",
    image: "/pump-prototype.png",
    label: "Connected",
    name: "Kronis Micro 4i",
    lede: "Foldable panels with IoT, portal and app control.",
    specs: ["Mono PERC Bi-Cut", "Foldable", "IoT + app"],
    highlights: ["Advanced IoT + app access", "Access to portal and app"],
    priceInr: 99000,
    priceNote: "Introductory booking price, excl. GST",
    includes: [
      "Pump and controller (12 kg)",
      "Foldable 480W Mono PERC Bi-Cut array",
      "IoT module with portal and app access",
      "2-year pump warranty + 1 year extended",
      "15-year solar panel warranty (≥80% rated output)",
    ],
    features: [
      { name: "Solar panel type", value: "Mono PERC Bi-Cut" },
      { name: "Solar panel efficiency", value: "19%" },
      { name: "Solar panel weight", value: "28 kg" },
      { name: "Foldable solar panel", value: "Yes" },
      { name: "Advanced IoT integration", value: "Yes" },
      { name: "Access to portal & app", value: "Yes" },
      { name: "Integration with sensor modules", value: "No" },
    ],
  },
  {
    slug: "micro-4i-pro",
    id: "pro",
    image: "/4i-pro-new.png",
    label: "Advanced",
    name: "Kronis Micro 4i Pro",
    lede: "Lightweight bifacial array, IoT, portal and sensor-ready control.",
    specs: ["Bi-facial Dual HJT", "11 kg panels", "Sensor modules"],
    highlights: ["Advanced IoT + app access", "Integration with field sensors"],
    priceInr: 129000,
    priceNote: "Introductory booking price, excl. GST",
    includes: [
      "Pump and controller (12 kg)",
      "11 kg bifacial Dual HJT array (480W)",
      "IoT module with portal and app access",
      "Sensor-module integration",
      "2-year pump warranty + 1 year extended",
      "15-year solar panel warranty (≥80% rated output)",
    ],
    features: [
      { name: "Solar panel type", value: "Bi-facial Dual HJT" },
      { name: "Solar panel efficiency", value: "23±5%" },
      { name: "Solar panel weight", value: "11 kg" },
      { name: "Foldable solar panel", value: "Yes" },
      { name: "Advanced IoT integration", value: "Yes" },
      { name: "Access to portal & app", value: "Yes" },
      { name: "Integration with sensor modules", value: "Yes" },
    ],
  },
];

export function getKronisProduct(slug: string) {
  return KRONIS_PRODUCTS.find((product) => product.slug === slug);
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
