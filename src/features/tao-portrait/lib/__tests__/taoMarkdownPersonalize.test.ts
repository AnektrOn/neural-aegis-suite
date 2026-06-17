import { describe, expect, it } from "vitest";
import { personalizeTaoMarkdown } from "../taoMarkdownPersonalize";

describe("personalizeTaoMarkdown", () => {
  it("replaces [Username] and utilisateur with display name", () => {
    const md = `# Rapport pour [Username]

Le champ morphique de l'utilisateur révèle une verticalité forte.

L'Utilisateur manifeste une tension entre Bois et Eau.`;

    const out = personalizeTaoMarkdown(md, "Petter Gryding");
    expect(out).toContain("Petter Gryding");
    expect(out).not.toMatch(/\[Username\]/i);
    expect(out).not.toMatch(/\butilisateur\b/i);
    expect(out).not.toMatch(/\bUtilisateur\b/);
  });

  it("leaves markdown unchanged when display name is missing", () => {
    const md = "Portrait de [Username] pour l'utilisateur.";
    expect(personalizeTaoMarkdown(md, "")).toBe(md);
    expect(personalizeTaoMarkdown(md, null)).toBe(md);
  });
});
