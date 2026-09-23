"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { EnterHandoffKeySheet } from "@/components/rental/EnterHandoffKeySheet";
import { RentalDiscoverMap } from "@/components/rental/RentalDiscoverMap";
import { SoftChip, SoftRaised, SoftButton } from "@/components/ui/SoftUi";
import { dummyRentals, type RentalListing } from "@/data/dummy";
import { getPrimaryAttached } from "@/lib/handoffKeys";
import { getRentListings } from "@/lib/rentListings";
import { kronis } from "@/lib/kronis";
import { ArrowLeft, Gauge, KeyRound, Phone, Plus, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const statusColor = {
  ACTIVE: kronis.lime,
  COMPLETED: "#6b7280",
  UPCOMING: "#4A7DBA",
} as const;

/** Demo rentee position — south of the pump cluster so “You” is easy to see */
const MY_LOCATION = { lat: 19.8829, lng: 86.02085 };

function callPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  window.location.href = `tel:${digits}`;
}

function ListingCard({
  listing,
  selected,
  onSelect,
  onCall,
}: {
  listing: RentalListing;
  selected: boolean;
  onSelect: () => void;
  onCall: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="outline-none"
    >
      <SoftRaised className="w-full" contentClassName="p-3.5" radius={20}>
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate font-extrabold" style={{ color: kronis.ink }}>
              {listing.model}
            </div>
            <div className="mt-0.5 truncate text-sm" style={{ color: kronis.inkMuted }}>
              {listing.serial ? `${listing.serial} · ` : null}
              {listing.ownerName} · {listing.village}
            </div>
          </div>
          <span
            className="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
            style={{
              background: listing.available ? kronis.limeSoft : "#e8eaed",
              color: listing.available ? kronis.lime : "#6b7280",
            }}
          >
            {listing.available ? "AVAILABLE" : "BUSY"}
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="text-sm" style={{ color: kronis.inkMuted }}>
            {listing.distanceKm.toFixed(1)} km
          </div>
          <div className="font-extrabold" style={{ color: kronis.ink }}>
            ₹{listing.ratePerDayInr}
            <span className="text-xs font-semibold" style={{ color: kronis.inkMuted }}>
              /day
            </span>
          </div>
        </div>

        {selected ? (
          <div
            className="mt-3"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <SoftButton
              label={listing.available ? "Call to rent" : "Call owner"}
              variant="orange"
              className="w-full"
              icon={Phone}
              onClick={onCall}
            />
          </div>
        ) : null}
      </SoftRaised>
    </div>
  );
}

export default function RentalsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const isRentee = session?.role === "rentee";

  const [listings, setListings] = useState<RentalListing[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [enterKeyOpen, setEnterKeyOpen] = useState(false);
  const [hasAttached, setHasAttached] = useState(false);

  useEffect(() => {
    const list = getRentListings();
    setListings(list);
    setSelectedId(
      (prev) =>
        prev ??
        list.find((l) => l.available)?.id ??
        list[0]?.id ??
        null
    );
    setHasAttached(!!getPrimaryAttached(session?.phone));
  }, [session?.phone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("attach") !== "1") return;
    setEnterKeyOpen(true);
    // One-shot deep link — clear so Find doesn’t reopen the sheet by default
    url.searchParams.delete("attach");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const closeEnterKey = () => {
    setEnterKeyOpen(false);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("attach")) {
      url.searchParams.delete("attach");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.pumpName.toLowerCase().includes(q) ||
        l.village.toLowerCase().includes(q) ||
        l.ownerName.toLowerCase().includes(q) ||
        l.model.toLowerCase().includes(q) ||
        (l.serial ?? "").toLowerCase().includes(q)
    );
  }, [query, listings]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  const total = useMemo(
    () => dummyRentals.reduce((s, r) => s + r.amountInr, 0),
    []
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <div className="relative z-20 flex items-center gap-2.5 px-3.5 pb-2 pt-2">
        {isRentee ? (
          <SoftChip
            icon={UserRound}
            onClick={() => router.push("/profile")}
            label="Profile"
            color={kronis.lime}
          />
        ) : (
          <SoftChip icon={ArrowLeft} onClick={() => router.push("/home")} label="Back" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
            {isRentee ? "Find" : "My rentals"}
          </div>
          <div className="truncate text-xs" style={{ color: kronis.inkMuted }}>
            {isRentee
              ? `${session?.name ?? "Rentee"} · nearby`
              : `${session?.name ?? "Owner"} · manage listings`}
          </div>
        </div>
        {isRentee ? (
          <>
            <SoftChip
              icon={KeyRound}
              onClick={() => setEnterKeyOpen(true)}
              label="Attach key"
              color={kronis.ink}
            />
            <div className="relative">
              <SoftChip
                icon={Gauge}
                onClick={() => router.push("/rentals/my-pump")}
                label="Start pump"
                color={kronis.ink}
              />
              {hasAttached ? (
                <span
                  className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full"
                  style={{
                    background: kronis.lime,
                    boxShadow: "0 0 0 1.5px #fff",
                  }}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {isRentee ? (
        <>
          <div
            className="relative mx-3.5 min-h-[220px] flex-[1.15] overflow-hidden rounded-[22px]"
            style={{
              boxShadow:
                "4px 6px 14px rgba(102,109,122,0.28), -2px -2px 8px rgba(255,255,255,0.75)",
            }}
          >
            <RentalDiscoverMap
              listings={filtered}
              selectedId={selected?.id ?? null}
              myLocation={MY_LOCATION}
              onSelect={(id) => setSelectedId(id)}
            />

            <div className="absolute left-3 right-3 top-3 z-10">
              <div
                className="flex items-center gap-2 rounded-[16px] px-3 py-2.5"
                style={{
                  background: "rgba(245,247,250,0.94)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                }}
              >
                <Search size={16} color={kronis.inkMuted} strokeWidth={2.2} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search village…"
                  className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  style={{ color: kronis.ink }}
                />
              </div>
            </div>

            <div
              className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "rgba(23,26,18,0.72)", color: "#fff" }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: "#60a5fa",
                  boxShadow: "0 0 0 3px rgba(96,165,250,0.35)",
                }}
              />
              Near you · {filtered.filter((l) => l.available).length} available
            </div>
          </div>

          <div className="relative mt-3 min-h-0 flex-1">
            <div className="no-scrollbar h-full space-y-3 overflow-y-auto overflow-x-visible px-3.5 pb-8 pt-1">
              {filtered.length === 0 ? (
                <div
                  className="rounded-[18px] px-4 py-8 text-center text-sm font-semibold"
                  style={{ color: kronis.inkMuted, background: "#e8eaed" }}
                >
                  No matches for “{query}”
                </div>
              ) : (
                filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    selected={listing.id === selected?.id}
                    onSelect={() => setSelectedId(listing.id)}
                    onCall={() => callPhone(listing.ownerPhone)}
                  />
                ))
              )}
            </div>

            <EnterHandoffKeySheet
              open={enterKeyOpen}
              renteeName={session?.name}
              renteePhone={session?.phone}
              onClose={closeEnterKey}
              onAttached={() => {
                setHasAttached(true);
                setListings(getRentListings());
                router.push("/rentals/my-pump");
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 pb-28">
            {dummyRentals.map((r) => (
              <SoftRaised key={r.id} className="w-full p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold" style={{ color: kronis.ink }}>
                      {r.pumpName}
                    </div>
                    <div className="mt-0.5 text-sm" style={{ color: kronis.inkMuted }}>
                      {r.renteeName} · {r.renteePhone}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
                    style={{ background: statusColor[r.status] }}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span style={{ color: kronis.inkMuted }}>
                    {r.startDate} → {r.endDate}
                  </span>
                  <span className="font-extrabold" style={{ color: kronis.ink }}>
                    ₹{r.amountInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-extrabold"
                  style={{ background: kronis.limeSoft, color: kronis.lime }}
                  onClick={() => callPhone(r.renteePhone)}
                >
                  <Phone size={15} strokeWidth={2.4} />
                  Call rentee
                </button>
              </SoftRaised>
            ))}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pb-5 pt-3"
            style={{
              background: `linear-gradient(180deg, transparent, ${kronis.background} 30%)`,
            }}
          >
            <div className="min-w-0 flex-1 text-sm font-semibold" style={{ color: kronis.inkMuted }}>
              {dummyRentals.length} rentals
            </div>
            <SoftChip
              icon={Plus}
              size={52}
              color={kronis.lime}
              onClick={() => setAddOpen(true)}
              label="Add rental"
            />
            <div className="min-w-0 flex-1 text-right text-sm font-extrabold" style={{ color: kronis.ink }}>
              ₹{total.toLocaleString("en-IN")}
            </div>
          </div>

          {addOpen ? (
            <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/35">
              <button type="button" className="absolute inset-0" onClick={() => setAddOpen(false)} />
              <div
                className="relative rounded-t-[28px] px-4 pb-10 pt-3"
                style={{ background: kronis.background }}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#c5ccd6]" />
                <div className="mb-3 text-[17px] font-extrabold" style={{ color: kronis.ink }}>
                  Add rental
                </div>
                <label className="mb-1 block text-xs font-bold" style={{ color: kronis.inkMuted }}>
                  Rentee mobile
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91…"
                  className="mb-4 w-full rounded-2xl border-0 px-4 py-3 text-[15px] outline-none"
                  style={{
                    background: "#fff",
                    color: kronis.ink,
                    boxShadow:
                      "inset 3px 3px 8px rgba(163,177,198,0.35), inset -2px -2px 6px rgba(255,255,255,0.9)",
                  }}
                />
                <SoftButton
                  label="Save (demo)"
                  variant="orange"
                  className="w-full"
                  onClick={() => {
                    setPhone("");
                    setAddOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
