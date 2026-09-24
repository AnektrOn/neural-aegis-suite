import * as THREE from "three";

let sharedTexture: THREE.CanvasTexture | null = null;

function markerTexture(): THREE.CanvasTexture {
  if (sharedTexture) return sharedTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6a1a";
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffcc99";
    ctx.beginPath();
    ctx.arc(32, 32, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  sharedTexture = new THREE.CanvasTexture(canvas);
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  return sharedTexture;
}

export function createBqcSpriteMaterial(spotlight: boolean): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: markerTexture(),
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: spotlight ? 1 : 0.88,
    sizeAttenuation: true,
  });
}

export function setBqcSpriteSize(sprite: THREE.Sprite, headSpan: number, spotlight: boolean) {
  const s = headSpan * (spotlight ? 0.065 : 0.048);
  sprite.scale.set(s, s, 1);
  sprite.renderOrder = 20;
}
