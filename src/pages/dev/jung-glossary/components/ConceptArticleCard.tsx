import React from "react";
import { Link2, Quote, ArrowRight } from "lucide-react";
import type { DoctrinalBlock, DoctrinalConcept } from "../doctrinalGlossaryTypes";
import TypologyCompassWidget from "./TypologyCompassWidget";

interface ConceptArticleCardProps {
  concept: DoctrinalConcept;
  allConcepts: DoctrinalConcept[];
  onSelectConcept?: (id: string) => void;
}

export default function ConceptArticleCard({
  concept,
  allConcepts,
  onSelectConcept,
}: ConceptArticleCardProps) {
  // Find related concept objects
  const relatedConcepts = concept.relatedConceptIds
    .map((id) => allConcepts.find((c) => c.id === id))
    .filter(Boolean) as DoctrinalConcept[];

  const isTypologyWidgetTarget =
    concept.title.toLowerCase().includes("fonction inférieure") ||
    concept.title.toLowerCase().includes("quatre fonctions");

  return (
    <article
      id={concept.id}
      className="relative scroll-mt-24 rounded-2xl border border-[var(--codex-cardline)] bg-[var(--codex-surface)] p-6 sm:p-9 my-8 shadow-sm transition-all hover:border-[var(--codex-cardline-hover)]/40"
    >
      {/* Concept Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--codex-cardline)] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono-code text-xs text-[var(--codex-gold)] font-medium">
              § {concept.code}
            </span>
            {concept.originalTerm && (
              <span className="font-garamond italic text-sm text-[var(--codex-ink-secondary)]">
                — {concept.originalTerm}
              </span>
            )}
          </div>
          <h3 className="font-garamond text-2xl sm:text-3xl lg:text-4xl font-normal text-[var(--codex-ink)] tracking-tight">
            {concept.title}
          </h3>
        </div>

        {/* Anchor link button */}
        <a
          href={`#${concept.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono-code text-[var(--codex-ink-tertiary)] hover:text-[var(--codex-gold)] transition-colors self-start sm:self-auto py-1"
          title="Lien direct vers cette notion"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>#{concept.id}</span>
        </a>
      </div>

      {/* Essence Pill / Summary */}
      {concept.essence && (
        <div className="mb-6 rounded-xl border border-[var(--codex-gold)]/25 bg-[var(--codex-gold-muted)]/30 p-4 sm:p-5">
          <p className="font-mono-code text-[10px] uppercase tracking-wider text-[var(--codex-gold)] font-semibold mb-1">
            Essence Doctrinale
          </p>
          <p className="text-sm sm:text-base leading-relaxed text-[var(--codex-ink)] font-medium">
            {concept.essence}
          </p>
        </div>
      )}

      {/* Blocks Rendering */}
      <div className="space-y-6">
        {concept.blocks.map((block, idx) => (
          <BlockRenderer key={idx} block={block} />
        ))}
      </div>

      {/* Interactive Typology Compass if relevant */}
      {isTypologyWidgetTarget && <TypologyCompassWidget />}

      {/* Related Concepts (Cross-references) */}
      {relatedConcepts.length > 0 && (
        <div className="mt-8 pt-5 border-t border-[var(--codex-cardline)]">
          <p className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--codex-ink-tertiary)] mb-3">
            Résonances & Notions Connexes
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => onSelectConcept?.(rel.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] text-xs text-[var(--codex-ink-secondary)] hover:text-[var(--codex-gold)] hover:border-[var(--codex-gold)] transition-colors"
              >
                <span className="font-mono-code text-[10px] text-[var(--codex-gold)]">
                  {rel.code}
                </span>
                <span>{rel.title}</span>
                <ArrowRight className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function BlockRenderer({ block }: { block: DoctrinalBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-sm sm:text-base leading-relaxed text-[var(--codex-ink-secondary)]">
          <FormattedText text={block.content} />
        </p>
      );

    case "quote":
      return (
        <blockquote className="my-6 rounded-xl border-l-2 border-[var(--codex-gold)] bg-[var(--codex-surface-elevated)]/60 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-[var(--codex-gold)] shrink-0 mt-1 opacity-70" />
            <div>
              <p className="font-garamond italic text-lg sm:text-xl text-[var(--codex-ink)] leading-relaxed">
                « {block.quote} »
              </p>
              {block.source && (
                <p className="mt-2 text-right font-mono-code text-xs text-[var(--codex-gold)]">
                  — {block.source}
                </p>
              )}
            </div>
          </div>
        </blockquote>
      );

    case "facets":
      return (
        <div className="space-y-3.5 my-4">
          {block.items.map((item, fIdx) => (
            <div
              key={fIdx}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 rounded-xl border border-[var(--codex-cardline)]/70 bg-[var(--codex-surface-elevated)]/40 p-4 transition-colors hover:border-[var(--codex-cardline)]"
            >
              <div className="md:col-span-4 flex items-baseline gap-1.5">
                <span className="font-mono-code text-xs font-semibold uppercase tracking-wider text-[var(--codex-gold)]">
                  {item.label}
                </span>
                {item.emphasis && (
                  <span className="font-garamond italic text-xs text-[var(--codex-ink-tertiary)]">
                    (*{item.emphasis}*)
                  </span>
                )}
              </div>
              <div className="md:col-span-8 text-xs sm:text-sm leading-relaxed text-[var(--codex-ink)] whitespace-pre-line">
                <FormattedText text={item.content} />
              </div>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div className="space-y-4 my-4">
          {block.title && (
            <h4 className="font-mono-code text-xs uppercase tracking-wider text-[var(--codex-gold)] font-medium">
              {block.title}
            </h4>
          )}
          <ol className="space-y-3">
            {block.items.map((step) => (
              <li
                key={step.stepNumber}
                className="flex items-start gap-3.5 rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)]/30 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--codex-gold)]/40 bg-[var(--codex-gold-muted)] font-mono-code text-xs font-semibold text-[var(--codex-gold-light)]">
                  0{step.stepNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-[var(--codex-ink)] mb-1">
                    {step.title}
                  </h5>
                  {step.subpoints.map((sub, sIdx) => (
                    <p
                      key={sIdx}
                      className="text-xs sm:text-sm text-[var(--codex-ink-secondary)] leading-relaxed mt-1"
                    >
                      <FormattedText text={sub} />
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case "dyad":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
          {block.items.map((item, dIdx) => (
            <div
              key={dIdx}
              className="rounded-xl border border-[var(--codex-cardline)] bg-[var(--codex-surface-elevated)] p-4 sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-mono-code text-[11px] text-[var(--codex-gold)]">
                    Axe 0{dIdx + 1}
                  </span>
                  <h5 className="text-base font-semibold text-[var(--codex-ink)]">
                    {item.label}
                  </h5>
                  {item.originalTerm && (
                    <span className="font-garamond italic text-xs text-[var(--codex-ink-tertiary)]">
                      (*{item.originalTerm}*)
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[var(--codex-ink-secondary)] leading-relaxed">
                  <FormattedText text={item.description} />
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

/** Simple parser for **bold**, *italic*, and `code` inside blocks */
function FormattedText({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-[var(--codex-ink)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={index} className="font-garamond italic text-[var(--codex-ink)]">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="font-mono-code text-xs px-1.5 py-0.5 rounded bg-[var(--codex-surface-elevated)] border border-[var(--codex-cardline)] text-[var(--codex-gold)]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}
