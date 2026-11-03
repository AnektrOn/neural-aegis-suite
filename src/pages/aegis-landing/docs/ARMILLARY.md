# Armillary sphere — module API

Vanilla WebGL 1 renderer used on the AEGIS landing hero and the boot loader. Not Three.js, not R3F, not the prism-landing stack.

## Files

| File | Responsibility |
| --- | --- |
| `armillaryConstants.ts` | Ring specs, cameras, texture URLs, default spin / color |
| `armillaryMath.ts` | `mat4`, `hexToRgb`, `smoothDamp`, `clamp` |
| `armillaryGeometry.ts` | Procedural ring bands, fillets, ticks, spheres |
| `armillaryShaders.ts` | GLSL 1.00 vertex + four fragment programs |
| `createArmillaryRenderer.ts` | Context, GPU upload, draw, dispose |
| `ArmillarySphereCanvas.tsx` | React host: load maps, rAF, pointer, resize |

## React host

```tsx
import { ArmillarySphereCanvas } from "../armillary/ArmillarySphereCanvas";

<ArmillarySphereCanvas
  className="absolute inset-0"
  interactive={false}
/>
```

### `ArmillarySphereCanvasProps`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `className` | `string` | — | Applied to the sizing wrapper, not the canvas |
| `coreColor` | hex `string` | `LANDING_CORE_COLOR` (`#e8b17a`) | Point-light / core tint |
| `glow` | `number` | `LANDING_CORE_GLOW` (`1.65`) | Scales core + halo intensity |
| `ringTargets` | `Record<RingId, EulerDeg>` | `DEFAULT_RING_EULERS` | Rest pose, degrees |
| `sphereTarget` | `EulerDeg` | `{0,0,0}` | World offset of the assembly |
| `spin` | `Record<RingId, number>` | outer 10, middle −16, inner 8 | Degrees / second added to Y |
| `autoCamera` | `boolean` | `true` | Advance azimuth each frame |
| `autoCameraSpeed` | `number` | `AUTO_CAM_SPEED` (`0`) | Hero is locked; loader uses `0.16` |
| `interactive` | `boolean` | `true` | Orbit (drag), pinch/wheel zoom |
| `quality` | `"high" \| "low"` | `"high"` | `low` = no MSAA, 2 halos, DPR 1.5 |
| `onError` | `() => void` | — | Texture / WebGL failure |
| `onReady` | `() => void` | — | First painted frame; hero fades the JPEG still |
| `adaptFraming` | `boolean` | `false` | Lerp camera with wrapper aspect |
| `initialAzimuth` | `number` | `LANDING_CAM.az` | Radians; **mount-only** |
| `initialPolar` | `number` | `LANDING_CAM.pol` | Radians; **mount-only** |
| `initialDistance` | `number` | `LANDING_CAM.dist` | **mount-only** |
| `initialTarget` | `[x,y,z]` | `LANDING_CAM.target` | Look-at; **mount-only** |

Pose / color / spin updates go through a ref and do **not** remount the WebGL context. Camera initials are `useEffect` dependencies: changing them tears down the renderer.

Hero usage (`LandingHero`): `interactive={false}` and `pointer-events-none`, so the default `autoCamera` + `AUTO_CAM_SPEED = 0` yields a still frame with hover bob only.

Loader usage (`ArmillaryLoader`): `LOADER_CAM` (dist 8.4, target near origin) and `autoCameraSpeed={LOADER_CAM_SPEED}`.

### Call sites

```bash
rg "ArmillarySphereCanvas|createArmillaryRenderer|ArmillaryLoader" src
```

Expected: `LandingHero.tsx`, `ArmillaryLoader.tsx`, `BootLoadingScreen.tsx`.

## Renderer API

```ts
createArmillaryRenderer(canvas: HTMLCanvasElement, maps: ArmillaryMaps): ArmillaryRenderer
```

`ArmillaryMaps` is three already-decoded `HTMLImageElement`s (`albedo`, `roughness`, `normal`). The canvas host loads them in parallel from `ARMILLARY_TEXTURES` (1024² WebP).

```ts
type ArmillaryRenderer = {
  gl: WebGLRenderingContext;
  resize: (w: number, h: number) => void;
  render: (params: ArmillaryRenderParams) => void;
  dispose: () => void;
};

type ArmillaryRenderParams = {
  vp: Float32Array;          // view-projection, column-major
  camPos: number[];          // world-space eye
  ringMats: Float32Array[];  // one mat4 per RING_SPECS entry, nested
  corePos: number[];         // world-space core + halo origin
  color: [number, number, number]; // 0–1 linear-ish RGB
  glow: number;
};
```

Context flags: `antialias` (off when `quality="low"`), `alpha`, `premultipliedAlpha`, `depth`. Optional `haloCount` 1–3. Fallback `experimental-webgl`. Index buffer is `Uint16`; meshes over 65535 vertices throw.

`dispose()` deletes ring/core/halo buffers, the three textures, and the four programs.

## Geometry

Three nested bands from `RING_SPECS`:

| `id` | Radius | Width | Depth | Tick count |
| --- | --- | --- | --- | --- |
| `outer` | 2.00 | 0.22 | 0.14 | 48 |
| `middle` | 1.62 | 0.20 | 0.12 | 36 |
| `inner` | 1.28 | 0.18 | 0.10 | 24 |

Each ring is three draws: extruded band (PBR), inner fillet (flat emissive), tick quads (flat bronze). Every 6th tick is longer.

Core sphere radius 0.55; additive halos at 0.72 / 1.05 / 1.70.

Ring matrices are a **parent chain**: outer → middle → inner, then a lift `trans(sphere.x, SPHERE_Y_BASE + hoverY + sphere.y, sphere.z)` with `SPHERE_Y_BASE = 0.18`. Hover: `sin(t * HOVER_SPEED) * HOVER_AMPLITUDE` (0.7 × 0.12). The camera look-at Y follows hover at 0.35× so the hero framing stays locked.

## Shaders

Shared vertex `VERT_OBS`: object → world (`uModel`), clip (`uVP`), normal/tangent via `uN`.

| Program | Fragment | What it draws |
| --- | --- | --- |
| `obs` | `FRAG_OBS` | Textured ring bands — tangent-space normal map, Schlick F0=0.04, analytic env, core as point light, Reinhard + gamma |
| `flat` | `FRAG_FLAT` | Fillets (`uColor * uInt`) and ticks |
| `core` | `FRAG_CORE` | Rim-lit bronze sphere |
| `halo` | `FRAG_HALO` | View-aligned glow, `gl_FragColor.a = 0`, additive blend |

`FRAG_OBS` uniforms: `uCam`, `uCore`, `uCol`, `uGlow`, `uAlbedo`, `uRough`, `uNorTex`.

Draw order each frame:

1. Clear to transparent
2. Opaque PBR bands
3. Flat fillets + ticks
4. Core
5. `blendFunc(ONE, ONE)`, `depthMask(false)`, up to three halo spheres (pow 1.7 / 2.2 / 3.1); `quality="low"` skips the outermost

## Camera presets

```ts
LANDING_CAM = { az: 0.52, pol: 1.14, dist: 30, target: [-7.55, -5.22, 0] }
LOADER_CAM  = { az: 0.38, pol: 1.08, dist: 8.4, target: [0, 0.2, 0] }
```

Projection: 34° vertical FOV, near 0.1, far 100. Distance clamp when interactive: 8–40.

Orbit: `az -= dx * 0.006`, `pol` clamped to `(0.05, π - 0.05)`. Wheel: `dist *= exp(deltaY * 0.001)` (`passive: false`).

Resize: `devicePixelRatio` capped at 1.5 (2 only at ≥1440 and `quality="high"`), `ResizeObserver` on the wrapper. The rAF loop pauses when the canvas is offscreen or `document.hidden`. Landing hero also sets `adaptFraming` so target/distance lerp with aspect.

Landing mounts the canvas only from `LANDING_CANVAS_MIN_WIDTH` (1024). Below that, `hero-scene-*.jpg` is the hero visual. A cream veil (`.aegis-landing__hero-veil`) covers baked-in UI in that JPEG so HTML copy stays readable.

## Reduced motion

If `(prefers-reduced-motion: reduce)`:

- Ring eulers snap to `ringTargets` (no `smoothDamp`)
- `spinAcc` is not advanced
- Hover amplitude is 0
- Auto-azimuth is skipped

A single paint still runs on resize while paused.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| JPEG still, no metal | Viewport under 1024, or texture 404 / WebGL throw — check console `Texture introuvable` / `WebGL n'est pas disponible` |
| Black canvas | Parent has no size; wrapper must have width/height (`absolute inset-0` on a positioned stage) |
| Soft / blurry | DPR cap is 2; check wrapper CSS size, not canvas CSS size |
| Rings freeze | Reduced motion enabled |
| Context lost after HMR | Effect deps include `initialTarget`; pass a stable tuple |
| Import from prism-landing | Forbidden — keep this renderer self-contained |
