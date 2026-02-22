import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import type { HealthMetrics } from "../types";
import { useApp } from "../state/context";

function normalizeDigits(s: string) {
  const map: Record<string, string> = {
    "０": "0",
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
    "．": ".",
    "，": ",",
  };
  return s.replace(/[０-９．，]/g, (c) => map[c] ?? c);
}

function parseLabs(text: string): Partial<HealthMetrics> {
  const t = normalizeDigits(text).replace(/\s+/g, " ").toLowerCase();
  const out: Partial<HealthMetrics> = {};
  const num = (m: RegExpMatchArray | null) => {
    if (!m) return undefined;
    const v = parseFloat(m[1].replace(/,/g, "."));
    return Number.isFinite(v) ? v : undefined;
  };
  const grab = (pattern: RegExp) => num(t.match(pattern));

  const totalChol =
    grab(/総コレステロール[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/総コレ[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/total\s*chol[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (totalChol !== undefined) out.totalChol = totalChol;

  const ldl =
    grab(/ldl[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/ldlコレステロール[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (ldl !== undefined) out.ldl = ldl;

  const hdl =
    grab(/hdl[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/hdlコレステロール[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (hdl !== undefined) out.hdl = hdl;

  const tg =
    grab(/中性脂肪[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/\btg[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/triglycerides[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (tg !== undefined) out.tg = tg;

  const fpg =
    grab(/空腹時血糖[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/血糖[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/\bfpg[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (fpg !== undefined) out.fpg = fpg;

  const hba1c =
    grab(/ヘモグロビンa1c[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ??
    grab(/hba1c[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (hba1c !== undefined) out.hba1c = hba1c;

  const ast =
    grab(/\bast[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\bgot[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (ast !== undefined) out.ast = ast;

  const alt =
    grab(/\balt[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\bgpt[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (alt !== undefined) out.alt = alt;

  const ggt =
    grab(/γ[-‐ー]?\s?gtp[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/ガンマ\s?gtp[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\bggt[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (ggt !== undefined) out.ggt = ggt;

  const uric =
    grab(/尿酸[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\buric[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (uric !== undefined) out.uricAcid = uric;

  const crea =
    grab(/クレアチニン[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\bcreatinine[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (crea !== undefined) out.creatinine = crea;

  const bun =
    grab(/尿素窒素[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i) ||
    grab(/\bbun[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (bun !== undefined) out.bun = bun;

  const egfr =
    grab(/\begfr[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (egfr !== undefined) out.egfr = egfr;

  const crp =
    grab(/\bcrp[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (crp !== undefined) out.crp = crp;

  return out;
}

export default function BloodTestForm() {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Partial<HealthMetrics>>({});
  const [labs, setLabs] = useState<Partial<HealthMetrics>>({});

  function randomLabsValues(): Partial<HealthMetrics> {
    const pick = (min: number, max: number, dp = 0) => {
      const v = min + Math.random() * (max - min);
      const m = Math.pow(10, dp);
      return Math.round(v * m) / m;
    };
    return {
      totalChol: Math.round(pick(160, 250)),
      ldl: Math.round(pick(80, 180)),
      hdl: Math.round(pick(35, 80)),
      tg: Math.round(pick(60, 250)),
      fpg: Math.round(pick(85, 120)),
      hba1c: pick(5.0, 7.0, 1),
      ast: Math.round(pick(15, 60)),
      alt: Math.round(pick(15, 60)),
      ggt: Math.round(pick(10, 120)),
      uricAcid: pick(3.0, 8.0, 1),
      creatinine: pick(0.6, 1.2, 1),
      egfr: Math.round(pick(55, 100)),
      crp: pick(0.00, 0.50, 2),
    };
  }

  const handleFile = async (f: File) => {
    setErr(null);
    setLoading(true);
    try {
      let worker;
      try {
        worker = await createWorker("jpn+eng", 1);
      } catch {
        worker = await createWorker("eng", 1);
      }
      const { data: { text } } = await worker.recognize(f);
      await worker.terminate();
      setRaw(text);
      const p = parseLabs(text);
      setParsed(p);
      setLabs((l) => ({ ...l, ...p }));
    } catch {
      setErr("OCRの読み取りに失敗しました。画像の解像度や明るさを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setHealth(labs as HealthMetrics);
    actions.recompute();
  };

  return (
    <div className="card">
      <h3>血液検査データ（日本語OCR）</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
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
      {/* {raw !== null && (
        <div style={{ fontSize: 12, color: "#444", background: "#fafafa", padding: 12, borderRadius: 8, marginBottom: 8 }}>
          <div>OCR解析結果: 文字数 {raw.length}</div>
          <div>
            検出フィールド:
            {parsed && Object.keys(parsed).length > 0
              ? Object.entries(parsed)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(" / ")
              : " なし"}
          </div>
        </div>
      )} */}
      <form onSubmit={onApply} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          総コレステロール
          <input
            type="number"
            value={labs.totalChol ?? ""}
            onChange={(e) => setLabs({ ...labs, totalChol: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          LDL
          <input
            type="number"
            value={labs.ldl ?? ""}
            onChange={(e) => setLabs({ ...labs, ldl: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          HDL
          <input
            type="number"
            value={labs.hdl ?? ""}
            onChange={(e) => setLabs({ ...labs, hdl: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          中性脂肪
          <input
            type="number"
            value={labs.tg ?? ""}
            onChange={(e) => setLabs({ ...labs, tg: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          空腹時血糖
          <input
            type="number"
            value={labs.fpg ?? ""}
            onChange={(e) => setLabs({ ...labs, fpg: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          HbA1c
          <input
            type="number"
            step="0.1"
            value={labs.hba1c ?? ""}
            onChange={(e) => setLabs({ ...labs, hba1c: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          AST(GOT)
          <input
            type="number"
            value={labs.ast ?? ""}
            onChange={(e) => setLabs({ ...labs, ast: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          ALT(GPT)
          <input
            type="number"
            value={labs.alt ?? ""}
            onChange={(e) => setLabs({ ...labs, alt: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          γ-GTP
          <input
            type="number"
            value={labs.ggt ?? ""}
            onChange={(e) => setLabs({ ...labs, ggt: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          尿酸
          <input
            type="number"
            value={labs.uricAcid ?? ""}
            onChange={(e) => setLabs({ ...labs, uricAcid: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          クレアチニン
          <input
            type="number"
            value={labs.creatinine ?? ""}
            onChange={(e) => setLabs({ ...labs, creatinine: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          eGFR
          <input
            type="number"
            value={labs.egfr ?? ""}
            onChange={(e) => setLabs({ ...labs, egfr: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <label>
          CRP
          <input
            type="number"
            step="0.01"
            value={labs.crp ?? ""}
            onChange={(e) => setLabs({ ...labs, crp: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </label>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12 }}>
          <button type="submit">反映して再計算</button>
          <button
            type="button"
            onClick={() => {
              setLabs((l) => ({ ...l, ...randomLabsValues() }));
            }}
          >
            ランダム入力
          </button>
          <button
            type="button"
            onClick={() => {
              setLabs({});
              setParsed({});
              setRaw(null);
            }}
          >
            クリア
          </button>
        </div>
      </form>
    </div>
  );
}
