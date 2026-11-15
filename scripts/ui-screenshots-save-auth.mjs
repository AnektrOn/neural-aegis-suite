/**
 * Headed login → save Playwright storageState for screenshot runs.
 * Usage:
 *   node scripts/ui-screenshots-save-auth.mjs --storage .tmp-ui-shots/auth.json
 *
 * Log in in the opened window, wait until you land on /dashboard or /welcome,
 * then press Enter in this terminal.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const BASE = process.env.AEGIS_BASE_URL || "http://127.0.0.1:8080";
const STORAGE = process.argv.includes("--storage")
  ? process.argv[process.argv.indexOf("--storage") + 1]
  : ".tmp-ui-shots/auth.json";

fs.mkdirSync(path.dirname(STORAGE), { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });

console.log("Connecte-toi dans la fenêtre Chromium.");
console.log("Quand tu es sur /dashboard ou /welcome, reviens ici et appuie Entrée.");

await new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("> ", () => {
    rl.close();
    resolve();
  });
});

await context.storageState({ path: STORAGE });
await browser.close();
console.log(`Auth saved → ${STORAGE}`);
console.log(`URL finale: ${page.url?.() || "(closed)"}`);
