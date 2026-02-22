import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppActions, AppState, GeneProfile, HealthMetrics, WearableDaily, WearableSummary } from "../types";
import { computeRisk } from "../engine/risk";
import { generateNudge } from "../engine/nudge";
import { AppCtx } from "./context";

const STORAGE_KEY = "futurehealth.appstate.v1";

const defaultWearables: WearableSummary = {
  days: [],
};

const defaultState: AppState = {
  health: {},
  wearables: defaultWearables,
  riskHistory: [],
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(e);
    }
    // Seed with 7 days synthetic wearables for demo
    const start = new Date();
    const days: WearableDaily[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        steps: Math.round(5000 + Math.random() * 6000),
        sleepHours: Math.round((6 + Math.random() * 3) * 10) / 10,
        avgHr: Math.round(60 + Math.random() * 20),
      });
    }
    return { ...defaultState, wearables: { days } };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const recompute = useCallback(() => {
    setState((s) => {
      const r = computeRisk(s.gene, s.health, s.wearables);
      const ts = new Date().toISOString();
      return {
        ...s,
        risk: r,
        riskHistory: [...(s.riskHistory ?? []), { timestamp: ts, score: r.riskScore }],
        lastRecomputeAt: ts,
      };
    });
  }, []);

  const generate = useCallback(() => {
    setState((s) => ({
      ...s,
      todayNudge: generateNudge(s.gene, s.health, s.wearables),
    }));
  }, []);

  useEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: AppActions = useMemo(
    () => ({
      setHealth: (h: HealthMetrics) => setState((s) => ({ ...s, health: { ...h, updatedAt: todayISO() } })),
      setWearables: (w: WearableSummary) => setState((s) => ({ ...s, wearables: w })),
      setGene: (g: GeneProfile) => setState((s) => ({ ...s, gene: g })),
      recompute,
      generateNudge: generate,
    }),
    [generate, recompute]
  );

  return <AppCtx.Provider value={{ state, actions }}>{children}</AppCtx.Provider>;
}

export default AppProvider
