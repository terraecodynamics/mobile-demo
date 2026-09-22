"use client";

import { SoftChip, SoftRaised } from "@/components/ui/SoftUi";
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

const kindMeta: Record<
  DummyNotification["kind"],
  { Icon: typeof Bell; bg: string; color: string }
> = {
  rental: { Icon: CalendarX2, bg: "#FBEAE0", color: "#E0642E" },
  alert: { Icon: MapPin, bg: "#FBF3E0", color: "#C2952E" },
  security: { Icon: ShieldAlert, bg: "#FBEAE0", color: "#E0642E" },
  pump: { Icon: Cpu, bg: kronis.limeSoft, color: kronis.lime },
  weather: { Icon: CloudRain, bg: "#E8F1FB", color: "#3B82C4" },
  system: { Icon: Bell, bg: "#EEF1F5", color: "#6B7280" },
};

/** Prefer calendar-clock for “new rental” style rows */
function iconFor(n: DummyNotification) {
  if (n.kind === "rental" && n.title.toLowerCase().includes("new")) {
    return { Icon: CalendarClock, bg: "#FBF3E0", color: "#C2952E" };
  }
  if (n.kind === "rental" && n.title.toLowerCase().includes("expired")) {
    return kindMeta.rental;
  }
  return kindMeta[n.kind];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState(dummyNotifications);

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

  const markAll = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openItem = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

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
