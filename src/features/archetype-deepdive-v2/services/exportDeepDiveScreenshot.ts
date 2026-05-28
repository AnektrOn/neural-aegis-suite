import html2canvas from "html2canvas";

/** Desktop landscape — readable when shared */
const DESKTOP_EXPORT_WIDTH_PX = 1280;
const EXPORT_SCALE = 2;
const MAX_CANVAS_TILE_HEIGHT_PX = 8000;
const REFLOW_MS = 500;

const CAPTURE_STYLE_ID = "deep-dive-jpeg-capture-styles";

/**
 * Self-contained export palette on the report root (no html.light toggle).
 * Fixes washed-out text and invisible glass cards when forcing a light capture.
 */
const CAPTURE_CSS = `
  #deep-dive-report-export.deep-dive-jpeg-capture-active {
    --background: 30 25% 97%;
    --foreground: 20 12% 12%;
    --card: 30 20% 99%;
    --card-foreground: 20 12% 12%;
    --popover: 30 20% 96%;
    --popover-foreground: 20 12% 12%;
    --muted-foreground: 20 8% 32%;
    --border: 30 12% 78%;
    --primary: 24 22% 22%;
    --primary-foreground: 30 20% 96%;

    width: ${DESKTOP_EXPORT_WIDTH_PX}px !important;
    max-width: ${DESKTOP_EXPORT_WIDTH_PX}px !important;
    margin: 0 !important;
    padding: 32px 36px 48px !important;
    box-sizing: border-box !important;
    background: hsl(30 25% 97%) !important;
    color: hsl(20 12% 12%) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active [data-export-hide],
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-export-hide {
    display: none !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active * {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active .neural-card,
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="backdrop-blur"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-white/"] {
    background: hsl(30 18% 99%) !important;
    border-color: hsl(30 12% 78%) !important;
    box-shadow: 0 2px 14px hsl(20 10% 15% / 0.08) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active .text-text-primary,
  #deep-dive-report-export.deep-dive-jpeg-capture-active h1,
  #deep-dive-report-export.deep-dive-jpeg-capture-active h2,
  #deep-dive-report-export.deep-dive-jpeg-capture-active h3,
  #deep-dive-report-export.deep-dive-jpeg-capture-active h4,
  #deep-dive-report-export.deep-dive-jpeg-capture-active strong {
    color: hsl(20 12% 10%) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active .text-text-secondary,
  #deep-dive-report-export.deep-dive-jpeg-capture-active p,
  #deep-dive-report-export.deep-dive-jpeg-capture-active li,
  #deep-dive-report-export.deep-dive-jpeg-capture-active span:not([class*="rounded-full"]) {
    color: hsl(20 8% 22%) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active .text-text-tertiary,
  #deep-dive-report-export.deep-dive-jpeg-capture-active .text-muted-foreground {
    color: hsl(20 6% 38%) !important;
  }

  /* Accent chips designed for dark UI — darken for export */
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-indigo-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-sky-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-emerald-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-rose-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-amber-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-fuchsia-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="text-teal-"] {
    color: hsl(20 12% 18%) !important;
  }

  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-indigo-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-sky-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-emerald-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-rose-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-amber-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-fuchsia-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-teal-"],
  #deep-dive-report-export.deep-dive-jpeg-capture-active [class*="bg-white/"] {
    background-color: hsl(30 15% 92%) !important;
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
    display: block !important;
  }
  #deep-dive-report-export.deep-dive-jpeg-capture-active .flip-face-back {
    border-top: 1px solid hsl(30 12% 78%) !important;
    padding-top: 14px !important;
    margin-top: 0 !important;
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
      f.style.display = "block";
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
      backgroundColor: "#f7f4f1",
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
        backgroundColor: "#f7f4f1",
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

export async function exportDeepDiveJpeg(
  element: HTMLElement,
  profileLabel: string,
  _isFR = true,
): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const stem = slugify(profileLabel) || "deep-dive";
  const height = Math.max(element.scrollHeight, element.offsetHeight);

  if (height <= MAX_CANVAS_TILE_HEIGHT_PX) {
    const canvas = await captureReport(element);
    triggerDownload(
      canvas.toDataURL("image/jpeg", 0.94),
      `aegis-deepdive-desktop-${stem}-${date}.jpg`,
    );
    return;
  }

  const tiles = await captureReportTiled(element);
  tiles.forEach((canvas, idx) => {
    triggerDownload(
      canvas.toDataURL("image/jpeg", 0.94),
      `aegis-deepdive-desktop-${stem}-${date}-part-${idx + 1}.jpg`,
    );
  });
}
