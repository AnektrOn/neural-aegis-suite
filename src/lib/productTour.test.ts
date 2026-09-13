import { afterEach, describe, expect, it } from "vitest";
import {
  clearProductTour,
  isProductTourDone,
  markProductTourDone,
  productTourKey,
} from "./productTour";

const UID = "user-tour-test";

afterEach(() => {
  clearProductTour(UID);
});

describe("productTour flag", () => {
  it("is not done by default", () => {
    expect(isProductTourDone(UID)).toBe(false);
  });

  it("marks the v1 flag in storage", () => {
    markProductTourDone(UID);
    expect(isProductTourDone(UID)).toBe(true);
    expect(localStorage.getItem(productTourKey(UID))).toBe("1");
  });

  it("clears the flag for admin reset", () => {
    markProductTourDone(UID);
    clearProductTour(UID);
    expect(isProductTourDone(UID)).toBe(false);
  });
});
