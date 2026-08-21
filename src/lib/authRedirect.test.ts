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

  it("defaults guest redirect to Guardian onboarding", () => {
    expect(resolveGuestRedirect(null)).toBe("/onboarding");
    expect(defaultGuestRedirect()).toBe("/onboarding");
  });

  it("preserves explicit redirect", () => {
    expect(resolveGuestRedirect("/newsletter")).toBe("/newsletter");
    expect(resolveGuestRedirect("/quiz")).toBe("/quiz");
  });
});
