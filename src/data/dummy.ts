/** Dummy farm / pump data for UI-only Next demo */

export type DummyPump = {
  id: string;
  /** Display label: model · serial (for one-line contexts) */
  name: string;
  /** Product model: Kronis 4 | Kronis 4 – Pro */
  model: "Kronis 4" | "Kronis 4 – Pro";
  /** Unique Serial No for this pump unit */
  serial: string;
  number: number;
  online: boolean;
  running: boolean;
  flowLpm: number | null;
  soilPct: number;
  lastSeen: string;
  lat: number;
  lng: number;
  field: { lat: number; lng: number }[];
};

export type DummyRental = {
  id: string;
  pumpName: string;
  renteePhone: string;
  renteeName: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  amountInr: number;
};

/** Pumps listed for rent on the map (rentee discovery) */
export type RentalListing = {
  id: string;
  pumpName: string;
  ownerName: string;
  ownerPhone: string;
  village: string;
  ratePerDayInr: number;
  /** Kronis product model, e.g. Kronis 4 / Kronis 4 – Pro */
  model: string;
  /** Unique Serial No for this unit */
  serial: string;
  available: boolean;
  lat: number;
  lng: number;
  distanceKm: number;
};

export type DummyNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  /** Section header, e.g. TODAY or SEPTEMBER 18, 2026 */
  section: string;
  unread: boolean;
  kind: "rental" | "alert" | "security" | "pump" | "weather" | "system";
};

export const dummyUser = {
  name: "Terra Demo",
  initials: "TD",
  email: "demo@terraeco.app",
  mobile: "+91 98765 43210",
  farmName: "Green Valley Farm",
  city: "Puri",
  members: [
    { id: "m1", name: "Ravi Kumar", role: "Operator" },
    { id: "m2", name: "Anita Patel", role: "Viewer" },
  ],
};

/**
 * Field polygons match native `DEMO_FENCES` in pumpMapFences.js —
 * irregular quads that follow real plot edges (not axis-aligned boxes).
 */
export const dummyPumps: DummyPump[] = [
  {
    id: "p1",
    name: "Kronis 4 · KR-007",
    model: "Kronis 4",
    serial: "KR-007",
    number: 1,
    online: true,
    running: false,
    flowLpm: 0,
    soilPct: 62,
    lastSeen: "just now",
    lat: 19.884193,
    lng: 86.02015,
    field: [
      { lat: 19.884422, lng: 86.020119 },
      { lat: 19.884317, lng: 86.020366 },
      { lat: 19.883953, lng: 86.020189 },
      { lat: 19.884079, lng: 86.019926 },
    ],
  },
  {
    id: "p2",
    name: "Kronis 4 · KR-014",
    model: "Kronis 4",
    serial: "KR-014",
    number: 2,
    online: true,
    running: true,
    flowLpm: 48,
    soilPct: 41,
    lastSeen: "just now",
    lat: 19.883856,
    lng: 86.01971,
    field: [
      { lat: 19.884004, lng: 86.019649 },
      { lat: 19.883921, lng: 86.019858 },
      { lat: 19.883719, lng: 86.019778 },
      { lat: 19.883779, lng: 86.019555 },
    ],
  },
  {
    id: "p3",
    name: "Kronis 4 – Pro · KR-021",
    model: "Kronis 4 – Pro",
    serial: "KR-021",
    number: 3,
    online: false,
    running: false,
    flowLpm: null,
    soilPct: 55,
    lastSeen: "2 min ago",
    lat: 19.88355,
    lng: 86.02005,
    field: [
      { lat: 19.88372, lng: 86.01995 },
      { lat: 19.88364, lng: 86.02022 },
      { lat: 19.88338, lng: 86.02014 },
      { lat: 19.88346, lng: 86.01988 },
    ],
  },
];

export const dummyRentals: DummyRental[] = [
  {
    id: "r1",
    pumpName: "Kronis 4 · KR-007",
    renteePhone: "+91 91234 56780",
    renteeName: "Ramesh Kumar",
    startDate: "2026-09-20",
    endDate: "2026-09-25",
    status: "ACTIVE",
    amountInr: 3500,
  },
  {
    id: "r2",
    pumpName: "Kronis 4 · KR-014",
    renteePhone: "+91 99887 66554",
    renteeName: "Sita Devi",
    startDate: "2026-09-10",
    endDate: "2026-09-15",
    status: "COMPLETED",
    amountInr: 2800,
  },
  {
    id: "r2b",
    pumpName: "Kronis 4 · KR-007",
    renteePhone: "+91 98765 43210",
    renteeName: "Vikram Singh",
    startDate: "2026-09-01",
    endDate: "2026-09-07",
    status: "COMPLETED",
    amountInr: 4900,
  },
  {
    id: "r3",
    pumpName: "Kronis 4 – Pro · KR-021",
    renteePhone: "+91 90123 44556",
    renteeName: "Ajay Patel",
    startDate: "2026-09-28",
    endDate: "2026-10-02",
    status: "UPCOMING",
    amountInr: 4200,
  },
];

/** Nearby geo-tagged pumps available to rent (rentee map) */
export const rentalListings: RentalListing[] = [
  {
    id: "rl1",
    pumpName: "Kronis 4 · KR-007",
    ownerName: "Terra Demo",
    ownerPhone: "+919876543210",
    village: "Puri · Green Valley",
    ratePerDayInr: 700,
    model: "Kronis 4",
    serial: "KR-007",
    available: true,
    lat: 19.884193,
    lng: 86.02015,
    distanceKm: 0.2,
  },
  {
    id: "rl2",
    pumpName: "Kronis 4 · KR-108",
    ownerName: "Bikash Nayak",
    ownerPhone: "+919887766554",
    village: "Balukhanda",
    ratePerDayInr: 550,
    model: "Kronis 4",
    serial: "KR-108",
    available: true,
    lat: 19.883856,
    lng: 86.01971,
    distanceKm: 0.4,
  },
  {
    id: "rl3",
    pumpName: "Kronis 4 – Pro · KR-221",
    ownerName: "Sunita Das",
    ownerPhone: "+919012344556",
    village: "Gop",
    ratePerDayInr: 800,
    model: "Kronis 4 – Pro",
    serial: "KR-221",
    available: false,
    lat: 19.88355,
    lng: 86.02005,
    distanceKm: 0.6,
  },
  {
    id: "rl4",
    pumpName: "Kronis 4 · KR-134",
    ownerName: "Pradeep Mohanty",
    ownerPhone: "+919445566778",
    village: "Konark road",
    ratePerDayInr: 650,
    model: "Kronis 4",
    serial: "KR-134",
    available: true,
    lat: 19.8819,
    lng: 86.0224,
    distanceKm: 1.1,
  },
  {
    id: "rl5",
    pumpName: "Kronis 4 – Pro · KR-305",
    ownerName: "Meena Sahoo",
    ownerPhone: "+919778899001",
    village: "Satapada side",
    ratePerDayInr: 500,
    model: "Kronis 4 – Pro",
    serial: "KR-305",
    available: true,
    lat: 19.8862,
    lng: 86.0178,
    distanceKm: 1.4,
  },
];

export const dummyNotifications: DummyNotification[] = [
  {
    id: "n1",
    title: "Rental expired: Kronis 4 · KR-007",
    body: "Kronis 4 · KR-007 rented to Rahul has expired. Please update status to make it available for rent.",
    time: "1 day ago",
    section: "TODAY",
    unread: true,
    kind: "rental",
  },
  {
    id: "n2",
    title: "New Rental Created",
    body: "A new rental has been created for Kronis 4 · KR-007",
    time: "3 days ago",
    section: "SEPTEMBER 18, 2026",
    unread: true,
    kind: "rental",
  },
  {
    id: "n3",
    title: "New Rental Created",
    body: "A new rental has been created for Kronis 4 · KR-014",
    time: "3 days ago",
    section: "SEPTEMBER 18, 2026",
    unread: true,
    kind: "rental",
  },
  {
    id: "n4",
    title: "Movement Alert",
    body: "Kronis 4 · KR-007 — Movement alert: device moved outside the geofence (13085m from center, limit 10m).",
    time: "2 weeks ago",
    section: "SEPTEMBER 8, 2026",
    unread: true,
    kind: "alert",
  },
  {
    id: "n5",
    title: "Theft Alarm",
    body: "Kronis 4 · KR-007 — Theft alarm triggered near the farm boundary. Check device location immediately.",
    time: "2 weeks ago",
    section: "SEPTEMBER 8, 2026",
    unread: true,
    kind: "security",
  },
  {
    id: "n6",
    title: "Pump went offline",
    body: "Kronis 4 – Pro · KR-021 lost connection. Last seen 2 minutes ago.",
    time: "2 weeks ago",
    section: "SEPTEMBER 8, 2026",
    unread: false,
    kind: "pump",
  },
  {
    id: "n7",
    title: "Rain expected today",
    body: "Light showers near Puri district this afternoon. Consider pausing irrigation.",
    time: "3 weeks ago",
    section: "AUGUST 28, 2026",
    unread: false,
    kind: "weather",
  },
  {
    id: "n8",
    title: "Soil moisture low",
    body: "Kronis 4 · KR-014 soil at 41%. Consider starting a timed irrigation run.",
    time: "3 weeks ago",
    section: "AUGUST 28, 2026",
    unread: false,
    kind: "pump",
  },
  {
    id: "n9",
    title: "Rental started",
    body: "Ramesh Kumar · Kronis 4 · KR-007 · ₹3,500 · ends Sep 25.",
    time: "1 month ago",
    section: "AUGUST 20, 2026",
    unread: true,
    kind: "rental",
  },
  {
    id: "n10",
    title: "Geofence assigned",
    body: "Kronis 4 · KR-007 was assigned to Field 1 geofence on your farm map.",
    time: "1 month ago",
    section: "AUGUST 20, 2026",
    unread: true,
    kind: "system",
  },
  {
    id: "n11",
    title: "Flow sensor update",
    body: "Kronis 4 · KR-007 reported 0 L/min while stopped — sensor healthy.",
    time: "1 month ago",
    section: "AUGUST 15, 2026",
    unread: true,
    kind: "pump",
  },
  {
    id: "n12",
    title: "Weekly summary ready",
    body: "Your irrigation summary for last week is available in Profile.",
    time: "1 month ago",
    section: "AUGUST 15, 2026",
    unread: true,
    kind: "system",
  },
];

export const dummyWeather = {
  condition: "Rain" as "Rain" | "Sunny" | "Cloudy",
  temperature: 28,
  humidity: 72,
  label: "Light rain",
};

export const dummyWeeklyStats = [
  { day: "Mon", hours: 2.4 },
  { day: "Tue", hours: 1.1 },
  { day: "Wed", hours: 3.0 },
  { day: "Thu", hours: 0.5 },
  { day: "Fri", hours: 2.2 },
  { day: "Sat", hours: 1.8 },
  { day: "Sun", hours: 0 },
];
