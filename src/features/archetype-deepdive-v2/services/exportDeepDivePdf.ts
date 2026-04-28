/**
 * Deep Dive V2 — branded PDF export.
 *
 * Opens a new window with a Neural & Ethereal stylesheet, renders the
 * markdown report, and triggers the browser's "Save as PDF" dialog.
 *
 * Pure presentation logic — no data fetching, no React deps.
 */

type ReportKind = "user" | "admin";

interface ExportOptions {
  kind: ReportKind;
  /** Already-built markdown report. */
  markdown: string;
  /** Profile label (e.g. "Leader Warrior/Sovereign — quête de sens"). */
  profileLabel: string;
}

/**
 * Minimal markdown → HTML converter, scoped to what `buildUserReport` /
 * `buildAdminReport` actually emit (h1/h2/h3, paragraphs, ordered/unordered
 * lists, **bold**, *italic*, inline `code`).
 */
function markdownToHtml(md: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const inline = (s: string) =>
    escape(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const lines = md.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }

    const ol = /^\s*(\d+)\.\s+(.*)$/.exec(line);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(ol[2])}</li>`);
      continue;
    }

    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

const NEURAL_PRINT_CSS = `
  @page {
    size: A4;
    margin: 18mm 16mm;
  }

  :root {
    --ink:        #0a0d14;
    --ink-deep:   #050810;
    --paper:      #f5f1e8;
    --gold:       #c9a96e;
    --gold-soft:  #d8be8a;
    --filament:   rgba(201, 169, 110, 0.35);
    --text:       #1a1d24;
    --text-muted: #555a66;
    --rule:       rgba(10, 13, 20, 0.12);
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--paper);
    color: var(--text);
    font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 8px 48px;
  }

  /* ── Cover ──────────────────────────────────────────────────────────── */
  .cover {
    position: relative;
    padding: 56px 40px;
    margin-bottom: 36px;
    background: linear-gradient(180deg, var(--ink-deep) 0%, var(--ink) 100%);
    color: var(--paper);
    border: 1px solid var(--filament);
    border-radius: 4px;
    overflow: hidden;
    page-break-after: always;
  }
  .cover::before,
  .cover::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, var(--filament) 0%, transparent 70%);
    pointer-events: none;
  }
  .cover::before { top: -120px; right: -120px; width: 320px; height: 320px; }
  .cover::after  { bottom: -160px; left: -160px; width: 380px; height: 380px; }

  .cover .eyebrow {
    font-size: 8.5pt;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 28px;
    position: relative;
  }
  .cover h1 {
    font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
    font-weight: 500;
    font-size: 30pt;
    letter-spacing: 0.18em;
    line-height: 1.15;
    text-transform: uppercase;
    margin: 0 0 24px 0;
    color: var(--paper);
    position: relative;
  }
  .cover .subtitle {
    font-size: 11pt;
    color: rgba(245, 241, 232, 0.75);
    margin-bottom: 40px;
    position: relative;
  }
  .cover .meta {
    display: flex;
    gap: 32px;
    border-top: 1px solid var(--filament);
    padding-top: 20px;
    font-size: 9pt;
    color: rgba(245, 241, 232, 0.6);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    position: relative;
  }
  .cover .meta strong {
    display: block;
    color: var(--gold-soft);
    font-weight: 500;
    margin-bottom: 4px;
    font-size: 8pt;
    letter-spacing: 0.3em;
  }

  /* ── Body typography ─────────────────────────────────────────────── */
  .content h1 {
    font-family: 'Cinzel', Georgia, serif;
    font-size: 18pt;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0 0 8px 0;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--rule);
  }
  .content h2 {
    font-family: 'Cinzel', Georgia, serif;
    font-size: 13pt;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 32px 0 12px 0;
    padding-left: 12px;
    border-left: 2px solid var(--gold);
    page-break-after: avoid;
  }
  .content h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10.5pt;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--gold);
    margin: 20px 0 6px 0;
    text-transform: uppercase;
    page-break-after: avoid;
  }
  .content p {
    margin: 0 0 10px 0;
    color: var(--text);
  }
  .content strong { color: var(--ink); font-weight: 600; }
  .content em { color: var(--text-muted); }
  .content code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 9.5pt;
    background: rgba(201, 169, 110, 0.12);
    padding: 1px 5px;
    border-radius: 2px;
    color: var(--ink);
  }
  .content ul,
  .content ol {
    margin: 4px 0 14px 0;
    padding-left: 22px;
  }
  .content li {
    margin-bottom: 6px;
    color: var(--text);
  }
  .content li::marker { color: var(--gold); }

  /* Avoid awkward breaks inside small blocks. */
  .content h2 + p,
  .content h3 + p,
  .content h2 + ul,
  .content h3 + ul { page-break-before: avoid; }

  /* ── Footer (each page in @page is hard; we add a static one) ──── */
  .footer {
    margin-top: 48px;
    padding-top: 14px;
    border-top: 1px solid var(--rule);
    font-size: 8pt;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
  }
  .footer .mark { color: var(--gold); }
`;

export function exportDeepDivePdf({ kind, markdown, profileLabel }: ExportOptions): void {
  const win = window.open("", "_blank");
  if (!win) return;

  const today = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const titleMain = kind === "user" ? "Rapport Archétypal" : "Lecture Admin";
  const eyebrow = kind === "user" ? "Aegis · Deep Dive" : "Aegis · Deep Dive · Backoffice";
  const subtitle =
    kind === "user"
      ? "Une cartographie vivante de tes archétypes selon Caroline Myss."
      : "Lecture clinique du profil pour le coach.";

  const filename = `aegis-deep-dive-${kind}.pdf`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>${NEURAL_PRINT_CSS}</style>
</head>
<body>
  <div class="page">
    <section class="cover">
      <div class="eyebrow">${eyebrow}</div>
      <h1>${titleMain}</h1>
      <div class="subtitle">${subtitle}</div>
      <div class="meta">
        <div><strong>Profil</strong>${profileLabel}</div>
        <div><strong>Date</strong>${today}</div>
        <div><strong>Vue</strong>${kind === "user" ? "Utilisateur" : "Coach / Admin"}</div>
      </div>
    </section>

    <section class="content">
      ${markdownToHtml(markdown)}
    </section>

    <footer class="footer">
      <span>Aegis <span class="mark">·</span> ${today}</span>
      <span>${kind === "user" ? "Vue Utilisateur" : "Vue Admin"}</span>
    </footer>
  </div>

  <script>
    // Wait for fonts to settle, then trigger the print dialog.
    (function () {
      var ready = function () {
        setTimeout(function () { window.focus(); window.print(); }, 250);
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(ready);
      } else {
        window.addEventListener('load', ready);
      }
    })();
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
