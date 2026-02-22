import type { GeneProfile, HealthMetrics, WearableSummary } from "../types";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNudge(
  gene: GeneProfile | undefined,
  health: HealthMetrics,
  wearables: WearableSummary
): string {
  const today = wearables.days.slice(-1)[0];
  const msgs: string[] = [];

  if (today) {
    if (today.steps < 6000) {
      msgs.push("今日は帰宅時に一駅分（約10～15分）歩きましょう。");
    } else if (today.steps < 9000) {
      msgs.push("エレベーターの代わりに階段を選んで、あと1,000歩上乗せ。");
    } else {
      msgs.push("素晴らしい歩数です。軽いストレッチで仕上げましょう。");
    }
    if (today.sleepHours < 6.5) {
      msgs.push("今夜は就寝30分前にスマホを置き、入眠を早めましょう。");
    }
  } else {
    msgs.push("5分の軽い散歩で1日の活動をスタートしましょう。");
  }

  if (typeof health.hba1c === "number" && health.hba1c >= 6.0) {
    msgs.push("夕食の白米を半分にし、サラダや汁物を先に食べましょう。");
  }
  if (typeof health.ldl === "number" && health.ldl >= 140) {
    msgs.push("今週は魚（特に青魚）を2回、揚げ物を1回減らしましょう。");
  }
  if (typeof health.bmi === "number" && health.bmi >= 27.5) {
    msgs.push("間食は200kcal以内に。ナッツや高カカオチョコを活用。");
  }

  if (gene) {
    if (gene.riskBias.diabetes === "high") {
      msgs.push("糖質は『主食・主菜・副菜』の順で。血糖スパイクを抑えましょう。");
    }
    if (gene.riskBias.cardiovascular === "high") {
      msgs.push("週2回の有酸素運動（20分）をカレンダーに予定登録。");
    }
  }

  // Return one or two concise items
  if (msgs.length === 0) {
    return "水分補給と3分の深呼吸でコンディションを整えましょう。";
  }
  if (msgs.length === 1) return msgs[0];
  return `${pick(msgs)} ${pick(msgs.filter((m) => m !== msgs[0]))}`;
}
