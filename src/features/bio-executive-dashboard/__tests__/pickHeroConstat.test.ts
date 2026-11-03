import { describe, expect, it } from "vitest";
import { pickHeroConstat } from "../pickHeroConstat";

describe("pickHeroConstat", () => {
  it("gratuit — rapport prêt", () => {
    expect(
      pickHeroConstat(
        {
          tier: "free",
          reportReady: true,
          pendingCount: null,
          oldestPendingDays: null,
          lastContactDays: null,
        },
        "fr",
      ),
    ).toBe("Votre rapport est prêt");
  });

  it("gratuit — rapport en préparation", () => {
    expect(
      pickHeroConstat(
        {
          tier: "free",
          reportReady: false,
          pendingCount: 3,
          oldestPendingDays: 10,
          lastContactDays: null,
        },
        "fr",
      ),
    ).toBe("Votre rapport est en préparation");
  });

  it("matrice — décision la plus ancienne > 7 j", () => {
    expect(
      pickHeroConstat(
        {
          tier: "matrix",
          pendingCount: 2,
          oldestPendingDays: 9,
          lastContactDays: null,
        },
        "fr",
      ),
    ).toBe("2 décisions attendent. La plus ancienne : 9 jours.");
  });

  it("matrice — plus de 5 décisions ouvertes", () => {
    expect(
      pickHeroConstat(
        {
          tier: "matrix",
          pendingCount: 6,
          oldestPendingDays: 3,
          lastContactDays: null,
        },
        "fr",
      ),
    ).toBe("6 décisions ouvertes.");
  });

  it("matrice — relation sans mise à jour > 14 j", () => {
    expect(
      pickHeroConstat(
        {
          tier: "matrix",
          pendingCount: 1,
          oldestPendingDays: 2,
          lastContactDays: 20,
        },
        "fr",
      ),
    ).toBe("Aucune relation mise à jour depuis 20 jours.");
  });

  it("matrice — mémoire à jour", () => {
    expect(
      pickHeroConstat(
        {
          tier: "matrix",
          pendingCount: 0,
          oldestPendingDays: null,
          lastContactDays: 5,
        },
        "fr",
      ),
    ).toBe("Aucune décision en attente. Mémoire à jour.");
  });
});
