import { useState } from "react";
import type { WearableDaily, WearableSummary } from "../types";
import { useApp } from "../state/context";

function generateSample(days = 14): WearableSummary {
  const res: WearableDaily[] = [];
  const start = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    res.push({
      date: d.toISOString().slice(0, 10),
      steps: Math.round(4000 + Math.random() * 8000),
      sleepHours: Math.round((6 + Math.random() * 3) * 10) / 10,
      avgHr: Math.round(60 + Math.random() * 20),
    });
  }
  return { days: res };
}

export default function WearableUploader() {
  const { state, actions } = useApp();
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f: File) => {
    setErr(null);
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      if (!Array.isArray(json)) throw new Error("Invalid format");
      const days: WearableDaily[] = json.map((d) => ({
        date: d.date,
        steps: Number(d.steps),
        sleepHours: Number(d.sleepHours),
        avgHr: d.avgHr ? Number(d.avgHr) : undefined,
      }));
      actions.setWearables({ days });
      actions.recompute();
    } catch {
      setErr("JSON形式が不正です。[{ date, steps, sleepHours, avgHr? }] の配列をアップロードしてください。");
    }
  };

  const downloadTemplate = () => {
    const sample = generateSample(7).days;
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wearables-sample.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3>ウェアラブルデータ連携（JSONアップロード or サンプル生成）</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="file"
          accept="application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button onClick={() => actions.setWearables(generateSample(14))}>サンプルデータで上書き</button>
        <button onClick={downloadTemplate}>テンプレートJSONをダウンロード</button>
        {err && <span style={{ color: "crimson" }}>{err}</span>}
      </div>
      <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
        直近 {state.wearables.days.length} 日分読み込み済み。
      </div>
    </div>
  );
}
