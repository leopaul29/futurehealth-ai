import { useEffect } from "react";
import type { GeneProfile } from "../types";
import { useApp } from "../state/context";

const PROFILES: GeneProfile[] = [
  {
    id: "diab-high",
    name: "糖尿病リスク高・代謝低い",
    description: "血糖コントロールに注意。運動と食事の両輪で改善。",
    riskBias: { diabetes: "high", cardiovascular: "medium", metabolism: "high" },
  },
  {
    id: "cv-high",
    name: "心血管リスク高",
    description: "LDLと血圧に注意。脂質と運動管理を重視。",
    riskBias: { diabetes: "medium", cardiovascular: "high", metabolism: "medium" },
  },
  {
    id: "balanced",
    name: "平均的リスク",
    description: "特定の強いバイアスなし。生活習慣で最適化。",
    riskBias: { diabetes: "medium", cardiovascular: "medium", metabolism: "medium" },
  },
];

export default function GeneProfileSelector() {
  const { state, actions } = useApp();
  useEffect(() => {
    if (!state.gene) {
      actions.setGene(PROFILES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card">
      <h3>遺伝子リスクプロファイル（モック）</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {PROFILES.map((p) => (
          <label key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, cursor: "pointer" }}>
            <input
              type="radio"
              name="gene"
              checked={state.gene?.id === p.id}
              onChange={() => actions.setGene(p)}
              style={{ marginRight: 8 }}
            />
            <strong>{p.name}</strong>
            <div style={{ fontSize: 12, color: "#555" }}>{p.description}</div>
          </label>
        ))}
      </div>
    </div>
  );
}
