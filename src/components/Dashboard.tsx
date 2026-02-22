import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "../state/context";
import { computeRisk } from "../engine/risk";

export default function Dashboard() {
  const { state, actions } = useApp();
  const risk = state.risk;

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
      <h2>FutureHealth AI ダッシュボード</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
        <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
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
        </div>

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

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ border: "1px dashed #ddd" }}>
          <h3>今日のアクション</h3>
          <div>{state.todayNudge ?? "アクションを生成しましょう。"}</div>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                actions.generateNudge();
              }}
            >
              ナッジを生成
            </button>
          </div>
        </div>
        <div className="card" style={{ border: "1px dashed #ddd" }}>
          <h3>ウェアラブルサマリー（直近7日）</h3>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {state.wearables.days.slice(-7).map((d) => (
              <li key={d.date}>
                {d.date}: 歩数 {d.steps} ／ 睡眠 {d.sleepHours}h {d.avgHr ? `／ 平均心拍 ${d.avgHr} bpm` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
