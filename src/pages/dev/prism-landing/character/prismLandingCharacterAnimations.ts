import * as THREE from "three";

export type CharacterLocomotion = "idle" | "walk";

export type PrismLandingCharacterAnimations = {
  setLocomotion: (state: CharacterLocomotion) => void;
  update: (dt: number) => void;
  dispose: () => void;
  hasBodyLocomotion: () => boolean;
};

const IDLE_RE = /idle|stand|rest|neutral/i;
const WALK_RE = /walk|marche|jog|locomotion|move/i;
const STOP_RE = /stop_from_run|stop/i;

function pickClip(clips: THREE.AnimationClip[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const hit = clips.find((c) => pattern.test(c.name));
    if (hit) return hit;
  }
  return null;
}

export function createPrismLandingCharacterAnimations(
  model: THREE.Object3D,
  clips: THREE.AnimationClip[],
): PrismLandingCharacterAnimations {
  const mixer = new THREE.AnimationMixer(model);
  const fade = 0.28;

  const idleClip =
    clips.find((c) => c.name === "idle_neutral") ?? pickClip(clips, [IDLE_RE]);
  const walkClip =
    clips.find((c) => c.name === "walk_forward") ?? pickClip(clips, [WALK_RE]);
  const stopClip =
    clips.find((c) => c.name === "stop_from_run") ?? pickClip(clips, [STOP_RE]);

  const idleAction = idleClip ? mixer.clipAction(idleClip) : null;
  const walkAction = walkClip ? mixer.clipAction(walkClip) : null;
  const stopAction = stopClip ? mixer.clipAction(stopClip) : null;

  if (idleAction) idleAction.loop = THREE.LoopRepeat;
  if (walkAction) walkAction.loop = THREE.LoopRepeat;
  if (stopAction) {
    stopAction.loop = THREE.LoopOnce;
    stopAction.clampWhenFinished = true;
  }

  let locomotion: CharacterLocomotion = "idle";
  let current: THREE.AnimationAction | null = null;
  let playingStop = false;

  const crossTo = (next: THREE.AnimationAction | null, duration = fade) => {
    if (!next) return;
    next.reset();
    next.setEffectiveWeight(1);
    next.fadeIn(duration);
    next.play();
    if (current && current !== next) {
      current.fadeOut(duration);
    }
    current = next;
  };

  if (idleAction) {
    crossTo(idleAction, 0.01);
  }

  const onFinished = (event: THREE.Event) => {
    const action = event as THREE.Event & { action: THREE.AnimationAction };
    if (stopAction && action.action === stopAction) {
      playingStop = false;
      if (idleAction) crossTo(idleAction);
    }
  };
  mixer.addEventListener("finished", onFinished);

  const hasBodyLocomotion = Boolean(idleAction || walkAction);

  return {
    hasBodyLocomotion() {
      return hasBodyLocomotion;
    },
    setLocomotion(state) {
      const prev = locomotion;
      locomotion = state;

      if (state === "walk" && walkAction) {
        playingStop = false;
        walkAction.setEffectiveTimeScale(1);
        crossTo(walkAction);
        return;
      }

      if (prev === "walk" && state === "idle" && stopAction && !playingStop) {
        playingStop = true;
        crossTo(stopAction, 0.12);
        return;
      }

      if (idleAction && !playingStop) {
        crossTo(idleAction);
      }
    },
    update(dt) {
      mixer.update(dt);
    },
    dispose() {
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
    },
  };
}
