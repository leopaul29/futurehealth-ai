import { useRef, useState } from "react";
import type { HealthMetrics } from "../types";
import { useApp } from "../state/context";
import { extractMetricsWithGPT } from "../services/gptVisionOcr";

// Removed local text parsing & Tesseract. ChatGPT OCR only.

export default function HealthForm() {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<HealthMetrics>(() => state.health || {});
  const [ocrRaw, setOcrRaw] = useState<string | null>(null);
  const [ocrParsed, setOcrParsed] = useState<Partial<HealthMetrics> | null>(null);

  function randomHealth(): HealthMetrics {
    const pick = (min: number, max: number, step = 1) =>
      Math.round((min + Math.random() * (max - min)) / step) * step;
    const pickFloat = (min: number, max: number, dp = 1) => {
      const v = min + Math.random() * (max - min);
      const m = Math.pow(10, dp);
      return Math.round(v * m) / m;
    };
    return {
      bmi: pickFloat(18.0, 33.0, 1),
      systolicBp: pick(105, 150),
      diastolicBp: pick(60, 95),
      hba1c: pickFloat(5.0, 6.8, 1),
      ldl: pick(80, 180),
      updatedAt: new Date().toISOString(),
    };
  }

  // Local image preprocessing & OCR removed.

  const handleFile = async (f: File) => {
    setErr(null);
    setLoading(true);
    try {
      const data = await extractMetricsWithGPT(f, "checkup");
      const parsed: Partial<HealthMetrics> = data;
      setOcrRaw(JSON.stringify(data));
      setOcrParsed(parsed);
      setOcrParsed(parsed);
      const merged: HealthMetrics = { ...form, ...parsed };
      setForm(merged);
    } catch {
      setErr("OpenAI OCRに失敗しました。APIキーやネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setHealth(form);
    actions.recompute();
    actions.generateNudge();
  };

  return (
    <div className="card">
      <h3>健診データ入力（OCR対応）</h3>
      <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}>
            画像から自動読み取り
          </button>
          <span style={{ fontSize: 12, color: "#777" }}>OCRモード: ChatGPT</span>
          {loading && <span>読み取り中…</span>}
          {err && <span style={{ color: "crimson" }}>{err}</span>}
        </div>
        <label>
          BMI
          <input
            type="number"
            step="0.1"
            value={form.bmi ?? ""}
            onChange={(e) => setForm({ ...form, bmi: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          収縮期血圧（上）
          <input
            type="number"
            value={form.systolicBp ?? ""}
            onChange={(e) => setForm({ ...form, systolicBp: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </label>
        <label>
          拡張期血圧（下）
          <input
            type="number"
            value={form.diastolicBp ?? ""}
            onChange={(e) => setForm({ ...form, diastolicBp: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </label>
        <label>
          HbA1c（%）
          <input
            type="number"
            step="0.1"
            value={form.hba1c ?? ""}
            onChange={(e) => setForm({ ...form, hba1c: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          LDLコレステロール
          <input
            type="number"
            value={form.ldl ?? ""}
            onChange={(e) => setForm({ ...form, ldl: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </label>
        {ocrRaw !== null && (
          <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#444", background: "#fafafa", padding: 12, borderRadius: 8 }}>
            <div>OCR解析結果: 文字数 {ocrRaw.length}</div>
            <div>
              検出フィールド:
              {ocrParsed && Object.keys(ocrParsed).length > 0
                ? Object.entries(ocrParsed)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" / ")
                : " なし"}
            </div>
          </div>
        )}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              const rnd = randomHealth();
              setForm(rnd);
              setOcrRaw(null);
              setOcrParsed(null);
            }}
          >
            ランダム入力
          </button>
          <button type="submit">保存してリスク再計算</button>
          <button
            type="button"
            onClick={() => {
              setForm({});
              setOcrParsed(null);
            }}
          >
            クリア
          </button>
        </div>
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#555" }}>
          {state.lastRecomputeAt
            ? `最終再計算: ${new Date(state.lastRecomputeAt).toLocaleString()} ／ スコア ${state.risk?.riskScore ?? "-" }`
            : "再計算はまだ行われていません"}
        </div>
      </form>
    </div>
  );
}
