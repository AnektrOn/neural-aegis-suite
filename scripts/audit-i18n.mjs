/**
 * Audit EN/FR parity in translations.ts and t() key usage in src/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Dynamic import translations (Vite project - use read + eval alternative)
const transContent = fs.readFileSync(path.join(root, "src/i18n/translations.ts"), "utf8");
// Extract export const translations = { ... };
const start = transContent.indexOf("export const translations = {");
const end = transContent.lastIndexOf("} as const;");
const objStr = transContent.slice(start + "export const translations = ".length, end + 1);
// eslint-disable-next-line no-eval
const translations = eval(`(${objStr})`);

const missingFr = [];
const missingEn = [];
const identical = [];

for (const [key, val] of Object.entries(translations)) {
  if (!val.fr || String(val.fr).trim() === "") missingFr.push(key);
  if (!val.en || String(val.en).trim() === "") missingEn.push(key);
  if (val.fr === val.en && val.fr.length > 3) {
    identical.push(key);
  }
}

function walkDir(dir, ext, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.name === "node_modules" || ent.name === "dist") continue;
    if (ent.isDirectory()) walkDir(p, ext, files);
    else if (ext.some((e) => ent.name.endsWith(e))) files.push(p);
  }
  return files;
}

const srcFiles = walkDir(path.join(root, "src"), [".ts", ".tsx"]);
const keyPattern = /\bt\s*\(\s*["']([^"']+)["']/g;
const castPattern = /as TranslationKey/g;
const usedKeys = new Set();
const dynamicKeyWarnings = [];

for (const file of srcFiles) {
  const rel = path.relative(root, file);
  if (rel.includes("translations.ts")) continue;
  const content = fs.readFileSync(file, "utf8");
  let m;
  while ((m = keyPattern.exec(content)) !== null) {
    usedKeys.add(m[1]);
  }
  if (castPattern.test(content) && /toolbox\.stopV2\./.test(content)) {
    dynamicKeyWarnings.push(rel);
  }
}

const allKeys = new Set(Object.keys(translations));
const missingInTranslations = [...usedKeys].filter((k) => !allKeys.has(k)).sort();
const unusedKeys = [...allKeys].filter((k) => !usedKeys.has(k));

// Hardcoded French in JSX (heuristic: >8 chars with accents)
const frenchPattern =
  />[^<{]*[àâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ][^<{]{4,}</g;
const hardcodedFrench = [];

for (const file of srcFiles) {
  const rel = path.relative(root, file);
  if (rel.includes("promote/") || rel.includes("translations.ts")) continue;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;
    if (line.includes("t(") || line.includes("fr:") || line.includes("en:")) continue;
    if (/[àâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/i.test(line)) {
      if (
        line.includes("className") ||
        line.includes("import ") ||
        line.includes("*") ||
        line.includes("test(") ||
        line.includes("describe(") ||
        line.includes(".md") ||
        line.includes("console.")
      )
        continue;
      if (/["'`][^"'`]{8,}[àâäéèêëïîôùûüç][^"'`]*["'`]/.test(line)) {
        hardcodedFrench.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
}

console.log("=== translations.ts parity ===");
console.log("Total keys:", allKeys.size);
console.log("Missing FR:", missingFr.length, missingFr.slice(0, 15));
console.log("Missing EN:", missingEn.length, missingEn.slice(0, 15));
console.log("\n=== t() keys not in translations ===");
console.log("Count:", missingInTranslations.length);
console.log(missingInTranslations.slice(0, 50).join("\n"));
if (missingInTranslations.length > 50) console.log("... and", missingInTranslations.length - 50, "more");
console.log("\n=== Potentially hardcoded French (sample) ===");
console.log("Count:", hardcodedFrench.length);
console.log(hardcodedFrench.slice(0, 40).join("\n"));
console.log("\n=== Identical fr/en (sample, may be intentional) ===");
console.log(identical.length, "keys");
console.log(identical.slice(0, 30).join("\n"));
