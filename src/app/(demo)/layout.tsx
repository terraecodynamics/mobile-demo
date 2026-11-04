"use client";

import { AppShellLock } from "@/components/auth/AppShellLock";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PhoneShell } from "@/components/phone/PhoneShell";
import { WebAppShell } from "@/components/phone/WebAppShell";
import { AppViewProvider } from "@/components/phone/AppViewProvider";
import { readAppView, type AppView } from "@/lib/appView";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function DemoGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <RequireAuth>{children}</RequireAuth>;
}

function DemoFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [view, setView] = useState<AppView>("phone");

  useEffect(() => {
    const sync = () => setView(readAppView());
    sync();
    window.addEventListener("terraeco-view", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("terraeco-view", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const body = (
    <AppViewProvider value={view}>
      <DemoGate>{children}</DemoGate>
    </AppViewProvider>
  );
  if (pathname !== "/login" && view === "web") {
    return <WebAppShell>{body}</WebAppShell>;
  }
  return <PhoneShell>{body}</PhoneShell>;
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShellLock />
      <DemoFrame>{children}</DemoFrame>
    </AuthProvider>
  );
}
