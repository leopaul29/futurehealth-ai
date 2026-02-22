import { createContext, useContext } from "react";
import type { AppActions, AppState } from "../types";

export const AppCtx = createContext<{ state: AppState; actions: AppActions } | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

