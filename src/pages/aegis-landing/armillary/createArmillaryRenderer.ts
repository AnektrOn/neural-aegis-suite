import { RING_SPECS } from "./armillaryConstants";
import { extrudeProfile, filletProfile, ringBandProfile, sphereMesh, tickMarksMesh } from "./armillaryGeometry";
import { mat4 } from "./armillaryMath";
import { FRAG_CORE, FRAG_FLAT, FRAG_HALO, FRAG_OBS, VERT_OBS } from "./armillaryShaders";

type GlMesh = {
  pb: WebGLBuffer;
  nb: WebGLBuffer;
  ib: WebGLBuffer;
  n: number;
  uvb?: WebGLBuffer;
  tb?: WebGLBuffer;
};

type GlProgram = WebGLProgram & { u: (name: string) => WebGLUniformLocation | null };

/** Decoded gun-metal maps. Paths live in `ARMILLARY_TEXTURES`. */
export type ArmillaryMaps = {
  albedo: HTMLImageElement;
  roughness: HTMLImageElement;
  normal: HTMLImageElement;
};

/** Per-frame uniforms. `ringMats` is one column-major mat4 per `RING_SPECS` entry (nested outer→inner). */
export type ArmillaryRenderParams = {
  vp: Float32Array;
  camPos: number[];
  ringMats: Float32Array[];
  corePos: number[];
  color: [number, number, number];
  glow: number;
};

export type ArmillaryRenderer = {
  gl: WebGLRenderingContext;
  resize: (w: number, h: number) => void;
  render: (params: ArmillaryRenderParams) => void;
  dispose: () => void;
};

export type ArmillaryRendererOptions = {
  antialias?: boolean;
  /** Additive halo spheres. 3 = full, 2 skips the outermost pass. */
  haloCount?: 1 | 2 | 3;
};

function uploadTexture(gl: WebGLRenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}

/** Compile shaders, upload meshes/textures, return a disposable WebGL 1 renderer. */
export function createArmillaryRenderer(
  canvas: HTMLCanvasElement,
  maps: ArmillaryMaps,
  options: ArmillaryRendererOptions = {},
): ArmillaryRenderer {
  const haloCount = options.haloCount ?? 3;
  const glOpts: WebGLContextAttributes = {
    antialias: options.antialias ?? true,
    alpha: true,
    premultipliedAlpha: true,
    depth: true,
  };
  const gl = (canvas.getContext("webgl", glOpts) ??
    canvas.getContext("experimental-webgl", glOpts)) as WebGLRenderingContext | null;
  if (!gl) {
    throw new Error("WebGL n'est pas disponible dans ce navigateur.");
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) throw new Error("Impossible de créer le shader.");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(`Shader : ${gl.getShaderInfoLog(sh) ?? ""}`);
    }
    return sh;
  };

  const linkProgram = (fragSrc: string): GlProgram => {
    const prog = gl.createProgram();
    if (!prog) throw new Error("Impossible de créer le programme.");
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_OBS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.bindAttribLocation(prog, 1, "aNor");
    gl.bindAttribLocation(prog, 2, "aUv");
    gl.bindAttribLocation(prog, 3, "aTan");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Link : ${gl.getProgramInfoLog(prog) ?? ""}`);
    }
    const cache: Record<string, WebGLUniformLocation | null> = {};
    const u = (name: string) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(prog, name)));
    return Object.assign(prog, { u });
  };

  const programs = {
    obs: linkProgram(FRAG_OBS),
    flat: linkProgram(FRAG_FLAT),
    core: linkProgram(FRAG_CORE),
    halo: linkProgram(FRAG_HALO),
  };

  const albedoTex = uploadTexture(gl, maps.albedo);
  const roughTex = uploadTexture(gl, maps.roughness);
  const norTex = uploadTexture(gl, maps.normal);

  const uploadMesh = (mesh: {
    P: number[];
    N: number[];
    I: number[];
    UV?: number[];
    T?: number[];
  }): GlMesh => {
    const pb = gl.createBuffer();
    if (!pb) throw new Error("Buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.P), gl.STATIC_DRAW);

    const nb = gl.createBuffer();
    if (!nb) throw new Error("Buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.N), gl.STATIC_DRAW);

    let uvb: WebGLBuffer | undefined;
    if (mesh.UV) {
      uvb = gl.createBuffer() ?? undefined;
      if (!uvb) throw new Error("Buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, uvb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.UV), gl.STATIC_DRAW);
    }

    let tb: WebGLBuffer | undefined;
    if (mesh.T) {
      tb = gl.createBuffer() ?? undefined;
      if (!tb) throw new Error("Buffer");
      gl.bindBuffer(gl.ARRAY_BUFFER, tb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.T), gl.STATIC_DRAW);
    }

    const ib = gl.createBuffer();
    if (!ib) throw new Error("Buffer");
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    if (mesh.P.length / 3 > 65535) throw new Error("Maillage trop grand");
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.I), gl.STATIC_DRAW);

    return { pb, nb, ib, n: mesh.I.length, uvb, tb };
  };

  const ringMeshes = RING_SPECS.map((spec) => ({
    band: uploadMesh(
      extrudeProfile(ringBandProfile(spec.R - spec.w, spec.R, spec.depth), 160),
    ),
    fillet: uploadMesh(extrudeProfile(filletProfile(spec.R - spec.w + 0.004, 0.011), 160)),
    ticks: uploadMesh(tickMarksMesh(spec)),
  }));

  const coreMesh = uploadMesh(sphereMesh(0.55));
  const haloInner = uploadMesh(sphereMesh(0.72));
  const haloMid = uploadMesh(sphereMesh(1.05));
  const haloOuter = uploadMesh(sphereMesh(1.7));

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);

  const drawMesh = (prog: GlProgram, mesh: GlMesh) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pb);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nb);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    if (mesh.uvb) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvb);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(2);
    }
    if (mesh.tb) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tb);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(3);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
    gl.drawElements(gl.TRIANGLES, mesh.n, gl.UNSIGNED_SHORT, 0);
  };

  const bindModel = (prog: GlProgram, model: Float32Array, vp: Float32Array) => {
    gl.useProgram(prog);
    gl.uniformMatrix4fv(prog.u("uModel"), false, model);
    gl.uniformMatrix4fv(prog.u("uVP"), false, vp);
    gl.uniformMatrix3fv(prog.u("uN"), false, mat4.rot3(model));
  };

  return {
    gl,
    resize(w, h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },
    render({ vp, camPos, ringMats, corePos, color, glow }) {
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      let prog = programs.obs;
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, albedoTex);
      gl.uniform1i(prog.u("uAlbedo"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, roughTex);
      gl.uniform1i(prog.u("uRough"), 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, norTex);
      gl.uniform1i(prog.u("uNorTex"), 2);

      RING_SPECS.forEach((_, i) => {
        bindModel(prog, ringMats[i], vp);
        gl.uniform3fv(prog.u("uCam"), camPos);
        gl.uniform3fv(prog.u("uCore"), corePos);
        gl.uniform3fv(prog.u("uCol"), color);
        gl.uniform1f(prog.u("uGlow"), glow);
        drawMesh(prog, ringMeshes[i].band);
      });

      prog = programs.flat;
      RING_SPECS.forEach((_, i) => {
        bindModel(prog, ringMats[i], vp);
        gl.uniform3fv(prog.u("uColor"), color);
        gl.uniform1f(prog.u("uInt"), 1.15);
        drawMesh(prog, ringMeshes[i].fillet);
        gl.uniform3f(prog.u("uColor"), 0.55, 0.48, 0.4);
        gl.uniform1f(prog.u("uInt"), 1);
        drawMesh(prog, ringMeshes[i].ticks);
      });

      const coreModel = mat4.trans(corePos[0], corePos[1], corePos[2]);
      prog = programs.core;
      bindModel(prog, coreModel, vp);
      gl.uniform3fv(prog.u("uCam"), camPos);
      gl.uniform3fv(prog.u("uCol"), color);
      gl.uniform1f(prog.u("uGlow"), glow);
      drawMesh(prog, coreMesh);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      prog = programs.halo;
      bindModel(prog, coreModel, vp);
      gl.uniform3fv(prog.u("uCam"), camPos);
      gl.uniform3fv(prog.u("uCol"), color);
      const haloPasses = [
        { mesh: haloInner, pow: 1.7, amt: 0.42 },
        { mesh: haloMid, pow: 2.2, amt: 0.28 },
        { mesh: haloOuter, pow: 3.1, amt: 0.14 },
      ].slice(0, haloCount);
      for (const pass of haloPasses) {
        gl.uniform1f(prog.u("uPow"), pass.pow);
        gl.uniform1f(prog.u("uAmt"), pass.amt * glow);
        drawMesh(prog, pass.mesh);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    },
    dispose() {
      [coreMesh, haloInner, haloMid, haloOuter, ...ringMeshes.flatMap((r) => [r.band, r.fillet, r.ticks])].forEach(
        (m) => {
          gl.deleteBuffer(m.pb);
          gl.deleteBuffer(m.nb);
          gl.deleteBuffer(m.ib);
          if (m.uvb) gl.deleteBuffer(m.uvb);
          if (m.tb) gl.deleteBuffer(m.tb);
        },
      );
      [albedoTex, roughTex, norTex].forEach((t) => gl.deleteTexture(t));
      Object.values(programs).forEach((p) => gl.deleteProgram(p));
    },
  };
}
