import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

const enabled = process.env.LOGOS_BATCH_LIVE_TEST === "1";
const connection = process.env.SUPABASE_DB_URL;
const sql = enabled && connection ? postgres(connection, { max: 1, prepare: false }) : null;

afterAll(async () => { await sql?.end(); });

describe.skipIf(!enabled)("deployed weekly LOGOS batches", () => {
  async function batch() {
    if (!sql) throw new Error("Database test connection unavailable");
    return sql`SELECT p.* FROM public.logos_path_prompts p JOIN public.logos_prompt_batches b ON b.id=p.batch_id WHERE b.source='cron' AND b.note='weekly-2026-11-16'`;
  }
  it("creates exactly five prompts", async () => { expect((await batch()).length).toBe(5); });
  it("uses five distinct categories", async () => {
    expect((await batch()).map(p => p.category).sort()).toEqual(["body", "decision", "intention", "mental", "relation"]);
  });
  it("expires exactly seven days after creation", async () => {
    for (const p of await batch()) expect(new Date(p.expires_at).getTime()-new Date(p.created_at).getTime()).toBe(7*24*60*60*1000);
  });
  it("keeps one five-row batch after server retries", async () => {
    if (!sql) throw new Error("Database test connection unavailable");
    const rows = await sql`SELECT b.id, count(p.id)::int AS count FROM public.logos_prompt_batches b JOIN public.logos_path_prompts p ON p.batch_id=b.id WHERE b.source='cron' AND b.note='weekly-2026-11-16' GROUP BY b.id`;
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(5);
  });
  it("restricts catalogue writes and the writer to service role", async () => {
    if (!sql) throw new Error("Database test connection unavailable");
    for (const role of ["anon", "authenticated"]) {
      const [r] = await sql`SELECT has_function_privilege(${role}, 'public.create_weekly_logos_batch()', 'EXECUTE') AS execute,
        has_table_privilege(${role}, 'public.logos_path_prompts', 'INSERT') AS prompts,
        has_table_privilege(${role}, 'public.logos_prompt_batches', 'INSERT') AS batches`;
      expect(r).toEqual({execute:false, prompts:false, batches:false});
    }
    const [r] = await sql`SELECT has_function_privilege('service_role', 'public.create_weekly_logos_batch()', 'EXECUTE') AS execute`;
    expect(r.execute).toBe(true);
  });
});