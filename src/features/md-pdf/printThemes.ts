export type MdPdfThemeId = "nocturne" | "ivoire" | "obsidian";

export const MD_PDF_THEMES: Array<{
  id: MdPdfThemeId;
  labelKey: "admin.mdPdf.themeNocturne" | "admin.mdPdf.themeIvoire" | "admin.mdPdf.themeObsidian";
}> = [
  { id: "nocturne", labelKey: "admin.mdPdf.themeNocturne" },
  { id: "ivoire", labelKey: "admin.mdPdf.themeIvoire" },
  { id: "obsidian", labelKey: "admin.mdPdf.themeObsidian" },
];

const SHARED = `
  @page { size: A4 portrait; margin: 16mm 15mm 18mm; }
  @page :first { margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    max-width: 210mm;
    height: auto;
    overflow: visible;
  }
  body {
    font-family: "Barlow", "Segoe UI", sans-serif;
    font-size: 10.5pt;
    line-height: 1.68;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: none;
    -webkit-hyphens: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  img, svg, table, pre, blockquote, ul, ol, dl, p, li, h1, h2, h3, h4, section, article, main {
    max-width: 100%;
  }
  img { height: auto; border-radius: 3px; }
  a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }

  .cover {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 210mm;
    min-height: 297mm;
    padding: 22mm 20mm 24mm;
    page-break-after: always;
    break-after: page;
  }
  .cover-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 4mm 8mm;
    margin-bottom: 0;
  }
  .brand {
    font-family: "DM Mono", monospace;
    font-size: 8pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    min-width: 0;
    flex: 1 1 60%;
    overflow-wrap: break-word;
  }
  .cover-lang {
    font-family: "DM Mono", monospace;
    font-size: 8pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 1.6mm 3.5mm;
    border: 1px solid currentColor;
    border-radius: 99px;
    flex: 0 1 auto;
  }
  .cover-hero { padding: 18mm 0; min-width: 0; }
  .cover-glyph-wrap {
    width: 16mm;
    height: 16mm;
    border-radius: 50%;
    border: 1px solid currentColor;
    display: grid;
    place-items: center;
    font-size: 13pt;
    margin-bottom: 8mm;
  }
  .cover-orientation {
    font-family: "DM Mono", monospace;
    font-size: 8.5pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0 0 4mm;
  }
  .cover-user {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 34pt;
    line-height: 1.12;
    margin: 0;
    overflow-wrap: break-word;
  }
  .cover-foot { min-width: 0; }
  .cover-foot h1 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 18pt;
    font-weight: 400;
    line-height: 1.35;
    margin: 0 0 5mm;
    border: none;
    padding: 0;
    overflow-wrap: break-word;
  }
  .cover-dossier {
    font-family: "DM Mono", monospace;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0 0 7mm;
    overflow-wrap: break-word;
  }
  .cover .subtitle {
    font-size: 11pt;
    line-height: 1.65;
    margin: 0 0 8mm;
  }
  .cover-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 2.5mm;
    margin: 0 0 10mm;
  }
  .cover-chips span {
    font-family: "DM Mono", monospace;
    font-size: 7.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 1.6mm 3.2mm;
    border-radius: 99px;
    border: 1px solid currentColor;
    max-width: 100%;
    overflow-wrap: break-word;
  }
  .cover-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 8mm 12mm;
    margin: 0;
    padding-top: 8mm;
    border-top: 1px solid currentColor;
  }
  .cover-fact {
    flex: 1 1 calc(50% - 8mm);
    min-width: 0;
    max-width: 100%;
  }
  .cover-fact .k {
    display: block;
    font-family: "DM Mono", monospace;
    font-size: 7pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.75;
    margin: 0 0 2.5mm;
  }
  .cover-fact .v { display: block; font-size: 10.5pt; overflow-wrap: break-word; }

  .sheet { padding: 0; width: 210mm; }
  .score-sheet {
    width: 210mm;
    padding: 0;
    page-break-after: always;
    break-after: page;
  }
  .cover-score {
    font-family: "DM Mono", monospace;
    font-size: 8.5pt;
    letter-spacing: 0.06em;
    margin: 4mm 0 0;
    opacity: 0.9;
  }
  .score-kicker {
    font-family: "DM Mono", monospace;
    font-size: 8pt;
    letter-spacing: 0.04em;
    margin: 0 0 8mm;
  }
  .score-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 7mm;
    justify-items: stretch;
  }
  .score-radar {
    width: min(100%, 138mm);
    margin: 0 auto;
  }
  .score-radar-svg { width: 100%; height: auto; display: block; }
  .score-table { width: 100%; font-size: 9pt; margin: 0; table-layout: auto; }
  .score-table th { padding: 2mm 2.5mm; }
  .score-table td { padding: 2.2mm 2.5mm; }
  .score-rank, .score-num { font-family: "DM Mono", monospace; white-space: nowrap; }
  .score-table th:nth-child(3), .score-table td:nth-child(3),
  .score-table th:nth-child(4), .score-table td:nth-child(4) { text-align: right; width: 18mm; }
  .score-table tbody tr:nth-child(-n+3) td { font-weight: 500; }
  .doc { width: 100%; }
  .doc + .doc { break-before: page; page-break-before: always; padding-top: 2mm; }
  .doc-banner { margin: 0 0 10mm; padding-bottom: 6mm; }
  .doc-banner .kicker {
    font-family: "DM Mono", monospace;
    font-size: 8pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 4mm;
  }
  .doc-banner h1 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 18pt;
    line-height: 1.35;
    margin: 0 0 4mm;
    border: none;
    padding: 0;
    overflow-wrap: break-word;
  }

  h1, h2, h3, h4 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 400;
    line-height: 1.38;
    overflow-wrap: break-word;
    page-break-after: avoid;
    break-after: avoid;
  }
  h1 { font-size: 18pt; margin: 0 0 7mm; }
  h2.section-title, h2 {
    display: block;
    margin: 11mm 0 6mm;
    padding-bottom: 3.5mm;
    font-size: 14pt;
  }
  .h-num {
    font-family: "DM Mono", monospace;
    font-size: 9pt;
    letter-spacing: 0.08em;
    margin-right: 2.5mm;
  }
  .h-num::after { content: "."; }
  h3 {
    font-size: 12.5pt;
    margin: 8mm 0 4.5mm;
  }
  h4 {
    font-family: "Barlow", sans-serif;
    font-size: 8.5pt;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 7mm 0 3.5mm;
  }
  p {
    margin: 0 0 4.2mm;
    orphans: 3;
    widows: 3;
  }
  ul, ol {
    margin: 1mm 0 6mm;
    padding: 0 0 0 5.5mm;
    list-style-position: outside;
  }
  li {
    margin-bottom: 3.2mm;
    padding-left: 1mm;
    orphans: 3;
    widows: 3;
    overflow-wrap: break-word;
  }
  li.task { list-style: none; margin-left: 0; padding-left: 0; }
  li.task::before { content: "☐  "; }
  li.task.done::before { content: "☑  "; }
  blockquote {
    margin: 6mm 0 8mm;
    padding: 4.5mm 5.5mm;
    break-inside: auto;
  }
  blockquote p { margin: 0 0 3mm; }
  blockquote p:last-child { margin: 0; }
  pre {
    margin: 5mm 0 7mm;
    padding: 4.5mm 5mm;
    font-family: "DM Mono", Menlo, monospace;
    font-size: 8pt;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  code { font-family: "DM Mono", Menlo, monospace; font-size: 0.88em; }
  p code, li code { padding: 0.4mm 1.2mm; border-radius: 2px; }
  hr { border: none; margin: 8mm 0; }
  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 5mm 0 8mm;
    font-size: 9pt;
  }
  th, td { text-align: left; padding: 2.6mm 3mm; vertical-align: top; overflow-wrap: break-word; }

  .dossier {
    margin: 0 0 10mm;
    padding: 6.5mm 7mm;
  }
  .dossier-row {
    display: grid;
    grid-template-columns: minmax(0, 38%) minmax(0, 1fr);
    gap: 2.5mm 5mm;
    padding: 3mm 0;
  }
  .dossier-row + .dossier-row { border-top: 1px solid currentColor; }
  .dossier-row dt {
    font-family: "DM Mono", monospace;
    font-size: 7.5pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .dossier-row dd { margin: 0; min-width: 0; overflow-wrap: break-word; }

  .locale-block { margin: 5mm 0 8mm; }
  .locale-en { padding: 1.5mm 0 1.5mm 4.5mm; }
  .locale-h { font-size: 12.5pt !important; margin-top: 0 !important; }

  ol.points {
    list-style: decimal;
    list-style-position: inside;
    padding: 0;
    margin: 4mm 0 8mm;
  }
  ol.points > li,
  .point {
    display: block;
    margin: 0 0 7mm;
    padding: 5.5mm 6mm 6mm;
    break-inside: auto;
    page-break-inside: auto;
  }
  .point-title {
    display: block;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 12pt;
    font-weight: 500;
    line-height: 1.4;
    margin: 0 0 3mm;
    padding: 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  .point-body {
    margin: 0;
    padding: 0;
  }
  ol.points > li > strong:first-child {
    display: block;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 12pt;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 2.8mm;
  }
  ul > li {
    break-inside: auto;
    page-break-inside: auto;
    margin-bottom: 4.5mm;
  }
`;

const NOCTURNE = `
  body { color: #1d1914; background: #f3eee4; }
  .sheet { background: #f3eee4; }
  .score-sheet { background: #f3eee4; }
  h2.section-title, h2 { border-bottom: 1px solid rgba(196, 163, 90, 0.45); color: #1a1612; }
  .h-num { color: #8a6a28; }
  h3 { color: #3d3428; }
  a { color: #8a6a28; }
  hr { border-top: 1px solid rgba(18, 15, 12, 0.12); }
  blockquote { background: rgba(196, 163, 90, 0.08); border-left: 2px solid #c4a35a; color: #3a342c; }
  pre, p code, li code { background: rgba(18, 15, 12, 0.05); }
  th { background: #1a1612; color: #f4efe4; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; }
  td { border-bottom: 1px solid rgba(18, 15, 12, 0.1); }
  .cover {
    background:
      radial-gradient(circle at 18% 12%, rgba(196, 163, 90, 0.2), transparent 46%),
      #0a0b0f;
    color: #f4efe4;
  }
  .cover .brand, .cover-lang, .cover-glyph-wrap, .cover-orientation, .cover-dossier, .cover-score { color: #c4a35a; }
  .cover-lang, .cover-glyph-wrap { border-color: rgba(196, 163, 90, 0.45); }
  .cover-facts { border-top-color: rgba(196, 163, 90, 0.28); }
  .cover-chips span { color: #c4a35a; border-color: rgba(196, 163, 90, 0.4); }
  .cover-fact .k { color: rgba(196, 163, 90, 0.75); }
  .dossier { background: rgba(196, 163, 90, 0.07); }
  .dossier-row + .dossier-row { border-top-color: rgba(18, 15, 12, 0.08); }
  .dossier-row dt { color: #8a6a28; }
  .locale-en { border-left: 2px solid rgba(196, 163, 90, 0.4); color: #4a4338; }
  ol.points > li { background: rgba(255, 255, 255, 0.35); border-left: 2px solid #c4a35a; }
  .doc-banner { border-bottom: 1px solid rgba(196, 163, 90, 0.45); }
  .doc-banner .kicker { color: #8a6a28; }
`;

const IVOIRE = `
  body { color: #1f1b16; background: #fffdf8; }
  .sheet { background: #fffdf8; }
  .score-sheet { background: #fffdf8; }
  h2.section-title, h2 { border-bottom: 1px solid #d8c49a; color: #14110e; }
  .h-num { color: #8a6a28; }
  h3 { color: #4a4032; }
  a { color: #8a6a28; }
  hr { border-top: 1px solid #e6dcc8; }
  blockquote { border-left: 2px solid #c4a35a; background: #f7f1e6; color: #4a4338; }
  pre, p code, li code { background: #f3eee3; }
  th { background: #f3eee3; color: #2c261e; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; }
  td { border-bottom: 1px solid #eee6d6; }
  .cover { background: linear-gradient(180deg, #f4ead6 0%, #fffdf8 72%); color: #1f1b16; }
  .cover .brand, .cover-lang, .cover-glyph-wrap, .cover-orientation, .cover-dossier, .cover-score { color: #8a6a28; }
  .cover-lang, .cover-glyph-wrap { border-color: #d8c49a; }
  .cover-facts { border-top-color: #d8c49a; }
  .cover-chips span { color: #6a5c45; border-color: #d8c49a; }
  .cover-fact .k { color: #8a6a28; }
  .dossier { background: #f7f1e6; }
  .dossier-row + .dossier-row { border-top-color: #e6dcc8; }
  .dossier-row dt { color: #8a6a28; }
  .locale-en { border-left: 2px solid #d8c49a; color: #5a5348; }
  ol.points > li { background: #f7f1e6; border-left: 2px solid #c4a35a; }
  .doc-banner { border-bottom: 1px solid #d8c49a; }
  .doc-banner .kicker { color: #8a6a28; }
`;

const OBSIDIAN = `
  body { color: #ece6d8; background: #0c0e12; }
  .sheet { background: #0c0e12; }
  .score-sheet { background: #0c0e12; }
  h2.section-title, h2 { border-bottom: 1px solid rgba(196, 163, 90, 0.35); color: #f7f2e8; }
  .h-num { color: #c4a35a; }
  h3 { color: #c4a35a; }
  a { color: #e0c57a; }
  hr { border-top: 1px solid rgba(244, 239, 228, 0.14); }
  blockquote { border-left: 2px solid #c4a35a; background: rgba(196, 163, 90, 0.08); color: #d8d0c0; }
  pre, p code, li code { background: rgba(255, 255, 255, 0.06); }
  th { background: #c4a35a; color: #120f0c; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; }
  td { border-bottom: 1px solid rgba(244, 239, 228, 0.12); }
  .cover {
    background:
      radial-gradient(circle at 16% 10%, rgba(196, 163, 90, 0.24), transparent 48%),
      #06070a;
    color: #f4efe4;
  }
  .cover .brand, .cover-lang, .cover-glyph-wrap, .cover-orientation, .cover-dossier, .cover-score { color: #c4a35a; }
  .cover-lang, .cover-glyph-wrap { border-color: rgba(196, 163, 90, 0.4); }
  .cover-facts { border-top-color: rgba(196, 163, 90, 0.28); }
  .cover-chips span { color: #e0c57a; border-color: rgba(196, 163, 90, 0.4); }
  .cover-fact .k { color: rgba(196, 163, 90, 0.75); }
  .dossier { background: rgba(196, 163, 90, 0.08); }
  .dossier-row + .dossier-row { border-top-color: rgba(244, 239, 228, 0.1); }
  .dossier-row dt { color: #c4a35a; }
  .locale-en { border-left: 2px solid rgba(196, 163, 90, 0.4); color: #c8c0b0; }
  ol.points > li { background: rgba(255, 255, 255, 0.04); border-left: 2px solid #c4a35a; }
  .doc-banner { border-bottom: 1px solid rgba(196, 163, 90, 0.35); }
  .doc-banner .kicker { color: #c4a35a; }
`;

const SCREEN_PAPER = `
  @media screen {
    html { background: #171717 !important; }
    body {
      display: flex;
      flex-direction: column;
      gap: 36px;
      width: 210mm !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: transparent !important;
    }
    .cover {
      margin: 0;
      box-shadow: 0 18px 50px rgba(0,0,0,0.45);
    }
    .sheet, .score-sheet {
      padding: 20mm 18mm 24mm !important;
      box-shadow: 0 18px 50px rgba(0,0,0,0.45);
    }
    .score-sheet { min-height: 297mm; }
  }
  @media print {
    html, body {
      display: block;
      width: auto !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .cover { margin: 0; box-shadow: none; }
    .sheet, .score-sheet { padding: 0 !important; box-shadow: none; min-height: 0; }
    .score-sheet:first-child { padding: 16mm 15mm 18mm !important; }
  }
`;

export function getMdPdfThemeCss(theme: MdPdfThemeId): string {
  const extra = theme === "ivoire" ? IVOIRE : theme === "obsidian" ? OBSIDIAN : NOCTURNE;
  return `${SHARED}\n${extra}\n${SCREEN_PAPER}`;
}

export const MD_PDF_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap";
