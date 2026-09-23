"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { SoftChip, SoftButton } from "@/components/ui/SoftUi";
import { dummyPumps, dummyUser, rentalListings } from "@/data/dummy";
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
  MapPinned,
  Phone,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const PUMP_META: Record<string, { model: string; serial: string; power: string }> = {
  p1: { model: "Kronis 4", serial: "KR-007", power: "Solar" },
  p2: { model: "Kronis 4", serial: "KR-014", power: "Solar" },
  p3: { model: "Kronis 4 – Pro", serial: "KR-021", power: "Solar" },
};

export default function ProfilePage() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const isRentee = session?.role === "rentee";
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
    () => rentalListings.filter((l) => l.available).length,
    []
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const backPath = session ? homePathForRole(session.role) : "/login";

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

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-10">
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
                  Find pumps
                </span>
                <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                  {nearbyAvailable} available nearby
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

            {dummyPumps.map((p) => {
              const meta = PUMP_META[p.id];
              const line = meta
                ? [meta.model, meta.serial, meta.power].join(" · ")
                : "TerraEco pump";
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
                      {p.name}
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
            })}

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
