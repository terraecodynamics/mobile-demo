"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { setAppView } from "@/lib/appView";
import {
  Bell,
  Building2,
  House,
  KeyRound,
  Radio,
  Smartphone,
  Sprout,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const OWNER_NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/farm", label: "Farm", icon: Sprout },
  { href: "/rentals", label: "Rentals", icon: KeyRound },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const RENTEE_NAV = [
  { href: "/rentals", label: "Rentals", icon: KeyRound },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const ORG_NAV = [
  { href: "/org", label: "Org", icon: Building2 },
  { href: "/org/farmers", label: "Farmers", icon: Users },
  { href: "/org/sensors", label: "Sensors", icon: Radio },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function WebAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const items =
    session?.role === "rentee"
      ? RENTEE_NAV
      : session?.role === "org"
        ? ORG_NAV
        : OWNER_NAV;

  const initials = (session?.name || "K")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 flex overflow-hidden" style={{ background: "#e7ebf2" }}>
      <aside className="flex w-[88px] shrink-0 flex-col items-center border-r border-black/5 bg-white py-5">
        <Link href={items[0].href} className="mb-6 flex items-center justify-center" aria-label="Kronis home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kronis-logo.svg" alt="Kronis" className="h-7 w-auto max-w-[72px]" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {items.map((item) => {
            const active =
              item.href === "/org"
                ? pathname === "/org"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex w-[72px] flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition"
                style={{
                  color: active ? "#171A12" : "#8b90a0",
                  background: active ? "#FFF0EB" : "transparent",
                }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: active ? "#fff" : "transparent", color: active ? "#ff6b35" : "currentColor" }}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          title="Phone preview"
          className="mb-3 grid h-10 w-10 place-items-center rounded-2xl text-[#8b90a0] transition hover:bg-[#f4f6f8] hover:text-[#171A12]"
          onClick={() => {
            setAppView("phone");
            router.refresh();
          }}
        >
          <Smartphone size={18} />
        </button>
        <div
          className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold text-white"
          style={{ background: "#171A12" }}
          title={session?.name}
        >
          {initials}
        </div>
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" style={{ background: "#e7ebf2" }}>
        {children}
      </main>
    </div>
  );
}
