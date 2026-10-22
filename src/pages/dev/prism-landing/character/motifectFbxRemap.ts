import * as THREE from "three";

/** Motifect / Mixamo-like → squelette CC4 du GLB cartoon_young_boy. */
export const MOTIFECT_TO_CC4_BONES: Record<string, string> = {
  Hips: "rootx",
  Spine1: "spine_01x",
  Spine2: "spine_02x",
  Chest: "spine_03x",
  Neck1: "neckx",
  Neck2: "neckx",
  Head: "headx",
  LeftShoulder: "shoulderl",
  LeftArm: "arm_stretchl",
  LeftForeArm: "forearm_stretchl",
  LeftHand: "handl",
  RightShoulder: "shoulderr",
  RightArm: "arm_stretchr",
  RightForeArm: "forearm_stretchr",
  RightHand: "handr",
  LeftLeg: "thigh_stretchl",
  LeftShin: "leg_stretchl",
  LeftFoot: "footl",
  LeftToeBase: "toes_01l",
  RightLeg: "thigh_stretchr",
  RightShin: "leg_stretchr",
  RightFoot: "footr",
  RightToeBase: "toes_01r",
};

export function getCharacterSkeletonBoneSet(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    const skinned = obj as THREE.SkinnedMesh;
    if (!skinned.isSkinnedMesh || !skinned.skeleton) return;
    for (const bone of skinned.skeleton.bones) {
      names.add(bone.name);
    }
  });
  return names;
}

export function remapMotifectClip(
  clip: THREE.AnimationClip,
  targetName: string,
  validBones: Set<string>,
): THREE.AnimationClip | null {
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of clip.tracks) {
    const dot = track.name.indexOf(".");
    if (dot < 0) continue;
    const srcBone = track.name.slice(0, dot);
    const property = track.name.slice(dot);
    const dstBone = MOTIFECT_TO_CC4_BONES[srcBone];
    if (!dstBone || !validBones.has(dstBone)) continue;

    const next = track.clone();
    next.name = `${dstBone}${property}`;
    tracks.push(next);
  }

  if (tracks.length < 6) return null;
  return new THREE.AnimationClip(targetName, clip.duration, tracks);
}
