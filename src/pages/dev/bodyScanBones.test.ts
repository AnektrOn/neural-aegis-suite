import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_SCAN_ZONES } from "@/components/widgets/BodyScanWidget";
import {
  BODY_SCAN_PREVIEW_ZONES,
  boneBelongsToZone,
  collectZoneBoneIndices,
  elapsedAtZoneStart,
  facingMultiplier,
  heightBandWeight,
  lateralMultiplier,
  normalizeMixamoBoneName,
  ZONE_BONE_SPEC,
  ZONE_LIGHT_ANCHORS,
  ZONE_SWEEPS,
  applyZoneRegionMask,
  easeSweep,
  pingPong01,
  samplePolyline,
  sweepBand,
} from "./bodyScanBones";

const MIXAMO_BONES = [
  "mixamorig:Hips",
  "mixamorig:Spine",
  "mixamorig:Spine1",
  "mixamorig:Spine2",
  "mixamorig:Neck",
  "mixamorig:Head",
  "mixamorig:HeadTop_End",
  "mixamorig:LeftEye",
  "mixamorig:RightEye",
  "mixamorig:LeftShoulder",
  "mixamorig:RightShoulder",
  "mixamorig:LeftArm",
  "mixamorig:LeftForeArm",
  "mixamorig:LeftHand",
  "mixamorig:LeftHandThumb1",
  "mixamorig:LeftHandIndex1",
  "mixamorig:LeftHandMiddle1",
  "mixamorig:RightHand",
  "mixamorig:RightHandThumb1",
  "mixamorig:LeftUpLeg",
  "mixamorig:RightUpLeg",
  "mixamorig:LeftLeg",
  "mixamorig:RightLeg",
  "mixamorig:LeftFoot",
  "mixamorig:RightFoot",
  "mixamorig:LeftToeBase",
  "mixamorig:RightToe_End",
].map((name) => ({ name }));

describe("bodyScanBones", () => {
  it("strips the mixamorig prefix with colon or underscore", () => {
    expect(normalizeMixamoBoneName("mixamorig:Head")).toBe("head");
    expect(normalizeMixamoBoneName("mixamorig_Hips")).toBe("hips");
    expect(normalizeMixamoBoneName("Head")).toBe("head");
  });

  it("maps every default and preview zone to bones and a sweep path", () => {
    for (const zone of [...DEFAULT_BODY_SCAN_ZONES, ...BODY_SCAN_PREVIEW_ZONES]) {
      expect(ZONE_BONE_SPEC[zone.id], zone.id).toBeDefined();
      expect(collectZoneBoneIndices(MIXAMO_BONES, zone.id).length, zone.id).toBeGreaterThan(0);
      expect(ZONE_SWEEPS[zone.id], zone.id).toBeDefined();
      expect(ZONE_SWEEPS[zone.id].paths.length, zone.id).toBeGreaterThan(0);
      expect(ZONE_LIGHT_ANCHORS[zone.id], zone.id).toBeDefined();
    }
  });

  it("splits hands palms from finger bones", () => {
    expect(boneBelongsToZone("mixamorig:LeftHand", "hands")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftHandThumb1", "hands")).toBe(false);
    expect(boneBelongsToZone("mixamorig:LeftHandThumb1", "fingers")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftArm", "hands")).toBe(false);
    expect(boneBelongsToZone("mixamorig:LeftArm", "upper_arms")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftArm", "back_arms")).toBe(true);
  });

  it("splits hands from arms", () => {
    expect(boneBelongsToZone("mixamorig:LeftHandThumb1", "fingers")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftArm", "hands")).toBe(false);
    expect(boneBelongsToZone("mixamorig:LeftArm", "arms")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftHand", "arms")).toBe(false);
    expect(boneBelongsToZone("mixamorig:LeftArm", "back_arms")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftHandThumb1", "back_hands")).toBe(false);
  });

  it("does not let abdomen prefix-match Spine2 (chest)", () => {
    expect(boneBelongsToZone("mixamorig:Spine", "abdomen")).toBe(true);
    expect(boneBelongsToZone("mixamorig:Spine2", "abdomen")).toBe(false);
    expect(boneBelongsToZone("mixamorig:Spine2", "chest")).toBe(true);
    expect(boneBelongsToZone("mixamorig:LeftShoulder", "shoulders")).toBe(true);
    expect(boneBelongsToZone("mixamorig:Spine2", "shoulders")).toBe(false);
  });

  it("weights front vertices higher for front-facing zones", () => {
    expect(facingMultiplier(1, 0, 1, "front")).toBeGreaterThan(0.9);
    expect(facingMultiplier(0, 0, 1, "front")).toBe(0);
    expect(facingMultiplier(0.2, 0, 1, "front")).toBe(0);
    expect(facingMultiplier(0, 0, 1, "back")).toBeGreaterThan(0.9);
    expect(facingMultiplier(1, 0, 1, "back")).toBe(0);
  });

  it("splits forehead, crown, and occiput with region masks", () => {
    expect(ZONE_BONE_SPEC.forehead.region?.facing).toBe("front");
    expect(ZONE_BONE_SPEC.back_head.region?.facing).toBe("back");
    expect(ZONE_BONE_SPEC.forehead.region?.lateral).toBe("center");
    expect(ZONE_BONE_SPEC.temples.region?.lateral).toBe("outer");
    expect(ZONE_BONE_SPEC.ears.region?.lateral).toBe("outer");
    expect(ZONE_BONE_SPEC.head.region?.yMin).toBeGreaterThan(
      ZONE_BONE_SPEC.forehead.region?.yMax ?? 0,
    );
    expect(ZONE_BONE_SPEC.jaw.region?.yMax).toBeLessThan(
      ZONE_BONE_SPEC.forehead.region?.yMin ?? 1,
    );

    expect(heightBandWeight(0.65, 0.55, 0.74)).toBeGreaterThan(0.8);
    expect(facingMultiplier(1, 0, 1, "front", 3.6)).toBeGreaterThan(
      facingMultiplier(1, 0, 1, "back", 3.6),
    );
    expect(heightBandWeight(0.9, 0.8, 1)).toBeGreaterThan(heightBandWeight(0.5, 0.8, 1));
    expect(facingMultiplier(0, 0, 1, "back", 3.6)).toBeGreaterThan(0.85);
  });

  it("applyZoneRegionMask zeros bleed between front and back of head", () => {
    // Fake head span: y 0→1, z -1→+1, x -1→+1.
    const pos = {
      getX: (i: number) => [0, 0, 0, 0, 0, 0.9, -0.9][i],
      getY: (i: number) => [0.05, 0.65, 0.65, 0.1, 0.95, 0.55, 0.45][i],
      getZ: (i: number) => [0, 1, -1, 1, 0, 0.2, 0.2][i],
    };

    const forehead = new Float32Array(7).fill(1);
    applyZoneRegionMask(forehead, pos, "forehead");
    expect(forehead[1]).toBeGreaterThan(0.3);
    expect(forehead[2]).toBe(0);
    expect(forehead[3]).toBe(0);
    expect(forehead[4]).toBe(0);

    const crown = new Float32Array(7).fill(1);
    applyZoneRegionMask(crown, pos, "head");
    expect(crown[0]).toBe(0);
    expect(crown[1]).toBe(0);
    expect(crown[4]).toBeGreaterThan(0.3);

    const occiput = new Float32Array(7).fill(1);
    applyZoneRegionMask(occiput, pos, "back_head");
    expect(occiput[1]).toBe(0);
    expect(occiput[2]).toBeGreaterThan(0.3);
    expect(occiput[4]).toBe(0);

    const ears = new Float32Array(7).fill(1);
    applyZoneRegionMask(ears, pos, "ears");
    expect(ears[5]).toBeGreaterThan(0.3);
    expect(ears[1]).toBe(0);
  });

  it("lateralMultiplier separates center from outer", () => {
    expect(lateralMultiplier(0.1, 0.5, "center", 0.5)).toBeGreaterThan(0.8);
    expect(lateralMultiplier(0.9, 0.5, "center", 0.5)).toBeLessThan(0.2);
    expect(lateralMultiplier(0.9, 0.5, "outer", 0.5)).toBeGreaterThan(0.8);
    expect(lateralMultiplier(0.1, 0.5, "outer", 0.5)).toBeLessThan(0.2);
  });

  it("sums elapsed time at a zone start", () => {
    expect(elapsedAtZoneStart(BODY_SCAN_PREVIEW_ZONES, 0)).toBe(0);
    expect(elapsedAtZoneStart(BODY_SCAN_PREVIEW_ZONES, 1)).toBe(
      BODY_SCAN_PREVIEW_ZONES[0].duration_sec,
    );
  });

  it("interpolates a sweep polyline and peaks the band at the playhead", () => {
    expect(samplePolyline([[0, 0, 0], [2, 0, 0]], 0.5)).toEqual([1, 0, 0]);
    expect(easeSweep(0.5)).toBeGreaterThan(0.4);
    expect(sweepBand(0.5, 0.5)).toBeGreaterThan(sweepBand(0.1, 0.5));
    expect(pingPong01(0.25)).toBeCloseTo(0.25);
    expect(pingPong01(1.25)).toBeCloseTo(0.75);
  });
});
