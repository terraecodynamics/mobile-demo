"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  homePathForRole,
  isOrgAllowedPath,
  isRenteeAllowedPath,
} from "@/lib/auth";
import { kronis } from "@/lib/kronis";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Gate demo routes: must be logged in; role scopes stay on their areas. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role === "rentee" && !isRenteeAllowedPath(pathname)) {
      router.replace(homePathForRole("rentee"));
      return;
    }
    if (session.role === "org" && !isOrgAllowedPath(pathname)) {
      router.replace(homePathForRole("org"));
      return;
    }
    if (
      (session.role === "owner" || session.role === "rentee") &&
      pathname.startsWith("/org")
    ) {
      router.replace(homePathForRole(session.role));
    }
  }, [ready, session, pathname, router]);

  if (!ready) {
    return (
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        style={{ background: kronis.background }}
      >
        <div className="text-sm font-semibold" style={{ color: kronis.inkMuted }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!session) return null;
  if (session.role === "rentee" && !isRenteeAllowedPath(pathname)) return null;
  if (session.role === "org" && !isOrgAllowedPath(pathname)) return null;
  if (
    (session.role === "owner" || session.role === "rentee") &&
    pathname.startsWith("/org")
  ) {
    return null;
  }

  return <>{children}</>;
}
