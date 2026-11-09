import type {
  DoctrinalBlock,
  DoctrinalChapter,
  DoctrinalConcept,
  DoctrinalFrontmatter,
  DoctrinalGlossaryData,
} from "./doctrinalGlossaryTypes";

/** Strip markdown formatting like bold, italic, wikilinks */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/** Clean wikilinks into human readable strings: `[[🌌·ConscienceSouveraine]]` -> `Conscience Souveraine` */
export function cleanWikilink(link: string): string {
  let cleaned = link.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
  // Strip glyph prefix if present (e.g. "🌌·", "🔷·", "🌐·", "🌀·")
  cleaned = cleaned.replace(/^[^a-zA-ZÀ-ÿ0-9]*·/, "");
  // Insert spaces before capitals if CamelCased
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2");
  return cleaned.trim();
}

/** Clean title by stripping emojis and leading numbering */
export function cleanTitleAndTerm(raw: string): { title: string; originalTerm?: string } {
  // Extract (*Original Term*) if present
  let originalTerm: string | undefined;
  const termMatch = raw.match(/\(\*([^*]+)\*\)/);
  if (termMatch) {
    originalTerm = termMatch[1].trim();
  }

  // Strip term in parenthesis from title
  let cleaned = raw.replace(/\(\*[^*]+\*\)/, "").trim();

  // Strip emojis and symbols (Unicode emoji ranges + common icons)
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}⚡🧠🎭🧭🌙📌🧬🔬📚✦◈]/gu,
    "",
  );

  // Strip markdown heading markers (e.g. "### Qu'est-ce qu'un Complexe ?")
  cleaned = cleaned.replace(/^#{1,6}\s+/, "").trim();

  // Strip leading number like "1. ", "2. ", etc.
  cleaned = cleaned.replace(/^\s*\d+\.\s*/, "").trim();

  // Strip trailing or leading dashes
  cleaned = cleaned.replace(/^[-—–:]\s*/, "").replace(/\s*[-—–:]$/, "").trim();

  return { title: cleaned, originalTerm };
}

/** Create URL-safe kebab-case slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse raw markdown string of 01_GLOSSAIRE_DOCTRINAL_JUNG.md into structured AST */
export function parseDoctrinalGlossary(markdown: string | { default: string }): DoctrinalGlossaryData {
  const rawText = typeof markdown === "string" ? markdown : (markdown?.default ?? "");
  const lines = (rawText || "").split(/\r?\n/);

  // 1. Extract Frontmatter
  let frontmatterEndIndex = -1;
  const fmLines: string[] = [];
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        frontmatterEndIndex = i;
        break;
      }
      fmLines.push(lines[i]);
    }
  }

  const frontmatter: DoctrinalFrontmatter = {
    titre: "GLOSSAIRE DOCTRINAL JUNG",
    stade: "fondation",
    domaine: "PSY",
    glyphe: "📚",
    auteur: "Carl Gustav Jung",
    oeuvre: "L'Homme à la découverte de son âme",
    prismesLies: [],
    resonance: [],
    created: "2026-11-04",
    updated: "2026-11-04",
    glyphes: [],
    domaines: [],
    nature: "glossaire",
    vecteur: "neguentropie",
    poupeesRusses: [],
  };

  // Basic YAML extraction without external dependencies
  for (const line of fmLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val = kvMatch[2].trim();

      // Clean quoted strings
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      // Arrays: ["a", "b"]
      if (val.startsWith("[") && val.endsWith("]")) {
        const items = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);

        if (key === "prismes_lies") frontmatter.prismesLies = items;
        else if (key === "resonance") frontmatter.resonance = items.map(cleanWikilink);
        else if (key === "glyphes") frontmatter.glyphes = items;
        else if (key === "domaines") frontmatter.domaines = items;
        else if (key === "poupees-russes") frontmatter.poupeesRusses = items.map(cleanWikilink);
      } else {
        if (key === "titre") frontmatter.titre = val;
        else if (key === "stade") frontmatter.stade = val;
        else if (key === "domaine") frontmatter.domaine = val;
        else if (key === "glyphe") frontmatter.glyphe = val;
        else if (key === "auteur") frontmatter.auteur = val;
        else if (key === "oeuvre") frontmatter.oeuvre = val;
        else if (key === "created") frontmatter.created = val;
        else if (key === "updated") frontmatter.updated = val;
        else if (key === "nature") frontmatter.nature = val;
        else if (key === "vecteur") frontmatter.vecteur = val;
      }
    }
  }

  // 2. Body Parsing
  const bodyLines = frontmatterEndIndex >= 0 ? lines.slice(frontmatterEndIndex + 1) : lines;

  let mainTitle = "Glossaire Doctrinal et Clinique : Carl Gustav Jung";
  let subTitle = "Référence Fondatrice : L'Homme à la découverte de son âme";
  let charCount: string | undefined = "773 809 caractères";
  let introLead = "";
  let firewallNotice: string | undefined;

  // Split into raw chapter chunks
  interface RawChapter {
    rawHeader: string;
    num: number;
    lines: string[];
  }
  const rawChapters: RawChapter[] = [];
  let currentRawChapter: RawChapter | null = null;
  const preChapterLines: string[] = [];

  for (const line of bodyLines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("[AEGIS V3 ONTOLOGY FIREWALL ACTIVE]")) {
      firewallNotice = trimmed;
      continue;
    }

    const chMatch = trimmed.match(/^##\s+(?:[^0-9]*\s*)?(\d+)\.\s*(.+)$/);
    if (chMatch) {
      const num = parseInt(chMatch[1], 10);
      currentRawChapter = {
        rawHeader: trimmed.replace(/^##\s*/, ""),
        num,
        lines: [],
      };
      rawChapters.push(currentRawChapter);
      continue;
    }

    if (currentRawChapter) {
      currentRawChapter.lines.push(line);
    } else {
      preChapterLines.push(line);
    }
  }

  // Parse header lines before Chapter 1
  for (const pLine of preChapterLines) {
    const trimmed = pLine.trim();
    if (trimmed.startsWith("# ")) {
      const clean = cleanTitleAndTerm(trimmed.replace(/^#\s*/, ""));
      mainTitle = clean.title;
    } else if (trimmed.startsWith("## ")) {
      const cleanSub = cleanTitleAndTerm(trimmed.replace(/^##\s*/, ""));
      subTitle = cleanSub.title;
      const countMatch = trimmed.match(/\(([\d\s]+(?:caractères|chars))\)/i);
      if (countMatch) charCount = countMatch[1];
    } else if (trimmed && !trimmed.startsWith("---")) {
      if (!introLead) introLead = trimmed;
      else introLead += " " + trimmed;
    }
  }

  // 3. Parse Chapters & Concepts
  const chapters: DoctrinalChapter[] = [];
  const allConcepts: DoctrinalConcept[] = [];

  for (const rawCh of rawChapters) {
    const { title: chTitle, originalTerm: chTerm } = cleanTitleAndTerm(rawCh.rawHeader);
    const chapterId = String(rawCh.num).padStart(2, "0");

    // Split raw chapter lines into concepts by `### `
    interface RawConcept {
      rawHeader: string;
      lines: string[];
    }
    const rawConcepts: RawConcept[] = [];
    let currentRawConcept: RawConcept | null = null;

    for (const cLine of rawCh.lines) {
      const cTrimmed = cLine.trim();
      if (cTrimmed.startsWith("### ")) {
        currentRawConcept = {
          rawHeader: cTrimmed.replace(/^###\s*/, ""),
          lines: [],
        };
        rawConcepts.push(currentRawConcept);
      } else if (currentRawConcept) {
        currentRawConcept.lines.push(cLine);
      }
    }

    const chapterConcepts: DoctrinalConcept[] = [];
    let conceptSubIndex = 1;

    for (const rawConc of rawConcepts) {
      const { title: concTitle, originalTerm: concTerm } = cleanTitleAndTerm(rawConc.rawHeader);
      const code = `${chapterId}.${conceptSubIndex++}`;
      const conceptId = slugify(concTitle);

      const blocks = parseConceptBlocks(rawConc.lines);

      // Determine essence from blocks
      let essence = "";
      const facetBlock = blocks.find((b) => b.type === "facets");
      if (facetBlock && facetBlock.type === "facets") {
        const defFacet = facetBlock.items.find(
          (item) => item.label.toLowerCase().includes("définition") || item.label.toLowerCase().includes("qu'est-ce"),
        );
        if (defFacet) {
          essence = defFacet.content;
        } else if (facetBlock.items[0]) {
          essence = `${facetBlock.items[0].label} : ${facetBlock.items[0].content}`;
        }
      }

      if (!essence) {
        const pBlock = blocks.find((b) => b.type === "paragraph");
        if (pBlock && pBlock.type === "paragraph") {
          essence = pBlock.content;
        }
      }

      if (!essence) {
        essence = `${concTitle} — Pilier ${chapterId} de la métapsychologie jungienne.`;
      }

      const concept: DoctrinalConcept = {
        id: conceptId,
        code,
        chapterId,
        title: concTitle,
        originalTerm: concTerm,
        essence: stripMarkdown(essence),
        blocks,
        relatedConceptIds: [],
      };

      chapterConcepts.push(concept);
      allConcepts.push(concept);
    }

    chapters.push({
      id: chapterId,
      num: rawCh.num,
      title: chTitle,
      originalTerm: chTerm,
      concepts: chapterConcepts,
    });
  }

  // 4. Cross-index relations between concepts
  for (const concept of allConcepts) {
    const rawAllText = JSON.stringify(concept.blocks).toLowerCase();
    for (const other of allConcepts) {
      if (other.id === concept.id) continue;

      const otherWords = other.title
        .toLowerCase()
        .split(/[\s'-]+/)
        .filter((w) => w.length >= 4);

      const matchesTitle = otherWords.length > 0 && otherWords.some((w) => rawAllText.includes(w));
      const matchesTerm = other.originalTerm && rawAllText.includes(other.originalTerm.toLowerCase());

      if (matchesTitle || matchesTerm) {
        concept.relatedConceptIds.push(other.id);
      }
    }
  }

  return {
    frontmatter,
    header: {
      title: mainTitle,
      subtitle: subTitle,
      charCount,
      introLead,
    },
    chapters,
    allConcepts,
    firewallNotice,
  };
}

/** Parse lines inside a single concept into structured blocks */
function parseConceptBlocks(lines: string[]): DoctrinalBlock[] {
  const blocks: DoctrinalBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const startIndex = i;
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed === "---") {
      i++;
      continue;
    }

    // Plain bullet (no **Label:** facet) — must run before paragraph fallback
    const plainBulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (plainBulletMatch && !/^\*\*[^*]+\*\*/.test(plainBulletMatch[1])) {
      blocks.push({
        type: "paragraph",
        content: stripMarkdown(plainBulletMatch[1]),
      });
      i++;
      continue;
    }

    // Facet label with colon inside bold: `- **Caractéristiques :**`
    const facetInlineColonMatch = trimmed.match(/^[-*]\s+\*\*([^*]+:\s*)\*\*\s*(.*)$/);
    if (facetInlineColonMatch) {
      const label = facetInlineColonMatch[1].replace(/:\s*$/, "").trim();
      let content = facetInlineColonMatch[2].trim();
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrim = nextLine.trim();
        if (
          (nextLine.startsWith("   ") || nextLine.startsWith("\t") || nextTrim.startsWith("-")) &&
          !nextTrim.match(/^[-*]\s+\*\*[^*]+\*\*/) &&
          !nextTrim.match(/^\d+\.\s+\*\*/)
        ) {
          if (nextTrim.startsWith("-") || nextTrim.startsWith("*")) {
            content += (content ? "\n" : "") + "• " + nextTrim.replace(/^[-*]\s*/, "");
          } else if (nextTrim) {
            content += (content ? " " : "") + nextTrim;
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: "facets",
        items: [{ label, content }],
      });
      continue;
    }

    // 1. Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      const fullQuote = quoteLines.join(" ");
      let quoteText = fullQuote;
      let source: string | undefined;

      const sourceMatch = fullQuote.match(/\(([^()]+)\)\s*$/);
      if (sourceMatch) {
        source = sourceMatch[1].replace(/^\*|\*$/g, "").trim();
        quoteText = fullQuote.slice(0, sourceMatch.index).trim();
      }

      quoteText = quoteText.replace(/^[«"“']|[»"”']$/g, "").replace(/^\*|\*$/g, "").trim();

      blocks.push({
        type: "quote",
        quote: quoteText,
        source,
      });
      continue;
    }

    // 2. Numbered Steps or Dyad with Sub-bullets (e.g. "1. **Titre :**" followed by "   - Bullet")
    const stepMatch = trimmed.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*(?::\s*)?(.*)$/);
    if (stepMatch) {
      const stepsList: Array<{
        stepNumber: number;
        title: string;
        subpoints: string[];
      }> = [];

      while (i < lines.length) {
        const curLine = lines[i];
        const curTrimmed = curLine.trim();
        const m = curTrimmed.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*(?::\s*)?(.*)$/);

        if (m) {
          const stepNum = parseInt(m[1], 10);
          const stepTitle = m[2].trim();
          const inlineText = m[3].trim();
          const subpoints: string[] = [];

          if (inlineText) {
            subpoints.push(inlineText);
          }

          i++;
          // Collect child bullets (lines starting with indent and - or *)
          while (i < lines.length) {
            const nextLine = lines[i];
            const nextTrim = nextLine.trim();
            if (
              (nextLine.startsWith("   ") || nextLine.startsWith("\t") || nextTrim.startsWith("-")) &&
              !nextTrim.match(/^\d+\.\s+\*\*/)
            ) {
              if (nextTrim.startsWith("-") || nextTrim.startsWith("*")) {
                subpoints.push(nextTrim.replace(/^[-*]\s*/, ""));
              } else if (nextTrim) {
                if (subpoints.length > 0) {
                  subpoints[subpoints.length - 1] += " " + nextTrim;
                } else {
                  subpoints.push(nextTrim);
                }
              }
              i++;
            } else {
              break;
            }
          }

          stepsList.push({
            stepNumber: stepNum,
            title: stepTitle,
            subpoints,
          });
        } else {
          break;
        }
      }

      // Check if it's a balanced dyad of exactly 2 items
      if (stepsList.length === 2 && stepsList[0].subpoints.length <= 1 && stepsList[1].subpoints.length <= 1) {
        const { title: t1, originalTerm: term1 } = cleanTitleAndTerm(stepsList[0].title);
        const { title: t2, originalTerm: term2 } = cleanTitleAndTerm(stepsList[1].title);
        blocks.push({
          type: "dyad",
          items: [
            {
              label: t1,
              originalTerm: term1,
              description: stepsList[0].subpoints.join(" "),
            },
            {
              label: t2,
              originalTerm: term2,
              description: stepsList[1].subpoints.join(" "),
            },
          ],
        });
      } else {
        blocks.push({
          type: "steps",
          items: stepsList,
        });
      }
      continue;
    }

    // 3. Facets / Bullet Points with Bold Labels (`- **Label :** Value`)
    const facetMatch = trimmed.match(/^[-*]\s+\*\*([^*]+)\*\*\s*:\s*(.*)$/);
    if (facetMatch) {
      const facetItems: Array<{ label: string; content: string; emphasis?: string }> = [];

      while (i < lines.length) {
        const curLine = lines[i];
        const curTrim = curLine.trim();
        const fMatch = curTrim.match(/^[-*]\s+\*\*([^*]+)\*\*\s*:\s*(.*)$/);

        if (fMatch) {
          const rawLabel = fMatch[1].trim();
          let content = fMatch[2].trim();
          i++;

          // Collect multiline or sub-bullets
          while (i < lines.length) {
            const nextLine = lines[i];
            const nextTrim = nextLine.trim();
            if (
              (nextLine.startsWith("   ") || nextLine.startsWith("\t") || nextTrim.startsWith("-")) &&
              !nextTrim.match(/^[-*]\s+\*\*[^*]+\*\*\s*:/) &&
              !nextTrim.match(/^\d+\.\s+\*\*/)
            ) {
              if (nextTrim.startsWith("-") || nextTrim.startsWith("*")) {
                content += "\n• " + nextTrim.replace(/^[-*]\s*/, "");
              } else if (nextTrim) {
                content += " " + nextTrim;
              }
              i++;
            } else {
              break;
            }
          }

          const { title: labelTitle, originalTerm: labelTerm } = cleanTitleAndTerm(rawLabel);
          facetItems.push({
            label: labelTitle,
            emphasis: labelTerm,
            content,
          });
        } else {
          break;
        }
      }

      // If exactly 2 opposing items, render as dyad
      if (facetItems.length === 2 && (facetItems[0].label.includes("Causale") || facetItems[0].label.includes("Objet"))) {
        blocks.push({
          type: "dyad",
          items: facetItems.map((f) => ({
            label: f.label,
            originalTerm: f.emphasis,
            description: f.content,
          })),
        });
      } else {
        blocks.push({
          type: "facets",
          items: facetItems,
        });
      }
      continue;
    }

    // 4. Sequential list like "1. *Exposition*..."
    const simpleListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (simpleListMatch) {
      const stepsList: Array<{
        stepNumber: number;
        title: string;
        subpoints: string[];
      }> = [];

      while (i < lines.length) {
        const curLine = lines[i];
        const curTrim = curLine.trim();
        const slm = curTrim.match(/^(\d+)\.\s+(.+)$/);
        if (slm) {
          const stepNum = parseInt(slm[1], 10);
          const fullText = slm[2].trim();
          // Extract *Title* if present
          let sTitle = fullText;
          let rest = "";
          const italicMatch = fullText.match(/^\*([^*]+)\*\s*(.*)$/);
          if (italicMatch) {
            sTitle = italicMatch[1].trim();
            rest = italicMatch[2].replace(/^[-—–(:]\s*/, "").replace(/\)$/, "").trim();
          }

          stepsList.push({
            stepNumber: stepNum,
            title: sTitle,
            subpoints: rest ? [rest] : [],
          });
          i++;
        } else {
          break;
        }
      }

      blocks.push({
        type: "steps",
        items: stepsList,
      });
      continue;
    }

    // 5. Default Paragraph
    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const pLine = lines[i];
      const pTrim = pLine.trim();
      if (!pTrim || pTrim === "---" || pTrim.startsWith("#") || pTrim.startsWith(">") || pTrim.startsWith("-") || pTrim.match(/^\d+\./)) {
        break;
      }
      paragraphLines.push(pTrim);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: paragraphLines.join(" "),
      });
    } else if (i === startIndex) {
      // Unrecognized line shape — advance so we never spin on the same index.
      blocks.push({
        type: "paragraph",
        content: stripMarkdown(trimmed),
      });
      i++;
    }
  }

  return blocks;
}
