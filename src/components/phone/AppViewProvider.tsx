"use client";

import { createContext, useContext } from "react";
import type { AppView } from "@/lib/appView";

const AppViewContext = createContext<AppView>("phone");

export function AppViewProvider({
  value,
  children,
}: {
  value: AppView;
  children: React.ReactNode;
}) {
  return <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>;
}

export function useAppView() {
  return useContext(AppViewContext);
}
