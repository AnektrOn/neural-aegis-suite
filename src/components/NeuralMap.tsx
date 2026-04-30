import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Network, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CONTACT_PROXIMITY_LABELS,
  lineOpacityFromQuality,
  normalizeContactProximity,
  PROXIMITY_LAYOUT,
} from "@/lib/contactProximity";

export type Period = "1d" | "3d" | "7d" | "14d" | "1m" | "3m" | "6m" | "1y" | "all";

export const PERIOD_DAYS: Record<Period, number> = {
  "1d": 1,
  "3d": 3,
  "7d": 7,
  "14d": 14,
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  all: 99999,
};

export const PERIOD_LABELS: Record<Period, string> = {
  "1d": "1 Jour",
  "3d": "3 Jours",
  "7d": "1 Semaine",
  "14d": "2 Semaines",
  "1m": "1 Mois",
  "3m": "Trimestre",
  "6m": "Semestre",
  "1y": "Année",
  all: "Lifetime",
};

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
  /** Niveau de proximité (Supabase) — pilote la distance au centre sur la carte */
  proximity?: string | null;
}

function getProximityLayout(proximity: string | null | undefined) {
  const key = normalizeContactProximity(proximity);
  return PROXIMITY_LAYOUT[key];
}

export type NeuralMapViewControls = { resetView: () => void };

interface NeuralMapProps {
  people: Person[];
  onPersonClick?: (person: Person) => void;
  compact?: boolean;
  showFilters?: boolean;
  period?: Period;
  onPeriodChange?: (p: Period) => void;
  /** Proximité affichée sur la carte (ex. état local PeopleBoard avant enregistrement) */
  proximityById?: Record<string, string>;
  /** Note affichée sur la carte (ex. slider local) */
  qualityById?: Record<string, number>;
  /** Expose resetView() pour remettre zoom, pan et rotation par défaut */
  viewControlsRef?: MutableRefObject<NeuralMapViewControls | null>;
  /** Carte pleine expérience (bloom sur le graphe contacts) — non utilisé sur Dashboard */
  immersive?: boolean;
}

function createGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(c);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.15, "rgba(255,255,255,0.85)");
  g.addColorStop(0.4, "rgba(255,255,255,0.28)");
  g.addColorStop(0.7, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

async function fetchPeriodQualities(
  people: Person[],
  period: Period,
  userId: string
): Promise<Record<string, number>> {
  if (period === "all") {
    return Object.fromEntries(people.map((p) => [p.id, p.quality]));
  }
  try {
    const since = new Date();
    since.setDate(since.getDate() - PERIOD_DAYS[period]);
    const { data, error } = await supabase
      .from("relation_quality_history")
      .select("contact_id, quality")
      .eq("user_id", userId)
      .in(
        "contact_id",
        people.map((p) => p.id)
      )
      .gte("recorded_at", since.toISOString());

    if (error) {
      console.error("fetchPeriodQualities:", error.message);
      return Object.fromEntries(people.map((p) => [p.id, p.quality * 0.75]));
    }

    const grouped: Record<string, number[]> = {};
    (data || []).forEach((h: { contact_id: string; quality: number }) => {
      if (!grouped[h.contact_id]) grouped[h.contact_id] = [];
      grouped[h.contact_id].push(h.quality);
    });

    return Object.fromEntries(
      people.map((p) => {
        const hist = grouped[p.id];
        return [
          p.id,
          hist?.length ? hist.reduce((s, v) => s + v, 0) / hist.length : p.quality * 0.75,
        ];
      })
    );
  } catch (e) {
    console.error("fetchPeriodQualities:", e);
    return Object.fromEntries(people.map((p) => [p.id, p.quality * 0.75]));
  }
}

type NodeEntry = {
  person: Person;
  core: THREE.Sprite;
  outer: THREE.Sprite;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  idx: number;
  baseScale: number;
  outerBaseScale: number;
  baseLineOp: number;
};

const MOBILE_MAX_W = 640;

function hideNeuralTooltip(wrap: HTMLElement | null) {
  if (!wrap) return;
  const ttEl = wrap.querySelector("#neural-tooltip") as HTMLElement | null;
  if (ttEl) ttEl.style.display = "none";
}

export default function NeuralMap({
  people,
  onPersonClick,
  compact = false,
  showFilters = false,
  period: periodProp = "all",
  onPeriodChange,
  proximityById,
  qualityById,
  viewControlsRef,
  immersive = false,
}: NeuralMapProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const resetViewFnRef = useRef<(() => void) | null>(null);
  const [periodQualities, setPeriodQualities] = useState<Record<string, number>>({});
  const periodQRef = useRef<Record<string, number>>({});
  const selectedIdRef = useRef<string | null>(null);
  const onPersonClickRef = useRef(onPersonClick);
  onPersonClickRef.current = onPersonClick;

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_MAX_W
  );

  const activePeriod: Period = compact ? "all" : periodProp;

  const heightPx = compact
    ? 260
    : immersive
      ? isMobile
        ? 480
        : Math.min(720, Math.round((typeof window !== "undefined" ? window.innerHeight : 900) * 0.62))
      : isMobile
        ? 420
        : 520;

  const scenePausedRef = useRef(false);
  const freezeToggleRef = useRef<(() => boolean) | null>(null);
  const [uiFrozen, setUiFrozen] = useState(false);

  useEffect(() => {
    const onResizeViewport = () => setIsMobile(window.innerWidth < MOBILE_MAX_W);
    window.addEventListener("resize", onResizeViewport);
    return () => window.removeEventListener("resize", onResizeViewport);
  }, []);

  useEffect(() => {
    if (!user || people.length === 0) {
      setPeriodQualities({});
      periodQRef.current = {};
      return;
    }
    if (activePeriod === "all") {
      const q = Object.fromEntries(people.map((p) => [p.id, qualityById?.[p.id] ?? p.quality]));
      periodQRef.current = q;
      setPeriodQualities(q);
      return;
    }
    const baseline = Object.fromEntries(people.map((p) => [p.id, qualityById?.[p.id] ?? p.quality]));
    periodQRef.current = baseline;
    setPeriodQualities(baseline);
    fetchPeriodQualities(people, activePeriod, user.id).then((q) => {
      setPeriodQualities(q);
      periodQRef.current = q;
    });
  }, [people, activePeriod, user, qualityById]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || people.length === 0) return;

    const mobile = typeof window !== "undefined" && window.innerWidth < MOBILE_MAX_W;
    const w = el.clientWidth || 400;
    const h = el.clientHeight || (compact ? 260 : mobile ? 420 : 520);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, immersive ? 0.0035 : compact ? 0.01 : 0.014);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, immersive ? 1000 : 200);
    let baseZ = compact ? 20 : mobile ? 22 : 26;
    let zoomMul = 1;
    const clampZoomMul = () => {
      zoomMul = Math.min(2.4, Math.max(0.4, zoomMul));
    };
    const applyCameraZ = () => {
      camera.position.z = baseZ * zoomMul;
    };
    applyCameraZ();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    if (immersive) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    const useBloom = immersive && !mobile;
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (useBloom) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), mobile ? 1.0 : 1.35, 0.55, 0.72);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const spinGroup = new THREE.Group();
    scene.add(spinGroup);

    const BG_DUST = 250;
    const bgPos = new Float32Array(BG_DUST * 3);
    for (let i = 0; i < BG_DUST; i++) {
      bgPos[i * 3] = (Math.random() - 0.5) * 65;
      bgPos[i * 3 + 1] = (Math.random() - 0.5) * 65;
      bgPos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgDust = new THREE.Points(
      bgGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: compact ? 0.04 : 0.055,
        transparent: true,
        opacity: immersive ? 0.12 : 0.28,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    if (immersive) {
      spinGroup.add(bgDust);
    } else {
      scene.add(bgDust);
    }

    const interactiveRoot = new THREE.Group();
    spinGroup.add(interactiveRoot);

    let animPaused = false;
    scenePausedRef.current = false;
    freezeToggleRef.current = () => {
      animPaused = !animPaused;
      scenePausedRef.current = animPaused;
      return animPaused;
    };

    const glowTex = createGlowTexture();

    const centerOuterMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const centerCoreMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const centerOuter = new THREE.Sprite(centerOuterMat);
    const centerCore = new THREE.Sprite(centerCoreMat);
    const cs = compact ? 0.45 : 0.62;
    centerOuter.scale.set(cs * 3.2, cs * 3.2, 1);
    centerCore.scale.set(cs, cs, 1);
    interactiveRoot.add(centerOuter);
    interactiveRoot.add(centerCore);

    const pqMap = periodQRef.current;
    const nodeEntries: NodeEntry[] = [];
    const pickSprites: THREE.Sprite[] = [];

    people.forEach((person, idx) => {
      const pq = pqMap[person.id] ?? qualityById?.[person.id] ?? person.quality;
      const effectiveProx = proximityById?.[person.id] ?? person.proximity;
      const prox = getProximityLayout(effectiveProx);
      const scale = prox.spriteBase * (0.45 + pq / 18);
      const phi = Math.acos(-1 + (2 * idx + 1) / Math.max(people.length * 2, 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = prox.orbitR;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const outerMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.12 + pq * 0.032,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const coreMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.55 + pq * 0.045,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const outer = new THREE.Sprite(outerMat);
      const core = new THREE.Sprite(coreMat);
      outer.scale.set(scale * 3.2, scale * 3.2, 1);
      core.scale.set(scale, scale, 1);
      core.position.set(x, y, z);
      outer.position.copy(core.position);
      core.userData.personId = person.id;
      outer.userData.personId = person.id;

      const baseLineOp = lineOpacityFromQuality(pq);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: baseLineOp,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);

      interactiveRoot.add(line);
      interactiveRoot.add(outer);
      interactiveRoot.add(core);
      pickSprites.push(core, outer);

      nodeEntries.push({
        person,
        core,
        outer,
        line,
        idx,
        baseScale: scale,
        outerBaseScale: scale * 3.2,
        baseLineOp,
      });
    });

    let isDragging = false;
    type DragMode = "rotate" | "pan";
    let dragMode: DragMode | null = null;
    let prevX = 0;
    let prevY = 0;
    let dragMoved = false;
    const panRight = new THREE.Vector3();
    const panUp = new THREE.Vector3();
    const panFwd = new THREE.Vector3();
    const PAN_MAX = 36;
    const targetRotY = { v: 0 };
    const targetRotX = { v: 0 };
    let currentRotY = 0;
    let currentRotX = 0;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 1.5 };

    const raycastFromEvent = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
      return raycaster.intersectObjects(pickSprites, false);
    };

    const syncTooltipFromHit = (e: MouseEvent, hits: THREE.Intersection[]) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const ttEl = wrap.querySelector("#neural-tooltip") as HTMLElement | null;
      const ttName = wrap.querySelector("#neural-tt-name") as HTMLElement | null;
      const ttRole = wrap.querySelector("#neural-tt-role") as HTMLElement | null;
      const ttProx = wrap.querySelector("#neural-tt-prox") as HTMLElement | null;
      const ttBar = wrap.querySelector("#neural-tt-bar") as HTMLElement | null;
      const ttQ = wrap.querySelector("#neural-tt-q") as HTMLElement | null;
      if (!ttEl || !ttName || !ttRole || !ttProx || !ttBar || !ttQ) return;

      const cw = wrap.clientWidth;
      const rect = wrap.getBoundingClientRect();

      if (hits.length > 0) {
        const personId = hits[0].object.userData.personId as string | undefined;
        const person = personId ? people.find((p) => p.id === personId) : undefined;
        if (person) {
          const pqVal = periodQRef.current[person.id] ?? qualityById?.[person.id] ?? person.quality;
          ttEl.style.display = "block";
          ttEl.style.left = `${Math.min(e.clientX - rect.left + 14, cw - 160)}px`;
          ttEl.style.top = `${Math.max(e.clientY - rect.top - 8, 4)}px`;
          ttName.textContent = person.name;
          ttRole.textContent = person.role ?? "";
          ttProx.textContent = CONTACT_PROXIMITY_LABELS[normalizeContactProximity(proximityById?.[person.id] ?? person.proximity)];
          ttBar.style.width = `${pqVal * 10}%`;
          ttQ.textContent = `${pqVal.toFixed(1)} / 10`;
          return;
        }
      }
      ttEl.style.display = "none";
    };

    const applyPan = (dx: number, dy: number) => {
      camera.updateMatrixWorld(true);
      camera.matrixWorld.extractBasis(panRight, panUp, panFwd);
      const k = 0.032 * (camera.position.z / 24);
      spinGroup.position.addScaledVector(panRight, -dx * k);
      spinGroup.position.addScaledVector(panUp, dy * k);
      spinGroup.position.z = 0;
      spinGroup.position.x = THREE.MathUtils.clamp(spinGroup.position.x, -PAN_MAX, PAN_MAX);
      spinGroup.position.y = THREE.MathUtils.clamp(spinGroup.position.y, -PAN_MAX, PAN_MAX);
    };

    const onDown = (e: MouseEvent) => {
      const panButtons = e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey);
      if (panButtons) {
        dragMode = "pan";
      } else if (e.button === 0) {
        dragMode = "rotate";
      } else {
        return;
      }
      isDragging = true;
      dragMoved = false;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      isDragging = false;
      dragMode = null;
    };
    const onLeave = () => {
      isDragging = false;
      dragMode = null;
      hideNeuralTooltip(wrapRef.current);
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (isDragging && dragMode) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
        prevX = e.clientX;
        prevY = e.clientY;
        if (dragMode === "pan") {
          applyPan(dx, dy);
        } else {
          targetRotY.v += dx * 0.005;
          targetRotX.v += dy * 0.005;
          targetRotX.v = Math.max(-0.55, Math.min(0.55, targetRotX.v));
        }
        hideNeuralTooltip(wrapRef.current);
        return;
      }
      const hits = raycastFromEvent(e);
      syncTooltipFromHit(e, hits);
    };

    const onClick = (e: MouseEvent) => {
      if (dragMoved) return;
      const hits = raycastFromEvent(e);
      if (hits.length > 0) {
        const id = hits[0].object.userData.personId as string | undefined;
        const entry = nodeEntries.find((n) => n.person.id === id);
        if (entry) {
          selectedIdRef.current = entry.person.id;
          onPersonClickRef.current?.(entry.person);
        }
        return;
      }
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const m = typeof window !== "undefined" && window.innerWidth < MOBILE_MAX_W;
      const nw = mountRef.current.clientWidth || 400;
      const nh = mountRef.current.clientHeight || (compact ? 260 : m ? 420 : 520);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      baseZ = compact ? 20 : m ? 22 : 26;
      clampZoomMul();
      applyCameraZ();
      renderer.setSize(nw, nh);
      if (composer && bloomPass) {
        composer.setSize(nw, nh);
        bloomPass.resolution.set(nw, nh);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomMul *= Math.exp(e.deltaY * 0.0011);
      clampZoomMul();
      applyCameraZ();
    };

    const pinchDist = (e: TouchEvent) => {
      const a = e.touches[0];
      const b = e.touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };
    let pinchStartDist = 0;
    let pinchStartMul = 1;
    /** 1 doigt : glisser = rotation (comme souris) ; appui long puis glisser = pan */
    let touchPanId: number | null = null;
    let touchPrevX = 0;
    let touchPrevY = 0;
    type TouchGesture = "none" | "rotate" | "pan";
    let touchGesture: TouchGesture = "none";
    let touchLongPressTimer: ReturnType<typeof setTimeout> | null = null;
    /** Distance cumulée depuis pose du doigt : dépasse un seuil → rotation (glisser), sinon appui long → pan */
    let touchTravel = 0;
    const LONG_PRESS_MS = 300;
    const COMMIT_ROTATE_PX = 12;

    const clearTouchLongPress = () => {
      if (touchLongPressTimer !== null) {
        clearTimeout(touchLongPressTimer);
        touchLongPressTimer = null;
      }
    };

    const beginSingleFingerTouch = (t: Touch) => {
      touchPanId = t.identifier;
      touchPrevX = t.clientX;
      touchPrevY = t.clientY;
      touchGesture = "none";
      touchTravel = 0;
      clearTouchLongPress();
      touchLongPressTimer = setTimeout(() => {
        if (touchGesture === "none") touchGesture = "pan";
        touchLongPressTimer = null;
      }, LONG_PRESS_MS);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        clearTouchLongPress();
        touchPanId = null;
        touchGesture = "none";
        pinchStartDist = pinchDist(e);
        pinchStartMul = zoomMul;
        return;
      }
      if (e.touches.length === 1) {
        pinchStartDist = 0;
        beginSingleFingerTouch(e.touches[0]);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist > 10) {
        clearTouchLongPress();
        touchGesture = "none";
        e.preventDefault();
        const d = pinchDist(e);
        zoomMul = pinchStartMul * (d / pinchStartDist);
        clampZoomMul();
        applyCameraZ();
        hideNeuralTooltip(wrapRef.current);
        return;
      }
      if (e.touches.length === 1 && touchPanId !== null) {
        const t = e.touches[0];
        if (t.identifier !== touchPanId) return;
        const dx = t.clientX - touchPrevX;
        const dy = t.clientY - touchPrevY;
        touchPrevX = t.clientX;
        touchPrevY = t.clientY;
        const moved = Math.abs(dx) + Math.abs(dy);
        if (touchGesture === "none") {
          touchTravel += moved;
          if (touchTravel >= COMMIT_ROTATE_PX) {
            touchGesture = "rotate";
            clearTouchLongPress();
          } else {
            return;
          }
        }
        if (moved > 0.5) e.preventDefault();
        hideNeuralTooltip(wrapRef.current);
        if (touchGesture === "rotate") {
          targetRotY.v += dx * 0.005;
          targetRotX.v += dy * 0.005;
          targetRotX.v = Math.max(-0.55, Math.min(0.55, targetRotX.v));
        } else if (touchGesture === "pan") {
          applyPan(dx, dy);
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      clearTouchLongPress();
      if (e.touches.length < 2) pinchStartDist = 0;
      if (e.touches.length === 0) {
        touchPanId = null;
        touchGesture = "none";
        return;
      }
      if (e.touches.length === 1) {
        beginSingleFingerTouch(e.touches[0]);
      }
    };

    const resetView = () => {
      zoomMul = 1;
      clampZoomMul();
      spinGroup.position.set(0, 0, 0);
      targetRotY.v = 0;
      targetRotX.v = 0;
      currentRotY = 0;
      currentRotX = 0;
      applyCameraZ();
      if (immersive) {
        animPaused = false;
        scenePausedRef.current = false;
        setUiFrozen(false);
      }
    };
    resetViewFnRef.current = resetView;
    if (viewControlsRef) viewControlsRef.current = { resetView };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("mouseleave", onLeave);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("contextmenu", onContextMenu);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("resize", onResize);

    let raf = 0;
    const t0 = performance.now() / 1000;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = performance.now() / 1000 - t0;
      if (!scenePausedRef.current && !isDragging) targetRotY.v += 0.001;
      currentRotY += (targetRotY.v - currentRotY) * 0.05;
      currentRotX += (targetRotX.v - currentRotX) * 0.05;
      spinGroup.rotation.y = currentRotY;
      spinGroup.rotation.x = currentRotX;
      bgDust.rotation.y = currentRotY * (immersive ? 0.04 : 0.08);

      if (!scenePausedRef.current) {
        const cp = 1 + Math.sin(t * 2.2) * 0.09;
        centerCore.scale.set(cs * cp, cs * cp, 1);
        centerCoreMat.opacity = 0.75 + Math.sin(t * 2.0) * 0.12;
        centerOuterMat.opacity = 0.14 + Math.sin(t * 1.6) * 0.05;
      }

      const sel = selectedIdRef.current;
      for (const n of nodeEntries) {
        const isSel = n.person.id === sel;
        const pq =
          periodQRef.current[n.person.id] ?? qualityById?.[n.person.id] ?? n.person.quality;
        const coreMat = n.core.material as THREE.SpriteMaterial;
        const outerMat = n.outer.material as THREE.SpriteMaterial;
        const lineMat = n.line.material as THREE.LineBasicMaterial;

        if (!scenePausedRef.current) {
          if (isSel) {
            const pulse = 1.25 + Math.sin(t * 5) * 0.12;
            n.core.scale.set(n.baseScale * pulse, n.baseScale * pulse, 1);
            n.outer.scale.set(n.outerBaseScale * pulse, n.outerBaseScale * pulse, 1);
            coreMat.opacity = 0.92;
            outerMat.opacity = 0.32;
            lineMat.opacity = n.baseLineOp * (1.4 + Math.sin(t * 4) * 0.25);
          } else {
            const breath = 1 + Math.sin(t * 1.5 + n.idx * 0.9) * 0.07;
            const ts = n.baseScale * breath;
            n.core.scale.x += (ts - n.core.scale.x) * 0.07;
            n.core.scale.y = n.core.scale.x;
            n.outer.scale.x += (ts * 3.2 - n.outer.scale.x) * 0.07;
            n.outer.scale.y = n.outer.scale.x;
            coreMat.opacity = (0.55 + pq * 0.045) * (0.78 + Math.sin(t * 1.8 + n.idx) * 0.14);
            outerMat.opacity = (0.12 + pq * 0.032) * (0.82 + Math.sin(t * 1.3 + n.idx) * 0.1);
            lineMat.opacity = n.baseLineOp * (0.88 + Math.sin(t * 1.1 + n.idx * 0.7) * 0.09);
          }
        }
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("mouseleave", onLeave);
      renderer.domElement.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("contextmenu", onContextMenu);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      renderer.domElement.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("resize", onResize);
      hideNeuralTooltip(wrapRef.current);
      freezeToggleRef.current = null;
      composer?.dispose();
      glowTex.dispose();
      bgGeo.dispose();
      bgDust.geometry.dispose();
      (bgDust.material as THREE.Material).dispose();
      centerOuterMat.dispose();
      centerCoreMat.dispose();
      for (const n of nodeEntries) {
        (n.core.material as THREE.Material).dispose();
        (n.outer.material as THREE.Material).dispose();
        n.line.geometry.dispose();
        (n.line.material as THREE.Material).dispose();
      }
      renderer.dispose();
      el.removeChild(renderer.domElement);
      resetViewFnRef.current = null;
      if (viewControlsRef) viewControlsRef.current = null;
    };
  }, [people, periodQualities, compact, isMobile, proximityById, qualityById, viewControlsRef, immersive]);

  if (people.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-black p-8 text-center" style={{ minHeight: heightPx }}>
        <Network size={24} strokeWidth={1} className="mx-auto mb-3 text-white/20" />
        <p className="text-sm text-white/35">{t("neural.empty")}</p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
      {showFilters && onPeriodChange && !compact && (
        <div className="flex flex-wrap gap-1 border-b border-white/[0.06] px-1 py-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`rounded-md px-2 py-1 text-[8px] uppercase tracking-[0.14em] transition-colors ${
                activePeriod === p ? "bg-white/[0.06] text-white/90" : "text-white/25 hover:text-white/50"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      )}
      <div
        ref={mountRef}
        className="w-full"
        style={{ height: heightPx }}
        title={t("neural.mouseHelp")}
      />
      {!compact && !immersive && (
        <div className="absolute right-2 top-2 z-[6] flex gap-1">
          <button
            type="button"
            onClick={() => resetViewFnRef.current?.()}
            className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-black/80 px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white/55 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white/85"
            title={t("neural.resetView")}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            Vue
          </button>
        </div>
      )}
      {immersive && !compact && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[14]">
            <div className="pointer-events-auto absolute left-3 top-3 w-[min(280px,calc(100%-1.5rem))] rounded-3xl border border-white/[0.08] border-t-white/20 border-l-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:left-5 sm:top-5">
              <h3 className="mb-2 bg-gradient-to-br from-white to-indigo-200/90 bg-clip-text text-lg font-medium tracking-tight text-transparent">
                {t("neural.immersiveTitle")}
              </h3>
              <p className="text-sm font-light leading-relaxed text-white/60">{t("neural.immersiveHint")}</p>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-[16] flex -translate-x-1/2 gap-3 px-3 sm:bottom-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const v = freezeToggleRef.current?.() ?? false;
                setUiFrozen(v);
              }}
              className="pointer-events-auto min-w-[5.5rem] rounded-full border border-white/10 border-t-white/25 bg-white/[0.05] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-white/35 hover:bg-white/10 active:translate-y-px sm:min-w-[6.25rem] sm:px-6 sm:text-[13px]"
            >
              {uiFrozen ? t("neural.play") : t("neural.freeze")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetViewFnRef.current?.();
              }}
              className="pointer-events-auto flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full border border-white/10 border-t-white/25 bg-white/[0.05] px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:border-white/35 hover:bg-white/10 active:translate-y-px sm:min-w-[6.25rem] sm:px-6 sm:text-[13px]"
            >
              <RotateCcw size={13} strokeWidth={1.5} className="opacity-80" />
              {t("neural.reset")}
            </button>
          </div>
        </>
      )}
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-2xl"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <div
        id="neural-tooltip"
        className="pointer-events-none absolute z-[5] hidden min-w-[140px] rounded-lg border border-white/[0.15] bg-black/90 px-3 py-2 backdrop-blur-sm"
      >
        <p id="neural-tt-name" className="text-[12px] font-medium text-white/90" />
        <p id="neural-tt-role" className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-white/30" />
        <p id="neural-tt-prox" className="mt-1 text-[9px] tracking-[0.08em] text-white/45" />
        <div className="my-1.5 h-[1.5px] overflow-hidden rounded-full bg-white/[0.08]">
          <div id="neural-tt-bar" className="h-full rounded-full bg-white/50" style={{ width: "0%" }} />
        </div>
        <p id="neural-tt-q" className="text-[11px] text-white/40" />
      </div>
    </div>
  );
}
