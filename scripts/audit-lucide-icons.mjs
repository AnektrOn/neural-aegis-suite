#!/usr/bin/env node
/**
 * Lists files still importing lucide-react (migration tracker for Heroicons refont).
 * Usage: node scripts/audit-lucide-icons.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const rg = execSync("rg -l lucide-react src -g '*.ts' -g '*.tsx'", {
  cwd: root,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

const names = new Set();
for (const rel of rg) {
  const text = readFileSync(`${root}/${rel}`, "utf8");
  const re = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g;
  let m;
  while ((m = re.exec(text))) {
    for (const part of m[1].split(",")) {
      const id = part.replace(/type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (id && id !== "LucideIcon" && id !== "type") names.add(id);
    }
  }
}

console.log(`lucide-react files: ${rg.length}`);
console.log(`distinct icon symbols: ${names.size}`);
console.log("\nSample paths:");
for (const p of rg.slice(0, 15)) console.log(`  ${p}`);
if (rg.length > 15) console.log(`  ... +${rg.length - 15} more`);

console.log("\nDistinct symbols (sorted):");
console.log([...names].sort().join(", "));