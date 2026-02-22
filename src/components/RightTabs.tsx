import { useState } from "react";
import { useApp } from "../state/context";
import HealthForm from "./HealthForm";
import BloodTestForm from "./BloodTestForm";

export default function RightTabs() {
  const { state, actions } = useApp();
  const [tab, setTab] = useState<"home" | "checkup" | "blood">("home");

  return (
    <div className="card" style={{ height: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setTab("home")} style={{ padding: "8px 12px", borderRadius: 8, background: tab === "home" ? "#e3f2fd" : "#f5f5f5" }}>
          サマリー・ナッジ
        </button>
        <button onClick={() => setTab("checkup")} style={{ padding: "8px 12px", borderRadius: 8, background: tab === "checkup" ? "#e3f2fd" : "#f5f5f5" }}>
          健診データ
        </button>
        <button onClick={() => setTab("blood")} style={{ padding: "8px 12px", borderRadius: 8, background: tab === "blood" ? "#e3f2fd" : "#f5f5f5" }}>
          血液検査データ
        </button>
      </div>
      {tab === "home" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="card" style={{ border: "1px dashed #ddd" }}>
            <h3>今日のアクション</h3>
            <div>{state.todayNudge ?? "アクションを生成しましょう。"}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => actions.generateNudge()}>ナッジを生成</button>
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
      )}
      {tab === "checkup" && <HealthForm />}
      {tab === "blood" && <BloodTestForm />}
    </div>
  );
}

