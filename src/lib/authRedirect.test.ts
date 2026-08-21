import { describe, it, expect } from "vitest";
import {
  defaultGuestRedirect,
  isNewsletterRedirect,
  resolveGuestRedirect,
} from "./authRedirect";

describe("authRedirect", () => {
  it("detects newsletter paths", () => {
    expect(isNewsletterRedirect("/newsletter")).toBe(true);
    expect(isNewsletterRedirect("/newsletter/mai-2026")).toBe(true);
    expect(isNewsletterRedirect("/quiz")).toBe(false);
  });

  it("defaults guest redirect to the quiz", () => {
    expect(resolveGuestRedirect(null)).toBe("/quiz");
    expect(defaultGuestRedirect()).toBe("/quiz");
  });

  it("preserves explicit redirect", () => {
    expect(resolveGuestRedirect("/newsletter")).toBe("/newsletter");
    expect(resolveGuestRedirect("/quiz")).toBe("/quiz");
  });
});
