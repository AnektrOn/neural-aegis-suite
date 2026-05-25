#!/usr/bin/env node
/**
 * Pulse Course Sync → SQL Migration
 *
 * Reads Pulse courses from either:
 *   - An Obsidian vault directory (.md files with type: course in frontmatter)
 *   - A JSON file (array of course objects)
 * Validates, and generates a Supabase-ready SQL migration file.
 *
 * Usage:
 *   node scripts/pulse-sync/sync-courses.mjs <dir-or-json> [--out <output.sql>] [--dry-run]
 *
 * Examples:
 *   node scripts/pulse-sync/sync-courses.mjs ./scripts/pulse-sync/vault-example/courses --dry-run
 *   node scripts/pulse-sync/sync-courses.mjs ./scripts/pulse-sync/vault-example/courses/courses.json --dry-run
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

// ─── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = { dryRun: false, out: null, input: null, format: null };

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") flags.dryRun = true;
  else if (args[i] === "--out" && args[i + 1]) flags.out = args[++i];
  else if (args[i] === "--format" && args[i + 1]) flags.format = args[++i];
  else if (!args[i].startsWith("--")) flags.input = args[i];
}

if (!flags.input) {
  console.error("Usage: node sync-courses.mjs <dir|courses.json> [--out <file.sql>] [--dry-run]");
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

const VALID_SECTION_TYPES = [
  "hook", "concept", "exercise", "reflection", "action", "quote", "story",
];

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const REQUIRED_LOCALES = ["fr", "en"];

// ─── Minimal YAML Parser ─────────────────────────────────────────────

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

// ─── Course Body Parser (Obsidian) ───────────────────────────────────
// Sections are defined by H2 (## section_type) and locales by H3 (### FR/EN)

function parseCourseSections(body) {
  const sections = [];
  const lines = body.split("\n");
  let currentType = null;
  let currentLocale = null;
  let currentLines = [];
  let locales = {};

  function flushLocale() {
    if (currentType && currentLocale) {
      if (!locales[currentType]) locales[currentType] = {};
      locales[currentType][currentLocale] = currentLines.join("\n").trim();
    }
    currentLines = [];
  }

  function flushSection() {
    flushLocale();
    if (currentType && locales[currentType]) {
      sections.push({
        section_type: currentType,
        content: { ...locales[currentType] },
      });
    }
    currentType = null;
    currentLocale = null;
    locales = {};
  }

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(\w+)\s*$/);
    if (h2Match) {
      flushSection();
      const type = h2Match[1].toLowerCase();
      if (VALID_SECTION_TYPES.includes(type)) {
        currentType = type;
      }
      continue;
    }

    const h3Match = line.match(/^###\s+(FR|EN)\s*$/i);
    if (h3Match && currentType) {
      flushLocale();
      currentLocale = h3Match[1].toLowerCase();
      continue;
    }

    currentLines.push(line);
  }

  flushSection();
  return sections;
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

// ─── Course Validation ───────────────────────────────────────────────

function validateCourse(meta, sections, source) {
  const errors = [];

  if (!meta.external_key || typeof meta.external_key !== "string") {
    errors.push(`${source}: missing or invalid 'external_key'`);
  }

  if (meta.principle && !VALID_PRINCIPLES.includes(meta.principle)) {
    errors.push(`${source}: invalid 'principle': ${meta.principle}`);
  }

  if (!meta.title || typeof meta.title !== "object") {
    errors.push(`${source}: missing 'title'`);
  } else {
    for (const locale of REQUIRED_LOCALES) {
      if (!meta.title[locale]) errors.push(`${source}: 'title.${locale}' is empty`);
    }
  }

  if (meta.difficulty && !VALID_DIFFICULTIES.includes(meta.difficulty)) {
    errors.push(`${source}: invalid 'difficulty': ${meta.difficulty}`);
  }

  const archetypeTargets = Array.isArray(meta.archetype_targets) ? meta.archetype_targets : [];
  for (const a of archetypeTargets) {
    if (!VALID_ARCHETYPES.includes(a)) {
      errors.push(`${source}: invalid archetype '${a}'`);
    }
  }

  if (!sections || sections.length === 0) {
    errors.push(`${source}: no sections found`);
  } else {
    sections.forEach((s, idx) => {
      if (!VALID_SECTION_TYPES.includes(s.section_type)) {
        errors.push(`${source}: section[${idx}] invalid type '${s.section_type}'`);
      }
      if (!s.content || typeof s.content !== "object") {
        errors.push(`${source}: section[${idx}] missing content`);
      } else {
        for (const locale of REQUIRED_LOCALES) {
          if (!s.content[locale]) {
            errors.push(`${source}: section[${idx}] (${s.section_type}) missing '${locale}' content`);
          }
        }
      }
    });
  }

  const linkedCards = Array.isArray(meta.cards) ? meta.cards : [];

  return { errors, archetypeTargets, linkedCards };
}

// ─── Obsidian MD Parsing ─────────────────────────────────────────────

function parseCourseFile(filePath, root) {
  const raw = readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  const relPath = relative(root, filePath);

  if (!meta || meta.type !== "course") {
    return { course: null, errors: [] };
  }

  const sections = parseCourseSections(body);
  const { errors, archetypeTargets, linkedCards } = validateCourse(meta, sections, relPath);

  if (errors.length > 0) return { course: null, errors };

  return {
    course: {
      external_key: meta.external_key,
      principle: meta.principle || null,
      archetype_targets: archetypeTargets,
      difficulty: meta.difficulty || "beginner",
      estimated_minutes: meta.estimated_minutes || 5,
      sort_order: meta.sort_order ?? 0,
      is_active: meta.is_active !== false,
      title: meta.title,
      description: meta.description || { fr: "", en: "" },
      sections,
      linked_cards: linkedCards,
      _source: relPath,
    },
    errors: [],
  };
}

// ─── JSON Parsing ────────────────────────────────────────────────────

function parseJsonCourse(obj, index) {
  const source = obj.external_key || `courses[${index}]`;
  const sections = Array.isArray(obj.sections) ? obj.sections : [];
  const { errors, archetypeTargets, linkedCards } = validateCourse(obj, sections, source);

  if (errors.length > 0) return { course: null, errors };

  return {
    course: {
      external_key: obj.external_key,
      principle: obj.principle || null,
      archetype_targets: archetypeTargets,
      difficulty: obj.difficulty || "beginner",
      estimated_minutes: obj.estimated_minutes || 5,
      sort_order: obj.sort_order ?? 0,
      is_active: obj.is_active !== false,
      title: obj.title,
      description: obj.description || { fr: "", en: "" },
      sections,
      linked_cards: Array.isArray(obj.cards) ? obj.cards : linkedCards,
      _source: source,
    },
    errors: [],
  };
}

// ─── SQL Generation ──────────────────────────────────────────────────

function esc(str) {
  if (typeof str !== "string") return str;
  return str.replace(/'/g, "''");
}

function jsonb(obj) {
  return `'${esc(JSON.stringify(obj))}'::jsonb`;
}

function generateSQL(courses, sourceLabel) {
  const lines = [];

  lines.push(`-- Pulse courses synced from ${sourceLabel}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Courses: ${courses.length}`);
  lines.push(``);

  for (const course of courses) {
    const keyVar = `_course_${course.external_key.replace(/\W/g, "_")}`;

    lines.push(`-- ── Course: ${course.external_key} ──`);
    lines.push(``);

    // Upsert course
    if (course.principle) {
      lines.push(`INSERT INTO public.pulse_courses (`);
      lines.push(`  external_key, principle_id, archetype_targets, title_i18n, description_i18n,`);
      lines.push(`  difficulty, estimated_minutes, is_active, sort_order`);
      lines.push(`)`);
      lines.push(`SELECT`);
      lines.push(`  '${esc(course.external_key)}',`);
      lines.push(`  p.id,`);
      lines.push(`  ARRAY[${course.archetype_targets.map(a => `'${esc(a)}'`).join(", ")}]::TEXT[],`);
      lines.push(`  ${jsonb(course.title)},`);
      lines.push(`  ${jsonb(course.description)},`);
      lines.push(`  '${esc(course.difficulty)}',`);
      lines.push(`  ${course.estimated_minutes},`);
      lines.push(`  ${course.is_active},`);
      lines.push(`  ${course.sort_order}`);
      lines.push(`FROM public.aegis_rune_principles p WHERE p.code = '${esc(course.principle)}'`);
    } else {
      lines.push(`INSERT INTO public.pulse_courses (`);
      lines.push(`  external_key, archetype_targets, title_i18n, description_i18n,`);
      lines.push(`  difficulty, estimated_minutes, is_active, sort_order`);
      lines.push(`) VALUES (`);
      lines.push(`  '${esc(course.external_key)}',`);
      lines.push(`  ARRAY[${course.archetype_targets.map(a => `'${esc(a)}'`).join(", ")}]::TEXT[],`);
      lines.push(`  ${jsonb(course.title)},`);
      lines.push(`  ${jsonb(course.description)},`);
      lines.push(`  '${esc(course.difficulty)}',`);
      lines.push(`  ${course.estimated_minutes},`);
      lines.push(`  ${course.is_active},`);
      lines.push(`  ${course.sort_order}`);
      lines.push(`)`);
    }

    lines.push(`ON CONFLICT (external_key) DO UPDATE SET`);
    if (course.principle) {
      lines.push(`  principle_id = EXCLUDED.principle_id,`);
    }
    lines.push(`  archetype_targets = EXCLUDED.archetype_targets,`);
    lines.push(`  title_i18n = EXCLUDED.title_i18n,`);
    lines.push(`  description_i18n = EXCLUDED.description_i18n,`);
    lines.push(`  difficulty = EXCLUDED.difficulty,`);
    lines.push(`  estimated_minutes = EXCLUDED.estimated_minutes,`);
    lines.push(`  is_active = EXCLUDED.is_active,`);
    lines.push(`  sort_order = EXCLUDED.sort_order,`);
    lines.push(`  updated_at = now();`);
    lines.push(``);

    // Delete old sections & re-insert
    lines.push(`DELETE FROM public.pulse_course_sections`);
    lines.push(`WHERE course_id = (SELECT id FROM public.pulse_courses WHERE external_key = '${esc(course.external_key)}');`);
    lines.push(``);

    if (course.sections.length > 0) {
      lines.push(`INSERT INTO public.pulse_course_sections (course_id, section_type, content_i18n, sort_order)`);
      lines.push(`SELECT`);
      lines.push(`  co.id, v.section_type, v.content_i18n, v.sort_order`);
      lines.push(`FROM public.pulse_courses co,`);
      lines.push(`(VALUES`);

      const sectionValues = course.sections.map((s, idx) => {
        return `  ('${esc(s.section_type)}', ${jsonb(s.content)}, ${idx + 1})`;
      });

      lines.push(sectionValues.join(",\n"));
      lines.push(`) AS v(section_type, content_i18n, sort_order)`);
      lines.push(`WHERE co.external_key = '${esc(course.external_key)}';`);
      lines.push(``);
    }

    // Link cards to course
    if (course.linked_cards.length > 0) {
      for (const cardKey of course.linked_cards) {
        lines.push(`UPDATE public.aegis_synapse_cards SET course_id = (`);
        lines.push(`  SELECT id FROM public.pulse_courses WHERE external_key = '${esc(course.external_key)}'`);
        lines.push(`) WHERE external_key = '${esc(cardKey)}';`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

const allCourses = [];
const allErrors = [];
let sourceLabel = "";

if (inputMode === "json") {
  sourceLabel = `JSON (${basename(flags.input)})`;
  const raw = readFileSync(flags.input, "utf-8");
  let data;
  try { data = JSON.parse(raw); } catch (e) {
    console.error(`  ✗ Invalid JSON: ${e.message}`);
    process.exit(1);
  }
  const items = Array.isArray(data) ? data : data.courses || [];

  console.log(`\n  Pulse Course JSON Import`);
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  File:    ${flags.input}`);
  console.log(`  Courses: ${items.length}`);
  console.log();

  items.forEach((obj, idx) => {
    const { course, errors } = parseJsonCourse(obj, idx);
    if (errors.length > 0) allErrors.push(...errors);
    if (course) allCourses.push(course);
  });

} else {
  sourceLabel = `Obsidian (${flags.input})`;
  const files = findMarkdownFiles(flags.input);

  console.log(`\n  Pulse Course Obsidian Sync`);
  console.log(`  ${"─".repeat(40)}`);
  console.log(`  Path:  ${flags.input}`);
  console.log(`  Files: ${files.length}`);
  console.log();

  for (const f of files) {
    const { course, errors } = parseCourseFile(f, flags.input);
    if (errors.length > 0) allErrors.push(...errors);
    if (course) allCourses.push(course);
  }
}

if (allErrors.length > 0) {
  console.log(`  ✗ Validation errors:\n`);
  for (const err of allErrors) console.log(`    • ${err}`);
  console.log();
}

if (allCourses.length === 0) {
  console.error("  No valid courses found. Fix errors above and retry.");
  process.exit(1);
}

const keySet = new Set();
for (const c of allCourses) {
  if (keySet.has(c.external_key)) {
    console.error(`  ✗ Duplicate external_key: ${c.external_key}`);
    process.exit(1);
  }
  keySet.add(c.external_key);
}

allCourses.sort((a, b) => a.sort_order - b.sort_order);

console.log(`  ✓ Valid courses: ${allCourses.length}`);
for (const c of allCourses) {
  const archs = c.archetype_targets.length > 0 ? c.archetype_targets.join(",") : "(universal)";
  const sects = c.sections.map(s => s.section_type).join("→");
  console.log(`    ${c.external_key.padEnd(35)} ${(c.principle || "-").padEnd(16)} ${archs.padEnd(24)} [${sects}]`);
  if (c.linked_cards.length > 0) {
    console.log(`      ↳ cards: ${c.linked_cards.join(", ")}`);
  }
}
console.log();

const sql = generateSQL(allCourses, sourceLabel);

if (flags.dryRun) {
  console.log(`  --- DRY RUN (SQL preview) ---\n`);
  console.log(sql);
  console.log();
} else if (flags.out) {
  writeFileSync(flags.out, sql + "\n", "utf-8");
  console.log(`  ✓ SQL written to: ${flags.out}`);
  console.log();
} else {
  const ts = generateTimestamp();
  const defaultOut = `supabase/migrations/${ts}_pulse_courses_sync.sql`;
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
