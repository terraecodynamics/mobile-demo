"use client";

import { AppShellLock } from "@/components/auth/AppShellLock";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PhoneShell } from "@/components/phone/PhoneShell";
import { WebAppShell } from "@/components/phone/WebAppShell";
import { AppViewProvider } from "@/components/phone/AppViewProvider";
import { readAppView, type AppView } from "@/lib/appView";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

function DemoGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <RequireAuth>{children}</RequireAuth>;
}

function DemoFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [view, setView] = useState<AppView | null>(null);

  useLayoutEffect(() => {
    const sync = () => setView(readAppView());
    sync();
    window.addEventListener("terraeco-view", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("terraeco-view", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!view) {
    return <div className="fixed inset-0" style={{ background: "#e7ebf2" }} />;
  }

  const body = (
    <AppViewProvider value={view}>
      <DemoGate>{children}</DemoGate>
    </AppViewProvider>
  );
  if (view === "web" && pathname === "/login") {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "#e7ebf2" }}>
        {body}
      </div>
    );
  }
  if (view === "web") {
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
