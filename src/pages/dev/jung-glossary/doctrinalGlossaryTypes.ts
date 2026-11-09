export interface DoctrinalFrontmatter {
  titre: string;
  stade: string;
  domaine: string;
  glyphe: string;
  auteur: string;
  oeuvre: string;
  prismesLies: string[];
  resonance: string[];
  created: string;
  updated: string;
  glyphes: string[];
  domaines: string[];
  nature: string;
  vecteur: string;
  poupeesRusses: string[];
}

export type DoctrinalBlock =
  | {
      type: "paragraph";
      content: string;
    }
  | {
      type: "quote";
      quote: string;
      source?: string;
    }
  | {
      type: "facets";
      items: Array<{
        label: string;
        content: string;
        emphasis?: string;
      }>;
    }
  | {
      type: "steps";
      title?: string;
      items: Array<{
        stepNumber: number;
        title: string;
        subpoints: string[];
      }>;
    }
  | {
      type: "dyad";
      items: Array<{
        label: string;
        originalTerm?: string;
        description: string;
      }>;
    };

export interface DoctrinalConcept {
  id: string; // e.g., "complexe-autonome", "le-moi", "l-ombre"
  code: string; // e.g., "01.1", "02.1"
  chapterId: string; // e.g., "01", "02"
  title: string; // Cleaned title without emojis, e.g. "Qu'est-ce qu'un Complexe ?" or "Le Moi"
  originalTerm?: string; // German or Greek term, e.g. "Das Ich", "Gefühlsbetonter Komplex", "Saiwala"
  essence: string; // Short 1-2 sentence core definition
  blocks: DoctrinalBlock[];
  relatedConceptIds: string[]; // Cross-linked concepts
}

export interface DoctrinalChapter {
  id: string; // "01", "02", etc.
  num: number; // 1, 2, 3, 4, 5
  title: string; // Cleaned chapter title
  originalTerm?: string; // e.g. "Gefühlsbetonter Komplex"
  concepts: DoctrinalConcept[];
}

export interface DoctrinalGlossaryData {
  frontmatter: DoctrinalFrontmatter;
  header: {
    title: string;
    subtitle: string;
    charCount?: string;
    introLead: string;
  };
  chapters: DoctrinalChapter[];
  allConcepts: DoctrinalConcept[];
  firewallNotice?: string;
}
