import { describe, expect, it } from "vitest";
import {
  formatClockMmSs,
  formatToolboxDurationLabel,
  hydrateToolboxWidgetDuration,
  parseAssignmentDurationSec,
} from "./toolbox-widget-duration";

describe("parseAssignmentDurationSec", () => {
  it("parses min labels, clock values, and ignores NaN", () => {
    expect(parseAssignmentDurationSec("5 MIN")).toBe(300);
    expect(parseAssignmentDurationSec("10:00")).toBe(600);
    expect(parseAssignmentDurationSec("NaN:NaN")).toBe(0);
    expect(parseAssignmentDurationSec("12")).toBe(720);
  });
});

describe("hydrateToolboxWidgetDuration", () => {
  it("reads duration_min stored as a string", () => {
    const cfg = hydrateToolboxWidgetDuration("focus_introspectif", { duration_min: "8" });
    expect(cfg.duration_min).toBe(8);
    expect(cfg.duration_sec).toBe(480);
  });

  it("falls back to the assignment duration label", () => {
    const cfg = hydrateToolboxWidgetDuration("focus_introspectif", { intention: "Zero point" }, "15 min");
    expect(cfg.duration_min).toBe(15);
  });

  it("defaults timed tools to 10 minutes when nothing is stored", () => {
    const cfg = hydrateToolboxWidgetDuration("focus_introspectif", { intention: "Zero point" });
    expect(cfg.duration_min).toBe(10);
    expect(formatClockMmSs(Number(cfg.duration_sec))).toBe("10:00");
  });
});

describe("formatClockMmSs", () => {
  it("never prints NaN:NaN", () => {
    expect(formatClockMmSs(Number.NaN)).toBe("0:00");
    expect(formatClockMmSs(Number(undefined))).toBe("0:00");
  });
});

describe("formatToolboxDurationLabel", () => {
  it("replaces a stored NaN:NaN label", () => {
    expect(
      formatToolboxDurationLabel("NaN:NaN", "focus_introspectif", { duration_min: 12 }),
    ).toBe("12 min");
  });
});
