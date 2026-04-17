import { motion } from "motion/react";
import { OrbitalLoader } from "@/components/ui/orbital-loader";

/** Full-screen AEGIS loader + entrance motion (Suspense fallback, auth boot, dev preview). */
export function BootLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[min(100vw-2rem,920px)] flex justify-center"
      >
        <OrbitalLoader brand="AEGIS" />
      </motion.div>
    </div>
  );
}
