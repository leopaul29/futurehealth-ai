import { useRef, useState, useEffect } from "react";
import type { HealthMetrics } from "../types";
import { useApp } from "../state/context";
import { extractMetricsWithGPT } from "../services/gptVisionOcr";

// Removed normalizeDigits utility (not used with GPT OCR)

/**
 * Enhanced Parsing: Specifically tuned for Japanese Health Check table layouts
 */
// Removed local regex parser in favor of GPT-based OCR

export default function BloodTestForm() {
  const { actions } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);
  
  // Data State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [labs, setLabs] = useState<Partial<HealthMetrics>>({});

  function randomLabsValues(): Partial<HealthMetrics> {
    const intIn = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
    const floatIn = (min: number, max: number, dp = 1) => {
      const v = min + Math.random() * (max - min);
      const m = Math.pow(10, dp);
      return Math.round(v * m) / m;
    };
    return {
      totalChol: intIn(160, 250),
      ldl: intIn(80, 180),
      hdl: intIn(35, 80),
      tg: intIn(60, 250),
      fpg: intIn(85, 120),
      hba1c: floatIn(5.0, 7.0, 1),
      ast: intIn(15, 60),
      alt: intIn(15, 60),
      ggt: intIn(10, 120),
      uricAcid: floatIn(3.0, 8.0, 1),
      creatinine: floatIn(0.6, 1.2, 1),
      egfr: intIn(55, 100),
      crp: floatIn(0.0, 0.5, 2),
    };
  }

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(null);
    setRawText(null);
    setLoading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      setStatus("ChatGPTへ送信中");
      setProgress(20);
      const data = await extractMetricsWithGPT(file, "blood");
      const parsedData: Partial<HealthMetrics> = data;
      setRawText(JSON.stringify(data, null, 2));
      setProgress(100);
      setStatus("完了");
      setLabs(prev => ({ ...prev, ...parsedData }));
      
      if (Object.keys(parsedData).length === 0) {
        setErr("文字は読み取れましたが、項目（数値）を特定できませんでした。手入力で補完してください。");
      }

    } catch (error) {
      console.error(error);
      setErr("OCR処理中にエラーが発生しました。インターネット接続や画像形式を確認してください。");
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus("");
    }
  };

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setHealth(labs as HealthMetrics);
    actions.recompute();
  };

  return (
    <div className="card blood-test-container">
      <h3>🏥 健診データ自動入力</h3>
      <p style={{ fontSize: '0.8rem', color: '#666' }}>
        健康診断の結果を撮影してアップロードしてください。
      </p>

      <div className="upload-section" style={{ marginBottom: 20 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
        <button 
          className="primary-button"
          onClick={() => fileInputRef.current?.click()} 
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
            
            {rawText && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12 }}>OCR 生データ表示 (デバッグ用)</summary>
                <pre style={{ fontSize: 10, background: '#f5f5f5', padding: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                  {rawText}
                </pre>
              </details>
            )}
          </div>
        )}

        <form onSubmit={onApply} className="labs-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {Object.keys(labs).length === 0 && !loading && (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.5 }}>データがありません</p>
            )}
            {([
              { key: "totalChol", label: "総コレステロール", step: "1" },
              { key: "ldl", label: "LDL", step: "1" },
              { key: "hdl", label: "HDL", step: "1" },
              { key: "tg", label: "中性脂肪", step: "1" },
              { key: "fpg", label: "空腹時血糖", step: "1" },
              { key: "hba1c", label: "HbA1c", step: "0.1" },
              { key: "ast", label: "AST", step: "1" },
              { key: "alt", label: "ALT", step: "1" },
              { key: "ggt", label: "γ-GTP", step: "1" },
              { key: "uricAcid", label: "尿酸", step: "0.1" },
              { key: "creatinine", label: "クレアチニン", step: "0.1" },
              { key: "egfr", label: "eGFR", step: "1" },
              { key: "crp", label: "CRP", step: "0.1" },
            ] as { key: keyof HealthMetrics; label: string; step: string }[]).map(({ key, label, step }) => {
              const value = labs[key] ?? "";
              const hasValue = labs[key] !== undefined;
              return (
                <label key={String(key)} style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                  {label}
                  <input
                    type="number"
                    step={step}
                    value={value as number | string}
                    onChange={(e) =>
                      setLabs({
                        ...labs,
                        [key]: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    style={{ padding: 5, border: hasValue ? '2px solid #4CAF50' : '1px solid #ccc' }}
                  />
                </label>
              );
            })}
          </div>

          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="submit" className="apply-button" style={{ padding: 10, background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}>
              Update Score
            </button>
            <button
              type="button"
              style={{ padding: 10, background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}
              onClick={() => {
                setLabs((prev) => ({ ...prev, ...randomLabsValues() }));
              }}
            >
              Random
            </button>
            <button
              type="button"
              style={{ padding: 10, background: '#9e9e9e', color: 'white', border: 'none', borderRadius: 4 }}
              onClick={() => {
                setLabs({});
                setRawText(null);
                setErr(null);
                setProgress(0);
                setStatus("");
                setPreviewUrl((u) => {
                  if (u) URL.revokeObjectURL(u);
                  return null;
                });
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
