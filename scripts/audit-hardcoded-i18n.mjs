/**
 * Scans src/ for likely hardcoded UI strings (not using t()).
 * Run: npm run audit:i18n
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../src");
const SKIP_DIRS = new Set(["__tests__", "node_modules"]);
const EXT = new Set([".tsx", ".ts"]);

const patterns = [
  { name: "isFR ternary", re: /isFR\s*\?\s*["'`][^"'`]+["'`]\s*:\s*["'`][^"'`]+["'`]/g },
  { name: "locale ternary", re: /locale\s*===\s*["']fr["']\s*\?\s*["'`][^"'`]+["'`]\s*:\s*["'`][^"'`]+["'`]/g },
  { name: "aria-label literal", re: /aria-label=["']([^"']{2,})["']/g },
  { name: "placeholder literal", re: /placeholder=["']([^"'{][^"']*)["']/g },
  { name: "sr-only English", re: /<span className="sr-only">([A-Za-z][^<]{1,60})<\/span>/g },
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), files);
    } else if (EXT.has(path.extname(ent.name))) {
      files.push(path.join(dir, ent.name));
    }
  }
  return files;
}

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

const byFile = new Map();

for (const file of walk(ROOT)) {
  const rel = path.relative(path.resolve(import.meta.dirname, ".."), file);
  if (rel.includes("/pages/admin/") || rel.includes("/admin/")) continue;

  const content = fs.readFileSync(file, "utf8");
  if (content.includes('"use client"') === false && !content.includes("useLanguage") && !content.includes("isFR")) {
    // still scan for aria/placeholder
  }

  for (const { name, re } of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const snippet = m[0].length > 80 ? m[0].slice(0, 77) + "…" : m[0];
      if (!byFile.has(rel)) byFile.set(rel, []);
      byFile.get(rel).push({ kind: name, line: lineOf(content, m.index), snippet });
    }
  }
}

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`# i18n hardcoded string audit\n`);
console.log(`Scanned: ${ROOT} (excluding admin paths)\n`);
console.log(`Files with findings: ${sorted.length}\n`);

for (const [file, hits] of sorted) {
  console.log(`## ${file} (${hits.length})\n`);
  for (const h of hits.slice(0, 30)) {
    console.log(`- L${h.line} [${h.kind}] \`${h.snippet.replace(/`/g, "'")}\``);
  }
  if (hits.length > 30) console.log(`- … and ${hits.length - 30} more`);
  console.log("");
}

const total = sorted.reduce((n, [, h]) => n + h.length, 0);
console.log(`\nTotal findings: ${total}`);
