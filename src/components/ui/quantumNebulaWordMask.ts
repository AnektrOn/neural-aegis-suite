import * as THREE from "three";

export interface QuantumNebulaWordConfig {
  text: string;
  font: string;
  scale: number;
  weight: number;
  spacingEm: number;
  italic: boolean;
  uppercase: boolean;
  outline: boolean;
  /** World-space offset of the word pupil (positive X = right). */
  offsetX?: number;
  offsetY?: number;
}

export interface WordMaskData {
  active: boolean;
  texture: THREE.CanvasTexture | null;
  planeW: number;
  planeH: number;
  gridW: number;
  gridH: number;
  mask: Float32Array | null;
  blurred: Float32Array | null;
  gradX: Float32Array | null;
  gradY: Float32Array | null;
}

export function buildWordMaskData(wordCfg: QuantumNebulaWordConfig): WordMaskData {
  const rawText = (wordCfg.text || "").trim();
  if (!rawText) {
    return {
      active: false,
      texture: null,
      planeW: 1,
      planeH: 1,
      gridW: 0,
      gridH: 0,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }

  const displayText = wordCfg.uppercase ? rawText.toUpperCase() : rawText;
  const canvasW = 1024;
  const canvasH = 384;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      active: false,
      texture: null,
      planeW: 1,
      planeH: 1,
      gridW: 0,
      gridH: 0,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }

  const fontStyle = wordCfg.italic ? "italic" : "normal";
  const fontFamily = `"${wordCfg.font}", "Cinzel", serif`;

  let fontPx = 220;
  const measureWithSpacing = (px: number) => {
    ctx.font = `${fontStyle} ${wordCfg.weight} ${px}px ${fontFamily}`;
    const letterSpacePx = wordCfg.spacingEm * px;
    let totalW = 0;
    for (let i = 0; i < displayText.length; i++) {
      totalW += ctx.measureText(displayText[i]).width;
      if (i < displayText.length - 1) totalW += letterSpacePx;
    }
    return { totalW, letterSpacePx };
  };

  let measured = measureWithSpacing(fontPx);
  while (measured.totalW > canvasW * 0.86 && fontPx > 32) {
    fontPx -= 6;
    measured = measureWithSpacing(fontPx);
  }

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.font = `${fontStyle} ${wordCfg.weight} ${fontPx}px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, fontPx * 0.055);

  let cursorX = (canvasW - measured.totalW) * 0.5;
  const centerY = canvasH * 0.52;
  for (let i = 0; i < displayText.length; i++) {
    const ch = displayText[i];
    if (wordCfg.outline) {
      ctx.strokeText(ch, cursorX, centerY);
    } else {
      ctx.fillText(ch, cursorX, centerY);
    }
    cursorX += ctx.measureText(ch).width + measured.letterSpacePx;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const gridW = 160;
  const gridH = 60;
  const small = document.createElement("canvas");
  small.width = gridW;
  small.height = gridH;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  if (!sctx) {
    return {
      active: true,
      texture,
      planeW: 1.08 * wordCfg.scale,
      planeH: 1.08 * wordCfg.scale,
      gridW,
      gridH,
      mask: null,
      blurred: null,
      gradX: null,
      gradY: null,
    };
  }
  sctx.drawImage(canvas, 0, 0, gridW, gridH);
  const sdata = sctx.getImageData(0, 0, gridW, gridH).data;

  const rawMask = new Float32Array(gridW * gridH);
  for (let i = 0; i < gridW * gridH; i++) {
    rawMask[i] = sdata[i * 4 + 3] / 255;
  }

  const blurred = rawMask.slice();
  const temp = new Float32Array(gridW * gridH);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let sum = 0;
        let count = 0;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < gridW) {
            sum += blurred[y * gridW + nx];
            count++;
          }
        }
        temp[y * gridW + x] = sum / count;
      }
    }
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < gridH) {
            sum += temp[ny * gridW + x];
            count++;
          }
        }
        blurred[y * gridW + x] = sum / count;
      }
    }
  }

  const gradX = new Float32Array(gridW * gridH);
  const gradY = new Float32Array(gridW * gridH);
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      const idx = y * gridW + x;
      const gx = blurred[idx - 1] - blurred[idx + 1];
      const gy = blurred[(y + 1) * gridW + x] - blurred[(y - 1) * gridW + x];
      const len = Math.hypot(gx, gy) + 0.0001;
      gradX[idx] = gx / len;
      gradY[idx] = gy / len;
    }
  }

  const aspect = canvasW / canvasH;
  const planeH = 1.08 * wordCfg.scale;
  const planeW = planeH * aspect;

  return {
    active: true,
    texture,
    planeW,
    planeH,
    gridW,
    gridH,
    mask: rawMask,
    blurred,
    gradX,
    gradY,
  };
}