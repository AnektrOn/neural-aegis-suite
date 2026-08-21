#!/usr/bin/env node
/**
 * Upload Guardian MP3 tracks to Supabase Storage (bucket: guardian-audio).
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (or .env).
 * After upload, set in production:
 *   VITE_GUARDIAN_AUDIO_BASE_URL=https://<project>.supabase.co/storage/v1/object/public/guardian-audio
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const AUDIO_ROOT = path.join(ROOT, "public/audio/guardian");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function walkMp3(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMp3(full, rel)));
    } else if (entry.name.endsWith(".mp3")) {
      files.push({ rel, full });
    }
  }
  return files;
}

const files = await walkMp3(AUDIO_ROOT);
console.log(`Uploading ${files.length} MP3 files to guardian-audio…`);

for (const { rel, full } of files) {
  const body = await readFile(full);
  const { error } = await supabase.storage.from("guardian-audio").upload(rel, body, {
    upsert: true,
    contentType: "audio/mpeg",
  });
  if (error) {
    console.error(`FAIL ${rel}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`OK ${rel}`);
  }
}

const publicBase = `${url.replace(/\/$/, "")}/storage/v1/object/public/guardian-audio`;
console.log(`\nSet VITE_GUARDIAN_AUDIO_BASE_URL=${publicBase}`);
