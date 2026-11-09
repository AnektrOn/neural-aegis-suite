import { describe, expect, it } from "vitest";

describe("Member shell v2 — waves 2-4 pages", () => {
  it.each([
    ["Toolbox", () => import("../Toolbox")],
    ["PracticesHub", () => import("../PracticesHub")],
    ["PulsePage", () => import("@/features/aegis-pulse/pages/PulsePage")],
    ["Bibliotheque", () => import("../Bibliotheque")],
    ["MeditationLibraryPage", () => import("@/features/meditation/pages/MeditationLibraryPage")],
    ["Persona", () => import("../Persona")],
    ["PeopleBoard", () => import("../PeopleBoard")],
    ["Analytics", () => import("../Analytics")],
    ["Profile", () => import("../Profile")],
    ["Settings", () => import("../Settings")],
    ["Messages", () => import("../Messages")],
    ["InstallApp", () => import("../InstallApp")],
    ["Ambassador", () => import("../Ambassador")],
    ["CalendarView", () => import("../CalendarView")],
    ["DeepDiveScores", () => import("../DeepDiveScores")],
  ])("%s loads without throwing at import time", async (_name, load) => {
    const mod = await load();
    expect(mod.default).toBeTruthy();
  });
});
