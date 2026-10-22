import * as THREE from "three";
import type { SceneLayoutData } from "../layout/sceneLayout";
import {
  LAYOUT_COPY_BEATS,
  opacityForLayoutBeat,
  type LayoutCopyBeat,
  type LayoutCopyRole,
} from "./layoutCopyBeats";

export type LayoutCopyLabels = {
  sync: (u: number, layout: SceneLayoutData, camera: THREE.Camera) => void;
  dispose: () => void;
};

const ROLE_FONT: Record<LayoutCopyRole, { size: number; weight: string }> = {
  kicker: { size: 28, weight: "500" },
  title: { size: 42, weight: "600" },
  body: { size: 26, weight: "400" },
};

const ROLE_SCALE: Record<LayoutCopyRole, { w: number; h: number }> = {
  kicker: { w: 14, h: 2.2 },
  title: { w: 18, h: 4.2 },
  body: { w: 16, h: 5.4 },
};

function wrapLines(ctx: CanvasRenderingContext2D, lines: string[], maxWidth: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const words = line.split(" ");
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function makeLabelTexture(beat: LayoutCopyBeat): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = beat.role === "title" ? 420 : beat.role === "kicker" ? 220 : 520;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const font = ROLE_FONT[beat.role];
  ctx.font = `${font.weight} ${font.size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = `#${beat.color.toString(16).padStart(6, "0")}`;
  const wrapped = wrapLines(ctx, beat.lines, canvas.width - 80);
  const lineH = font.size * 1.28;
  const startY = canvas.height / 2 - ((wrapped.length - 1) * lineH) / 2;
  wrapped.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineH);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createLayoutCopyLabels(scene: THREE.Scene): LayoutCopyLabels {
  const sprites = LAYOUT_COPY_BEATS.map((beat) => {
    const texture = makeLabelTexture(beat);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = `LayoutCopy2D_${beat.id}`;
    sprite.visible = false;
    const scale = ROLE_SCALE[beat.role];
    sprite.scale.set(scale.w, scale.h, 1);
    sprite.frustumCulled = false;
    sprite.renderOrder = 20;
    scene.add(sprite);
    return { beat, sprite, material, texture };
  });

  return {
    sync(u, layout) {
      for (const item of sprites) {
        const opacity = opacityForLayoutBeat(u, item.beat.uStart, item.beat.uEnd);
        item.material.opacity = opacity;
        item.sprite.visible = opacity > 0.02;
        if (!item.sprite.visible) continue;
        item.sprite.position.copy(item.beat.worldPos(layout));
      }
    },
    dispose() {
      for (const item of sprites) {
        scene.remove(item.sprite);
        item.texture.dispose();
        item.material.dispose();
      }
    },
  };
}
