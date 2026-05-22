import { describe, it, expect } from "vitest";
import {
  mergeNewsletterMarkdownEntries,
  parseNewsletterMarkdownFile,
  inferMetadataFromMarkdownBody,
} from "./newsletter-markdown-parse";

const GRAND_MALENTENDU_MD = `# Le grand malentendu : Quand le succès devient une erreur système.

> **Accroche :** Votre succès est peut-être le signe que vous avez définitivement accepté la boucle.

Posez-vous la question, une bonne fois pour toutes : faites-vous la différence entre l'accomplissement et le succès ?

### Pourquoi l'élite est en burn-out technique ?

**[Lien vers le Protocole Nomos]**

#SystemicArchitecture #SuccesVsAccomplissement
`;

describe("newsletter-markdown-parse", () => {
  it("parses frontmatter and body", () => {
    const md = `---
slug: test-edition
title_fr: Bonjour
excerpt_fr: Un brief court
---
# Hello`;
    const { meta, body } = parseNewsletterMarkdownFile(md);
    expect(meta.slug).toBe("test-edition");
    expect(meta.title_fr).toBe("Bonjour");
    expect(body).toContain("# Hello");
  });

  it("merges fr and en files by slug", () => {
    const preview = mergeNewsletterMarkdownEntries([
      {
        path: "lettre-fr.md",
        content: `---\nslug: mai-2026\ntitle_fr: FR Title\nexcerpt_fr: Brief FR\n---\n# FR body`,
      },
      {
        path: "lettre-en.md",
        content: `---\nslug: mai-2026\ntitle_en: EN Title\nexcerpt_en: Brief EN\n---\n# EN body`,
      },
    ]);
    expect(preview.edition.slug).toBe("mai-2026");
    expect(preview.edition.bodyFr).toContain("FR body");
    expect(preview.edition.bodyEn).toContain("EN body");
    expect(preview.edition.titleFr).toBe("FR Title");
    expect(preview.edition.titleEn).toBe("EN Title");
  });

  it("infers title, excerpt and slug from raw article without frontmatter", () => {
    const inferred = inferMetadataFromMarkdownBody(GRAND_MALENTENDU_MD);
    expect(inferred.titleFr).toContain("grand malentendu");
    expect(inferred.excerptFr).toContain("accepté la boucle");
    expect(inferred.slug).toBe(
      "le-grand-malentendu-quand-le-succes-devient-une-erreur-systeme",
    );
    expect(inferred.bodyFr).not.toMatch(/^#\s+Le grand malentendu/);
    expect(inferred.bodyFr).toContain("Protocole Nomos");
    expect(inferred.bodyFr).not.toContain("> **Accroche");
  });

  it("merges raw markdown file into importable edition", () => {
    const preview = mergeNewsletterMarkdownEntries([
      { path: "grand-malentendu.md", content: GRAND_MALENTENDU_MD },
    ]);
    expect(preview.edition.slug).toBe(
      "le-grand-malentendu-quand-le-succes-devient-une-erreur-systeme",
    );
    expect(preview.edition.titleFr).toContain("grand malentendu");
    expect(preview.edition.excerptFr).toContain("accepté la boucle");
    expect(preview.edition.bodyFr.length).toBeGreaterThan(100);
    expect(preview.issues).toContain("format_inferred_from_markdown");
  });
});
