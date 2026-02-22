import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../state/context";
import { computeRisk } from "../engine/risk";
const SCORE_GUIDE = {
  PERFECT: {
    min: 90,
    label: "理想的 (Ideal)",
    color: "#2ecc71",
    desc: "非常に健康的です。現在の生活習慣を維持しましょう。定期的なチェックのみで問題ありません。"
  },
  SAFE: {
    min: 75,
    label: "良好 (Good)",
    color: "#3498db",
    desc: "概ね良好です。わずかな数値の変動はありますが、過度に心配する必要はありません。"
  },
  WARNING: {
    min: 60,
    label: "要注意 (Warning)",
    color: "#f1c40f",
    desc: "1年後の予測スコアが低下傾向にあります。生活習慣の改善（食事・運動）を検討し始めましょう。"
  },
  DANGER: {
    min: 0,
    label: "要医療支援 (Action Required)",
    color: "#e74c3c",
    desc: "将来的な疾患リスクが高い状態です。専門医への相談や、精密検査を受けることを強く推奨します。"
  }
};
function ScoreInsight({ currentScore, futureScore }: { currentScore: number, futureScore: number }) {
  // Determine which zone the FUTURE score falls into
  const getZone = (score: number) => {
    if (score >= 90) return SCORE_GUIDE.PERFECT;
    if (score >= 75) return SCORE_GUIDE.SAFE;
    if (score >= 60) return SCORE_GUIDE.WARNING;
    return SCORE_GUIDE.DANGER;
  };

  const zone = getZone(futureScore);
  const isDeclining = futureScore < currentScore;

  return (
    <div className="score-card" style={{ 
      padding: '20px', 
      borderRadius: '12px', 
      borderLeft: `8px solid ${zone.color}`,
      background: '#fff',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>将来の健康予測スコア</h3>
        <span style={{ 
          backgroundColor: zone.color, 
          color: '#fff', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '0.9rem',
          fontWeight: 'bold' 
        }}>
          {zone.label}
        </span>
      </div>

      <div style={{ margin: '15px 0', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>{Math.round(futureScore)}</span>
        <span style={{ color: '#666' }}>/ 100 点 (1年後予測)</span>
      </div>

      {/* Trend Indicator */}
      {isDeclining && (
        <p style={{ color: '#e74c3c', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ⚠️ 現在の習慣を続けると、1年後にスコアが {Math.round(currentScore - futureScore)}点 低下する予測です。
        </p>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />

      <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
        {zone.desc}
      </p>

      {/* Range Reference Legend */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ padding: '8px', background: '#f9f9f9', borderRadius: '6px' }}>
          <small style={{ color: '#666', display: 'block' }}>安心ライン (Safe):</small>
          <strong style={{ color: '#2ecc71' }}>75点 以上</strong>
          <p style={{ fontSize: '0.75rem', margin: 0 }}>医療機関への相談は不要、セルフケアで十分です。</p>
        </div>
        <div style={{ padding: '8px', background: '#f9f9f9', borderRadius: '6px' }}>
          <small style={{ color: '#666', display: 'block' }}>警戒ライン (Critical):</small>
          <strong style={{ color: '#e74c3c' }}>60点 未満</strong>
          <p style={{ fontSize: '0.75rem', margin: 0 }}>放置すると重症化の恐れがあります。医師の診断が必要です。</p>
        </div>
      </div>
    </div>
  );
}
export default function Dashboard() {
  const { state } = useApp();
  const risk = state.risk;

  const futureScore = useMemo(() => {
    const base = risk?.riskScore ?? 0;
    const ldl = state.health.ldl ?? 0;
    const hba1c = state.health.hba1c ?? 0;
    let delta = 0;
    if (ldl > 140) delta += 1.5;
    if (hba1c > 5.7) delta += 2.0;
    const v = Math.max(0, Math.min(100, Math.round((base + delta) * 10) / 10));
    return v;
  }, [risk?.riskScore, state.health.ldl, state.health.hba1c]);

  const series = useMemo(() => {
    const hist = state.riskHistory ?? [];
    if (hist.length > 0) {
      return hist.map((e) => ({
        date: e.timestamp.slice(11, 16),
        risk: e.score,
      }));
    }
    if (!state.wearables.days.length) return [];
    return state.wearables.days.map((_, idx) => {
      const slice = { days: state.wearables.days.slice(0, idx + 1) };
      const r = computeRisk(state.gene, state.health, slice);
      return { date: state.wearables.days[idx].date.slice(5), risk: r.riskScore };
    });
  }, [state.gene, state.health, state.wearables.days, state.riskHistory]);

  return (
    <div className="card">
      <h2>FutureHealth AI</h2>
      <ScoreInsight currentScore={risk?.riskScore ?? 0} futureScore={futureScore} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, alignItems: "stretch" }}>
        {/*<div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
           <div style={{ fontSize: 12, color: "#555" }}>現在のリスクスコア</div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{risk?.riskScore ?? 0}</div>
          <div style={{ height: 12, background: "#eee", borderRadius: 6, overflow: "hidden", marginTop: 8 }}>
            <div
              style={{
                width: `${risk?.riskScore ?? 0}%`,
                height: "100%",
                background: `linear-gradient(90deg, #4caf50, #ff9800, #f44336)`,
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
            健康年齢: {risk?.healthAge ?? "-"} 歳 ／ 糖尿病: {risk?.risks.diabetes ?? 0}% 心血管:{" "}
            {risk?.risks.cardiovascular ?? 0}% 代謝: {risk?.risks.metabolic ?? 0}%
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#333" }}>
            1年後の予測リスクスコア: <strong>{futureScore}</strong>
          </div>
        </div> */}

        <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#555" }}>将来のリスク推移（簡易）</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line dataKey="risk" stroke="#1976d2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
            {state.lastRecomputeAt ? `最終再計算: ${new Date(state.lastRecomputeAt).toLocaleString()}（スコア ${risk?.riskScore ?? "-" }）` : "再計算履歴なし"}
          </div>
        </div>
      </div>
    </div>
  );
}
