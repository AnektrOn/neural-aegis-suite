import type { MdPdfContentLang } from "./markdownToPrintHtml";
import type { MdPdfThemeId } from "./printThemes";
import { SAMPLE_VAULT_MD } from "./sampleVaultMd";

export const MD_PDF_RENDER_STORAGE_KEY = "aegis.md-pdf.render.v1";

export type MdPdfRenderSession = {
  markdown: string;
  filename: string;
  theme: MdPdfThemeId;
  showCover: boolean;
  contentLang: MdPdfContentLang;
};

const DEFAULT_SESSION: MdPdfRenderSession = {
  markdown: SAMPLE_VAULT_MD,
  filename: "diag-balance-djanan33.md",
  theme: "nocturne",
  showCover: true,
  contentLang: "fr",
};

export function loadMdPdfRenderSession(): MdPdfRenderSession {
  try {
    const raw = localStorage.getItem(MD_PDF_RENDER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SESSION };
    const parsed = JSON.parse(raw) as Partial<MdPdfRenderSession>;
    return {
      markdown: parsed.markdown?.trim() ? parsed.markdown : DEFAULT_SESSION.markdown,
      filename: parsed.filename || DEFAULT_SESSION.filename,
      theme: parsed.theme === "ivoire" || parsed.theme === "obsidian" ? parsed.theme : "nocturne",
      showCover: parsed.showCover !== false,
      contentLang: parsed.contentLang === "en" || parsed.contentLang === "both" ? parsed.contentLang : "fr",
    };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function saveMdPdfRenderSession(session: MdPdfRenderSession): void {
  try {
    localStorage.setItem(MD_PDF_RENDER_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}
