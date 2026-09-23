"use client";

import { homePathForRole, readSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    router.replace(homePathForRole(session.role));
  }, [router]);

  return null;
}
