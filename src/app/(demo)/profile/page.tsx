"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { SoftChip, SoftButton } from "@/components/ui/SoftUi";
import { dummyPumps, dummyUser } from "@/data/dummy";
import { getRentListings } from "@/lib/rentListings";
import { homePathForRole } from "@/lib/auth";
import { kronis } from "@/lib/kronis";
import {
  getActiveGeofencePlots,
  setLiveFarmFile,
  type FarmBoundariesFile,
} from "@/lib/fieldGeometry";
import {
  ArrowLeft,
  ChevronRight,
  Cpu,
  Gauge,
  KeyRound,
  LogOut,
  MapPinned,
  Phone,
  Plus,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppView } from "@/components/phone/AppViewProvider";

function getInitials(name: string | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

function maskMobile(mobile: string | undefined) {
  if (!mobile) return null;
  const s = mobile.replace(/\s/g, "");
  if (s.length < 6) return s;
  return `${s.slice(0, 4)} ${s.slice(4, 8)} ${s.slice(8, 10)}xxx`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const isRentee = session?.role === "rentee";
  const isWeb = useAppView() === "web";
  const [fieldCount, setFieldCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isRentee) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/farm-boundaries");
        if (!res.ok) return;
        const file = (await res.json()) as FarmBoundariesFile;
        if (cancelled) return;
        setLiveFarmFile(file);
        setFieldCount(getActiveGeofencePlots().length || 0);
      } catch {
        /* keep 0 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRentee]);

  const displayName = session?.name ?? (isRentee ? "Rentee" : dummyUser.name);
  const displayPhone = session?.phone ?? dummyUser.mobile;

  const contactLine = useMemo(() => {
    const bits: string[] = [];
    const masked = maskMobile(displayPhone);
    if (masked) bits.push(masked);
    if (!isRentee && dummyUser.city) bits.push(dummyUser.city);
    if (isRentee) bits.push("Rentee");
    return bits.join(" · ");
  }, [displayPhone, isRentee]);

  const users = useMemo(
    () => [
      { id: "me", name: dummyUser.name, role: "Owner" },
      ...(dummyUser.members ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
      })),
    ],
    []
  );

  const farmMeta = useMemo(() => {
    const pumps = dummyPumps.length;
    const boundaries = fieldCount;
    const bLabel = `${boundaries} boundar${boundaries === 1 ? "y" : "ies"}`;
    const pLabel = `${pumps} pump${pumps === 1 ? "" : "s"}`;
    return `${bLabel} · ${pLabel}`;
  }, [fieldCount]);

  const nearbyAvailable = useMemo(
    () => getRentListings().filter((l) => l.available).length,
    []
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const backPath = session ? homePathForRole(session.role) : "/login";

  const sections = isRentee
    ? [
        { id: "account", label: "Account", hint: contactLine, Icon: UserRound },
        { id: "rentals", label: "Rentals", hint: `${nearbyAvailable} available nearby`, Icon: MapPinned },
        { id: "support", label: "Support", hint: "Help with rentals", Icon: Phone },
        { id: "preferences", label: "Preferences", hint: "English · Litres · ₹", Icon: SlidersHorizontal },
      ]
    : [
        { id: "account", label: "Account", hint: contactLine, Icon: UserRound },
        { id: "pumps", label: "My pumps", hint: `${dummyPumps.length} pumps`, Icon: Cpu },
        { id: "users", label: "Users", hint: `${users.length} people`, Icon: Users },
        { id: "farm", label: "Farm", hint: farmMeta, Icon: MapPinned },
        { id: "preferences", label: "Preferences", hint: "English · Litres · ₹", Icon: SlidersHorizontal },
      ];

  const [section, setSection] = useState(sections[0].id);

  if (isWeb) {
    return (
      <div className="relative flex min-h-0 flex-1" style={{ background: kronis.background }}>
        <aside className="flex w-[340px] shrink-0 flex-col border-r px-5 py-6" style={{ borderColor: "rgba(23,26,18,0.08)" }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: kronis.ink }}>
              <span className="text-[20px] font-extrabold" style={{ color: kronis.lime }}>
                {getInitials(displayName)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                {displayName}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                {isRentee ? "Rentee" : "Pump owner"}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {sections.map((item) => {
              const on = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left"
                  style={{
                    background: on ? "#fff" : "transparent",
                    boxShadow: on ? "0 8px 24px rgba(23,26,18,0.08)" : "none",
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: on ? kronis.limeSoft : "rgba(255,255,255,0.55)" }}
                  >
                    <item.Icon size={18} color={on ? kronis.lime : kronis.inkMuted} strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold" style={{ color: kronis.ink }}>
                      {item.label}
                    </span>
                    <span className="block truncate text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <SoftButton
              label="Log out"
              icon={LogOut}
              variant="ink"
              className="w-full"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            />
            <p className="mt-3 text-center text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
              TerraEco · v1.0.0
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white px-8 py-7">
          {section === "account" ? (
            <>
              <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Account
              </h1>
              <dl className="mt-6 space-y-4 text-[15px]">
                <div className="flex justify-between gap-4 border-b py-3" style={{ borderColor: kronis.divider }}>
                  <dt style={{ color: kronis.inkMuted }}>Name</dt>
                  <dd className="font-extrabold" style={{ color: kronis.ink }}>{displayName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b py-3" style={{ borderColor: kronis.divider }}>
                  <dt style={{ color: kronis.inkMuted }}>Mobile</dt>
                  <dd className="font-extrabold" style={{ color: kronis.ink }}>{displayPhone}</dd>
                </div>
                {!isRentee ? (
                  <div className="flex justify-between gap-4 border-b py-3" style={{ borderColor: kronis.divider }}>
                    <dt style={{ color: kronis.inkMuted }}>Farm</dt>
                    <dd className="font-extrabold" style={{ color: kronis.ink }}>{dummyUser.farmName}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 border-b py-3" style={{ borderColor: kronis.divider }}>
                  <dt style={{ color: kronis.inkMuted }}>Role</dt>
                  <dd className="font-extrabold" style={{ color: kronis.ink }}>{isRentee ? "Rentee" : "Pump owner"}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => showToast("Edit profile — demo")}
                className="mt-6 text-left text-[15px] font-bold underline"
                style={{ color: kronis.inkMuted }}
              >
                Edit profile
              </button>
            </>
          ) : null}

          {section === "pumps" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                  My pumps
                </h1>
                <SoftButton label="Add pump" icon={Plus} size="pill" variant="ink" onClick={() => router.push("/add-pump")} />
              </div>
              <div className="mt-5 space-y-2.5">
                {dummyPumps.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => router.push("/home")}
                    className="flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left"
                    style={{ background: kronis.background, borderColor: "transparent" }}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px]" style={{ background: kronis.limeSoft }}>
                      <PumpMapMarker number={p.number} selected={false} isRunning={p.running} compact />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-extrabold" style={{ color: kronis.ink }}>{p.model}</span>
                      <span className="mt-0.5 block text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>{p.serial} · Solar</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1" style={{ background: p.online ? kronis.limeSoft : kronis.offline }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.online ? kronis.lime : kronis.inkMuted }} />
                      <span className="text-[11px] font-bold" style={{ color: p.online ? kronis.lime : kronis.inkMuted }}>
                        {p.online ? "Online" : "Offline"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {section === "users" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                  Users
                </h1>
                <SoftButton label="+ Add user" size="pill" variant="soft" onClick={() => showToast("Invite farm users — coming soon")} />
              </div>
              <div className="mt-5 space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-[16px] px-3 py-3" style={{ background: kronis.background }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold" style={{ background: "#fff", color: kronis.ink }}>
                      {getInitials(u.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold" style={{ color: kronis.ink }}>{u.name}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-bold" style={{ color: kronis.inkMuted }}>{u.role}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {section === "farm" ? (
            <>
              <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Farm
              </h1>
              <p className="mt-2 text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
                {dummyUser.farmName} · {dummyUser.city}
              </p>
              <p className="mt-4 text-[15px] font-medium leading-relaxed" style={{ color: kronis.ink }}>
                {farmMeta}. Open the map to adjust the boundary and the fields inside it.
              </p>
              <div className="mt-6">
                <SoftButton label="Open farm boundary" variant="orange" className="w-full" onClick={() => router.push("/farm")} />
              </div>
            </>
          ) : null}

          {section === "rentals" ? (
            <>
              <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Rentals
              </h1>
              <div className="mt-5 space-y-2.5">
                {[
                  { label: "Find", hint: `${nearbyAvailable} available nearby`, href: "/rentals", Icon: MapPinned },
                  { label: "Enter key", hint: "Attach pump from owner", href: "/rentals?attach=1", Icon: KeyRound },
                  { label: "My pump", hint: "Start after attach", href: "/rentals/my-pump", Icon: Gauge },
                ].map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => router.push(row.href)}
                    className="flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3.5 text-left"
                    style={{ background: kronis.background }}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]" style={{ background: kronis.limeSoft }}>
                      <row.Icon size={20} color={kronis.lime} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-extrabold" style={{ color: kronis.ink }}>{row.label}</span>
                      <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>{row.hint}</span>
                    </span>
                    <ChevronRight size={20} color={kronis.inkMuted} />
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {section === "support" ? (
            <>
              <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Support
              </h1>
              <p className="mt-4 text-[15px] font-medium leading-relaxed" style={{ color: kronis.ink }}>
                Need help attaching a pump or starting a rental? Call support from the demo.
              </p>
              <div className="mt-6">
                <SoftButton label="Call support" icon={Phone} variant="orange" className="w-full" onClick={() => showToast("Call support — demo")} />
              </div>
            </>
          ) : null}

          {section === "preferences" ? (
            <>
              <h1 className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Preferences
              </h1>
              <div className="mt-5">
                <button type="button" onClick={() => showToast("Language — demo")} className="flex w-full items-center justify-between border-b py-4" style={{ borderColor: kronis.divider }}>
                  <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>Language</span>
                  <span className="flex items-center gap-1 text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
                    English <ChevronRight size={18} />
                  </span>
                </button>
                <button type="button" onClick={() => showToast("Units — demo")} className="flex w-full items-center justify-between border-b py-4" style={{ borderColor: kronis.divider }}>
                  <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>Units</span>
                  <span className="flex items-center gap-1 text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
                    Litres · ₹ <ChevronRight size={18} />
                  </span>
                </button>
              </div>
            </>
          ) : null}
        </div>

        {toast ? (
          <div
            className="pointer-events-none absolute inset-x-4 bottom-6 z-20 mx-auto max-w-sm rounded-2xl px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg"
            style={{ background: "rgba(23,26,18,0.92)" }}
          >
            {toast}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ background: kronis.background }}
    >
      <header className="flex items-center gap-3 px-4 pb-2 pt-1">
        <SoftChip
          icon={ArrowLeft}
          onClick={() => router.push(backPath)}
          label="Back"
        />
        <div
          className="text-[22px] font-extrabold tracking-[-0.3px]"
          style={{ color: kronis.ink }}
        >
          Profile
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-10">
        {/* Identity */}
        <div className="mb-[22px] mt-2 flex items-center gap-3.5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: kronis.ink }}
          >
            <span
              className="text-[22px] font-extrabold"
              style={{ color: kronis.lime }}
            >
              {getInitials(displayName)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[22px] font-extrabold tracking-[-0.3px]"
              style={{ color: kronis.ink }}
            >
              {displayName}
            </div>
            <div
              className="mt-1 text-[14px] font-semibold leading-snug"
              style={{ color: kronis.inkMuted }}
            >
              {contactLine}
            </div>
          </div>
        </div>

        {isRentee ? (
          <>
            {/* Rentee account */}
            <div
              className="mb-2.5 text-[12px] font-extrabold uppercase tracking-[0.8px]"
              style={{ color: kronis.inkMuted }}
            >
              Account
            </div>
            <div
              className="mb-4 rounded-[18px] border px-3.5"
              style={{ background: kronis.surface, borderColor: kronis.border }}
            >
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>
                  Mobile
                </span>
                <span className="text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
                  {displayPhone}
                </span>
              </div>
              <div className="h-px" style={{ background: kronis.divider }} />
              <div className="flex items-center justify-between py-3.5">
                <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>
                  Role
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[12px] font-bold"
                  style={{ background: kronis.limeSoft, color: kronis.lime }}
                >
                  Rentee
                </span>
              </div>
            </div>

            <div
              className="mb-2.5 text-[12px] font-extrabold uppercase tracking-[0.8px]"
              style={{ color: kronis.inkMuted }}
            >
              Rentals
            </div>
            <button
              type="button"
              onClick={() => router.push("/rentals")}
              className="mb-2.5 flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
              style={{ background: kronis.surface, borderColor: kronis.border }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: kronis.limeSoft }}
              >
                <MapPinned size={22} color={kronis.lime} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold" style={{ color: kronis.ink }}>
                  Find
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  {nearbyAvailable} available nearby
                </span>
              </span>
              <ChevronRight size={22} color={kronis.inkMuted} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/rentals?attach=1")}
              className="mb-2.5 flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
              style={{ background: kronis.surface, borderColor: kronis.border }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: "#FFF0E8" }}
              >
                <KeyRound size={20} color={kronis.lime} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold" style={{ color: kronis.ink }}>
                  Enter key
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  Attach pump from owner
                </span>
              </span>
              <ChevronRight size={22} color={kronis.inkMuted} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/rentals/my-pump")}
              className="mb-2.5 flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
              style={{ background: kronis.surface, borderColor: kronis.border }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: kronis.limeSoft }}
              >
                <Gauge size={20} color={kronis.lime} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold" style={{ color: kronis.ink }}>
                  My pump
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  Start after attach
                </span>
              </span>
              <ChevronRight size={22} color={kronis.inkMuted} />
            </button>

            <button
              type="button"
              onClick={() => showToast("Call support — demo")}
              className="flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
              style={{ background: kronis.surface, borderColor: kronis.border }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: "#E8F0FA" }}
              >
                <Phone size={20} color="#4A7DBA" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold" style={{ color: kronis.ink }}>
                  Support
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  Help with rentals
                </span>
              </span>
              <ChevronRight size={22} color={kronis.inkMuted} />
            </button>
          </>
        ) : (
          <>
            {/* My pumps */}
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <span
                className="text-[12px] font-extrabold uppercase tracking-[0.8px]"
                style={{ color: kronis.inkMuted }}
              >
                My pumps
              </span>
              <SoftButton
                label="Add pump"
                icon={Plus}
                size="pill"
                variant="ink"
                onClick={() => router.push("/add-pump")}
              />
            </div>

            {dummyPumps.length ? (
            dummyPumps.map((p) => {
              const line = `${p.serial} · Solar`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.push("/home")}
                  className="mb-2.5 flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
                  style={{
                    background: kronis.surface,
                    borderColor: kronis.border,
                  }}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px]"
                    style={{ background: kronis.limeSoft }}
                  >
                    <PumpMapMarker
                      number={p.number}
                      selected={false}
                      isRunning={p.running}
                      compact
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[16px] font-extrabold"
                      style={{ color: kronis.ink }}
                    >
                      {p.model}
                    </span>
                    <span
                      className="mt-0.5 block text-[12px] font-semibold leading-4"
                      style={{ color: kronis.inkMuted }}
                    >
                      {line}
                    </span>
                  </span>
                  <span
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1"
                    style={{
                      background: p.online ? kronis.limeSoft : kronis.offline,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: p.online ? kronis.lime : kronis.inkMuted,
                      }}
                    />
                    <span
                      className="text-[11px] font-bold"
                      style={{
                        color: p.online ? kronis.lime : kronis.inkMuted,
                      }}
                    >
                      {p.online ? "Online" : "Offline"}
                    </span>
                  </span>
                </button>
              );
            })
            ) : null}

            {/* Users */}
            <div
              className="mb-2.5 mt-[22px] text-[12px] font-extrabold uppercase tracking-[0.8px]"
              style={{ color: kronis.inkMuted }}
            >
              Users
            </div>
            <div
              className="rounded-[18px] border px-3.5 pb-2 pt-1"
              style={{
                background: kronis.surface,
                borderColor: kronis.border,
              }}
            >
              {users.map((u, i) => (
                <div key={u.id}>
                  {i > 0 ? (
                    <div className="h-px" style={{ background: kronis.divider }} />
                  ) : null}
                  <div className="flex items-center gap-3 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                      style={{
                        background: kronis.surfaceMuted,
                        color: kronis.ink,
                      }}
                    >
                      {getInitials(u.name)}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[15px] font-bold"
                      style={{ color: kronis.ink }}
                    >
                      {u.name}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[12px] font-bold"
                      style={{
                        background: kronis.surfaceMuted,
                        color: kronis.inkMuted,
                      }}
                    >
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mb-1.5 mt-2 flex justify-center">
                <SoftButton
                  label="+ Add user"
                  size="pill"
                  variant="soft"
                  onClick={() => showToast("Invite farm users — coming soon")}
                />
              </div>
            </div>

            {/* Farm */}
            <div
              className="mb-2.5 mt-[22px] text-[12px] font-extrabold uppercase tracking-[0.8px]"
              style={{ color: kronis.inkMuted }}
            >
              Farm
            </div>
            <button
              type="button"
              onClick={() => router.push("/farm")}
              className="flex w-full items-center gap-3 rounded-[18px] border px-3.5 py-3.5 text-left active:scale-[0.99]"
              style={{
                background: kronis.surface,
                borderColor: kronis.border,
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: kronis.limeSoft }}
              >
                <MapPinned size={22} color={kronis.lime} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[16px] font-extrabold"
                  style={{ color: kronis.ink }}
                >
                  Farm boundary
                </span>
                <span
                  className="mt-0.5 block text-[13px] font-semibold"
                  style={{ color: kronis.inkMuted }}
                >
                  {farmMeta}
                </span>
              </span>
              <ChevronRight size={22} color={kronis.inkMuted} />
            </button>
          </>
        )}

        {/* Preferences */}
        <div
          className="mt-[22px] rounded-[18px] border px-3.5"
          style={{
            background: kronis.surface,
            borderColor: kronis.border,
          }}
        >
          <button
            type="button"
            onClick={() => showToast("Language — demo")}
            className="flex w-full items-center justify-between py-3.5"
          >
            <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>
              Language
            </span>
            <span className="flex items-center gap-0.5">
              <span
                className="text-[14px] font-semibold"
                style={{ color: kronis.inkMuted }}
              >
                English
              </span>
              <ChevronRight size={18} color={kronis.inkMuted} />
            </span>
          </button>
          <div className="h-px" style={{ background: kronis.divider }} />
          <button
            type="button"
            onClick={() => showToast("Units — demo")}
            className="flex w-full items-center justify-between py-3.5"
          >
            <span className="text-[15px] font-bold" style={{ color: kronis.ink }}>
              Units
            </span>
            <span className="flex items-center gap-0.5">
              <span
                className="text-[14px] font-semibold"
                style={{ color: kronis.inkMuted }}
              >
                Litres · ₹
              </span>
              <ChevronRight size={18} color={kronis.inkMuted} />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => showToast("Edit profile — demo")}
          className="mx-auto mt-[18px] block py-2 text-[15px] font-bold underline"
          style={{ color: kronis.inkMuted }}
        >
          Edit profile
        </button>

        <SoftButton
          label="Log out"
          variant="ink"
          className="mt-2 w-full"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        />

        {session ? (
          <p
            className="mt-3 text-center text-[12px] font-semibold"
            style={{ color: kronis.inkMuted }}
          >
            Signed in as {session.role === "owner" ? "pump owner" : "rentee"}
          </p>
        ) : null}

        <p
          className="mt-5 text-center text-[12px] font-semibold opacity-70"
          style={{ color: kronis.inkMuted }}
        >
          TerraEco · v1.0.0
        </p>
      </div>

      {toast ? (
        <div
          className="pointer-events-none absolute inset-x-4 bottom-6 z-20 rounded-2xl px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg"
          style={{ background: "rgba(23,26,18,0.92)" }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
