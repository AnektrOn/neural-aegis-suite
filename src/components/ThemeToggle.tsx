import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { applyTheme, getStoredThemeIsDark } from "@/lib/theme";

export default function ThemeToggle({
  collapsed,
  compact,
}: {
  collapsed?: boolean;
  compact?: boolean;
}) {
  const [dark, setDark] = useState(getStoredThemeIsDark);

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      className={
        compact
          ? "inline-flex items-center justify-center rounded-lg border-0 bg-transparent p-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          : "mx-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-lg p-3 text-muted-foreground transition-colors duration-200 hover:bg-popover hover:text-foreground cursor-pointer"
      }
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div key={dark ? "moon" : "sun"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </button>
  );
}
