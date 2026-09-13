import { describe, expect, it } from "vitest";
import { ENGINE_SCENARIOS } from "./toolboxEngineScenarios";
import {
  engineIdForSlug,
  isMatterVisualSlug,
  isParticleVisualSlug,
  scenarioForSlug,
} from "./toolboxNebulaVisuals";
import { driveForBreathwork, driveForStopStep } from "./toolboxParticleDrives";
import { buildLungLobesTargets, lungAnatomyColorAtPosition, lungInflateWeightAtPosition } from "./toolboxParticleShapes";

describe("toolbox engine scenarios", () => {
  it("assigns exactly one visual language per engine", () => {
    const ids = ENGINE_SCENARIOS.map((s) => s.engine);
    expect(new Set(ids).size).toBe(ids.length);
    for (const scenario of ENGINE_SCENARIOS) {
      if (scenario.engine === "listen") {
        expect(scenario.visual).toBe("audio");
      } else {
        expect(["matter", "particles"]).toContain(scenario.visual);
      }
    }
  });

  it("maps breath to particle lungs and body family to matter", () => {
    expect(engineIdForSlug("breathwork")).toBe("breath");
    expect(isParticleVisualSlug("breathwork")).toBe(true);
    expect(isMatterVisualSlug("breathwork")).toBe(false);
    expect(isParticleVisualSlug("stop_protocol")).toBe(true);
    expect(scenarioForSlug("stop_protocol")?.engine).toBe("interrupt");
    expect(isParticleVisualSlug("open_monitoring")).toBe(true);
    expect(isMatterVisualSlug("body_scan")).toBe(true);
    expect(isMatterVisualSlug("progressive_relax")).toBe(true);
    expect(isMatterVisualSlug("shake_release")).toBe(true);
    expect(isParticleVisualSlug("body_scan")).toBe(false);
    expect(isParticleVisualSlug("shake_release")).toBe(false);
  });

  it("builds wireframe lung lobes with trachea and separated sides", () => {
    const radius = 2.0;
    const particleCount = 10000;
    const targets = buildLungLobesTargets(particleCount, radius);

    let leftLobeCount = 0;
    let rightLobeCount = 0;
    let tracheaCount = 0;

    for (let i = 0; i < targets.length; i += 3) {
      const x = targets[i]!;
      const y = targets[i + 1]!;

      if (y > 0.65 * radius && Math.abs(x) < 0.12 * radius) {
        tracheaCount += 1;
        continue;
      }

      if (x < -0.15 * radius) leftLobeCount += 1;
      if (x > 0.15 * radius) rightLobeCount += 1;
    }

    expect(targets.length).toBe(particleCount * 3);
    expect(leftLobeCount).toBeGreaterThan(2000);
    expect(rightLobeCount).toBeGreaterThan(2000);
    expect(tracheaCount).toBeGreaterThan(400);
    expect(Math.abs(leftLobeCount - rightLobeCount) / particleCount).toBeLessThan(0.08);
  });

  it("keeps trachea fixed and only tags lateral lobe tissue for breath inflation", () => {
    const radius = 2.0;
    const targets = buildLungLobesTargets(4000, radius);
    expect(lungInflateWeightAtPosition(0, 0.9 * radius, 0, radius)).toBe(0);
    expect(lungInflateWeightAtPosition(-0.5 * radius, -0.3 * radius, 0, radius)).toBe(1);
    expect(lungInflateWeightAtPosition(0.45 * radius, 0.1 * radius, 0, radius)).toBe(1);

    let fixedAirway = 0;
    let lobeTissue = 0;
    for (let i = 0; i < targets.length; i += 3) {
      const w = lungInflateWeightAtPosition(targets[i]!, targets[i + 1]!, targets[i + 2]!, radius);
      if (w === 0) fixedAirway += 1;
      else lobeTissue += 1;
    }
    expect(fixedAirway).toBeGreaterThan(200);
    expect(lobeTissue).toBeGreaterThan(2500);
  });

  it("colors wireframe lungs white with dimmer fixed airway", () => {
    const radius = 2.0;
    const [airR, airG, airB] = lungAnatomyColorAtPosition(0, 0.9 * radius, 0, radius);
    const [lobeR, lobeG, lobeB] = lungAnatomyColorAtPosition(-0.5 * radius, -0.3 * radius, 0, radius);

    expect(airR).toBeGreaterThan(0.65);
    expect(lobeR).toBeGreaterThan(0.85);
    expect(lobeG).toBeGreaterThan(0.85);
    expect(lobeB).toBeGreaterThan(0.85);
    expect(lobeR).toBeGreaterThan(airR);
  });

  it("inflates particle lungs on inhale and freezes on hold", () => {
    const inhaleStart = driveForBreathwork("breath_in", 0, true, 0);
    const inhaleEnd = driveForBreathwork("breath_in", 1, true, 0);
    const hold = driveForBreathwork("pause1", 0.5, true, 0);
    expect(inhaleStart.shape).toBe("lungs");
    expect((inhaleEnd.cloudScale ?? 0) > (inhaleStart.cloudScale ?? 0)).toBe(true);
    expect(hold.freeze ?? 0).toBeGreaterThan(0.4);
  });

  it("makes STOP S chaotic and O a hard freeze", () => {
    const s = driveForStopStep(0, 0.5, true, 1);
    const o = driveForStopStep(2, 0.5, true, 1);
    expect(s.noiseForce ?? 0).toBeGreaterThan(2);
    expect(s.freeze ?? 1).toBe(0);
    expect(s.shape).toBe("vortex");
    expect(o.shape).toBe("rings");
    expect(o.freeze ?? 0).toBeGreaterThan(0.9);
    expect(o.noiseForce ?? 1).toBeLessThan(0.1);
  });
});
