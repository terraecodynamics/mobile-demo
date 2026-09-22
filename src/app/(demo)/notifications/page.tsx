"use client";

import { SoftChip, SoftRaised } from "@/components/ui/SoftUi";
import { dummyNotifications } from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import { ArrowLeft, Bell, CalendarClock, CloudRain, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

const kindIcon = {
  pump: Cpu,
  weather: CloudRain,
  rental: CalendarClock,
  system: Bell,
} as const;

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className="flex items-center gap-3 px-3.5 pb-3 pt-2">
        <SoftChip icon={ArrowLeft} onClick={() => router.push("/home")} label="Back" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
            Notifications
          </div>
          <div className="text-xs" style={{ color: kronis.inkMuted }}>
            Dummy alerts
          </div>
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 pb-6">
        {dummyNotifications.map((n) => {
          const Icon = kindIcon[n.kind];
          return (
            <SoftRaised key={n.id} className="w-full p-3.5">
              <div className="flex gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: kronis.limeSoft }}
                >
                  <Icon size={18} color={kronis.lime} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold" style={{ color: kronis.ink }}>
                      {n.title}
                    </div>
                    {n.unread ? (
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: kronis.lime }}
                      />
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm leading-snug" style={{ color: kronis.inkMuted }}>
                    {n.body}
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold" style={{ color: "#8b90a0" }}>
                    {n.time}
                  </div>
                </div>
              </div>
            </SoftRaised>
          );
        })}
      </div>
    </div>
  );
}
