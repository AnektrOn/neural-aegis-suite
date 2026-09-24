import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  measureMouthInteriorExposure,
  sealFacialInteriorForWireframe,
  sealMouthCavityForWireframe,
  sealNeckForWireframe,
} from "./dienChanFaceZones";
function boxHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(2, 3, 1.2, 4, 6, 3);
  geo.translate(0, 0, 0);
  return geo;
}

describe("sealFacialInteriorForWireframe", () => {
  it("collapses vertices below the neck cut band", () => {
    const geo = boxHeadGeometry();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const cutY = box.min.y + (box.max.y - box.min.y) * 0.14;
    let belowBefore = 0;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const v = (y - box.min.y) / (box.max.y - box.min.y);
      if (v < 0.14 && y < cutY) belowBefore++;
    }
    expect(belowBefore).toBeGreaterThan(0);

    sealNeckForWireframe(geo, 0.14);
    let belowAfter = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const v = (y - box.min.y) / (box.max.y - box.min.y);
      if (v < 0.14 && y < cutY - 1e-4) belowAfter++;
    }
    expect(belowAfter).toBe(0);
  });

  it("pulls deep mouth-region vertices forward without rear cranium pass", () => {
    const geo = boxHeadGeometry();
    const before = measureMouthInteriorExposure(geo);
    sealMouthCavityForWireframe(geo);
    const after = measureMouthInteriorExposure(geo);
    expect(after.deepVerts).toBeLessThanOrEqual(before.deepVerts);
    expect(after.minFrontInMouth).toBeGreaterThanOrEqual(before.minFrontInMouth);
  });

  it("orchestrator runs mouth then neck", () => {
    const geo = boxHeadGeometry();
    const before = measureMouthInteriorExposure(geo);
    sealFacialInteriorForWireframe(geo, 0.17);
    const after = measureMouthInteriorExposure(geo);
    expect(after.deepVerts).toBeLessThanOrEqual(before.deepVerts);
  });
});
