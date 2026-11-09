import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Layers, BookOpen, Grid, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DoctrinalFrontmatter } from "../doctrinalGlossaryTypes";

interface GlossaryHeaderProps {
  frontmatter: DoctrinalFrontmatter;
  header: {
    title: string;
    subtitle: string;
    charCount?: string;
    introLead: string;
  };
  totalConcepts: number;
  totalChapters: number;
  viewMode: "codex" | "atlas";
  onViewModeChange: (mode: "codex" | "atlas") => void;
  onOpenSearch: () => void;
  onCustomFileLoaded?: (content: string, filename: string) => void;
}

export default function GlossaryHeader({
  frontmatter,
  header,
  totalConcepts,
  totalChapters,
  viewMode,
  onViewModeChange,
  onOpenSearch,
  onCustomFileLoaded,
}: GlossaryHeaderProps) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [showOntologyModal, setShowOntologyModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && onCustomFileLoaded) {
        onCustomFileLoaded(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="relative border-b border-[var(--codex-cardline)] bg-[var(--codex-bg)]/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* Top Utility Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 text-[var(--codex-ink-secondary)] hover:text-[var(--codex-ink)] hover:bg-[var(--codex-surface)]">
            <Link to="/dev" aria-label={isFR ? "Retour au Dev Lab" : "Back to Dev Lab"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="hidden sm:flex items-center gap-2 font-mono-code text-xs text-[var(--codex-ink-tertiary)]">
            <span>AEGIS DEV</span>
            <span>/</span>
            <span className="text-[var(--codex-ink)] font-medium">DOCTRINE JUNG</span>
          </div>

          {/* Ontological Nesting Badge / Dropdown */}
          {(frontmatter?.poupeesRusses ?? []).length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOntologyModal(!showOntologyModal)}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-[11px] font-mono-code text-[var(--codex-ink-secondary)] hover:border-[var(--codex-gold)] transition-colors"
                title="Poupées russes ontologiques AEGIS"
              >
                <Layers className="h-3 w-3 text-[var(--codex-gold)]" />
                <span className="truncate max-w-[140px] lg:max-w-[190px]">
                  {frontmatter.poupeesRusses[0]}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showOntologyModal && (
                <div className="absolute left-0 mt-2 w-80 rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] font-mono-code uppercase tracking-wider text-[var(--codex-gold)] mb-2">
                    Nidification Ontologique AEGIS
                  </p>
                  <ol className="space-y-2 text-xs">
                    {(frontmatter.poupeesRusses ?? []).map((item, idx) => (
                      <li key={item} className="flex items-center gap-2 text-[var(--codex-ink-secondary)]">
                        <span className="font-mono-code text-[10px] text-[var(--codex-gold)]">
                          0{idx + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3 pt-3 border-t border-[var(--codex-cardline)] flex justify-between text-[10px] font-mono-code text-[var(--codex-ink-tertiary)]">
                    <span>Vecteur : {frontmatter?.vecteur}</span>
                    <span>Stade : {frontmatter?.stade}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center / Right: View Toggle, Search, Custom MD & Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle: Codex vs Atlas */}
          <div className="flex items-center rounded-lg border border-[var(--codex-cardline)] bg-[var(--codex-surface)] p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("codex")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "codex"
                  ? "bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] shadow-sm font-semibold"
                  : "text-[var(--codex-ink-secondary)] hover:text-[var(--codex-ink)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Codex</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("atlas")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "atlas"
                  ? "bg-[var(--codex-surface-elevated)] text-[var(--codex-gold)] shadow-sm font-semibold"
                  : "text-[var(--codex-ink-secondary)] hover:text-[var(--codex-ink)]"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Atlas</span>
            </button>
          </div>

          {/* Search Trigger (⌘K) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-xs text-[var(--codex-ink-secondary)] hover:text-[var(--codex-ink)] hover:border-[var(--codex-cardline-hover)] transition-colors min-h-[36px]"
          >
            <Search className="h-3.5 w-3.5 text-[var(--codex-gold)]" />
            <span className="hidden md:inline">Rechercher...</span>
            <kbd className="hidden md:inline-flex items-center rounded border border-[var(--codex-cardline)] bg-[var(--codex-bg)] px-1.5 py-0.5 font-mono-code text-[10px] text-[var(--codex-ink-tertiary)]">
              ⌘K
            </kbd>
          </button>

          {/* Hidden file input for testing other .md */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".md,.markdown,.txt"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 text-[var(--codex-ink-secondary)] hover:text-[var(--codex-gold)] hover:bg-[var(--codex-surface)]"
            title="Tester un autre fichier markdown doctrinal"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </div>

      {/* Hero Header Presentation */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 border-t border-[var(--codex-cardline)]/60">
        <div className="flex flex-col gap-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--codex-gold)] font-medium">
              {frontmatter.auteur}
            </span>
            <span className="text-[var(--codex-ink-tertiary)]">·</span>
            <span className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--codex-ink-secondary)]">
              {frontmatter.oeuvre}
            </span>
            {header.charCount && (
              <>
                <span className="text-[var(--codex-ink-tertiary)]">·</span>
                <span className="font-mono-code text-[11px] text-[var(--codex-ink-tertiary)]">
                  {header.charCount}
                </span>
              </>
            )}
          </div>

          <h1 className="font-garamond text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[var(--codex-ink)] leading-[1.1]">
            Glossaire Doctrinal & Clinique
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-[var(--codex-ink-secondary)] max-w-3xl">
            {header.introLead}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className="font-mono-code text-[11px] border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-[var(--codex-ink-secondary)]">
              {totalChapters} Piliers
            </Badge>
            <Badge variant="outline" className="font-mono-code text-[11px] border-[var(--codex-cardline)] bg-[var(--codex-surface)] text-[var(--codex-gold)]">
              {totalConcepts} Notions Métapsychologiques
            </Badge>
            <div className="flex items-center gap-1.5 ml-auto">
              {(frontmatter?.domaines ?? []).map((dom) => (
                <span
                  key={dom}
                  className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase border border-[var(--codex-cardline)] text-[var(--codex-ink-tertiary)] bg-[var(--codex-surface)]"
                >
                  {dom}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
