/** Demo auth — localStorage session for owner vs rentee */

export type AuthRole = "owner" | "rentee";

export type AuthSession = {
  role: AuthRole;
  name: string;
  phone: string;
  loggedInAt: string;
};

const STORAGE_KEY = "terraeco.demo.auth";

export const DEMO_OWNER = {
  name: "Terra Demo",
  phone: "9876543210",
  email: "demo@terraeco.app",
  password: "1234",
  otp: "123456",
} as const;

export const DEMO_RENTEE = {
  name: "Ramesh Kumar",
  phone: "9123456780",
  email: "rentee@terraeco.app",
  password: "5678",
  otp: "567890",
} as const;

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeId(value: string) {
  return value.trim().toLowerCase();
}

/** Match email/mobile to a demo account (role). */
export function matchDemoAccount(emailOrMobile: string) {
  const id = normalizeId(emailOrMobile);
  const phone = digitsOnly(emailOrMobile).slice(-10);

  if (
    id === DEMO_OWNER.email ||
    phone === DEMO_OWNER.phone ||
    id === `+91${DEMO_OWNER.phone}`
  ) {
    return { role: "owner" as const, account: DEMO_OWNER };
  }
  if (
    id === DEMO_RENTEE.email ||
    phone === DEMO_RENTEE.phone ||
    id === `+91${DEMO_RENTEE.phone}`
  ) {
    return { role: "rentee" as const, account: DEMO_RENTEE };
  }
  return null;
}

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.role !== "owner" && parsed?.role !== "rentee") return null;
    if (!parsed.name || !parsed.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function homePathForRole(role: AuthRole): string {
  return role === "rentee" ? "/rentals" : "/home";
}

/** Paths a rentee may open (everything else redirects to /rentals) */
export function isRenteeAllowedPath(pathname: string): boolean {
  if (pathname === "/rentals") return true;
  if (pathname === "/login") return true;
  if (pathname === "/profile") return true;
  if (pathname.startsWith("/rentals/")) return true;
  return false;
}
