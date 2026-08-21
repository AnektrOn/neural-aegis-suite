import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildMdPdfHtml, type MdPdfContentLang } from "@/features/md-pdf/exportMarkdownPdf";
import {
  loadMdPdfRenderSession,
  saveMdPdfRenderSession,
} from "@/features/md-pdf/mdPdfRenderSession";
import { SAMPLE_VAULT_MD } from "@/features/md-pdf/sampleVaultMd";
import { MD_PDF_THEMES, type MdPdfThemeId } from "@/features/md-pdf/printThemes";
import { useMdPdfAssessment } from "@/features/md-pdf/useMdPdfAssessment";

const A4_WIDTH_PX = 794;

export default function AdminMarkdownPdfRender() {
  const [theme, setTheme] = useState<MdPdfThemeId>("nocturne");
  const [showCover, setShowCover] = useState(true);
  const [contentLang, setContentLang] = useState<MdPdfContentLang>("fr");
  const [markdown, setMarkdown] = useState(SAMPLE_VAULT_MD);
  const [filename, setFilename] = useState("diag-balance-djanan33.md");
  const [iframeHeight, setIframeHeight] = useState(2200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const session = loadMdPdfRenderSession();
    setTheme(session.theme);
    setShowCover(session.showCover);
    setContentLang(session.contentLang);
    setMarkdown(session.markdown);
    setFilename(session.filename);
  }, []);

  const pdfLocale = contentLang === "en" ? "en" : "fr";
  const { assessment, status: userStatus, handle: userHandle } = useMdPdfAssessment(markdown, pdfLocale);

  useEffect(() => {
    saveMdPdfRenderSession({ markdown, filename, theme, showCover, contentLang });
  }, [markdown, filename, theme, showCover, contentLang]);

  const html = useMemo(
    () =>
      buildMdPdfHtml({
        sources: [{ filename, markdown }],
        theme,
        showCover,
        locale: pdfLocale,
        contentLang,
        assessment,
      }).html,
    [filename, markdown, theme, showCover, contentLang, pdfLocale, assessment],
  );

  const measure = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const next = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
      1123,
    );
    setIframeHeight(next + 8);
  };

  useEffect(() => {
    measure();
  }, [html]);

  return (
    <div id="aegis-md-pdf-render" data-testid="md-pdf-render" className="min-h-screen bg-[#171717] text-white">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-400">Rendu A4</p>
        <Link
          to="/admin/md-pdf"
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        >
          Studio
        </Link>
        <div className="flex flex-wrap gap-2">
          {MD_PDF_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wider ${
                theme === item.id
                  ? "border-rose-400 bg-rose-400/20 text-rose-200"
                  : "border-white/15 text-white/60"
              }`}
            >
              {item.id}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["fr", "en", "both"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setContentLang(id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wider ${
                contentLang === id
                  ? "border-rose-400 bg-rose-400/20 text-rose-200"
                  : "border-white/15 text-white/60"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={showCover} onChange={(e) => setShowCover(e.target.checked)} />
          Couverture
        </label>
        {userHandle ? (
          <p className={`text-[11px] uppercase tracking-wider ${userStatus === "found" ? "text-rose-300" : "text-white/50"}`}>
            {userStatus === "loading"
              ? `Profil ${userHandle}…`
              : userStatus === "found"
                ? `Profil ${assessment?.displayName ?? userHandle}`
                : `Pas d'assessment pour ${userHandle}`}
          </p>
        ) : null}
      </header>

      <div className="overflow-auto px-6 py-8">
        <iframe
          ref={iframeRef}
          title="Rendu A4 MD PDF"
          srcDoc={html}
          onLoad={measure}
          className="mx-auto block border-0 bg-transparent"
          style={{ width: A4_WIDTH_PX, height: iframeHeight }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
