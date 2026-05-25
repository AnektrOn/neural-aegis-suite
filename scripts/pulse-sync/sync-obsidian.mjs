#!/usr/bin/env node
/**
 * Pulse Content Sync → SQL Migration
 *
 * Reads Pulse cards from either:
 *   - An Obsidian vault directory (.md files with YAML frontmatter + body)
 *   - A JSON file (array of card objects)
 * Validates, and generates a Supabase-ready SQL migration file.
 *
 * Usage:
 *   node scripts/pulse-sync/sync-obsidian.mjs <vault-or-json> [--out <output.sql>] [--dry-run] [--format json|md]
 *
 * Examples:
 *   node scripts/pulse-sync/sync-obsidian.mjs ./scripts/pulse-sync/vault-example
 *   node scripts/pulse-sync/sync-obsidian.mjs ./scripts/pulse-sync/cards.json --dry-run
 *   node scripts/pulse-sync/sync-obsidian.mjs ~/Obsidian/AEGIS-Pulse --out supabase/migrations/20260610_pulse_cards.sql
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

// ─── CLI Args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = { dryRun: false, out: null, input: null, format: null };

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") flags.dryRun = true;
  else if (args[i] === "--out" && args[i + 1]) flags.out = args[++i];
  else if (args[i] === "--format" && args[i + 1]) flags.format = args[++i];
  else if (!args[i].startsWith("--")) flags.input = args[i];
}

if (!flags.input) {
  console.error("Usage: node sync-obsidian.mjs <vault-dir|cards.json> [--out <file.sql>] [--dry-run] [--format json|md]");
  process.exit(1);
}

if (!existsSync(flags.input)) {
  console.error(`Input not found: ${flags.input}`);
  process.exit(1);
}

const inputStat = statSync(flags.input);
const inputMode = flags.format
  ? flags.format
  : inputStat.isFile() && extname(flags.input) === ".json"
    ? "json"
    : "md";

const VALID_PRINCIPLES = [
  "MENTALISM", "CORRESPONDENCE", "VIBRATION",
  "POLARITY", "RHYTHM", "CAUSE_EFFECT", "GENDER",
];

const VALID_ARCHETYPES = [
  "sage", "warrior", "lover", "sovereign", "magician", "healer",
  "creator", "rebel", "caregiver", "explorer", "mystic", "jester",
];

const REQUIRED_LOCALES = ["fr", "en"];

// ─── YAML Frontmatter Parser (minimal, no deps) ─────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: null, body: raw };
  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();
  const meta = parseYaml(yamlStr);
  return { meta, body };
}

function parseYaml(str) {
  const lines = str.split("\n");
  return parseYamlBlock(lines, 0, 0).value;
}

function parseYamlBlock(lines, startIdx, baseIndent) {
  const result = {};
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) { i++; continue; }

    const indent = line.search(/\S/);
    if (indent < baseIndent) break;
    if (indent > baseIndent && i > startIdx) break;

    const listMatch = line.match(/^(\s*)- (.*)$/);
    if (listMatch) break;

    const kvMatch = line.match(/^(\s*)([\w_]+)\s*:\s*(.*)$/);
    if (!kvMatch) { i++; continue; }

    const key = kvMatch[2];
    let val = kvMatch[3].trim();

    if (val === "" || val === "|" || val === ">") {
      const nextLineIdx = i + 1;
      if (nextLineIdx < lines.length) {
        const nextLine = lines[nextLineIdx];
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > indent && nextLine.trim().startsWith("- ")) {
          const arr = parseYamlArray(lines, nextLineIdx, nextIndent);
          result[key] = arr.value;
          i = arr.endIdx;
          continue;
        } else if (nextIndent > indent) {
          if (val === "|" || val === ">") {
            const block = parseYamlMultiline(lines, nextLineIdx, nextIndent);
            result[key] = block.value;
            i = block.endIdx;
            continue;
          }
          const nested = parseYamlBlock(lines, nextLineIdx, nextIndent);
          result[key] = nested.value;
          i = nested.endIdx;
          continue;
        }
      }
      result[key] = "";
      i++;
    } else {
      result[key] = unquote(val);
      i++;
    }
  }

  return { value: result, endIdx: i };
}

function parseYamlArray(lines, startIdx, baseIndent) {
  const arr = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    const indent = line.search(/\S/);
    if (indent < baseIndent) break;

    const match = line.match(/^(\s*)- (.*)$/);
    if (!match || match[1].length !== baseIndent) break;

    arr.push(unquote(match[2].trim()));
    i++;
  }

  return { value: arr, endIdx: i };
}

function parseYamlMultiline(lines, startIdx, baseIndent) {
  const parts = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const indent = line.search(/\S/);
    if (line.trim() === "") { parts.push(""); i++; continue; }
    if (indent < baseIndent) break;
    parts.push(line.slice(baseIndent));
    i++;
  }

  return { value: parts.join("\n").trim(), endIdx: i };
}

function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

// ─── Body Section Parser (Obsidian) ─────────────────────────────────

function parseCourseBody(body) {
  const sections = {};
  const lines = body.split("\n");
  let currentKey = null;
  let currentLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(Hook|Concept|Action)\s+(FR|EN)\s*$/i);
    if (headingMatch) {
      if (currentKey) {
        sections[currentKey] = currentLines.join("\n").trim();
      }
      const section = headingMatch[1].toLowerCase();
      const locale = headingMatch[2].toLowerCase();
      currentKey = `${section}_${locale}`;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentKey) {
    sections[currentKey] = currentLines.join("\n").trim();
  }

  const course = {};
  for (const locale of REQUIRED_LOCALES) {
    const hook = sections[`hook_${locale}`] || "";
    const concept = sections[`concept_${locale}`] || "";
    const action = sections[`action_${locale}`] || "";
    if (hook || concept || action) {
      course[locale] = {};
      if (hook) course[locale].hook = hook;
      if (concept) course[locale].concept = concept;
      if (action) course[locale].action = action;
    }
  }

  return course;
}

// ─── File Discovery ──────────────────────────────────────────────────

function findMarkdownFiles(dir) {
  const files = [];

  function walk(d) {
    for (const entry of readdirSync(d)) {
      if (entry.startsWith(".") || entry.startsWith("_")) continue;
      const full = join(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (extname(entry) === ".md") files.push(full);
    }
  }

  walk(dir);
  return files.sort();
}

// ─── Card Validation (shared between MD and JSON) ────────────────────

function validateCard(meta, source) {
  const errors = [];

  if (!meta.external_key || typeof meta.external_key !== "string") {
    errors.push(`${source}: missing or invalid 'external_key'`);
  }

  if (!meta.principle || !VALID_PRINCIPLES.includes(meta.principle)) {
    errors.push(`${source}: 'principle' must be one of: ${VALID_PRINCIPLES.join(", ")}`);
  }

  const i18nFields = ["title", "format", "problem"];
  for (const field of i18nFields) {
    if (!meta[field] || typeof meta[field] !== "object") {
      errors.push(`${source}: missing i18n field '${field}'`);
      continue;
    }
    for (const locale of REQUIRED_LOCALES) {
      if (!meta[field][locale]) {
        errors.push(`${source}: '${field}.${locale}' is empty`);
      }
    }
  }

  if (meta.bullets && typeof meta.bullets === "object") {
    for (const locale of REQUIRED_LOCALES) {
      if (!Array.isArray(meta.bullets[locale]) || meta.bullets[locale].length === 0) {
        errors.push(`${source}: 'bullets.${locale}' must be a non-empty array`);
      }
    }
  } else {
    errors.push(`${source}: missing 'bullets' field`);
  }

  const archetypeTargets = Array.isArray(meta.archetype_targets) ? meta.archetype_targets : [];
  for (const arch of archetypeTargets) {
    if (!VALID_ARCHETYPES.includes(arch)) {
      errors.push(`${source}: invalid archetype '${arch}' in archetype_targets. Valid: ${VALID_ARCHETYPES.join(", ")}`);
    }
  }

  return { errors, archetypeTargets };
}

// ─── Obsidian MD Parsing ─────────────────────────────────────────────

function parseCardFile(filePath, vaultRoot) {
  const raw = readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  const relPath = relative(vaultRoot, filePath);

  if (!meta) {
    return { card: null, errors: [`${relPath}: missing YAML frontmatter`] };
  }

  const { errors, archetypeTargets } = validateCard(meta, relPath);

  const course = parseCourseBody(body);
  for (const locale of REQUIRED_LOCALES) {
    if (!course[locale]) {
      errors.push(`${relPath}: missing course body sections for '${locale}' (# Hook ${locale.toUpperCase()}, # Concept ${locale.toUpperCase()}, # Action ${locale.toUpperCase()})`);
    }
  }

  if (errors.length > 0) {
    return { card: null, errors };
  }

  return {
    card: {
      external_key: meta.external_key,
      principle: meta.principle,
      sort_order: meta.sort_order ?? 0,
      time_label: meta.time_label ?? "2 MIN",
      is_active: meta.is_active !== false,
      archetype_targets: archetypeTargets,
      title: meta.title,
      format: meta.format,
      problem: meta.problem,
      bullets: meta.bullets,
      course_content: course,
      _source: relPath,
    },
    errors: [],
  };
}

// ─── JSON Parsing ────────────────────────────────────────────────────

function parseJsonCard(obj, index) {
  const source = obj.external_key || `cards[${index}]`;
  const { errors, archetypeTargets } = validateCard(obj, source);

  if (!obj.course_content || typeof obj.course_content !== "object") {
    errors.push(`${source}: missing 'course_content' object`);
  } else {
    for (const locale of REQUIRED_LOCALES) {
      if (!obj.course_content[locale]) {
        errors.push(`${source}: missing 'course_content.${locale}'`);
      } else {
        const cc = obj.course_content[locale];
        if (!cc.hook && !cc.concept && !cc.action) {
          errors.push(`${source}: 'course_content.${locale}' must have at least one of: hook, concept, action`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { card: null, errors };
  }

  return {
    card: {
      external_key: obj.external_key,
      principle: obj.principle,
      sort_order: obj.sort_order ?? 0,
      time_label: obj.time_label ?? "2 MIN",
      is_active: obj.is_active !== false,
      archetype_targets: archetypeTargets,
      title: obj.title,
      format: obj.format,
      problem: obj.problem,
      bullets: obj.bullets,
      course_content: obj.course_content,
      _source: source,
    },
    errors: [],
  };
}

function loadJsonCards(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`  ✗ Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  const cards = Array.isArray(data) ? data : data.cards;
  if (!Array.isArray(cards)) {
    console.error("  ✗ JSON must be an array of cards or { cards: [...] }");
    process.exit(1);
  }

  return cards;
}

// ─── SQL Generation ──────────────────────────────────────────────────

function escapeSQL(str) {
  if (typeof str !== "string") return str;
  return str.replace(/'/g, "''");
}

function toJsonbLiteral(obj) {
  return `'${escapeSQL(JSON.stringify(obj))}'::jsonb`;
}

function generateSQL(cards, sourceLabel) {
  const lines = [];

  lines.push(`-- Pulse cards synced from ${sourceLabel}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Cards: ${cards.length}`);
  lines.push(``);

  lines.push(`INSERT INTO public.aegis_synapse_cards (`);
  lines.push(`  principle_id,`);
  lines.push(`  external_key,`);
  lines.push(`  title_i18n,`);
  lines.push(`  problem_i18n,`);
  lines.push(`  bullets_i18n,`);
  lines.push(`  format_i18n,`);
  lines.push(`  course_content_i18n,`);
  lines.push(`  time_label,`);
  lines.push(`  is_active,`);
  lines.push(`  sort_order,`);
  lines.push(`  archetype_targets`);
  lines.push(`)`);
  lines.push(`SELECT`);
  lines.push(`  p.id,`);
  lines.push(`  v.external_key,`);
  lines.push(`  v.title_i18n,`);
  lines.push(`  v.problem_i18n,`);
  lines.push(`  v.bullets_i18n,`);
  lines.push(`  v.format_i18n,`);
  lines.push(`  v.course_content_i18n,`);
  lines.push(`  v.time_label,`);
  lines.push(`  v.is_active,`);
  lines.push(`  v.sort_order,`);
  lines.push(`  v.archetype_targets`);
  lines.push(`FROM (VALUES`);

  const valueBlocks = cards.map((card) => {
    const block = [];
    block.push(`  (`);
    block.push(`    '${escapeSQL(card.principle)}',`);
    block.push(`    '${escapeSQL(card.external_key)}',`);
    block.push(`    ${toJsonbLiteral(card.title)},`);
    block.push(`    ${toJsonbLiteral(card.problem)},`);
    block.push(`    ${toJsonbLiteral(card.bullets)},`);
    block.push(`    ${toJsonbLiteral(card.format)},`);
    block.push(`    ${toJsonbLiteral(card.course_content)},`);
    block.push(`    '${escapeSQL(card.time_label)}',`);
    block.push(`    ${card.is_active},`);
    block.push(`    ${card.sort_order},`);
    block.push(`    ARRAY[${card.archetype_targets.map(a => `'${escapeSQL(a)}'`).join(", ")}]::TEXT[]`);
    block.push(`  )`);
    return block.join("\n");
  });

  lines.push(valueBlocks.join(",\n"));

  lines.push(`) AS v(`);
  lines.push(`  principle_code, external_key, title_i18n, problem_i18n,`);
  lines.push(`  bullets_i18n, format_i18n, course_content_i18n, time_label,`);
  lines.push(`  is_active, sort_order, archetype_targets`);
  lines.push(`)`);
  lines.push(`JOIN public.aegis_rune_principles p ON p.code = v.principle_code`);
  lines.push(`ON CONFLICT (external_key) DO UPDATE SET`);
  lines.push(`  principle_id = EXCLUDED.principle_id,`);
  lines.push(`  title_i18n = EXCLUDED.title_i18n,`);
  lines.push(`  problem_i18n = EXCLUDED.problem_i18n,`);
  lines.push(`  bullets_i18n = EXCLUDED.bullets_i18n,`);
  lines.push(`  format_i18n = EXCLUDED.format_i18n,`);
  lines.push(`  course_content_i18n = EXCLUDED.course_content_i18n,`);
  lines.push(`  time_label = EXCLUDED.time_label,`);
  lines.push(`  is_active = EXCLUDED.is_active,`);
  lines.push(`  sort_order = EXCLUDED.sort_order,`);
  lines.push(`  archetype_targets = EXCLUDED.archetype_targets,`);
  lines.push(`  updated_at = now();`);

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

const allCards = [];
const allErrors = [];
let sourceLabel = "";

if (inputMode === "json") {
  sourceLabel = `JSON (${basename(flags.input)})`;
  const rawCards = loadJsonCards(flags.input);

  console.log(`\n  Pulse JSON Import`);
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  File:   ${flags.input}`);
  console.log(`  Cards:  ${rawCards.length}`);
  console.log();

  rawCards.forEach((obj, idx) => {
    const { card, errors } = parseJsonCard(obj, idx);
    if (errors.length > 0) allErrors.push(...errors);
    if (card) allCards.push(card);
  });

} else {
  sourceLabel = `Obsidian vault (${flags.input})`;
  const files = findMarkdownFiles(flags.input);

  if (files.length === 0) {
    console.error(`No .md files found in: ${flags.input}`);
    process.exit(1);
  }

  console.log(`\n  Pulse Obsidian Sync`);
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  Vault:  ${flags.input}`);
  console.log(`  Files:  ${files.length}`);
  console.log();

  for (const f of files) {
    const { card, errors } = parseCardFile(f, flags.input);
    if (errors.length > 0) allErrors.push(...errors);
    if (card) allCards.push(card);
  }
}

if (allErrors.length > 0) {
  console.log(`  ✗ Validation errors:\n`);
  for (const err of allErrors) {
    console.log(`    • ${err}`);
  }
  console.log();
}

if (allCards.length === 0) {
  console.error("  No valid cards found. Fix errors above and retry.");
  process.exit(1);
}

const keySet = new Set();
for (const c of allCards) {
  if (keySet.has(c.external_key)) {
    console.error(`  ✗ Duplicate external_key: ${c.external_key}`);
    process.exit(1);
  }
  keySet.add(c.external_key);
}

allCards.sort((a, b) => a.sort_order - b.sort_order);

console.log(`  ✓ Valid cards: ${allCards.length}`);
for (const c of allCards) {
  const archs = c.archetype_targets.length > 0 ? c.archetype_targets.join(",") : "(universal)";
  console.log(`    ${c.external_key.padEnd(35)} ${c.principle.padEnd(16)} ${archs.padEnd(28)} ${c.title.fr}`);
}
console.log();

const sql = generateSQL(allCards, sourceLabel);

if (flags.dryRun) {
  console.log(`  --- DRY RUN (SQL preview) ---\n`);
  console.log(sql);
  console.log();
} else if (flags.out) {
  writeFileSync(flags.out, sql + "\n", "utf-8");
  console.log(`  ✓ SQL written to: ${flags.out}`);
  console.log();
} else {
  const defaultOut = `supabase/migrations/${generateTimestamp()}_pulse_cards_sync.sql`;
  writeFileSync(defaultOut, sql + "\n", "utf-8");
  console.log(`  ✓ SQL written to: ${defaultOut}`);
  console.log();
}

function generateTimestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
}
