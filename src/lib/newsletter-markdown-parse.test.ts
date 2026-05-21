import { describe, it, expect } from "vitest";
import {
  mergeNewsletterMarkdownEntries,
  parseNewsletterMarkdownFile,
} from "./newsletter-markdown-parse";

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
});
