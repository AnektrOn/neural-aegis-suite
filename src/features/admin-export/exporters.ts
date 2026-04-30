import JSZip from "jszip";
import type { DataSourceKey } from "./dataSources";

function escapeCsv(v: any): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));
  const out = [headers.join(",")];
  for (const r of rows) {
    out.push(headers.map((h) => escapeCsv(r[h])).join(","));
  }
  return out.join("\n");
}

export function rowsToMarkdown(label: string, rows: Record<string, any>[]): string {
  if (rows.length === 0) return `## ${label}\n\n_Aucune donnée._\n`;
  const headers = Array.from(rows.reduce<Set<string>>((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) =>
    `| ${headers.map((h) => {
      const v = r[h];
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    }).join(" | ")} |`
  );
  return `## ${label} (${rows.length})\n\n${head}\n${sep}\n${body.join("\n")}\n`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportCsvZip(
  datasets: { key: DataSourceKey; label: string; rows: Record<string, any>[] }[],
  baseName: string,
) {
  const zip = new JSZip();
  for (const d of datasets) {
    zip.file(`${d.key}.csv`, rowsToCsv(d.rows));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${baseName}.zip`);
}

export function exportJson(
  datasets: { key: DataSourceKey; label: string; rows: Record<string, any>[] }[],
  baseName: string,
  meta: Record<string, any>,
) {
  const payload = {
    exported_at: new Date().toISOString(),
    meta,
    data: Object.fromEntries(datasets.map((d) => [d.key, d.rows])),
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${baseName}.json`,
  );
}

export function exportMarkdown(
  datasets: { key: DataSourceKey; label: string; rows: Record<string, any>[] }[],
  baseName: string,
  meta: Record<string, any>,
) {
  const lines: string[] = [
    `# Export Aegis — ${new Date().toLocaleString("fr-FR")}`,
    "",
    "```json",
    JSON.stringify(meta, null, 2),
    "```",
    "",
  ];
  for (const d of datasets) lines.push(rowsToMarkdown(d.label, d.rows), "");
  downloadBlob(
    new Blob([lines.join("\n")], { type: "text/markdown" }),
    `${baseName}.md`,
  );
}
