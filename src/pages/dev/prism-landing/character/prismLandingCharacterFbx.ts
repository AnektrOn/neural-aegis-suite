import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import walkForwardFbxUrl from "../assets/character/animations/walk_forward.fbx?url";
import idleNeutralFbxUrl from "../assets/character/animations/idle_neutral.fbx?url";
import stopFromRunFbxUrl from "../assets/character/animations/stop_from_run.fbx?url";
import { getCharacterSkeletonBoneSet, remapMotifectClip } from "./motifectFbxRemap";

const FBX_SOURCES: { url: string; clipName: string }[] = [
  { url: walkForwardFbxUrl, clipName: "walk_forward" },
  { url: idleNeutralFbxUrl, clipName: "idle_neutral" },
  { url: stopFromRunFbxUrl, clipName: "stop_from_run" },
];

let fbxPromise: Promise<THREE.AnimationClip[]> | null = null;

export function resetMotifectFbxCache() {
  fbxPromise = null;
}

export function loadMotifectLocomotionClips(
  characterRoot: THREE.Object3D,
): Promise<THREE.AnimationClip[]> {
  if (!fbxPromise) {
    const validBones = getCharacterSkeletonBoneSet(characterRoot);
    const loader = new FBXLoader();
    fbxPromise = Promise.all(
      FBX_SOURCES.map(async ({ url, clipName }) => {
        const fbx = await loader.loadAsync(url);
        const source = fbx.animations[0];
        if (!source) return null;
        return remapMotifectClip(source, clipName, validBones);
      }),
    ).then((clips) => clips.filter((c): c is THREE.AnimationClip => c !== null));
  }
  return fbxPromise;
}
