import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { seoPrerender } from "./scripts/seoPrerender";
import { resolvePublicClientEnv } from "./scripts/publicClientEnv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const publicEnv = resolvePublicClientEnv(loadEnv(mode, process.cwd(), "VITE_"));
  return ({
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicEnv.VITE_SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY),
  },
  // Absolute base so lazy chunks resolve from site root on deep routes (/deep-dive/scores, etc.).
  // Relative "./" breaks on nested SPA paths (assets 404 → infinite loading spinner).
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), seoPrerender(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      {
        find: /^(?:\.\.\/)+assets\/hdri\/moonless_golf_1k\.hdr\?url$/,
        replacement: path.resolve(__dirname, "./src/assets/moonless-golf-url.ts"),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.fbx"],
  optimizeDeps: {
    include: ["lucide-react", "recharts"],
    exclude: ["three-good-godrays"],
  },
  });
});
