import type { HealthMetrics } from "../types";

type OcrTarget = "checkup" | "blood";

function pickModel() {
  const m = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_OPENAI_MODEL;
  return m || "gpt-4o-mini";
}

function pickBaseUrl() {
  const b = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_OPENAI_BASE_URL;
  return b || "https://api.openai.com";
}

function getApiKey() {
  const k = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_OPENAI_API_KEY;
  if (!k) throw new Error("VITE_OPENAI_API_KEY is not set");
  return k;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function buildPrompt(target: OcrTarget) {
  const common =
    "You are a strict medical report parser. Read the image and extract only numeric values. Return a single JSON object, no prose. Omit keys you cannot find. Use numbers only (no units). Use dot as decimal.";
  if (target === "checkup") {
    return `${common} Allowed keys: ["bmi","systolicBp","diastolicBp","hba1c","ldl"].`;
  }
  return `${common} Allowed keys: ["totalChol","ldl","hdl","tg","fpg","hba1c","ast","alt","ggt","uricAcid","creatinine","egfr","crp"].`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    // Attempt direct parse first
    return JSON.parse(trimmed);
  } catch {
    // Look for JSON within markdown code blocks or curly braces
    const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/) || trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        throw new Error("Found JSON-like string but it's invalid: " + e);
      }
    }
    throw new Error("No valid JSON found in model output: " + trimmed.substring(0, 100));
  }
}

export async function extractMetricsWithGPT(
  file: File,
  target: OcrTarget
): Promise<Partial<HealthMetrics>> {
  const apiKey = getApiKey();
  const model = pickModel();
  const base = pickBaseUrl();
  
  // FIXED: No more stack overflow
  const dataUrl = await fileToDataUrl(file);

  const body = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(target) },
          { 
            type: "image_url", 
            image_url: { 
                url: dataUrl,
                detail: "low" // 'low' is faster and cheaper, usually enough for text
            } 
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 500,
  };

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`OpenAI error ${res.status}: ${errorBody.error?.message || res.statusText}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  
  if (!content) throw new Error("Empty response from OpenAI");
  
  return extractJson(content) as Partial<HealthMetrics>;
}
