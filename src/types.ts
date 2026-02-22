export type HealthMetrics = {
  bmi?: number;
  systolicBp?: number;
  diastolicBp?: number;
  hba1c?: number;
  ldl?: number;
  hdl?: number;
  totalChol?: number;
  tg?: number;
  fpg?: number;
  ast?: number;
  alt?: number;
  ggt?: number;
  uricAcid?: number;
  creatinine?: number;
  bun?: number;
  egfr?: number;
  crp?: number;
  updatedAt?: string;
};

export type WearableDaily = {
  date: string; // YYYY-MM-DD
  steps: number;
  sleepHours: number;
  avgHr?: number;
};

export type WearableSummary = {
  days: WearableDaily[];
};

export type GeneProfile = {
  id: string;
  name: string;
  description: string;
  riskBias: {
    diabetes: "low" | "medium" | "high";
    cardiovascular: "low" | "medium" | "high";
    metabolism: "low" | "medium" | "high";
  };
};

export type RiskResult = {
  healthAge: number;
  riskScore: number; // 0-100
  risks: {
    diabetes: number;
    cardiovascular: number;
    metabolic: number;
  };
};

export type RiskHistoryEntry = {
  timestamp: string;
  score: number;
};

export type AppState = {
  health: HealthMetrics;
  wearables: WearableSummary;
  gene?: GeneProfile;
  risk?: RiskResult;
  todayNudge?: string;
  riskHistory?: RiskHistoryEntry[];
  lastRecomputeAt?: string;
};

export type AppActions = {
  setHealth: (h: HealthMetrics) => void;
  setWearables: (w: WearableSummary) => void;
  setGene: (g: GeneProfile) => void;
  recompute: () => void;
  generateNudge: () => void;
};
