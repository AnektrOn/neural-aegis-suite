import * as THREE from "three";
import type { LandingRenderTuning } from "../scene/landingRenderTuning";
import {
  characterHasRenderableMesh,
  createPrismLandingCharacter,
  type PrismLandingCharacter,
} from "../character/prismLandingCharacter";
import type { WalkSurface } from "./walkSurface";

const CAPSULE_RADIUS = 0.38;
const CAPSULE_LENGTH = 1.05;
const WALK_ACCEL = 28;
const WALK_FRICTION = 10;
const PLAYER_RADIUS = 0.5;
const WATER_SURFACE_EPS = 0.08;

export type WalkCollider = {
  min: THREE.Vector3;
  max: THREE.Vector3;
};

export type ThirdPersonWalkController = {
  enter: (camera: THREE.PerspectiveCamera, viewTarget?: THREE.Vector3) => void;
  exit: () => void;
  isActive: () => boolean;
  getFocusWorldPosition: (target: THREE.Vector3) => boolean;
  update: (dt: number, camera: THREE.PerspectiveCamera) => void;
  dispose: () => void;
};

type ThirdPersonWalkOptions = {
  scene: THREE.Scene;
  canvas: HTMLCanvasElement;
  walkSurface: WalkSurface;
  colliders: WalkCollider[];
  renderTuning: LandingRenderTuning;
  onExit: () => void;
};

function collides(pos: THREE.Vector3, colliders: WalkCollider[]) {
  for (const box of colliders) {
    const closest = new THREE.Vector3(
      THREE.MathUtils.clamp(pos.x, box.min.x, box.max.x),
      THREE.MathUtils.clamp(pos.y, box.min.y, box.max.y),
      THREE.MathUtils.clamp(pos.z, box.min.z, box.max.z),
    );
    if (closest.distanceToSquared(pos) < PLAYER_RADIUS * PLAYER_RADIUS) {
      return true;
    }
  }
  return false;
}

function tryMove(
  position: THREE.Vector3,
  delta: THREE.Vector3,
  walkSurface: WalkSurface,
  colliders: WalkCollider[],
) {
  const next = position.clone().add(delta);
  const footY = walkSurface.getFootHeight(next.x, next.z);
  next.y = footY;

  if (!collides(next, colliders)) {
    position.copy(next);
    return;
  }

  const slideX = position.clone();
  slideX.x += delta.x;
  slideX.y = walkSurface.getFootHeight(slideX.x, slideX.z);
  if (!collides(slideX, colliders)) {
    position.copy(slideX);
    return;
  }

  const slideZ = position.clone();
  slideZ.z += delta.z;
  slideZ.y = walkSurface.getFootHeight(slideZ.x, slideZ.z);
  if (!collides(slideZ, colliders)) {
    position.copy(slideZ);
  }
}

export function createThirdPersonWalkController(
  options: ThirdPersonWalkOptions,
): ThirdPersonWalkController {
  const { scene, canvas, walkSurface, colliders, renderTuning, onExit } = options;
  const waterLevel = walkSurface.waterLevel;

  let active = false;
  let engineOn = false;
  const pointerNdc = new THREE.Vector2();
  const velocity = new THREE.Vector3();
  const moveDir = new THREE.Vector3();
  const camOffset = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let facingYaw = 0;
  let lookHeight = CAPSULE_LENGTH + CAPSULE_RADIUS * 0.5;
  let disposed = false;

  let character: PrismLandingCharacter | null = null;
  let characterPromise: Promise<PrismLandingCharacter> | null = null;

  const body = new THREE.Group();
  body.name = "ThirdPersonWalker";

  const capsuleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    emissive: 0x2a1810,
    emissiveIntensity: 0.15,
    roughness: 0.85,
    metalness: 0.05,
  });
  const capsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 6, 12),
    capsuleMat,
  );
  capsule.castShadow = true;
  capsule.position.y = CAPSULE_LENGTH * 0.5 + CAPSULE_RADIUS;
  body.add(capsule);
  body.visible = false;
  scene.add(body);

  const attachCharacter = (c: PrismLandingCharacter) => {
    if (c.pivot.parent && c.pivot.parent !== body) {
      c.pivot.parent.remove(c.pivot);
    }
    if (c.pivot.parent !== body) {
      body.add(c.pivot);
    }
    c.setDriveMode("external");
    c.setSurfaceAt((x, z) => {
      const footY = walkSurface.getFootHeight(x, z);
      return footY <= waterLevel + WATER_SURFACE_EPS ? "water" : "earth";
    });

    if (!characterHasRenderableMesh(c.pivot)) {
      console.warn("[Prism landing] Personnage sans mesh — capsule de secours.");
      capsule.visible = true;
      return;
    }

    character = c;
    c.pivot.visible = true;
    lookHeight = c.lookHeight;
    capsule.visible = false;
    body.updateMatrixWorld(true);
  };

  const detachCharacter = () => {
    if (!character) return;
    if (character.pivot.parent === body) body.remove(character.pivot);
    character = null;
  };

  const onCharacterReady = (c: PrismLandingCharacter) => {
    if (disposed) return;
    attachCharacter(c);
  };
  const onCharacterFailed = (err: unknown) => {
    console.error("[Prism landing] Échec chargement personnage:", err);
    characterPromise = null;
    if (active) capsule.visible = true;
  };

  const ensureCharacterAttached = async () => {
    if (character && characterHasRenderableMesh(character.pivot)) {
      attachCharacter(character);
      return;
    }
    if (character) {
      character.dispose();
      character = null;
    }
    try {
      if (!characterPromise) {
        characterPromise = createPrismLandingCharacter();
      }
      let c = await characterPromise;
      if (!characterHasRenderableMesh(c.pivot)) {
        c.dispose();
        characterPromise = createPrismLandingCharacter();
        c = await characterPromise;
      }
      if (!active || disposed) return;
      onCharacterReady(c);
    } catch (err) {
      onCharacterFailed(err);
    }
  };

  const syncBodyY = () => {
    const footY = walkSurface.getFootHeight(body.position.x, body.position.z);
    body.position.y = footY;
  };

  /** Pieds sur le sol visible sous le centre de l’écran (ou cible travelling), pas sous la caméra drone. */
  const placeBodyOnViewGround = (
    camera: THREE.PerspectiveCamera,
    viewTarget?: THREE.Vector3,
  ) => {
    pointerNdc.set(0, 0);
    const hit = walkSurface.pickGroundPoint(camera, pointerNdc);
    if (hit) {
      body.position.set(hit.x, walkSurface.getFootHeight(hit.x, hit.z), hit.z);
      return;
    }
    if (viewTarget) {
      body.position.set(viewTarget.x, 0, viewTarget.z);
      syncBodyY();
      return;
    }
    body.position.set(camera.position.x, 0, camera.position.z);
    syncBodyY();
  };

  const updatePointerNdc = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!active) return;
    if (event.button !== 0) return;
    engineOn = true;
    updatePointerNdc(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!active || !engineOn) return;
    updatePointerNdc(event);
  };

  const onPointerUp = () => {
    engineOn = false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && active) {
      exitInternal();
      onExit();
    }
  };

  const exitInternal = () => {
    active = false;
    engineOn = false;
    velocity.set(0, 0, 0);
    body.visible = false;
    if (character) character.setVelocity(new THREE.Vector3());
    canvas.style.touchAction = "";
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  return {
    enter(camera: THREE.PerspectiveCamera, viewTarget?: THREE.Vector3) {
      active = true;
      engineOn = false;
      velocity.set(0, 0, 0);

      placeBodyOnViewGround(camera, viewTarget);
      body.visible = true;
      capsule.visible = true;
      void ensureCharacterAttached();

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 1e-6) {
        forward.normalize();
        facingYaw = Math.atan2(forward.x, forward.z);
      }
      body.rotation.y = facingYaw;
      const camDist = renderTuning.exploreCamDistance;
      const camHeight = renderTuning.exploreCamHeight;
      camOffset.set(
        -Math.sin(facingYaw) * camDist,
        camHeight,
        -Math.cos(facingYaw) * camDist,
      );
      lookTarget.set(body.position.x, body.position.y + lookHeight, body.position.z);
      camera.position.copy(body.position).add(camOffset);
      camera.lookAt(lookTarget);

      canvas.style.touchAction = "none";
    },
    exit() {
      exitInternal();
    },
    isActive() {
      return active;
    },
    getFocusWorldPosition(target) {
      if (!active) return false;
      target.set(body.position.x, body.position.y + lookHeight * 0.55, body.position.z);
      return true;
    },
    update(dt: number, camera: THREE.PerspectiveCamera) {
      if (!active) return;

      if (engineOn) {
        const groundTarget = walkSurface.pickGroundPoint(camera, pointerNdc);
        if (groundTarget) {
          moveDir.subVectors(groundTarget, body.position);
          moveDir.y = 0;
          if (moveDir.lengthSq() > 0.04) {
            moveDir.normalize();
            velocity.addScaledVector(moveDir, WALK_ACCEL * dt);
            facingYaw = Math.atan2(moveDir.x, moveDir.z);
          }
        } else {
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() > 1e-6) {
            forward.normalize();
            velocity.addScaledVector(forward, WALK_ACCEL * dt);
            facingYaw = Math.atan2(forward.x, forward.z);
          }
        }
      }

      const maxSpeed = renderTuning.exploreMaxSpeed;
      const speed = velocity.length();
      if (speed > maxSpeed) {
        velocity.multiplyScalar(maxSpeed / speed);
      }

      const friction = Math.exp(-WALK_FRICTION * dt);
      velocity.multiplyScalar(friction);

      if (velocity.lengthSq() > 1e-5) {
        const delta = velocity.clone().multiplyScalar(dt);
        tryMove(body.position, delta, walkSurface, colliders);
      }

      syncBodyY();
      const bodyLerp = renderTuning.exploreBodyLerp;
      body.rotation.y += (facingYaw - body.rotation.y) * Math.min(1, bodyLerp * dt);

      if (character) {
        const worldVel = velocity.clone().applyQuaternion(body.quaternion);
        character.setVelocity(worldVel);
        character.update(dt);
      }

      const camDist = renderTuning.exploreCamDistance;
      const camHeight = renderTuning.exploreCamHeight;
      camOffset.set(
        -Math.sin(facingYaw) * camDist,
        camHeight,
        -Math.cos(facingYaw) * camDist,
      );
      lookTarget.set(body.position.x, body.position.y + lookHeight, body.position.z);

      const camLerp = renderTuning.exploreCamLerp;
      const desiredCam = body.position.clone().add(camOffset);
      camera.position.lerp(desiredCam, Math.min(1, camLerp * dt));
      camera.lookAt(lookTarget);
    },
    dispose() {
      disposed = true;
      if (character) {
        character.dispose();
        character = null;
      }
      characterPromise = null;
      detachCharacter();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      scene.remove(body);
      capsule.geometry.dispose();
      capsuleMat.dispose();
    },
  };
}
