import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import type { HealthMetrics } from "../types";
import { useApp } from "../state/context";

function parseMetricsFromText(text: string): Partial<HealthMetrics> {
  const t = text.replace(/\s+/g, " ").toLowerCase();
  const out: Partial<HealthMetrics> = {};
  const num = (m: RegExpMatchArray | null) => {
    if (!m) return undefined;
    const v = parseFloat(m[1].replace(/,/g, "."));
    return Number.isFinite(v) ? v : undefined;
  };
  const bmi = num(t.match(/bmi[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i));
  if (bmi !== undefined) out.bmi = bmi;
  const hba1c = num(t.match(/hba1c[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i));
  if (hba1c !== undefined) out.hba1c = hba1c;
  const ldl = num(t.match(/ldl[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i));
  if (ldl !== undefined) out.ldl = ldl;
  // Pattern 1: 収縮期/拡張期 in separate cells (Japanese labels)
  const sbp = num(t.match(/収縮期[^0-9]{0,8}([1-2]?[0-9]{2})/));
  const dbp = num(t.match(/拡張期[^0-9]{0,8}([4-9][0-9]|1[0-2][0-9])/));
  if (sbp !== undefined) out.systolicBp = Math.round(sbp);
  if (dbp !== undefined) out.diastolicBp = Math.round(dbp);
  // Pattern 2: numeric pair like 120/80
  const bpPair = t.match(/([1-2][0-9]{2}|[8-9][0-9]|[1-9][0-9])\s*\/\s*([4-9][0-9]|1[0-2][0-9])/);
  if (bpPair) {
    const s = parseInt(bpPair[1], 10);
    const d = parseInt(bpPair[2], 10);
    if (out.systolicBp === undefined && Number.isFinite(s)) out.systolicBp = s;
    if (out.diastolicBp === undefined && Number.isFinite(d)) out.diastolicBp = d;
  }
  return out;
}

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

  async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const url = URL.createObjectURL(file);
      const i = new Image();
      i.onload = () => {
        URL.revokeObjectURL(url);
        res(i);
      };
      i.onerror = (e) => rej(e);
      i.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = gray > 180 ? 255 : 0; // simple threshold
      data[i] = data[i + 1] = data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  const handleFile = async (f: File) => {
    setErr(null);
    setLoading(true);
    try {
      const canvas = await preprocessImage(f);
      let worker;
      try {
        worker = await createWorker("jpn+eng", 1);
      } catch {
        worker = await createWorker("eng", 1);
      }
      const {
        data: { text },
      } = await worker.recognize(canvas);
      await worker.terminate();
      setOcrRaw(text);
      const parsed = parseMetricsFromText(text);
      setOcrParsed(parsed);
      const merged: HealthMetrics = { ...form, ...parsed };
      setForm(merged);
    } catch {
      setErr("OCRの読み取りに失敗しました。手入力で調整してください。");
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
            accept="image/*,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}>
            画像から自動読み取り
          </button>
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
