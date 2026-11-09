import React, { useState, useEffect } from "react";
import { Search, BookOpen, ChevronRight, X, Compass, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DoctrinalChapter, DoctrinalConcept } from "../doctrinalGlossaryTypes";

interface GlossaryNavigationProps {
  chapters: DoctrinalChapter[];
  allConcepts: DoctrinalConcept[];
  activeConceptId: string | null;
  onSelectConcept: (id: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export default function GlossaryNavigationAndSearch({
  chapters,
  allConcepts,
  activeConceptId,
  onSelectConcept,
  isSearchOpen,
  setIsSearchOpen,
}: GlossaryNavigationProps) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut listener for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Filtered concepts in search dialog
  const searchResults = searchQuery.trim()
    ? allConcepts.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          (c.originalTerm && c.originalTerm.toLowerCase().includes(q)) ||
          c.essence.toLowerCase().includes(q) ||
          c.code.includes(q)
        );
      })
    : [];

  const handleSelectAndClose = (id: string) => {
    onSelectConcept(id);
    setIsSearchOpen(false);
    setMobileDrawerOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* =========================================================================
          DESKTOP LEFT NAVIGATION RAIL (Visible on lg: ≥ 1024px)
         ========================================================================= */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 space-y-6 scrollbar-thin">
          <div className="flex items-center justify-between border-b border-[var(--codex-cardline)] pb-2">
            <span className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--codex-gold)] font-medium">
              Sommaire Doctrinal
            </span>
            <span className="font-mono-code text-[10px] text-[var(--codex-ink-tertiary)]">
              {allConcepts.length} NOTIONS
            </span>
          </div>

          <nav className="space-y-6">
            {chapters.map((ch) => (
              <div key={ch.id} className="space-y-2">
                {/* Chapter Header */}
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-code text-xs text-[var(--codex-gold)] font-semibold">
                    {ch.id}.
                  </span>
                  <span className="text-xs font-semibold text-[var(--codex-ink)] uppercase tracking-tight">
                    {ch.title}
                  </span>
                </div>

                {/* Concepts list */}
                <ul className="space-y-1 pl-4 border-l border-[var(--codex-cardline)] ml-1.5">
                  {ch.concepts.map((concept) => {
                    const isActive = activeConceptId === concept.id;
                    return (
                      <li key={concept.id}>
                        <button
                          type="button"
                          onClick={() => onSelectConcept(concept.id)}
                          className={`group w-full text-left py-1 px-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            isActive
                              ? "bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] font-medium border-l-2 border-[var(--codex-gold)] -ml-[1px]"
                              : "text-[var(--codex-ink-secondary)] hover:text-[var(--codex-ink)] hover:bg-[var(--codex-surface)]"
                          }`}
                        >
                          <span className="truncate">{concept.title}</span>
                          <span className="font-mono-code text-[10px] opacity-60 ml-1.5">
                            {concept.code}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE FLOATING ACTION BAR (Fixed bottom pill on < 1024px)
         ========================================================================= */}
      <div className="lg:hidden fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-full border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)]/95 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--codex-surface)] text-xs font-medium text-[var(--codex-ink)] border border-[var(--codex-cardline)] active:scale-95 transition-transform"
          >
            <BookOpen className="h-4 w-4 text-[var(--codex-gold)]" />
            <span>Sommaire ({allConcepts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--codex-surface)] text-[var(--codex-gold)] border border-[var(--codex-cardline)] active:scale-95 transition-transform"
            aria-label={isFR ? "Rechercher" : "Search"}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE DRAWER MODAL
         ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div className="bg-[var(--codex-surface)] border-t border-[var(--codex-cardline)] rounded-t-3xl max-h-[85vh] flex flex-col p-6 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--codex-cardline)]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--codex-gold)]" />
                <h3 className="font-medium text-sm text-[var(--codex-ink)]">
                  Table des Matières Doctrinale
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-full text-[var(--codex-ink-tertiary)] hover:text-[var(--codex-ink)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-5 flex-1">
              {chapters.map((ch) => (
                <div key={ch.id} className="space-y-2">
                  <p className="font-mono-code text-[11px] text-[var(--codex-gold)] font-semibold uppercase">
                    {ch.id}. {ch.title}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {ch.concepts.map((concept) => (
                      <button
                        key={concept.id}
                        type="button"
                        onClick={() => handleSelectAndClose(concept.id)}
                        className={`text-left p-2.5 rounded-xl text-xs flex items-center justify-between border transition-colors ${
                          activeConceptId === concept.id
                            ? "bg-[var(--codex-surface-elevated)] border-[var(--codex-gold)] text-[var(--codex-gold)] font-medium"
                            : "bg-[var(--codex-surface-elevated)]/40 border-[var(--codex-cardline)] text-[var(--codex-ink-secondary)]"
                        }`}
                      >
                        <span className="truncate">{concept.title}</span>
                        <span className="font-mono-code text-[10px] text-[var(--codex-ink-tertiary)] ml-2">
                          {concept.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          UNIVERSAL SEARCH DIALOG (⌘K)
         ========================================================================= */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl bg-[var(--codex-surface)] border-[var(--codex-cardline)] text-[var(--codex-ink)] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 border-b border-[var(--codex-cardline)]">
            <DialogTitle className="sr-only">Recherche Doctrinale</DialogTitle>
            <DialogDescription className="sr-only">
              Rechercher une notion doctrinale ou clinique
            </DialogDescription>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-[var(--codex-gold)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={"Rechercher une notion, terme allemand (ex: Schatten, Ich, Wozu)..."}
                autoFocus
                className="w-full bg-transparent text-sm text-[var(--codex-ink)] placeholder:text-[var(--codex-ink-tertiary)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-[var(--codex-ink-tertiary)] hover:text-[var(--codex-ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
            {!searchQuery.trim() ? (
              <div className="py-8 text-center text-xs text-[var(--codex-ink-tertiary)]">
                <p className="font-mono-code uppercase tracking-wider text-[10px] text-[var(--codex-gold)] mb-1">
                  Recherche Doctrinale Immédiate
                </p>
                <p>Tapez un mot-clé conceptuel ou un nom en allemand pour filtrer instantanément les 20 notions.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--codex-ink-tertiary)]">
                Aucun résultat pour « {searchQuery} »
              </div>
            ) : (
              searchResults.map((res) => (
                <div
                  key={res.id}
                  onClick={() => handleSelectAndClose(res.id)}
                  className="cursor-pointer p-3 rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)]/50 hover:border-[var(--codex-gold)] hover:bg-[var(--codex-surface-elevated)] transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[11px] text-[var(--codex-gold)] font-medium">
                      § {res.code}
                    </span>
                    {res.originalTerm && (
                      <span className="font-garamond italic text-xs text-[var(--codex-ink-tertiary)]">
                        {res.originalTerm}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-[var(--codex-ink)]">
                    {res.title}
                  </h4>
                  <p className="text-xs text-[var(--codex-ink-secondary)] line-clamp-2">
                    {res.essence}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
