import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** three-monolith addons import `three` / `three/webgpu` — keep them off the app's 0.170. */
function threeMonolithSelfResolve(): Plugin {
  const root = path.resolve(__dirname, "node_modules/three-monolith");
  const isMono = (importer?: string) =>
    Boolean(
      importer &&
        (importer.includes(`${path.sep}three-monolith${path.sep}`) ||
          importer.includes("/three-monolith/")),
    );

  return {
    name: "three-monolith-self-resolve",
    enforce: "pre",
    resolveId(id, importer) {
      if (!isMono(importer)) return null;
      if (id === "three" || id === "three/webgpu") {
        return path.join(root, "build/three.webgpu.js");
      }
      if (id === "three/tsl") {
        return path.join(root, "build/three.tsl.js");
      }
      if (id.startsWith("three/addons/")) {
        return path.join(root, "examples/jsm", id.slice("three/addons/".length));
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
  plugins: [
    threeMonolithSelfResolve(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "three/webgpu": path.resolve(
        __dirname,
        "node_modules/three-monolith/build/three.webgpu.js",
      ),
      "three/tsl": path.resolve(
        __dirname,
        "node_modules/three-monolith/build/three.tsl.js",
      ),
    },
  },
  assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.fbx"],
  optimizeDeps: {
    include: ["lucide-react", "recharts"],
    exclude: ["three-monolith", "three/webgpu", "three/tsl", "three-good-godrays"],
  },
}));
