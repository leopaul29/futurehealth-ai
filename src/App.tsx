import "./App.css";
import AppProvider from "./state/AppState";
import Dashboard from "./components/Dashboard";
import GeneProfileSelector from "./components/GeneProfileSelector";
import HealthForm from "./components/HealthForm";
import BloodTestForm from "./components/BloodTestForm";
import WearableUploader from "./components/WearableUploader";
import Toast from "./components/Toast";

export default function App() {
  return (
    <AppProvider>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#42a5f5,#66bb6a)",
            }}
          />
          <h1 style={{ margin: 0, fontSize: 22 }}>FutureHealth AI</h1>
        </header>

        <Dashboard />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          {/* <GeneProfileSelector /> */}
          <HealthForm />
          <BloodTestForm />
          {/* <WearableUploader /> */}
        </div>
      </div>
      <Toast />
    </AppProvider>
  );
}
