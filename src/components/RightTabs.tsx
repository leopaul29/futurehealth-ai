import { useState } from "react";
import { useApp } from "../state/context";
import HealthForm from "./HealthForm";
import BloodTestForm from "./BloodTestForm";

export default function RightTabs() {
  const { state, actions } = useApp();
  const [tab, setTab] = useState<"home" | "wearable" | "checkup" | "blood">("home");

  return (
    <div className="card" style={{ height: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("home")}
          style={{ padding: "8px 12px", borderRadius: 8, background: tab === "home" ? "#e3f2fd" : "#f5f5f5" }}
        >
          サマリー・ナッジ
        </button>
        <button
          onClick={() => setTab("wearable")}
          style={{ padding: "8px 12px", borderRadius: 8, background: tab === "wearable" ? "#e3f2fd" : "#f5f5f5" }}
        >
          ウェアラブル
        </button>
        <button
          onClick={() => setTab("checkup")}
          style={{ padding: "8px 12px", borderRadius: 8, background: tab === "checkup" ? "#e3f2fd" : "#f5f5f5" }}
        >
          健診データ
        </button>
        <button
          onClick={() => setTab("blood")}
          style={{ padding: "8px 12px", borderRadius: 8, background: tab === "blood" ? "#e3f2fd" : "#f5f5f5" }}
        >
          血液検査データ
        </button>
      </div>
      {tab === "home" && (
        <div className="card" style={{ border: "1px dashed #ddd" }}>
          <h3>今日のアクション</h3>
          <div>{state.todayNudge ?? "アクションを生成しましょう。"}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => actions.generateNudge()}>ナッジを生成</button>
          </div>
        </div>
      )}
      {tab === "wearable" && (
        <div className="card" style={{ border: "1px dashed #ddd" }}>
          <h3>ウェアラブルサマリー（直近7日）</h3>
          <div style={{ borderTop: "1px solid #eee" }}>
            {state.wearables.days.slice(-7).map((d, idx) => (
              <div
                key={d.date}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  padding: "6px 0",
                  borderBottom: idx === state.wearables.days.slice(-7).length - 1 ? "none" : "1px solid #f0f0f0",
                  fontSize: 13,
                }}
              >
                <span>{d.date}</span>
                <span>歩数 {d.steps}</span>
                <span>
                  睡眠 {d.sleepHours}h
                  {d.avgHr ? ` ／ 心拍 ${d.avgHr} bpm` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "checkup" && <HealthForm />}
      {tab === "blood" && <BloodTestForm />}
    </div>
  );
}
