import { useState, useMemo, useEffect, useCallback } from "react";
import { ShieldCheck, ArrowUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import rawMarkdown from "./content/01_GLOSSAIRE_DOCTRINAL_JUNG.md?raw";
import { parseDoctrinalGlossary } from "./parseDoctrinalGlossary";
import GlossaryHeader from "./components/GlossaryHeader";
import ConceptArticleCard from "./components/ConceptArticleCard";
import ConceptAtlasGrid from "./components/ConceptAtlasGrid";
import GlossaryNavigationAndSearch from "./components/GlossaryNavigationAndSearch";
import "./jungGlossary.css";

const initialMarkdown =
  typeof rawMarkdown === "string"
    ? rawMarkdown
    : (rawMarkdown as { default?: string })?.default ?? "";

export default function JungGlossaryPage() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [markdownContent, setMarkdownContent] = useState<string>(initialMarkdown);
  const [viewMode, setViewMode] = useState<"codex" | "atlas">("codex");
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Parse Doctrinal Data from markdown
  const data = useMemo(() => {
    return parseDoctrinalGlossary(markdownContent);
  }, [markdownContent]);

  // Handle custom file upload
  const handleCustomFileLoaded = useCallback((content: string, filename: string) => {
    setMarkdownContent(content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Jump to specific concept
  const handleSelectConcept = useCallback((id: string) => {
    setActiveConceptId(id);
    if (viewMode === "atlas") {
      setViewMode("codex");
    }

    // Delay slightly to let Codex view render if switching from Atlas
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }, [viewMode]);

  // Scroll spy & Scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Setup IntersectionObserver for active concept scroll-spy in Codex mode
  useEffect(() => {
    if (viewMode !== "codex") return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveConceptId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      },
    );

    (data?.allConcepts ?? []).forEach((concept) => {
      const el = document.getElementById(concept.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [data?.allConcepts, viewMode]);

  return (
    <div className="jung-codex min-h-screen selection:bg-[var(--codex-gold-muted)]">
      {/* Editorial Header */}
      <GlossaryHeader
        frontmatter={data.frontmatter}
        header={data.header}
        totalConcepts={data.allConcepts.length}
        totalChapters={data.chapters.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCustomFileLoaded={handleCustomFileLoaded}
      />

      {/* Main Content Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {viewMode === "atlas" ? (
          /* ================= Atlas Synoptic View ================= */
          <ConceptAtlasGrid
            chapters={data.chapters}
            allConcepts={data.allConcepts}
            onSelectConcept={handleSelectConcept}
          />
        ) : (
          /* ================= Codex Sequential View ================= */
          <div className="flex gap-10 xl:gap-14">
            {/* Left sticky navigation rail (desktop) */}
            <GlossaryNavigationAndSearch
              chapters={data.chapters}
              allConcepts={data.allConcepts}
              activeConceptId={activeConceptId}
              onSelectConcept={handleSelectConcept}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />

            {/* Central Article Column */}
            <div className="flex-1 min-w-0 max-w-4xl mx-auto space-y-16">
              {data.chapters.map((chapter) => (
                <section
                  key={chapter.id}
                  id={`chapter-${chapter.id}`}
                  className="space-y-6 pt-6"
                >
                  {/* Monumental Chapter Divider */}
                  <div className="border-b-2 border-[var(--codex-gold)]/30 pb-4 pt-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono-code text-xs uppercase tracking-widest text-[var(--codex-gold)] font-bold">
                        Pilier Doctrinal 0{chapter.num}
                      </span>
                      {chapter.originalTerm && (
                        <span className="font-garamond italic text-xs text-[var(--codex-ink-tertiary)]">
                          — {chapter.originalTerm}
                        </span>
                      )}
                    </div>
                    <h2 className="font-garamond text-2xl sm:text-4xl font-normal text-[var(--codex-ink)] tracking-tight">
                      {chapter.title}
                    </h2>
                  </div>

                  {/* Chapter Concepts */}
                  <div className="space-y-8">
                    {chapter.concepts.map((concept) => (
                      <ConceptArticleCard
                        key={concept.id}
                        concept={concept}
                        allConcepts={data.allConcepts}
                        onSelectConcept={handleSelectConcept}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {/* Colophon & Firewall Notice */}
              {data.firewallNotice && (
                <footer className="mt-20 pt-10 border-t border-[var(--codex-cardline)] text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-xs text-[var(--codex-ink-tertiary)] font-mono-code mb-4">
                    <ShieldCheck className="h-4 w-4 text-[var(--codex-gold)]" />
                    <span>AEGIS ONTOLOGY AIR-GAP VERIFIED</span>
                  </div>
                  <p className="max-w-2xl mx-auto text-xs font-mono-code text-[var(--codex-ink-tertiary)] leading-relaxed">
                    {data.firewallNotice}
                  </p>
                </footer>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Scroll to Top floating button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center justify-center h-10 w-10 rounded-full border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] shadow-xl hover:scale-105 active:scale-95 transition-all"
          title="Haut de page"
          aria-label={isFR ? "Retour en haut" : "Back to top"}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
