import * as THREE from "three";

const EYE_HEIGHT = 1.72;
const WALK_SPEED = 4.2;
const SPRINT_MULT = 1.55;
const PLAYER_RADIUS = 0.55;

export type PovCollider = {
  min: THREE.Vector3;
  max: THREE.Vector3;
};

export type PovWalkController = {
  enter: (camera: THREE.PerspectiveCamera) => void;
  exit: () => void;
  isActive: () => boolean;
  update: (dt: number, keys: ReadonlySet<string>) => void;
  onPointerMove: (dx: number, dy: number) => void;
  dispose: () => void;
};

type PovWalkOptions = {
  domElement: HTMLElement;
  getTerrainHeight: (x: number, z: number) => number;
  colliders: PovCollider[];
  onExit: () => void;
};

function collides(pos: THREE.Vector3, colliders: PovCollider[]) {
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
  camera: THREE.PerspectiveCamera,
  delta: THREE.Vector3,
  getTerrainHeight: (x: number, z: number) => number,
  colliders: PovCollider[],
) {
  const next = camera.position.clone().add(delta);
  next.y = getTerrainHeight(next.x, next.z) + EYE_HEIGHT;
  if (!collides(next, colliders)) {
    camera.position.copy(next);
  } else {
    const slideX = camera.position.clone();
    slideX.x += delta.x;
    slideX.y = getTerrainHeight(slideX.x, slideX.z) + EYE_HEIGHT;
    if (!collides(slideX, colliders)) {
      camera.position.copy(slideX);
    } else {
      const slideZ = camera.position.clone();
      slideZ.z += delta.z;
      slideZ.y = getTerrainHeight(slideZ.x, slideZ.z) + EYE_HEIGHT;
      if (!collides(slideZ, colliders)) {
        camera.position.copy(slideZ);
      }
    }
  }
}

export function createPovWalkController(options: PovWalkOptions): PovWalkController {
  const { domElement, getTerrainHeight, colliders, onExit } = options;
  let active = false;
  let camera: THREE.PerspectiveCamera | null = null;
  let yaw = 0;
  let pitch = 0;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();

  const onPointerLockChange = () => {
    if (active && document.pointerLockElement !== domElement) {
      active = false;
      camera = null;
      onExit();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && active) {
      document.exitPointerLock();
    }
  };

  document.addEventListener("pointerlockchange", onPointerLockChange);
  document.addEventListener("keydown", onKeyDown);

  return {
    enter(cam: THREE.PerspectiveCamera) {
      camera = cam;
      active = true;
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      yaw = Math.atan2(dir.x, dir.z);
      pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
      cam.position.y = getTerrainHeight(cam.position.x, cam.position.z) + EYE_HEIGHT;
      void domElement.requestPointerLock();
    },
    exit() {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock();
      }
      active = false;
      camera = null;
    },
    isActive() {
      return active;
    },
    onPointerMove(dx: number, dy: number) {
      if (!active || !camera) return;
      yaw -= dx * 0.0022;
      pitch -= dy * 0.0022;
      pitch = THREE.MathUtils.clamp(pitch, -1.15, 1.15);
      const euler = new THREE.Euler(pitch, yaw, 0, "YXZ");
      camera.quaternion.setFromEuler(euler);
    },
    update(dt: number, keys: ReadonlySet<string>) {
      if (!active || !camera) return;
      const sprint = keys.has("Shift");
      const speed = WALK_SPEED * (sprint ? SPRINT_MULT : 1);
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) {
        forward.set(0, 0, -1);
      } else {
        forward.normalize();
      }
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      move.set(0, 0, 0);
      const forwardKeys = keys.has("w") || keys.has("z") || keys.has("arrowup");
      const backKeys = keys.has("s") || keys.has("arrowdown");
      const leftKeys = keys.has("a") || keys.has("q") || keys.has("arrowleft");
      const rightKeys = keys.has("d") || keys.has("arrowright");

      if (forwardKeys) move.add(forward);
      if (backKeys) move.sub(forward);
      if (leftKeys) move.sub(right);
      if (rightKeys) move.add(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        tryMove(camera, move, getTerrainHeight, colliders);
      } else {
        camera.position.y = getTerrainHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;
      }
    },
    dispose() {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("keydown", onKeyDown);
    },
  };
}

export function trackPovKeys(): { keys: Set<string>; attach: () => void; detach: () => void } {
  const keys = new Set<string>();
  const onDown = (e: KeyboardEvent) => {
    keys.add(e.key.toLowerCase());
  };
  const onUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
  };
  return {
    keys,
    attach() {
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);
    },
    detach() {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      keys.clear();
    },
  };
}
