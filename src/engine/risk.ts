import type { GeneProfile, HealthMetrics, RiskResult, WearableSummary } from "../types";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function scoreFromGeneBias(bias: "low" | "medium" | "high") {
  switch (bias) {
    case "low":
      return 0.1;
    case "medium":
      return 0.25;
    case "high":
      return 0.4;
  }
}

export function computeRisk(
  gene: GeneProfile | undefined,
  health: HealthMetrics,
  wearables: WearableSummary
): RiskResult {
  // Baseline risks from genetics
  const baseDiabetes = gene ? scoreFromGeneBias(gene.riskBias.diabetes) : 0.15;
  const baseCv = gene ? scoreFromGeneBias(gene.riskBias.cardiovascular) : 0.15;
  const baseMet = gene ? scoreFromGeneBias(gene.riskBias.metabolism) : 0.15;

  // Health metrics contributions (very simplified heuristic)
  let diabetes = baseDiabetes;
  let cv = baseCv;
  let met = baseMet;

  if (typeof health.hba1c === "number") {
    // Normal ~5.6%, prediabetes 5.7-6.4, diabetes >=6.5
    if (health.hba1c >= 6.5) diabetes += 0.4;
    else if (health.hba1c >= 6.0) diabetes += 0.25;
    else if (health.hba1c >= 5.7) diabetes += 0.15;
  }

  if (typeof health.bmi === "number") {
    if (health.bmi >= 30) {
      diabetes += 0.2;
      cv += 0.2;
      met += 0.25;
    } else if (health.bmi >= 27.5) {
      diabetes += 0.15;
      cv += 0.15;
      met += 0.2;
    } else if (health.bmi >= 25) {
      diabetes += 0.1;
      cv += 0.1;
      met += 0.15;
    }
  }

  if (typeof health.ldl === "number") {
    if (health.ldl >= 160) cv += 0.35;
    else if (health.ldl >= 140) cv += 0.25;
    else if (health.ldl >= 120) cv += 0.15;
  }

  if (typeof health.systolicBp === "number" && typeof health.diastolicBp === "number") {
    if (health.systolicBp >= 140 || health.diastolicBp >= 90) cv += 0.35;
    else if (health.systolicBp >= 130 || health.diastolicBp >= 85) cv += 0.2;
    else if (health.systolicBp >= 120 || health.diastolicBp >= 80) cv += 0.1;
  }

  // Wearables: average last 7 days
  const last7 = wearables.days.slice(-7);
  if (last7.length > 0) {
    const avgSteps = last7.reduce((s, d) => s + d.steps, 0) / last7.length;
    const avgSleep = last7.reduce((s, d) => s + d.sleepHours, 0) / last7.length;
    if (avgSteps < 5000) {
      diabetes += 0.15;
      cv += 0.1;
    } else if (avgSteps < 8000) {
      diabetes += 0.05;
    }
    if (avgSleep < 6.5) {
      diabetes += 0.1;
      met += 0.1;
    } else if (avgSleep > 9) {
      met += 0.05;
    }
  }

  diabetes = clamp(diabetes, 0, 1);
  cv = clamp(cv, 0, 1);
  met = clamp(met, 0, 1);

  const riskScore = Math.round(clamp((diabetes + cv + met) / 3, 0, 1) * 100);

  // Health age: 40 + (riskScore/100 * 20) - bounded 20..80
  const healthAge = clamp(Math.round(40 + (riskScore / 100) * 20), 20, 80);

  return {
    healthAge,
    riskScore,
    risks: {
      diabetes: Math.round(diabetes * 100),
      cardiovascular: Math.round(cv * 100),
      metabolic: Math.round(met * 100),
    },
  };
}
