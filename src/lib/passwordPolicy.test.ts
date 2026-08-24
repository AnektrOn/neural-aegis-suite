import { describe, expect, it } from "vitest";
import {
  normalizeAuthEmail,
  signupPasswordIssues,
  signupPasswordScore,
} from "./passwordPolicy";

describe("signupPasswordIssues", () => {
  it("accepts an 8-char password with a letter and a digit", () => {
    expect(signupPasswordIssues("soleil12")).toEqual([]);
  });

  it("flags short passwords", () => {
    expect(signupPasswordIssues("Ab1")).toContain("min");
  });

  it("flags missing digits without requiring a special character", () => {
    expect(signupPasswordIssues("abcdefgh")).toEqual(["digit"]);
  });
});

describe("signupPasswordScore", () => {
  it("returns 0 for empty input", () => {
    expect(signupPasswordScore("")).toBe(0);
  });

  it("returns 3 for a longer passphrase", () => {
    expect(signupPasswordScore("soleil12abcd")).toBe(3);
  });
});

describe("normalizeAuthEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeAuthEmail("  Maxime@CFR.be ")).toBe("maxime@cfr.be");
  });
});
