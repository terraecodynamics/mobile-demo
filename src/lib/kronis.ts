/** TerraEco Kronis palette — matches project-mobile-native */
export const kronis = {
  background: "#d9dee7",
  mapBackground: "#cfd5e0",
  surface: "#e8e9eb",
  surfaceMuted: "#dfe1e4",
  ink: "#171A12",
  inkMuted: "#555B4E",
  lime: "#ff6b35",
  limeDark: "#e63946",
  limeSoft: "#FFF0EB",
  online: "#ff6b35",
  warning: "#C2952E",
  warningBg: "#FBF3E0",
  alert: "#E0642E",
  alertBg: "#FBEAE0",
  offline: "#E9EAE4",
  border: "#D8DEE8",
  divider: "rgba(23,26,18,0.09)",
  shadow: "rgba(23,26,18,0.16)",
  brandRgb: "255,107,53",
  dialTrack: "#D8DEE8",
  dialStart: "#FFB899",
  dialStartEdge: "#FF8A5C",
  neo: "#d9dee7",
  neoInk: "#8b90a0",
} as const;

export type Kronis = typeof kronis;
