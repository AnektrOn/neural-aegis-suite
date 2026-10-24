import type { WebGLRenderer } from "three";
import * as THREE from "three";

function fragmentHighFloatOk(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const fmt = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  return Boolean(fmt?.precision);
}

/** RT half-float du composer : sinon fallback 8-bit (évite crash précision GL). */
export function r3fComposerRenderTargetType(renderer: WebGLRenderer): THREE.TextureDataType {
  if (!fragmentHighFloatOk(renderer)) return THREE.UnsignedByteType;
  if (renderer.capabilities.isWebGL2) return THREE.HalfFloatType;
  if (
    renderer.extensions.has("EXT_color_buffer_half_float") ||
    renderer.extensions.has("WEBGL_color_buffer_float")
  ) {
    return THREE.HalfFloatType;
  }
  return THREE.UnsignedByteType;
}
