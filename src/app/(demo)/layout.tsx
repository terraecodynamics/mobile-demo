"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PhoneShell } from "@/components/phone/PhoneShell";
import { usePathname } from "next/navigation";

function DemoGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <RequireAuth>{children}</RequireAuth>;
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PhoneShell>
        <DemoGate>{children}</DemoGate>
      </PhoneShell>
    </AuthProvider>
  );
}
