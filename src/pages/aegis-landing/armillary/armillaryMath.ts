import { DEG } from "./armillaryConstants";

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const round1 = (v: number) => Math.round(v * 100) / 100;

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255) as [
    number,
    number,
    number,
  ];
};

export const smoothDamp = (from: number, to: number, speed: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-speed * dt));

const vec = {
  sub: (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  dot: (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  norm: (a: number[]) => {
    const t = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / t, a[1] / t, a[2] / t];
  },
};

export const mat4 = {
  mul(a: Float32Array, b: Float32Array) {
    const out = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) sum += a[k * 4 + col] * b[row * 4 + k];
        out[row * 4 + col] = sum;
      }
    }
    return out;
  },
  rotX(r: number) {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  },
  rotY(r: number) {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  },
  rotZ(r: number) {
    const c = Math.cos(r);
    const s = Math.sin(r);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  },
  trans(x: number, y: number, z: number) {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  },
  persp(fovY: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fovY / 2);
    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) / (near - far),
      -1,
      0,
      0,
      (2 * far * near) / (near - far),
      0,
    ]);
  },
  lookAt(eye: number[], target: number[], up: number[]) {
    const z = vec.norm(vec.sub(eye, target));
    const x = vec.norm(vec.cross(up, z));
    const y = vec.cross(z, x);
    return new Float32Array([
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -vec.dot(x, eye),
      -vec.dot(y, eye),
      -vec.dot(z, eye),
      1,
    ]);
  },
  rot3(m: Float32Array) {
    return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
  },
  euler(xDeg: number, yDeg: number, zDeg: number) {
    return mat4.mul(
      mat4.mul(mat4.rotY(yDeg * DEG), mat4.rotX(xDeg * DEG)),
      mat4.rotZ(zDeg * DEG),
    );
  },
};
