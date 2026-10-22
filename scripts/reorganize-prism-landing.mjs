/**
 * One-shot: move prism-landing modules into subfolders and rewrite relative imports.
 * Run from repo root: node scripts/reorganize-prism-landing.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PRISM = path.join(ROOT, "src/pages/dev/prism-landing");

const MOVES = {
  "LANDING_SCENE_TOPOLOGY_PROMPT.md": "docs/LANDING_SCENE_TOPOLOGY_PROMPT.md",
  "LANDING_CINEMATIC_BIBLE.md": "docs/LANDING_CINEMATIC_BIBLE.md",
  "LANDING_DRONE_POSTPRODUCTION.md": "docs/LANDING_DRONE_POSTPRODUCTION.md",
  "LANDING_DRONE_CINEMATIC_MOVES.md": "docs/LANDING_DRONE_CINEMATIC_MOVES.md",
  "prism-landing.css": "styles/prism-landing.css",
  "prism-layout.css": "styles/prism-layout.css",
  "PrismLandingPage.tsx": "pages/PrismLandingPage.tsx",
  "PrismLayoutPage.tsx": "pages/PrismLayoutPage.tsx",
  "ShatteredCubeDevPage.tsx": "pages/ShatteredCubeDevPage.tsx",
  "PrismLandingCanvas.tsx": "ui/PrismLandingCanvas.tsx",
  "MonolithLandingCanvas.tsx": "ui/MonolithLandingCanvas.tsx",
  "PrismLandingSettingsPanel.tsx": "ui/PrismLandingSettingsPanel.tsx",
  "MonolithSettingsPanel.tsx": "ui/MonolithSettingsPanel.tsx",
  "cameraPath.ts": "camera/cameraPath.ts",
  "landingCameraKeyframes.ts": "camera/landingCameraKeyframes.ts",
  "landingCameraKeyframesUserLegacy.ts": "camera/landingCameraKeyframesUserLegacy.ts",
  "landingCameraPathPresets.ts": "camera/landingCameraPathPresets.ts",
  "layoutEditorCameraPath.ts": "camera/layoutEditorCameraPath.ts",
  "pathSamplerByKeyframeU.ts": "camera/pathSamplerByKeyframeU.ts",
  "landingTravellingRig.ts": "camera/landingTravellingRig.ts",
  "landingPathLensFov.ts": "camera/landingPathLensFov.ts",
  "landingCubeMarkShot.ts": "camera/landingCubeMarkShot.ts",
  "landingVilleneuvePillarFinale.ts": "camera/landingVilleneuvePillarFinale.ts",
  "landingCinematicContract.ts": "cinematic/landingCinematicContract.ts",
  "landingDefaultShotList.ts": "cinematic/landingDefaultShotList.ts",
  "landingDroneMovesContract.ts": "cinematic/landingDroneMovesContract.ts",
  "landingDronePostContract.ts": "cinematic/landingDronePostContract.ts",
  "sceneLayout.ts": "layout/sceneLayout.ts",
  "landingSceneLayout.ts": "layout/landingSceneLayout.ts",
  "portalAssemblyLayout.ts": "layout/portalAssemblyLayout.ts",
  "prismSceneConstants.ts": "layout/prismSceneConstants.ts",
  "prismLayoutSceneScale.ts": "layout/prismLayoutSceneScale.ts",
  "landingSubjectBounds.ts": "layout/landingSubjectBounds.ts",
  "landingTerrainHeight.ts": "layout/landingTerrainHeight.ts",
  "createCosmicMonolithScene.ts": "scene/createCosmicMonolithScene.ts",
  "createCosmicMonolithLandingScene.ts": "scene/createCosmicMonolithLandingScene.ts",
  "createMonolithWebgpuScene.ts": "scene/createMonolithWebgpuScene.ts",
  "createAegisText3D.ts": "scene/createAegisText3D.ts",
  "createLandingHeadlines3D.ts": "scene/createLandingHeadlines3D.ts",
  "atmosphere.ts": "scene/atmosphere.ts",
  "cubeEnvironment.ts": "scene/cubeEnvironment.ts",
  "navigationGuideLine.ts": "scene/navigationGuideLine.ts",
  "shatteredCubeAssets.ts": "scene/shatteredCubeAssets.ts",
  "marbleMonolithAssets.ts": "scene/marbleMonolithAssets.ts",
  "landingRenderTuning.ts": "scene/landingRenderTuning.ts",
  "monolithColorPipeline.ts": "monolith/monolithColorPipeline.ts",
  "monolithEmissiveLevels.ts": "monolith/monolithEmissiveLevels.ts",
  "monolithExposureMeter.ts": "monolith/monolithExposureMeter.ts",
  "monolithPipelineDebug.ts": "monolith/monolithPipelineDebug.ts",
  "monolithPortalGlow.ts": "monolith/monolithPortalGlow.ts",
  "monolithRendererTone.ts": "monolith/monolithRendererTone.ts",
  "monolithVisualContract.ts": "monolith/monolithVisualContract.ts",
  "three-monolith-modules.d.ts": "monolith/three-monolith-modules.d.ts",
  "prismLandingCharacter.ts": "character/prismLandingCharacter.ts",
  "prismLandingCharacterAnimations.ts": "character/prismLandingCharacterAnimations.ts",
  "prismLandingCharacterFbx.ts": "character/prismLandingCharacterFbx.ts",
  "motifectFbxRemap.ts": "character/motifectFbxRemap.ts",
  "povWalk.ts": "locomotion/povWalk.ts",
  "thirdPersonWalk.ts": "locomotion/thirdPersonWalk.ts",
  "walkSurface.ts": "locomotion/walkSurface.ts",
};

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveFiles() {
  for (const [from, to] of Object.entries(MOVES)) {
    const src = path.join(PRISM, from);
    const dest = path.join(PRISM, to);
    if (!fs.existsSync(src)) {
      if (fs.existsSync(dest)) continue;
      console.warn("skip missing:", from);
      continue;
    }
    ensureDirFor(dest);
    fs.renameSync(src, dest);
    console.log("mv", from, "->", to);
  }
}

function listSourceFiles(dir = PRISM, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "assets") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) listSourceFiles(full, acc);
    else if (/\.(tsx?|md)$/.test(name)) acc.push(full);
  }
  return acc;
}

function moduleIdFromFile(absPath) {
  const rel = path.relative(PRISM, absPath).replace(/\\/g, "/");
  return rel.replace(/\.(tsx?)$/, "");
}

function buildModuleIndex() {
  const index = new Map();
  for (const file of listSourceFiles()) {
    const id = moduleIdFromFile(file);
    index.set(id, id);
    const base = path.basename(id);
    if (!index.has(`@base:${base}`)) index.set(`@base:${base}`, id);
    else index.set(`@base:${base}`, null);
  }
  return index;
}

function resolveSpecifier(importerId, spec) {
  if (!spec.startsWith(".")) return spec;
  const importerDir = path.dirname(importerId);
  const joined = path.normalize(path.join(importerDir, spec)).replace(/\\/g, "/");
  const withoutQuery = joined.split("?")[0];
  return withoutQuery;
}

function findTargetModule(resolved, moduleIndex, allIds) {
  const candidates = [
    resolved,
    resolved.replace(/\.(tsx?)$/, ""),
  ];
  for (const c of candidates) {
    if (moduleIndex.has(c)) return c;
  }
  const base = path.basename(resolved).replace(/\.(tsx?)$/, "");
  const byBase = moduleIndex.get(`@base:${base}`);
  if (byBase) return byBase;
  const suffix = allIds.filter((id) => id.endsWith(`/${base}`) || id === base);
  if (suffix.length === 1) return suffix[0];
  return null;
}

function toRelativeImport(fromId, toModuleId) {
  let rel = path.relative(path.dirname(fromId), toModuleId).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function fixImportsInFile(absPath, moduleIndex, allIds) {
  const importerId = moduleIdFromFile(absPath);
  let text = fs.readFileSync(absPath, "utf8");
  const re = /from\s+(['"])(\.[^'"]+)(['"])/g;
  let changed = false;
  text = text.replace(re, (full, q1, spec, q2) => {
    const [pathPart, query] = spec.includes("?") ? [spec.slice(0, spec.indexOf("?")), spec.slice(spec.indexOf("?"))] : [spec, ""];
    const resolved = resolveSpecifier(importerId, pathPart);
    const target = findTargetModule(resolved, moduleIndex, allIds);
    if (!target) return full;
    const physical = path.join(PRISM, `${target}.ts`);
    const physicalTsx = path.join(PRISM, `${target}.tsx`);
    const exists =
      fs.existsSync(physical) ||
      fs.existsSync(physicalTsx) ||
      fs.existsSync(path.join(PRISM, resolved + ".ts")) ||
      fs.existsSync(path.join(PRISM, resolved + ".tsx"));
    const attemptPath = path.join(PRISM, resolved);
    const attemptOk =
      fs.existsSync(`${attemptPath}.ts`) ||
      fs.existsSync(`${attemptPath}.tsx`) ||
      fs.existsSync(attemptPath);
    if (attemptOk) return full;
    const newRel = toRelativeImport(importerId, target) + query;
    if (newRel === pathPart + query) return full;
    changed = true;
    return `from ${q1}${newRel}${q2}`;
  });

  const reImport = /import\s+(['"])(\.[^'"]+)(['"])/g;
  text = text.replace(reImport, (full, q1, spec, q2) => {
    if (!spec.startsWith("./assets") && !spec.startsWith("../assets")) return full;
    const importerDepth = importerId.split("/").length - 1;
    const needed = "../".repeat(importerDepth);
    if (importerDepth === 0) return full;
    const fixed = spec.replace(/^(\.\.\/)*assets\//, `${needed}assets/`);
    if (fixed === spec) return full;
    changed = true;
    return `import ${q1}${fixed}${q2}`;
  });

  const reSide = /from\s+(['"])(\.\/assets\/[^'"]+)(['"])/g;
  text = text.replace(reSide, (full, q1, spec, q2) => {
    const importerDepth = importerId.split("/").length - 1;
    if (importerDepth === 0) return full;
    const fixed = spec.replace(/^\.\/assets\//, "../assets/");
    if (fixed === spec) return full;
    changed = true;
    return `from ${q1}${fixed}${q2}`;
  });

  if (changed) fs.writeFileSync(absPath, text);
}

function fixAllImports() {
  const moduleIndex = buildModuleIndex();
  const allIds = [...moduleIndex.keys()].filter((k) => !k.startsWith("@base:"));
  for (const file of listSourceFiles()) {
    if (!/\.tsx?$/.test(file)) continue;
    fixImportsInFile(file, moduleIndex, allIds);
  }
}

function patchAppAndDocs() {
  const appPath = path.join(ROOT, "src/App.tsx");
  let app = fs.readFileSync(appPath, "utf8");
  app = app.replace(
    "./pages/dev/prism-landing/PrismLandingPage",
    "./pages/dev/prism-landing/pages/PrismLandingPage",
  );
  app = app.replace(
    "./pages/dev/prism-landing/ShatteredCubeDevPage",
    "./pages/dev/prism-landing/pages/ShatteredCubeDevPage",
  );
  app = app.replace(
    "./pages/dev/prism-landing/PrismLayoutPage",
    "./pages/dev/prism-landing/pages/PrismLayoutPage",
  );
  fs.writeFileSync(appPath, app);

  const contract = path.join(PRISM, "cinematic/landingCinematicContract.ts");
  if (fs.existsSync(contract)) {
    let t = fs.readFileSync(contract, "utf8");
    t = t.replace(
      "@see src/pages/dev/prism-landing/LANDING_CINEMATIC_BIBLE.md",
      "@see src/pages/dev/prism-landing/docs/LANDING_CINEMATIC_BIBLE.md",
    );
    fs.writeFileSync(contract, t);
  }
}

function writeReadme() {
  const readme = `# Prism landing (dev)

Organisation du module \`/dev/prism-landing\` et \`/dev/prism-layout\`.

| Dossier | Rôle |
|---------|------|
| \`pages/\` | Routes React (landing, layout editor, cube dev) |
| \`ui/\` | Canvas WebGL + panneaux réglages |
| \`camera/\` | Path travelling, keyframes, presets, rig |
| \`cinematic/\` | Contrats shot list, drone moves / post |
| \`layout/\` | Positions scène, bounds, terrain, constantes |
| \`scene/\` | Construction Three.js (monolithe cosmique, assets) |
| \`monolith/\` | Pipeline rendu WebGPU / debug |
| \`character/\` | Personnage landing + FBX |
| \`locomotion/\` | Marche 3e personne, surface |
| \`components/\` | Sous-composants R3F / monolithe |
| \`assets/\` | GLB, textures, fonts |
| \`docs/\` | Bibles cinéma + prompt topologie IA |
| \`styles/\` | CSS des pages |

Point d’entrée landing : \`pages/PrismLandingPage.tsx\` → \`ui/PrismLandingCanvas.tsx\` → \`scene/createCosmicMonolithLandingScene.ts\`.
`;
  fs.writeFileSync(path.join(PRISM, "README.md"), readme);
}

moveFiles();
fixAllImports();
patchAppAndDocs();
writeReadme();
console.log("done");
