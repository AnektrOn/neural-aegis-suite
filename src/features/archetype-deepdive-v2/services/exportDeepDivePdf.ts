/**
 * Branded PDF export for Deep Dive V2 reports.
 *
 * Strategies:
 *  - Text-based (preferred): writes structured, selectable text from a markdown
 *    source into a multi-page A4 PDF via jsPDF. No html2canvas, no screenshots.
 *  - Markdown-based legacy: opens a print-ready window for admins.
 */

import jsPDF from "jspdf";

interface ExportArgs {
  kind: "user" | "admin";
  markdown: string;
  profileLabel: string;
}

interface ExportTextArgs {
  markdown: string;
  profileLabel: string;
  kind?: "user" | "admin";
  isFR?: boolean;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip simple markdown emphasis/code markers — keep text content only. */
function stripInline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2");
}

/**
 * Render markdown content as a clean, text-only multi-page A4 PDF.
 * No images, no rasterized screenshots — fully selectable text.
 */
export function exportDeepDiveTextPdf({
  markdown,
  profileLabel,
  kind = "user",
  isFR = true,
}: ExportTextArgs): void {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Cover header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(20, 20, 30);
  pdf.text(isFR ? "Aegis — Deep Dive" : "Aegis — Deep Dive", margin, y);
  y += 9;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.setTextColor(60, 60, 80);
  const titleLines = pdf.splitTextToSize(profileLabel, maxW);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  pdf.setFontSize(9);
  pdf.setTextColor(130, 130, 140);
  const stamp = `${kind === "admin" ? (isFR ? "Lecture admin" : "Admin reading") : (isFR ? "Rapport personnel" : "Personal report")} · ${new Date().toLocaleDateString(isFR ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  pdf.text(stamp, margin, y);
  y += 6;
  pdf.setDrawColor(200, 200, 210);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  const lines = markdown.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { y += 3; continue; }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = stripInline(h[2]);
      const sizes = [16, 13, 11];
      const before = [5, 4, 3];
      const after = [3, 2, 2];
      ensureSpace(sizes[level - 1] + before[level - 1] + after[level - 1] + 2);
      y += before[level - 1];
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(sizes[level - 1]);
      pdf.setTextColor(20, 20, 30);
      const wrapped = pdf.splitTextToSize(text, maxW);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * (sizes[level - 1] * 0.42) + after[level - 1];
      continue;
    }

    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 55);
      const text = stripInline(li[1]);
      const wrapped = pdf.splitTextToSize(text, maxW - 5);
      ensureSpace(wrapped.length * 5 + 1);
      pdf.text("•", margin, y);
      pdf.text(wrapped, margin + 5, y);
      y += wrapped.length * 5 + 1;
      continue;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 65);
    const text = stripInline(line);
    const wrapped = pdf.splitTextToSize(text, maxW);
    ensureSpace(wrapped.length * 5 + 1);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 5 + 2;
  }

  // Footer on every page
  const pageCount = (pdf as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 150);
    pdf.text(`Aegis — ${profileLabel} · ${i}/${pageCount}`, pageW / 2, pageH - 8, { align: "center" });
  }

  const date = new Date().toISOString().slice(0, 10);
  const stem = slugify(profileLabel) || "deep-dive";
  pdf.save(`aegis-deepdive-${kind}-${stem}-${date}.pdf`);
}

// ----- Legacy markdown-based export (admin) -----

const NEURAL_PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1a1a1f;
    background: #fafafa;
    font-size: 11pt;
    line-height: 1.55;
  }
  .cover {
    background: radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.18), transparent 55%),
                radial-gradient(circle at 70% 80%, rgba(212, 175, 55, 0.12), transparent 55%),
                #010204;
    color: #f4f1e8;
    padding: 70mm 16mm 30mm;
    page-break-after: always;
    min-height: 230mm;
  }
  .cover .eyebrow { font-family: 'Cinzel', serif; font-size: 9pt; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(212, 175, 55, 0.85); margin-bottom: 10mm; }
  .cover h1 { font-family: 'Cinzel', serif; font-size: 28pt; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 6mm; line-height: 1.2; }
  .cover .subtitle { font-size: 12pt; color: rgba(244, 241, 232, 0.7); letter-spacing: 0.05em; }
  .cover .stamp { margin-top: 30mm; font-size: 9pt; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(212, 175, 55, 0.6); }
  h1, h2, h3 { font-family: 'Cinzel', serif; letter-spacing: 0.08em; color: #0d0d12; page-break-after: avoid; }
  h1 { font-size: 20pt; margin: 0 0 6mm; border-bottom: 1px solid #d4af37; padding-bottom: 3mm; }
  h2 { font-size: 14pt; margin: 10mm 0 3mm; color: #2a2a35; }
  h3 { font-size: 11pt; margin: 6mm 0 2mm; color: #4a4a5a; text-transform: uppercase; letter-spacing: 0.12em; }
  p { margin: 0 0 3mm; }
  ul, ol { margin: 0 0 4mm; padding-left: 6mm; }
  li { margin-bottom: 1.5mm; }
  strong { color: #0d0d12; }
  em { color: #6a6a7a; }
  code { font-family: 'Menlo', monospace; font-size: 9.5pt; background: rgba(0,0,0,0.05); padding: 1px 4px; border-radius: 3px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 6mm 0; }
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  let inPara = false;
  const closePara = () => { if (inPara) { html.push("</p>"); inPara = false; } };
  const closeList = () => { if (inList) { html.push("</ul>"); inList = false; } };
  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closePara(); closeList(); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { closePara(); closeList(); const level = h[1].length; html.push(`<h${level}>${inline(h[2])}</h${level}>`); continue; }
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) { closePara(); if (!inList) { html.push("<ul>"); inList = true; } html.push(`<li>${inline(li[1])}</li>`); continue; }
    closeList();
    if (!inPara) { html.push("<p>"); inPara = true; } else { html.push(" "); }
    html.push(inline(line));
  }
  closePara(); closeList();
  return html.join("\n");
}

export function exportDeepDivePdf({ kind, markdown, profileLabel }: ExportArgs): void {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!win) {
    console.warn("[exportDeepDivePdf] popup blocked");
    return;
  }
  const eyebrow = kind === "admin" ? "Lecture admin" : "Rapport personnel";
  const title = kind === "admin" ? "Lecture admin Deep Dive" : "Ton paysage archétypal";
  const dateStr = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Aegis · Deep Dive · ${escapeHtml(profileLabel)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>${NEURAL_PRINT_CSS}</style></head>
<body>
  <section class="cover">
    <div class="eyebrow">Aegis · Deep Dive</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">${escapeHtml(profileLabel)}</div>
    <div class="stamp">${escapeHtml(eyebrow)} · ${escapeHtml(dateStr)}</div>
  </section>
  <main>${markdownToHtml(markdown)}</main>
  <script>window.addEventListener('load',()=>{setTimeout(()=>{window.focus();window.print();},400);});</script>
</body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}
