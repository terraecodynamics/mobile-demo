"use client";

import { SoftChip, SoftRaised, SoftButton } from "@/components/ui/SoftUi";
import { dummyUser } from "@/data/dummy";
import { kronis } from "@/lib/kronis";
import {
  ArrowLeft,
  ChevronRight,
  KeyRound,
  Mail,
  Phone,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

const rows = [
  { label: "Edit profile", icon: UserRound, href: "#" },
  { label: "Change email", icon: Mail, href: "#" },
  { label: "Change mobile", icon: Phone, href: "#" },
  { label: "Change password", icon: KeyRound, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: kronis.background }}>
      <header className="flex items-center gap-3 px-3.5 pb-3 pt-2">
        <SoftChip icon={ArrowLeft} onClick={() => router.push("/home")} label="Back" />
        <div className="text-[17px] font-extrabold" style={{ color: kronis.ink }}>
          Profile
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3.5 pb-8">
        <SoftRaised className="mb-4 p-5 text-center">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold text-white"
            style={{
              background: `linear-gradient(145deg, ${kronis.lime}, ${kronis.limeDark})`,
            }}
          >
            {dummyUser.initials}
          </div>
          <div className="text-[18px] font-extrabold" style={{ color: kronis.ink }}>
            {dummyUser.name}
          </div>
          <div className="mt-1 text-sm" style={{ color: kronis.inkMuted }}>
            {dummyUser.email}
          </div>
          <div className="mt-0.5 text-sm" style={{ color: kronis.inkMuted }}>
            {dummyUser.mobile}
          </div>
          <div
            className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: kronis.limeSoft, color: kronis.lime }}
          >
            {dummyUser.farmName}
          </div>
        </SoftRaised>

        <div className="space-y-2.5">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <SoftRaised key={row.label} className="w-full px-4 py-3.5" onClick={() => {}}>
                <div className="flex items-center gap-3">
                  <Icon size={18} color={kronis.lime} />
                  <span className="flex-1 font-semibold" style={{ color: kronis.ink }}>
                    {row.label}
                  </span>
                  <ChevronRight size={18} color={kronis.inkMuted} />
                </div>
              </SoftRaised>
            );
          })}
        </div>

        <SoftButton
          label="Sign out (demo)"
          variant="ink"
          className="mt-6 w-full"
          onClick={() => router.push("/home")}
        />
      </div>
    </div>
  );
}
