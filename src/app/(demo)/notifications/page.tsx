"use client";

import { SoftButton, SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import {
  dummyNotifications,
  type DummyNotification,
} from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  CloudRain,
  Cpu,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppView } from "@/components/phone/AppViewProvider";

const kindMeta: Record<
  DummyNotification["kind"],
  { Icon: typeof Bell; bg: string; color: string; label: string }
> = {
  rental: { Icon: CalendarX2, bg: "#FBEAE0", color: "#E0642E", label: "Rental" },
  alert: { Icon: MapPin, bg: "#FBF3E0", color: "#C2952E", label: "Movement" },
  security: { Icon: ShieldAlert, bg: "#FBEAE0", color: "#E0642E", label: "Security" },
  pump: { Icon: Cpu, bg: kronis.limeSoft, color: kronis.lime, label: "Pump" },
  weather: { Icon: CloudRain, bg: "#E8F1FB", color: "#3B82C4", label: "Weather" },
  system: { Icon: Bell, bg: "#EEF1F5", color: "#6B7280", label: "System" },
};

const filters = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "rental", label: "Rentals" },
  { id: "alert", label: "Alerts" },
  { id: "pump", label: "Pump" },
  { id: "weather", label: "Weather" },
] as const;

type FilterId = (typeof filters)[number]["id"];

/** Prefer calendar-clock for “new rental” style rows */
function iconFor(n: DummyNotification) {
  if (n.kind === "rental" && n.title.toLowerCase().includes("new")) {
    return { ...kindMeta.rental, Icon: CalendarClock, bg: "#FBF3E0", color: "#C2952E" };
  }
  return kindMeta[n.kind];
}

function actionFor(n: DummyNotification): { label: string; href: string } {
  if (n.kind === "rental") return { label: "Open rentals", href: "/rentals" };
  if (n.kind === "system" && n.title.toLowerCase().includes("summary")) {
    return { label: "Open profile", href: "/profile" };
  }
  if (n.kind === "weather") return { label: "See the farm", href: "/home" };
  return { label: "Open pump", href: "/home" };
}

export default function NotificationsPage() {
  const router = useRouter();
  const isWeb = useAppView() === "web";
  const [items, setItems] = useState(dummyNotifications);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedId, setSelectedId] = useState(dummyNotifications[0]?.id ?? "");

  const unreadCount = items.filter((n) => n.unread).length;

  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, DummyNotification[]>();
    for (const n of items) {
      if (!map.has(n.section)) {
        map.set(n.section, []);
        order.push(n.section);
      }
      map.get(n.section)!.push(n);
    }
    return order.map((title) => ({ title, data: map.get(title)! }));
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((n) => {
      if (filter === "unread") return n.unread;
      if (filter === "all") return true;
      if (filter === "alert") return n.kind === "alert" || n.kind === "security";
      return n.kind === filter;
    });
  }, [items, filter]);

  const visibleSections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, DummyNotification[]>();
    for (const n of visible) {
      if (!map.has(n.section)) {
        map.set(n.section, []);
        order.push(n.section);
      }
      map.get(n.section)!.push(n);
    }
    return order.map((title) => ({ title, data: map.get(title)! }));
  }, [visible]);

  const selected = visible.find((n) => n.id === selectedId) ?? visible[0] ?? null;

  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openItem = (id: string) => {
    setSelectedId(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  if (isWeb) {
    const meta = selected ? iconFor(selected) : null;
    const action = selected ? actionFor(selected) : null;
    return (
      <div className="flex min-h-0 flex-1" style={{ background: kronis.background }}>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 px-8 pb-3 pt-6">
            <div className="min-w-0 flex-1">
              <div className="text-[22px] font-extrabold tracking-[-0.3px]" style={{ color: kronis.ink }}>
                Alerts
              </div>
              <div className="mt-0.5 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                {unreadCount} unread
              </div>
            </div>
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12px] font-bold"
              style={{ color: kronis.ink, boxShadow: "0 6px 16px rgba(23,26,18,0.08)" }}
            >
              <CheckCheck size={16} strokeWidth={2.4} />
              Mark all read
            </button>
          </header>

          <div className="flex flex-wrap gap-2 px-8 pb-3">
            {filters.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold"
                  style={{
                    background: on ? kronis.ink : "#fff",
                    color: on ? "#fff" : kronis.inkMuted,
                    boxShadow: on ? "none" : "0 4px 12px rgba(23,26,18,0.06)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {visibleSections.length === 0 ? (
              <div className="px-2 py-16 text-center text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
                Nothing in this filter.
              </div>
            ) : (
              visibleSections.map((section) => (
                <section key={section.title} className="mb-4">
                  <div
                    className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-[0.08em]"
                    style={{ color: "#6B7280" }}
                  >
                    {section.title}
                  </div>
                  <div className="space-y-1.5">
                    {section.data.map((n) => {
                      const { Icon, bg, color } = iconFor(n);
                      const on = selected?.id === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => openItem(n.id)}
                          className="flex w-full gap-3 rounded-[18px] px-3 py-3 text-left"
                          style={{
                            background: on ? "#fff" : "transparent",
                            boxShadow: on ? "0 8px 24px rgba(23,26,18,0.08)" : "none",
                          }}
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                            style={{ background: bg }}
                          >
                            <Icon size={20} color={color} strokeWidth={2.1} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span
                                className="truncate text-[14px] font-extrabold"
                                style={{ color: kronis.ink }}
                              >
                                {n.title}
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold" style={{ color: "#8b90a0" }}>
                                {n.time}
                              </span>
                            </span>
                            <span
                              className="mt-0.5 block truncate text-[12.5px] font-medium"
                              style={{ color: kronis.inkMuted }}
                            >
                              {n.body}
                            </span>
                          </span>
                          {n.unread ? (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ background: color }}
                            />
                          ) : (
                            <span className="w-2 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        <aside
          className="flex h-full w-[400px] shrink-0 flex-col border-l p-6"
          style={{ background: "#fff", borderColor: "rgba(23,26,18,0.08)" }}
        >
          {selected && meta && action ? (
            <>
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: meta.bg }}
              >
                <meta.Icon size={26} color={meta.color} strokeWidth={2.1} />
              </span>
              <div className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: meta.color }}>
                {meta.label}
              </div>
              <h1 className="mt-1 text-[22px] font-extrabold leading-snug tracking-[-0.3px]" style={{ color: kronis.ink }}>
                {selected.title}
              </h1>
              <div className="mt-1 text-[13px] font-semibold" style={{ color: kronis.inkMuted }}>
                {selected.section} · {selected.time}
              </div>
              <p className="mt-5 text-[15px] font-medium leading-relaxed" style={{ color: kronis.ink }}>
                {selected.body}
              </p>
              <div className="mt-auto">
                <SoftButton
                  label={action.label}
                  variant="orange"
                  className="w-full"
                  onClick={() => router.push(action.href)}
                />
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-[14px] font-semibold" style={{ color: kronis.inkMuted }}>
              Select an alert to read it.
            </div>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ background: kronis.background }}
    >
      <header className="flex items-start gap-2.5 px-3.5 pb-2 pt-2">
        <SoftChip
          icon={ArrowLeft}
          onClick={() => router.push("/home")}
          label="Back"
          flat
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <div
            className="text-[22px] font-extrabold leading-tight tracking-[-0.3px]"
            style={{ color: kronis.ink }}
          >
            Notifications
          </div>
          <div
            className="mt-0.5 text-[13px] font-semibold"
            style={{ color: kronis.inkMuted }}
          >
            {unreadCount} unread
          </div>
        </div>
        <button
          type="button"
          onClick={markAll}
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 active:scale-[0.97]"
          style={{
            background: "linear-gradient(145deg, #f5f6f8, #e4e7ec)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            color: kronis.inkMuted,
          }}
        >
          <CheckCheck size={16} strokeWidth={2.4} />
          <span className="text-[12px] font-bold">Mark all</span>
        </button>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3.5 pb-6 pt-1">
        {sections.map((section) => (
          <section key={section.title} className="mb-3.5">
            <div
              className="mb-2 px-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em]"
              style={{ color: "#6B7280" }}
            >
              {section.title}
            </div>
            <div className="space-y-2.5">
              {section.data.map((n) => {
                const { Icon, bg, color } = iconFor(n);
                return (
                  <SoftRaised
                    key={n.id}
                    className="w-full"
                    radius={22}
                    onClick={() => openItem(n.id)}
                  >
                    <div className="flex gap-3 px-3.5 py-3.5">
                      <span className="relative shrink-0">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ background: bg }}
                        >
                          <Icon size={20} color={color} strokeWidth={2.1} />
                        </span>
                        {n.unread ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                            style={{
                              background: color,
                              boxShadow: "0 0 0 2px #fff",
                            }}
                          />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="min-w-0 flex-1 text-[14px] font-extrabold leading-snug"
                            style={{ color: kronis.ink }}
                          >
                            {n.title}
                          </div>
                          <div
                            className="shrink-0 pt-0.5 text-[11px] font-semibold"
                            style={{ color: "#8b90a0" }}
                          >
                            {n.time}
                          </div>
                        </div>
                        <div
                          className="mt-1 text-[12.5px] font-medium leading-snug"
                          style={{ color: kronis.inkMuted }}
                        >
                          {n.body}
                        </div>
                      </div>
                    </div>
                  </SoftRaised>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
