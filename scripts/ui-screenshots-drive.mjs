/**
 * Capture Aegis routes at mobile / tablet / desktop and write into a Drive Desktop folder.
 * Usage:
 *   node scripts/ui-screenshots-drive.mjs --out "/path/to/Drive/.../2026-11-14" --theme dark \
 *     --storage .tmp-ui-shots/auth.json
 *
 * Save auth first (headed login):
 *   node scripts/ui-screenshots-save-auth.mjs --storage .tmp-ui-shots/auth.json
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AEGIS_BASE_URL || "http://127.0.0.1:8080";
const OUT = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : null;
const THEME = process.argv.includes("--theme")
  ? process.argv[process.argv.indexOf("--theme") + 1]
  : "light";
const STORAGE = process.argv.includes("--storage")
  ? process.argv[process.argv.indexOf("--storage") + 1]
  : null;

if (!OUT) {
  console.error("Missing --out <drive-folder>");
  process.exit(1);
}
if (THEME !== "light" && THEME !== "dark") {
  console.error("--theme must be light|dark");
  process.exit(1);
}
if (!STORAGE || !fs.existsSync(STORAGE)) {
  console.error("Missing valid --storage <auth.json> (login first via ui-screenshots-save-auth.mjs)");
  process.exit(1);
}

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

/** Public + member routes from App.tsx (auth walls are still useful screenshots). */
const ROUTES = [
  { slug: "home", path: "/" },
  { slug: "intro", path: "/intro" },
  { slug: "auth", path: "/auth" },
  { slug: "pricing", path: "/pricing" },
  { slug: "entreprise", path: "/entreprise" },
  { slug: "newsletter", path: "/newsletter" },
  { slug: "quiz", path: "/quiz" },
  { slug: "legal-privacy", path: "/legal/privacy" },
  { slug: "legal-terms", path: "/legal/terms" },
  { slug: "legal-refund", path: "/legal/refund" },
  { slug: "legal-mentions", path: "/legal/mentions" },
  { slug: "install-android", path: "/install-android" },
  { slug: "welcome", path: "/welcome" },
  { slug: "welcome-voice-agent", path: "/welcome/voice-agent" },
  { slug: "dashboard", path: "/dashboard" },
  { slug: "persona", path: "/persona" },
  { slug: "persona-portraits", path: "/persona/portraits" },
  { slug: "mood", path: "/mood" },
  { slug: "decisions", path: "/decisions" },
  { slug: "habits", path: "/habits" },
  { slug: "journal", path: "/journal" },
  { slug: "toolbox", path: "/toolbox" },
  { slug: "logos", path: "/logos" },
  { slug: "pratiques", path: "/pratiques" },
  { slug: "pratiques-dien-chan", path: "/pratiques/dien-chan" },
  { slug: "pulse", path: "/pulse" },
  { slug: "bibliotheque", path: "/bibliotheque" },
  { slug: "meditation", path: "/meditation" },
  { slug: "people", path: "/people" },
  { slug: "analytics", path: "/analytics" },
  { slug: "profile", path: "/profile" },
  { slug: "settings", path: "/settings" },
  { slug: "messages", path: "/messages" },
  { slug: "install", path: "/install" },
  { slug: "ambassadeur", path: "/ambassadeur" },
  { slug: "calendar", path: "/calendar" },
  { slug: "capture", path: "/capture" },
  { slug: "deep-dive", path: "/deep-dive" },
  { slug: "deep-dive-scores", path: "/deep-dive/scores" },
  { slug: "dev-lab", path: "/dev" },
  { slug: "dev-logos-choices", path: "/dev/logos-choices" },
  { slug: "dev-quantum-nebula", path: "/dev/quantum-nebula" },
  { slug: "dev-aegis-dashboard", path: "/dev/aegis-dashboard" },
];

function themeRoot() {
  return path.join(OUT, THEME);
}

function ensureDirs() {
  for (const v of VIEWPORTS) {
    fs.mkdirSync(path.join(themeRoot(), v.name), { recursive: true });
  }
}

async function applyTheme(page) {
  const dark = THEME === "dark";
  await page.addInitScript((isDark) => {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
  }, dark);
}

async function shot(page, viewport, route) {
  const file = path.join(themeRoot(), viewport.name, `${route.slug}.png`);
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const url = `${BASE}${route.path}`;
  let status = "ok";
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (res && res.status() >= 400) status = `http-${res.status()}`;
    await page.evaluate((isDark) => {
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("light", !isDark);
      try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch {
        /* ignore */
      }
    }, THEME === "dark");
    await page.waitForTimeout(900);
    await page.screenshot({ path: file, fullPage: true });
  } catch (e) {
    status = `error:${e instanceof Error ? e.message : String(e)}`;
    try {
      await page.screenshot({ path: file, fullPage: true });
    } catch {
      /* ignore */
    }
  }
  return { theme: THEME, viewport: viewport.name, slug: route.slug, path: route.path, file, status };
}

async function main() {
  ensureDirs();
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: THEME === "dark" ? "dark" : "light",
    storageState: STORAGE,
  });
  const page = await context.newPage();
  await applyTheme(page);

  // Sanity: must be authenticated
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(800);
  if (page.url().includes("/auth")) {
    console.error("Auth storage invalid — still on /auth. Re-run ui-screenshots-save-auth.mjs");
    await browser.close();
    process.exit(1);
  }
  console.log(`Auth OK → ${page.url()}`);

  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const row = await shot(page, viewport, route);
      results.push(row);
      console.log(`${row.theme}/${row.viewport}/${row.slug} → ${row.status}`);
    }
  }

  await browser.close();

  const index = [
    `# AEGIS UI screenshots (${THEME})`,
    ``,
    `- Base: \`${BASE}\``,
    `- Theme: \`${THEME}\``,
    `- Date folder: \`${OUT}\``,
    `- Viewports: mobile 390×844 · tablet 768×1024 · desktop 1440×900`,
    ``,
    `| Theme | Viewport | Slug | Path | Status |`,
    `|---|---|---|---|---|`,
    ...results.map(
      (r) => `| ${r.theme} | ${r.viewport} | ${r.slug} | \`${r.path}\` | ${r.status} |`,
    ),
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(themeRoot(), "index.md"), index, "utf8");
  console.log(`Wrote ${results.length} ${THEME} shots + index.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
