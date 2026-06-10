import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** Desktop landscape — readable when shared */
const DESKTOP_EXPORT_WIDTH_PX = 1280;
const EXPORT_SCALE = 2;
const MAX_CANVAS_TILE_HEIGHT_PX = 8000;
const REFLOW_MS = 500;

const CAPTURE_STYLE_ID = "deep-dive-jpeg-capture-styles";
/** Matches :root dark theme — hsl(200 35% 7%) */
const EXPORT_DARK_BG = "#0c1218";

/**
 * Dark-theme export palette on the report root.
 * Keeps the on-screen Neural & Ethereal look; only fixes html2canvas issues
 * (backdrop-blur, flip 3D, recharts sizing).
 */
const CAPTURE_CSS = `
  #deep-dive-report-export.deep-dive-jpeg-capture-active {
    --background: 200 35% 7%;
    --foreground: 24 48% 95%;
    --card: 201 28% 12%;
    --card-foreground: 24 48% 90%;
    --popover: 201 28% 15%;
    --popover-foreground: 24 48% 95%;
    --muted-foreground: 24 10% 60%;
    --border: 201 28% 20%;
    --primary: 24 48% 65%;
    --primary-foreground: 200 35% 7%;
    --warning: 35 90% 60%;

    width: ${DESKTOP_EXPORT_WIDTH_PX}px !important;
    max-width: ${DESKTOP_EXPORT_WIDTH_PX}px !important;
    margin: 0 !important;
    padding: 32px 36px 48px !important;
    box-sizing: border-box !important;
    background: ${EXPORT_DARK_BG} !important;
    color: hsl(24 48% 95%) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active [data-export-hide],
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-export-hide {
    display: none !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active * {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  /* Glass cards — solid dark surfaces (blur cannot be rasterized) */
  #deep-dive-report-export.deep-dive-jpeg-capture-active .neural-card:not([class*="from-"]),
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="backdrop-blur"]:not([class*="from-"]),
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-white/"]:not([class*="from-"]) {
    background: hsl(201 28% 13% / 0.96) !important;
    border-color: hsl(201 28% 22% / 0.9) !important;
    box-shadow: 0 4px 24px hsl(200 35% 4% / 0.45) !important;
  }

  /* Archetype gradient cards — preserve accent glow on dark base */
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-indigo-"] {
    background: linear-gradient(to bottom right, rgba(99, 102, 241, 0.14), hsl(201 28% 12%)) !important;
    border-color: rgba(129, 140, 248, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-sky-"] {
    background: linear-gradient(to bottom right, rgba(56, 189, 248, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(56, 189, 248, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-emerald-"] {
    background: linear-gradient(to bottom right, rgba(52, 211, 153, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(52, 211, 153, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-rose-"] {
    background: linear-gradient(to bottom right, rgba(251, 113, 133, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(251, 113, 133, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-amber-"] {
    background: linear-gradient(to bottom right, rgba(251, 191, 36, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(251, 191, 36, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-fuchsia-"] {
    background: linear-gradient(to bottom right, rgba(232, 121, 249, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(232, 121, 249, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-teal-"] {
    background: linear-gradient(to bottom right, rgba(45, 212, 191, 0.12), hsl(201 28% 12%)) !important;
    border-color: rgba(45, 212, 191, 0.35) !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="from-white"] {
    background: linear-gradient(to bottom right, hsl(201 28% 16%), hsl(201 28% 11%)) !important;
  }

  /* Flip cards — both faces stacked (html2canvas breaks 3D) */
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-card {
    perspective: none !important;
    min-height: auto !important;
    height: auto !important;
    cursor: default !important;
    margin-bottom: 12px !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-card-inner {
    transform: none !important;
    transform-style: flat !important;
    height: auto !important;
    min-height: 0 !important;
    position: static !important;
    display: flex !important;
    flex-direction: column !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face,
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face-back {
    position: relative !important;
    inset: auto !important;
    transform: none !important;
    backface-visibility: visible !important;
    -webkit-backface-visibility: visible !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    display: block !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face > *,
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face-back > * {
    -webkit-backface-visibility: visible !important;
    backface-visibility: visible !important;
    height: auto !important;
    min-height: 0 !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face-back {
    border-top: 2px dashed hsl(201 28% 28%) !important;
    padding-top: 14px !important;
    margin-top: 8px !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face-back::before {
    content: "Verso";
    display: block;
    font-size: 9px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: hsl(24 10% 52%);
    margin-bottom: 8px;
    font-family: system-ui, sans-serif;
  }

  /* Recharts — fixed box, no responsive scaling that breaks html2canvas */
  #deep-dive-report-export.deep-dive-jpeg-capture-active .recharts-responsive-container {
    width: ${DESKTOP_EXPORT_WIDTH_PX - 120}px !important;
    height: 420px !important;
    max-width: none !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .recharts-wrapper {
    width: ${DESKTOP_EXPORT_WIDTH_PX - 120}px !important;
    height: 420px !important;
    max-width: none !important;
    margin: 0 auto !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .recharts-surface {
    overflow: visible !important;
  }
`;

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function injectCaptureStyles(): void {
  if (document.getElementById(CAPTURE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = CAPTURE_STYLE_ID;
  style.textContent = CAPTURE_CSS;
  document.head.appendChild(style);
}

function removeCaptureStyles(): void {
  document.getElementById(CAPTURE_STYLE_ID)?.remove();
}

function stackFlipCardFaces(root: HTMLElement): void {
  root.querySelectorAll(".flip-card").forEach((cardEl) => {
    const card = cardEl as HTMLElement;
    card.classList.remove("is-flipped");
    const inner = card.querySelector(".flip-card-inner") as HTMLElement | null;
    if (inner) {
      inner.style.transform = "none";
      inner.style.transformStyle = "flat";
      inner.style.height = "auto";
      inner.style.minHeight = "0";
      inner.style.position = "static";
      inner.style.display = "flex";
      inner.style.flexDirection = "column";
    }
    card.querySelectorAll(".flip-face, .flip-face-back").forEach((face) => {
      const f = face as HTMLElement;
      f.style.position = "relative";
      f.style.inset = "auto";
      f.style.transform = "none";
      f.style.backfaceVisibility = "visible";
      f.style.height = "auto";
      f.style.minHeight = "0";
      f.style.display = "block";
      f.querySelectorAll(":scope > *").forEach((child) => {
        const c = child as HTMLElement;
        c.style.backfaceVisibility = "visible";
        c.style.height = "auto";
        c.style.minHeight = "0";
      });
    });
    card.style.perspective = "none";
    card.style.minHeight = "auto";
    card.style.height = "auto";
  });
}

/** Sync Recharts SVG dimensions to avoid polygon/grid misalignment in html2canvas. */
function syncRechartsDimensions(root: HTMLElement): void {
  const chartWidth = DESKTOP_EXPORT_WIDTH_PX - 120;
  root.querySelectorAll(".recharts-responsive-container").forEach((el) => {
    const container = el as HTMLElement;
    container.style.width = `${chartWidth}px`;
    container.style.height = "420px";
  });
  root.querySelectorAll(".recharts-wrapper").forEach((el) => {
    const wrapper = el as HTMLElement;
    wrapper.style.width = `${chartWidth}px`;
    wrapper.style.height = "420px";
  });
  root.querySelectorAll(".recharts-surface").forEach((el) => {
    const svg = el as SVGSVGElement;
    const w = svg.getBoundingClientRect().width || chartWidth;
    const h = svg.getBoundingClientRect().height || 420;
    svg.setAttribute("width", String(Math.round(w)));
    svg.setAttribute("height", String(Math.round(h)));
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
    svg.style.maxWidth = "none";
    svg.style.overflow = "visible";
  });
}

function applyCloneExportPrep(doc: Document): void {
  const cloneStyle = doc.createElement("style");
  cloneStyle.textContent = CAPTURE_CSS;
  doc.head.appendChild(cloneStyle);
  const root = doc.getElementById("deep-dive-report-export");
  if (!root) return;
  root.classList.add("deep-dive-jpeg-capture-active");
  stackFlipCardFaces(root as HTMLElement);
  syncRechartsDimensions(root as HTMLElement);
}

async function waitForLayout(): Promise<void> {
  window.dispatchEvent(new Event("resize"));
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  await new Promise<void>((r) => setTimeout(r, REFLOW_MS));
}

function unlockParentLayout(source: HTMLElement): (() => void) | null {
  const parent = source.parentElement;
  if (!parent) return null;
  const prev = {
    maxWidth: parent.style.maxWidth,
    overflow: parent.style.overflow,
    width: parent.style.width,
  };
  parent.style.maxWidth = "none";
  parent.style.overflow = "visible";
  parent.style.width = `${DESKTOP_EXPORT_WIDTH_PX}px`;
  return () => {
    parent.style.maxWidth = prev.maxWidth;
    parent.style.overflow = prev.overflow;
    parent.style.width = prev.width;
  };
}

async function captureReport(source: HTMLElement): Promise<HTMLCanvasElement> {
  injectCaptureStyles();
  source.classList.add("deep-dive-jpeg-capture-active");
  stackFlipCardFaces(source);
  syncRechartsDimensions(source);

  const scrollY = window.scrollY;
  const restoreParent = unlockParentLayout(source);
  window.scrollTo(0, 0);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForLayout();
    syncRechartsDimensions(source);
    await waitForLayout();

    const width = DESKTOP_EXPORT_WIDTH_PX;
    const height = Math.max(source.scrollHeight, source.offsetHeight);

    return html2canvas(source, {
      backgroundColor: EXPORT_DARK_BG,
      scale: EXPORT_SCALE,
      useCORS: true,
      logging: false,
      allowTaint: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      width,
      height,
      onclone: applyCloneExportPrep,
    });
  } finally {
    restoreParent?.();
    source.classList.remove("deep-dive-jpeg-capture-active");
    removeCaptureStyles();
    window.scrollTo(0, scrollY);
  }
}

async function captureReportTiled(source: HTMLElement): Promise<HTMLCanvasElement[]> {
  injectCaptureStyles();
  source.classList.add("deep-dive-jpeg-capture-active");
  stackFlipCardFaces(source);
  syncRechartsDimensions(source);

  const scrollY = window.scrollY;
  const restoreParent = unlockParentLayout(source);
  window.scrollTo(0, 0);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForLayout();
    syncRechartsDimensions(source);
    await waitForLayout();

    const totalHeight = Math.max(source.scrollHeight, source.offsetHeight);
    const width = DESKTOP_EXPORT_WIDTH_PX;
    const tiles: HTMLCanvasElement[] = [];

    for (let y = 0; y < totalHeight; y += MAX_CANVAS_TILE_HEIGHT_PX) {
      const tileHeight = Math.min(MAX_CANVAS_TILE_HEIGHT_PX, totalHeight - y);
      const tile = await html2canvas(source, {
        backgroundColor: EXPORT_DARK_BG,
        scale: EXPORT_SCALE,
        useCORS: true,
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: y,
        width,
        height: tileHeight,
        y,
        onclone: applyCloneExportPrep,
      });
      tiles.push(tile);
    }
    return tiles;
  } finally {
    restoreParent?.();
    source.classList.remove("deep-dive-jpeg-capture-active");
    removeCaptureStyles();
    window.scrollTo(0, scrollY);
  }
}

function buildExportFilename(stem: string, kind: string, ext: string, part?: number): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = slugify(stem) || "deep-dive";
  const suffix = part != null ? `-part-${part}` : "";
  return `aegis-deepdive-${kind}-${safe}-${date}${suffix}.${ext}`;
}

async function captureAllTiles(element: HTMLElement): Promise<HTMLCanvasElement[]> {
  const height = Math.max(element.scrollHeight, element.offsetHeight);
  if (height <= MAX_CANVAS_TILE_HEIGHT_PX) {
    return [await captureReport(element)];
  }
  return captureReportTiled(element);
}

function stitchTiles(tiles: HTMLCanvasElement[]): HTMLCanvasElement {
  if (tiles.length === 1) return tiles[0];
  const width = tiles[0].width;
  const totalHeight = tiles.reduce((sum, t) => sum + t.height, 0);
  const stitched = document.createElement("canvas");
  stitched.width = width;
  stitched.height = totalHeight;
  const ctx = stitched.getContext("2d")!;
  ctx.fillStyle = EXPORT_DARK_BG;
  ctx.fillRect(0, 0, width, totalHeight);
  let offsetY = 0;
  for (const tile of tiles) {
    ctx.drawImage(tile, 0, offsetY);
    offsetY += tile.height;
  }
  return stitched;
}

function canvasToPagedPdf(canvas: HTMLCanvasElement, pdf: jsPDF, marginMm = 8): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - marginMm * 2;
  const contentH = pageH - marginMm * 2;
  const imgWmm = contentW;
  const imgHmm = (canvas.height / canvas.width) * imgWmm;
  const sliceHmm = contentH;
  const totalPages = Math.max(1, Math.ceil(imgHmm / sliceHmm));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    pdf.setFillColor(12, 18, 24);
    pdf.rect(0, 0, pageW, pageH, "F");

    const srcY = (page * sliceHmm / imgHmm) * canvas.height;
    const srcH = Math.min((sliceHmm / imgHmm) * canvas.height, canvas.height - srcY);

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.ceil(srcH);
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = EXPORT_DARK_BG;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const renderHmm = (srcH / canvas.width) * imgWmm;
    pdf.addImage(slice.toDataURL("image/png"), "PNG", marginMm, marginMm, imgWmm, renderHmm);
  }
}

export interface DeepDiveVisualExportOpts {
  kind?: "user" | "admin";
  isFR?: boolean;
}

export async function exportDeepDivePng(
  element: HTMLElement,
  profileLabel: string,
  opts: DeepDiveVisualExportOpts = {},
): Promise<void> {
  const kind = opts.kind ?? "user";
  const tiles = await captureAllTiles(element);

  if (tiles.length === 1) {
    triggerDownload(
      tiles[0].toDataURL("image/png"),
      buildExportFilename(profileLabel, kind, "png"),
    );
    return;
  }

  tiles.forEach((canvas, idx) => {
    triggerDownload(
      canvas.toDataURL("image/png"),
      buildExportFilename(profileLabel, kind, "png", idx + 1),
    );
  });
}

export async function exportDeepDiveVisualPdf(
  element: HTMLElement,
  profileLabel: string,
  opts: DeepDiveVisualExportOpts = {},
): Promise<void> {
  const kind = opts.kind ?? "user";
  const tiles = await captureAllTiles(element);
  const stitched = stitchTiles(tiles);
  const pdf = new jsPDF("p", "mm", "a4");
  canvasToPagedPdf(stitched, pdf);
  pdf.save(buildExportFilename(profileLabel, kind, "pdf"));
}

export async function exportDeepDiveJpeg(
  element: HTMLElement,
  profileLabel: string,
  opts: DeepDiveVisualExportOpts = {},
): Promise<void> {
  const kind = opts.kind ?? "user";
  const tiles = await captureAllTiles(element);

  if (tiles.length === 1) {
    triggerDownload(
      tiles[0].toDataURL("image/jpeg", 0.94),
      buildExportFilename(profileLabel, kind, "jpg"),
    );
    return;
  }

  tiles.forEach((canvas, idx) => {
    triggerDownload(
      canvas.toDataURL("image/jpeg", 0.94),
      buildExportFilename(profileLabel, kind, "jpg", idx + 1),
    );
  });
}
