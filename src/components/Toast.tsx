import { useState } from "react";
import { useApp } from "../state/context";

export default function Toast() {
  const { state } = useApp();
  const [visible, setVisible] = useState(true);

  if (!visible || !state.todayNudge) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "12px 16px",
        background: "#333",
        color: "white",
        borderRadius: 8,
        maxWidth: 360,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 9999,
      }}
    >
      <strong>ナッジ</strong>
      <div style={{ marginTop: 4 }}>{state.todayNudge}</div>
      <button
        onClick={() => setVisible(false)}
        style={{ marginTop: 8, background: "#555", color: "white", border: "none", padding: "6px 10px", borderRadius: 6 }}
      >
        閉じる
      </button>
    </div>
  );
}
