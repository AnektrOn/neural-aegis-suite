import { describe, expect, it } from "vitest";
import {
  isTapGesture,
  clampCameraZ,
  CAMERA_Z_DEFAULT,
  CAMERA_Z_MIN,
  CAMERA_Z_MAX,
} from "./dienChanFaceInteraction";

describe("dienChanFaceInteraction", () => {
  it("distinguishes tap from drag", () => {
    expect(isTapGesture(0, 0, 3, 4)).toBe(true);
    expect(isTapGesture(0, 0, 20, 0)).toBe(false);
  });

  it("clamps camera zoom", () => {
    expect(clampCameraZ(1)).toBe(CAMERA_Z_MIN);
    expect(clampCameraZ(10)).toBe(CAMERA_Z_MAX);
    expect(clampCameraZ(CAMERA_Z_DEFAULT)).toBe(CAMERA_Z_DEFAULT);
  });
});
