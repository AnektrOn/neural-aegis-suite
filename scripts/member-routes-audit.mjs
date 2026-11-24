/**
 * Smoke-audit member (subscribed) routes via Playwright.
 *
 * Usage:
 *   node scripts/member-routes-audit.mjs
 *   node scripts/member-routes-audit.mjs --storage .tmp-ui-shots/auth.json
 *   AEGIS_BASE_URL=http://127.0.0.1:8080 node scripts/member-routes-audit.mjs --out .cursor/member-routes-audit.json
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AEGIS_BASE_URL || "http://127.0.0.1:8080";
const OUT =
  process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : ".cursor/member-routes-audit.json";
const STORAGE = process.argv.includes("--storage")
  ? process.argv[process.argv.indexOf("--storage") + 1]
  : null;

/** Member + related protected routes (from App.tsx). */
const MEMBER_ROUTES = [
  { slug: "home", path: "/" },
  { slug: "welcome", path: "/welcome" },
  { slug: "welcome-voice", path: "/welcome/voice-agent" },
  { slug: "capture", path: "/capture" },
  { slug: "dashboard", path: "/dashboard" },
  { slug: "persona", path: "/persona" },
  { slug: "persona-portraits", path: "/persona/portraits" },
  { slug: "mood", path: "/mood" },
  { slug: "decisions", path: "/decisions" },
  { slug: "habits", path: "/habits" },
  { slug: "journal", path: "/journal" },
  { slug: "toolbox", path: "/toolbox" },
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
  { slug: "onboarding-assessment", path: "/onboarding/assessment" },
  { slug: "onboarding-results", path: "/onboarding/results" },
  { slug: "assessment-maisons", path: "/assessment/maisons" },
  { slug: "deep-dive", path: "/deep-dive" },
  { slug: "deep-dive-scores", path: "/deep-dive/scores" },
  { slug: "cartographie-balance", path: "/cartographie/balance/analyse" },
];

const ERROR_BOUNDARY_MARKERS = [
  "Une erreur a bloqué l'affichage",
  "An error prevented rendering",
];

const ISSUE = {
  OK: "ok",
  AUTH: "redirected-auth",
  PRICING: "redirected-pricing",
  ONBOARDING: "redirected-onboarding",
  NOT_FOUND: "not-found",
  ERROR_BOUNDARY: "error-boundary",
  HTTP_ERROR: "http-error",
  NAV_TIMEOUT: "navigation-timeout",
  CONSOLE_ERROR: "console-error",
  CHUNK_LOAD: "chunk-load-failed",
};

async function auditRoute(page, route) {
  const consoleErrors = [];
  const pageErrors = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (!t.includes("favicon")) consoleErrors.push(t.slice(0, 500));
    }
  };
  const onPageError = (err) => pageErrors.push(String(err).slice(0, 500));

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const url = `${BASE}${route.path}`;
  let httpStatus = null;
  let finalUrl = url;
  let issues = [];

  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    httpStatus = res?.status() ?? null;
    await page.waitForTimeout(1200);
    finalUrl = page.url();
  } catch (e) {
    issues.push(ISSUE.NAV_TIMEOUT);
    finalUrl = page.url();
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) ?? "");

  if (httpStatus && httpStatus >= 400) issues.push(ISSUE.HTTP_ERROR);
  if (finalUrl.includes("/auth")) issues.push(ISSUE.AUTH);
  if (/\/pricing/.test(finalUrl)) issues.push(ISSUE.PRICING);
  if (/\/quiz|\/onboarding(?!\/assessment|\/results)/.test(finalUrl)) issues.push(ISSUE.ONBOARDING);
  if (bodyText.includes("404") && bodyText.match(/not found|introuvable/i)) issues.push(ISSUE.NOT_FOUND);
  if (ERROR_BOUNDARY_MARKERS.some((m) => bodyText.includes(m))) issues.push(ISSUE.ERROR_BOUNDARY);

  const chunkErr = [...consoleErrors, ...pageErrors].some(
    (t) =>
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(t),
  );
  if (chunkErr) issues.push(ISSUE.CHUNK_LOAD);

  const meaningfulConsole = consoleErrors.filter(
    (t) =>
      !/React DevTools|Download the React DevTools|Violation\]|ResizeObserver loop/i.test(t),
  );
  if (meaningfulConsole.length > 0 && !issues.includes(ISSUE.ERROR_BOUNDARY)) {
    issues.push(ISSUE.CONSOLE_ERROR);
  }

  if (issues.length === 0) issues.push(ISSUE.OK);

  const severity =
    issues.includes(ISSUE.ERROR_BOUNDARY) ||
    issues.includes(ISSUE.CHUNK_LOAD) ||
    issues.includes(ISSUE.HTTP_ERROR)
      ? "critical"
      : issues.includes(ISSUE.CONSOLE_ERROR) || issues.includes(ISSUE.NOT_FOUND)
        ? "warning"
        : issues.includes(ISSUE.AUTH) || issues.includes(ISSUE.PRICING) || issues.includes(ISSUE.ONBOARDING)
          ? "blocked"
          : "ok";

  return {
    slug: route.slug,
    path: route.path,
    httpStatus,
    finalUrl: finalUrl.replace(BASE, ""),
    issues: [...new Set(issues)],
    severity,
    consoleErrors: meaningfulConsole.slice(0, 8),
    pageErrors: pageErrors.slice(0, 8),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const contextOpts = {
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  };
  if (STORAGE && fs.existsSync(STORAGE)) {
    contextOpts.storageState = STORAGE;
  }
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  let authOk = false;
  if (STORAGE && fs.existsSync(STORAGE)) {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(600);
    authOk = !page.url().includes("/auth");
  }

  const results = [];
  for (const route of MEMBER_ROUTES) {
    const row = await auditRoute(page, route);
    results.push(row);
    const flag = row.severity === "ok" ? "✓" : row.severity === "blocked" ? "○" : "✗";
    console.log(`${flag} ${row.path} → ${row.issues.join(",")} (${row.finalUrl})`);
  }

  await browser.close();

  const summary = {
    base: BASE,
    auditedAt: new Date().toISOString(),
    authenticated: authOk,
    storage: STORAGE,
    totals: {
      routes: results.length,
      ok: results.filter((r) => r.severity === "ok").length,
      blocked: results.filter((r) => r.severity === "blocked").length,
      warning: results.filter((r) => r.severity === "warning").length,
      critical: results.filter((r) => r.severity === "critical").length,
    },
    results,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2), "utf8");
  console.log(`\nWrote ${OUT}`);
  console.log(
    `Summary: ${summary.totals.ok} ok, ${summary.totals.blocked} blocked, ${summary.totals.warning} warning, ${summary.totals.critical} critical`,
  );
  if (!authOk) {
    console.log(
      "\nNo valid --storage: member routes may show 'blocked' (auth/pricing/onboarding). Run:",
    );
    console.log("  node scripts/ui-screenshots-save-auth.mjs --storage .tmp-ui-shots/auth.json");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});