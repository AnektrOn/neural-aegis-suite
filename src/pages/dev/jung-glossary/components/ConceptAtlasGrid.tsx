import { useState, useMemo } from "react";
import { ArrowUpRight, Search, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DoctrinalChapter, DoctrinalConcept } from "../doctrinalGlossaryTypes";

interface ConceptAtlasGridProps {
  chapters: DoctrinalChapter[];
  allConcepts: DoctrinalConcept[];
  onSelectConcept: (id: string) => void;
}

export default function ConceptAtlasGrid({
  chapters,
  allConcepts,
  onSelectConcept,
}: ConceptAtlasGridProps) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [filterQuery, setFilterQuery] = useState<string>("");

  const filteredConcepts = useMemo(() => {
    return allConcepts.filter((concept) => {
      const matchesChapter =
        selectedChapterId === "all" || concept.chapterId === selectedChapterId;
      if (!matchesChapter) return false;

      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        concept.title.toLowerCase().includes(q) ||
        (concept.originalTerm && concept.originalTerm.toLowerCase().includes(q)) ||
        concept.essence.toLowerCase().includes(q) ||
        concept.code.includes(q)
      );
    });
  }, [allConcepts, selectedChapterId, filterQuery]);

  return (
    <div className="py-6 sm:py-8 space-y-8">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--codex-cardline)] pb-6">
        {/* Chapter Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedChapterId("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-code whitespace-nowrap transition-all ${
              selectedChapterId === "all"
                ? "bg-[var(--codex-gold)] text-[var(--codex-abyss)] font-semibold shadow-sm"
                : "border border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-gold)]"
            }`}
          >
            Tous ({allConcepts.length})
          </button>
          {chapters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChapterId(ch.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono-code whitespace-nowrap transition-all ${
                selectedChapterId === ch.id
                  ? "bg-[var(--codex-gold)] text-[var(--codex-abyss)] font-semibold shadow-sm"
                  : "border border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-[var(--codex-ink-secondary)] hover:border-[var(--codex-gold)]"
              }`}
            >
              {ch.id}. {ch.title.split(" ")[0]} ({ch.concepts.length})
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--codex-ink-tertiary)]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={isFR ? "Filtrer les notions..." : "Filter concepts..."}
            className="w-full rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--codex-ink)] placeholder:text-[var(--codex-ink-tertiary)] focus:outline-none focus:border-[var(--codex-gold)]"
          />
        </div>
      </div>

      {/* Grid of Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConcepts.map((concept) => {
          const quotesCount = concept.blocks.filter((b) => b.type === "quote").length;
          const facetsCount = concept.blocks
            .filter((b) => b.type === "facets")
            .reduce((acc, b) => (b.type === "facets" ? acc + b.items.length : acc), 0);

          return (
            <div
              key={concept.id}
              onClick={() => onSelectConcept(concept.id)}
              className="group relative cursor-pointer flex flex-col justify-between rounded-2xl border border-[var(--codex-cardline)] bg-[var(--codex-surface)] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--codex-gold)] hover:shadow-lg"
            >
              <div>
                {/* Header: code & term */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono-code text-xs text-[var(--codex-gold)] font-medium">
                    § {concept.code}
                  </span>
                  {concept.originalTerm && (
                    <span className="font-garamond italic text-xs text-[var(--codex-ink-secondary)] truncate max-w-[150px]">
                      {concept.originalTerm}
                    </span>
                  )}
                </div>

                {/* Concept Title */}
                <h4 className="font-garamond text-xl sm:text-2xl font-normal text-[var(--codex-ink)] mb-3 group-hover:text-[var(--codex-gold)] transition-colors">
                  {concept.title}
                </h4>

                {/* Essence */}
                <p className="text-xs sm:text-sm text-[var(--codex-ink-secondary)] leading-relaxed line-clamp-4">
                  {concept.essence}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-[var(--codex-cardline)]/60 flex items-center justify-between text-[11px] font-mono-code text-[var(--codex-ink-tertiary)]">
                <div className="flex items-center gap-2">
                  {facetsCount > 0 && <span>{facetsCount} facettes</span>}
                  {quotesCount > 0 && <span>· {quotesCount} citation</span>}
                </div>

                <span className="inline-flex items-center gap-1 text-[var(--codex-gold)] font-medium group-hover:translate-x-0.5 transition-transform">
                  <span>Explorer</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConcepts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--codex-cardline)] p-12 text-center">
          <p className="text-sm text-[var(--codex-ink-secondary)]">
            Aucune notion ne correspond à votre filtre "{filterQuery}".
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterQuery("");
              setSelectedChapterId("all");
            }}
            className="mt-3 text-xs font-mono-code text-[var(--codex-gold)] hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
