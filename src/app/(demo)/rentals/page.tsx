"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { EnterHandoffKeySheet } from "@/components/rental/EnterHandoffKeySheet";
import { MapStage } from "@/components/pump/MapStage";
import { PumpMapMarker } from "@/components/pump/PumpMapMarker";
import { ActiveRenteesSheet } from "@/components/rental/ActiveRenteesSheet";
import { HandoffKeySheet } from "@/components/rental/HandoffKeySheet";
import { PutOnRentSheet } from "@/components/rental/PutOnRentSheet";
import { RentalDiscoverMap } from "@/components/rental/RentalDiscoverMap";
import { SoftChip, SoftRaised, SoftButton } from "@/components/ui/SoftUi";
import { dummyPumps, dummyRentals, dummyUser, type RentalListing } from "@/data/dummy";
import { getOpenOfferForPump, getPrimaryAttached, issueHandoffKey, type HandoffOffer } from "@/lib/handoffKeys";
import { getPublishedForPump, getRentListings, publishPumpForRent } from "@/lib/rentListings";
import { kronis } from "@/lib/kronis";
import { ArrowLeft, CalendarDays, Gauge, KeyRound, Phone, Plus, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppView } from "@/components/phone/AppViewProvider";

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
  cardRef,
}: {
  listing: RentalListing;
  selected: boolean;
  onSelect: () => void;
  onCall: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
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
  const isWeb = useAppView() === "web";

  const [listings, setListings] = useState<RentalListing[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [renteesOpen, setRenteesOpen] = useState(false);
  const [listToast, setListToast] = useState<string | null>(null);
  const [pumpId, setPumpId] = useState(dummyPumps[0]?.id ?? "");
  const [muted, setMuted] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffOffer, setHandoffOffer] = useState<HandoffOffer | null>(null);
  const [enterKeyOpen, setEnterKeyOpen] = useState(false);
  const [hasAttached, setHasAttached] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const skipScrollRef = useRef(true);

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

  // Map pin → scroll that listing card into view
  useEffect(() => {
    if (!selectedId) return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    const el = cardRefs.current[selectedId];
    if (!el) return;
    window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }, [selectedId]);

  const total = useMemo(() => dummyRentals.reduce((s, r) => s + r.amountInr, 0), []);
  const mapPump = dummyPumps.find((p) => p.id === pumpId) ?? dummyPumps[0];

  const openGiveKey = () => {
    if (!mapPump) return;
    const published = getPublishedForPump(mapPump.id);
    const existing = getOpenOfferForPump(mapPump.id);
    if (existing) {
      setHandoffOffer(existing);
      setHandoffOpen(true);
      return;
    }
    const offer = issueHandoffKey({
      pumpId: mapPump.id,
      model: published?.model ?? mapPump.model,
      serial: mapPump.serial,
      ratePerDayInr: published?.ratePerDayInr ?? 700,
      ownerName: dummyUser.name,
      ownerPhone: dummyUser.mobile,
    });
    setHandoffOffer(offer);
    setHandoffOpen(true);
  };

  const cyclePump = () => {
    const i = dummyPumps.findIndex((p) => p.id === mapPump?.id);
    const next = dummyPumps[(i + 1) % dummyPumps.length];
    if (next) setPumpId(next.id);
  };

  return (
    <div
      className={isWeb ? "relative flex h-full min-h-0 flex-1" : "relative flex min-h-0 flex-1 flex-col"}
      style={{ background: isWeb ? "#e7ebf2" : kronis.background }}
    >
      {!isWeb ? (
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
      ) : null}

      {isRentee && isWeb ? (
        <>
          <div className="relative min-h-0 min-w-0 flex-1">
            <div className="absolute inset-0">
              <RentalDiscoverMap
                listings={filtered}
                selectedId={selected?.id ?? null}
                myLocation={MY_LOCATION}
                onSelect={(id) => {
                  skipScrollRef.current = false;
                  setSelectedId(id);
                }}
              />
            </div>
            <div
              className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "rgba(23,26,18,0.72)", color: "#fff" }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "#60a5fa", boxShadow: "0 0 0 3px rgba(96,165,250,0.35)" }}
              />
              Near you · {filtered.filter((l) => l.available).length} available
            </div>
          </div>
          <aside
            className="flex h-full w-[400px] shrink-0 flex-col border-l bg-white p-5"
            style={{ borderColor: "rgba(23,26,18,0.08)" }}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: kronis.inkMuted }}>
              Find
            </div>
            <div className="mt-1 text-[22px] font-extrabold leading-tight" style={{ color: kronis.ink }}>
              Nearby pumps
            </div>
            <p className="mt-2 text-[13px] leading-snug" style={{ color: kronis.inkMuted }}>
              {session?.name ?? "Rentee"} · pick a pin or a listing, then call the owner.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEnterKeyOpen(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-extrabold"
                style={{ background: "#f4f6f8", color: kronis.ink }}
              >
                <KeyRound size={15} />
                Attach key
              </button>
              <button
                type="button"
                onClick={() => router.push("/rentals/my-pump")}
                className="relative flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-extrabold"
                style={{ background: kronis.limeSoft, color: kronis.lime }}
              >
                <Gauge size={15} />
                Start pump
                {hasAttached ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ background: kronis.lime }} />
                ) : null}
              </button>
            </div>
            <div
              className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-2.5"
              style={{ background: "#f4f6f8" }}
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
            <div className="no-scrollbar mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="rounded-[18px] px-4 py-8 text-center text-sm font-semibold" style={{ color: kronis.inkMuted, background: "#f4f6f8" }}>
                  No matches for “{query}”
                </div>
              ) : (
                filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    selected={listing.id === selected?.id}
                    cardRef={(el) => {
                      cardRefs.current[listing.id] = el;
                    }}
                    onSelect={() => setSelectedId(listing.id)}
                    onCall={() => callPhone(listing.ownerPhone)}
                  />
                ))
              )}
            </div>
          </aside>
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
        </>
      ) : isRentee ? (
        <>
        <div className="contents">
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
              onSelect={(id) => {
                skipScrollRef.current = false;
                setSelectedId(id);
              }}
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
                    cardRef={(el) => {
                      cardRefs.current[listing.id] = el;
                    }}
                    onSelect={() => setSelectedId(listing.id)}
                    onCall={() => callPhone(listing.ownerPhone)}
                  />
                ))
              )}
            </div>

          </div>
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
        </>
      ) : isWeb && mapPump ? (
        <>
          <div className="relative min-h-0 min-w-0 flex-1">
            <MapStage
              pumps={dummyPumps}
              selectedId={mapPump.id}
              running={mapPump.running}
              muted={muted}
              onMute={() => setMuted((m) => !m)}
              onRentals={() => setRenteesOpen(true)}
              onSelectPump={setPumpId}
              sheetHeight={0}
            />
          </div>
          <aside
            className="flex h-full w-[400px] shrink-0 flex-col border-l"
            style={{ background: kronis.background, borderColor: "rgba(23,26,18,0.08)" }}
          >
            <button
              type="button"
              onClick={cyclePump}
              className="mx-4 mt-4 flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 text-left"
              style={{ boxShadow: "0 8px 24px rgba(23,26,18,0.08)" }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
                <PumpMapMarker number={mapPump.number} compact />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold" style={{ color: kronis.ink }}>
                  {mapPump.model}
                </span>
                <span className="block text-[12px] font-semibold" style={{ color: kronis.inkMuted }}>
                  {mapPump.serial}
                </span>
              </span>
              <span className="text-[12px] font-extrabold" style={{ color: kronis.lime }}>
                Switch
              </span>
            </button>

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: kronis.limeSoft }}
              >
                <CalendarDays size={22} color={kronis.lime} strokeWidth={2.1} />
              </span>
              <div className="mt-3 text-[20px] font-extrabold" style={{ color: kronis.ink }}>
                Rent a pump
              </div>
              <p className="mt-1 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                List it, then give the key to the rentee
              </p>
              <div className="mt-5 flex w-full max-w-[300px] flex-col gap-2.5">
                <SoftButton
                  label="List for rent"
                  variant="orange"
                  className="w-full"
                  onClick={() => setListOpen(true)}
                />
                <SoftButton label="Give key" variant="ink" className="w-full" onClick={openGiveKey} />
              </div>
            </div>

            <div
              className="mx-4 mb-5 flex items-center justify-center gap-8 rounded-full bg-white px-6 py-3"
              style={{ boxShadow: "0 8px 24px rgba(23,26,18,0.08)" }}
            >
              <div className="text-center">
                <div className="text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {mapPump.flowLpm ?? "—"}
                  <span className="text-[12px] font-bold"> L/min</span>
                </div>
                <div className="text-[10px] font-bold tracking-[0.12em]" style={{ color: kronis.inkMuted }}>
                  FLOW
                </div>
              </div>
              <div className="h-8 w-px" style={{ background: "rgba(23,26,18,0.12)" }} />
              <div className="text-center">
                <div className="text-[18px] font-extrabold" style={{ color: kronis.ink }}>
                  {mapPump.soilPct}%
                </div>
                <div className="text-[10px] font-bold tracking-[0.12em]" style={{ color: kronis.inkMuted }}>
                  SOIL
                </div>
              </div>
            </div>
          </aside>
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
            style={{ background: `linear-gradient(180deg, transparent, ${kronis.background} 30%)` }}
          >
            <div className="min-w-0 flex-1 text-sm font-semibold" style={{ color: kronis.inkMuted }}>
              {dummyRentals.length} rentals
            </div>
            <SoftChip
              icon={Plus}
              size={52}
              color={kronis.lime}
              onClick={() => setListOpen(true)}
              label="List for rent"
            />
            <div className="min-w-0 flex-1 text-right text-sm font-extrabold" style={{ color: kronis.ink }}>
              ₹{total.toLocaleString("en-IN")}
            </div>
          </div>
        </>
      )}
      {!isRentee ? (
        <>
          <PutOnRentSheet
            open={listOpen}
            pumps={dummyPumps.map((p) => ({
              id: p.id,
              model: p.model,
              serial: p.serial,
              number: p.number,
            }))}
            selectedPumpId={mapPump?.id}
            onClose={() => setListOpen(false)}
            onSaved={(payload) => {
              const listed = dummyPumps.find((p) => p.id === payload.pumpId);
              if (!listed) return;
              const unitLabel = `${payload.model} · ${payload.serial}`;
              publishPumpForRent({
                pumpId: payload.pumpId,
                pumpName: unitLabel,
                lat: listed.lat,
                lng: listed.lng,
                model: payload.model,
                serial: payload.serial,
                ratePerDayInr: payload.ratePerDayInr,
                available: payload.available,
              });
              setListToast(payload.available ? `Listed · ${unitLabel}` : `Unlisted · ${unitLabel}`);
              window.setTimeout(() => setListToast(null), 2400);
            }}
          />
          <HandoffKeySheet open={handoffOpen} offer={handoffOffer} onClose={() => setHandoffOpen(false)} />
          <ActiveRenteesSheet open={renteesOpen} onClose={() => setRenteesOpen(false)} />
          {listToast ? (
            <div
              className="pointer-events-none absolute bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-2xl px-4 py-3 text-[13px] font-bold text-white shadow-lg"
              style={{ background: "rgba(23,26,18,0.92)" }}
            >
              {listToast}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
