import { describe, expect, it } from "vitest";
import { normalizeMermaidSource, splitTextWithEmbeddedMermaid } from "./cartography-mermaid";
import { parseMarkdownBlocks } from "./cartography-document-parse";

const SHADOW_MERMAID = `Voici la cartographie holographique des interactions d'Ombre (Tier 3) pour le sujet 'note'.

\`\`\`mermaid
graph TD
%% Nœuds Archétypaux
M1(M1 SABOTEUR<br/>"Le Gardien du Silence")
M3(M3 GUÉRISSEUR<br/>"La Parole Étouffée")
M1 -- "Neutralise par la peur du changement" --> M3
classDef arch fill:#1a1a1a,stroke:#d4af37,stroke-width:2px,color:#fff;
class M1,M3 arch;
\`\`\`
`;

describe("cartography-mermaid", () => {
  it("extracts mermaid from fenced blocks", () => {
    const blocks = parseMarkdownBlocks(SHADOW_MERMAID);
    expect(blocks.some((b) => b.type === "p" && b.text.includes("cartographie holographique"))).toBe(true);
    const diagram = blocks.find((b) => b.type === "mermaid");
    expect(diagram?.type).toBe("mermaid");
    expect(diagram?.source).toMatch(/^graph TD/m);
    expect(diagram?.source).toContain("M1");
    expect(diagram?.source).not.toContain("```");
  });

  it("salvages flattened mermaid in a single paragraph", () => {
    const flat =
      "Intro. ```mermaid graph TD M1(M1 SABOTEUR) M3(M3 GUÉRISSEUR) M1 --> M3 ``` Fin.";
    const blocks = parseMarkdownBlocks(flat);
    expect(blocks.some((b) => b.type === "mermaid")).toBe(true);
    expect(blocks.some((b) => b.type === "p" && b.text === "Intro.")).toBe(true);
  });

  it("normalizes mermaid keyword on first line", () => {
    const src = normalizeMermaidSource("mermaid graph TD\nM1(A)\nM1 --> M2(B)");
    expect(src.startsWith("graph TD")).toBe(true);
  });

  it("splitTextWithEmbeddedMermaid handles inline fences", () => {
    const parts = splitTextWithEmbeddedMermaid("A ```mermaid graph TD\nM1(A)``` B");
    expect(parts).toHaveLength(3);
    expect(parts[1].kind).toBe("mermaid");
  });
});
