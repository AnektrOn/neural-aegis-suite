import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeApp } from "@/lib/capacitor";
import { applyTheme, getStoredThemeIsDark } from "@/lib/theme";

applyTheme(getStoredThemeIsDark());

void initNativeApp().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
