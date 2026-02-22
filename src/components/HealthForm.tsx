import { useRef, useState, useEffect } from "react";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (f: File) => {
    setErr(null);
    setLoading(true);
    try {
      setStatus("ChatGPTへ送信中");
      setProgress(20);
      setPreviewUrl(URL.createObjectURL(f));
      const data = await extractMetricsWithGPT(f, "checkup");
      const parsed: Partial<HealthMetrics> = data;
      setOcrRaw(JSON.stringify(data));
      const merged: HealthMetrics = { ...form, ...parsed };
      setForm(merged);
      setProgress(100);
      setStatus("完了");
    } catch {
      setErr("OpenAI OCRに失敗しました。APIキーやネットワークを確認してください。");
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus("");
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
      <h3>健診データ自動入力</h3>
      <div className="upload-section" style={{ marginBottom: 20 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          hidden
        />
        <button
          className="primary-button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          {loading ? `解析中 (${progress}%)` : "📷 画像をアップロード"}
        </button>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#777" }}>OCRモード: ChatGPT</span>

        {loading && (
          <div className="progress-bar-container" style={{ marginTop: 10 }}>
            <div className="status-text" style={{ fontSize: 12 }}>{status}...</div>
            <div style={{ width: '100%', background: '#eee', height: 8, borderRadius: 4 }}>
              <div style={{ width: `${progress}%`, background: '#4CAF50', height: '100%', borderRadius: 4, transition: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {err && <div className="error-box" style={{ color: 'white', background: 'crimson', padding: 10, borderRadius: 4, marginBottom: 10 }}>{err}</div>}

      <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: 20 }}>
        {previewUrl && (
          <div className="preview-pane">
            <small>アップロード画像:</small>
            <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: 8, border: '1px solid #ddd' }} />
            {ocrRaw && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12 }}>OCR 生データ表示 (デバッグ用)</summary>
                <pre style={{ fontSize: 10, background: '#f5f5f5', padding: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                  {ocrRaw}
                </pre>
              </details>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 12 }}>
          <button type="submit" className="apply-button" style={{ padding: 10, background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}>
            Update Score
          </button>
          <button
            type="button"
            style={{ padding: 10, background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
            onClick={() => {
              const rnd = randomHealth();
              setForm(rnd);
              setOcrRaw(null);
            }}
          >
            Random
          </button>
          <button
            type="button"
            style={{ padding: 10, background: '#9e9e9e', color: 'white', border: 'none', borderRadius: 4 }}
            onClick={() => {
              setForm({});
              setOcrRaw(null);
              setPreviewUrl((u) => {
                if (u) URL.revokeObjectURL(u);
                return null;
              });
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#555" }}>
          {state.lastRecomputeAt
            ? `最終再計算: ${new Date(state.lastRecomputeAt).toLocaleString()} ／ スコア ${state.risk?.riskScore ?? "-" }`
            : "再計算はまだ行われていません"}
        </div>
        </form>
      </div>
    </div>
  );
}
