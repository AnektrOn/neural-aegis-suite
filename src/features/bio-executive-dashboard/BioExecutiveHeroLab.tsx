import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardPaste,
  Copy,
  Layers,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HERO_LAB_CONFIG,
  formatHeroLabConfigForCopy,
  importHeroLabConfigFromJson,
  HERO_BREAKPOINT_LABELS,
  HERO_BREAKPOINT_ORDER,
  HERO_ELEMENT_LABELS,
  HERO_FONT_PRESETS,
  HERO_HOTSPOT_ELEMENT_IDS,
  HERO_LAB_ELEMENT_GROUPS,
  HERO_TEXT_ELEMENT_IDS,
  loadHeroLabEditorOpen,
  saveHeroLabEditorOpen,
  type HeroBreakpointKey,
  type HeroElementId,
  type HeroElementLayout,
  type HeroFontPreset,
  type HeroLabConfig,
  type HeroLabViewportDisplay,
  type HeroSilhouetteOverlay,
  type HeroTextAlign,
} from "./bioExecutiveHeroLabConfig";
import { patchElement, patchOverlay, patchSilhouette, type DragTarget } from "./bioExecutiveHeroLabDrag";
import { LabSection, LabSegmented, LabSelect, LabSlider, LabToggle } from "./heroLabEditorUi";

type BioExecutiveHeroLabProps = {
  config: HeroLabConfig;
  editBreakpoint: HeroBreakpointKey;
  /** Breakpoint slice bound to the canvas (preview WYSIWYG). */
  activeConfigKey: HeroBreakpointKey;
  onEditBreakpoint: (key: HeroBreakpointKey) => void;
  viewportDisplay: HeroLabViewportDisplay;
  onViewportDisplay: (display: HeroLabViewportDisplay) => void;
  onConfigChange: (config: HeroLabConfig) => void;
  selectedTarget: DragTarget;
  onSelectedTarget: (target: DragTarget) => void;
  onEditorOpenChange?: (open: boolean) => void;
};

export function BioExecutiveHeroLab({
  config,
  editBreakpoint,
  activeConfigKey,
  onEditBreakpoint,
  viewportDisplay,
  onViewportDisplay,
  onConfigChange,
  selectedTarget,
  onSelectedTarget,
  onEditorOpenChange,
}: BioExecutiveHeroLabProps) {
  const [editorOpen, setEditorOpen] = useState(loadHeroLabEditorOpen);
  const [copyLabel, setCopyLabel] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteDraft, setPasteDraft] = useState("");
  const slice = config[activeConfigKey];

  const setEditorOpenPersist = useCallback(
    (open: boolean) => {
      setEditorOpen(open);
      saveHeroLabEditorOpen(open);
      onEditorOpenChange?.(open);
    },
    [onEditorOpenChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setEditorOpenPersist(!editorOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen, setEditorOpenPersist]);

  const setSlice = (next: typeof slice) => {
    onConfigChange({ ...config, [activeConfigKey]: next });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel(label);
      window.setTimeout(() => setCopyLabel(null), 2000);
    } catch {
      setCopyLabel("Erreur copie");
    }
  };

  const applyImportedJson = useCallback(
    (text: string) => {
      const result = importHeroLabConfigFromJson(config, text, activeConfigKey);
      if (result.ok === false) {
        setImportFeedback({ kind: "err", text: result.error });
        window.setTimeout(() => setImportFeedback(null), 4000);
        return false;
      }
      onConfigChange(result.config);
      const focusKey =
        result.applied.find((k) => k === "mobilePortrait") ??
        result.applied.find((k) => k === activeConfigKey) ??
        result.applied[0];
      if (focusKey) {
        onEditBreakpoint(focusKey);
        if (focusKey === "desktop") {
          onViewportDisplay("desktop");
        } else {
          onViewportDisplay("auto");
        }
      }
      const labels = result.applied.map((k) => HERO_BREAKPOINT_LABELS[k]).join(" · ");
      setImportFeedback({ kind: "ok", text: `Importé · ${labels}` });
      setPasteModalOpen(false);
      setPasteDraft("");
      window.setTimeout(() => setImportFeedback(null), 3500);
      return true;
    },
    [activeConfigKey, config, onConfigChange, onEditBreakpoint, onViewportDisplay],
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!applyImportedJson(text)) {
        setPasteDraft(text);
        setPasteModalOpen(true);
      }
    } catch {
      setPasteDraft("");
      setPasteModalOpen(true);
    }
  };

  const sil = slice.silhouette;
  const isTextTarget = selectedTarget !== "silhouette" && selectedTarget !== "overlay";
  const hasTypography = isTextTarget && HERO_TEXT_ELEMENT_IDS.includes(selectedTarget);
  const isHotspotTarget =
    isTextTarget && HERO_HOTSPOT_ELEMENT_IDS.includes(selectedTarget as HeroElementId);
  const isSideRailTarget = isTextTarget && selectedTarget === "sideRail";
  const [headerSlot, setHeaderSlot] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setHeaderSlot(document.querySelector("[data-hero-builder-slot]"));
  }, []);

  const builderToggle = (
    <button
      type="button"
      onClick={() => setEditorOpenPersist(true)}
      title="Afficher l'éditeur hero (⌘⇧H)"
      className="relative z-30 flex items-center gap-2 rounded-full border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/95 px-3 py-2 aegis-bio-exec-lab__type-label font-semibold shadow-lg backdrop-blur-md transition-all"
    >
      <PanelRightOpen size={16} />
      <Sparkles size={14} className="aegis-bio-exec-lab__accent-text" />
      Hero Builder
    </button>
  );

  return (
    <>
      {headerSlot && !editorOpen ? createPortal(builderToggle, headerSlot) : !editorOpen ? builderToggle : null}

      {editorOpen ? (
        <aside
          className="aegis-hero-builder fixed right-0 top-0 z-[91] flex h-[100dvh] w-[min(100vw,380px)] flex-col border-l border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/98 text-[color:var(--bio-ink)] shadow-2xl backdrop-blur-xl"
          aria-label="Hero Builder"
        >
          <header className="shrink-0 border-b border-[color:var(--bio-frame-border)] px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Layers size={16} className="aegis-bio-exec-lab__accent-text shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight">Hero Builder</p>
                  <p className="text-[10px] opacity-60">Glisser · typo · overlay progressif</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpenPersist(false)}
                title="Masquer l'éditeur (⌘⇧H)"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1.5 text-[10px] font-semibold hover:bg-[color:var(--bio-chip)]"
              >
                <PanelRightClose size={14} />
                Masquer
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {HERO_BREAKPOINT_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onEditBreakpoint(key)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[9px] font-medium border transition-colors",
                    editBreakpoint === key
                      ? "aegis-bio-exec-lab__chip-active border-transparent"
                      : "border-[color:var(--bio-frame-border)] opacity-75 hover:opacity-100",
                  )}
                >
                  {HERO_BREAKPOINT_LABELS[key].replace("Tablette ", "Tab. ").replace("Mobile ", "Mob. ")}
                </button>
              ))}
            </div>
            <div className="mt-2.5">
              <LabSegmented
                label="Aperçu canvas"
                value={viewportDisplay}
                onChange={onViewportDisplay}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "mobile", label: "Mobile" },
                  { value: "tablet", label: "Tab." },
                  { value: "desktop", label: "Desktop" },
                ]}
              />
              <p className="mt-1.5 text-[9px] leading-snug opacity-55">
                Cadre : {HERO_BREAKPOINT_LABELS[activeConfigKey]}
                {viewportDisplay === "auto" ? " · suit l’onglet breakpoint" : null}
              </p>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <nav className="w-[38%] shrink-0 overflow-y-auto border-r border-[color:var(--bio-frame-border)] py-2">
              {HERO_LAB_ELEMENT_GROUPS.map((group) => (
                <div key={group.label} className="mb-2 px-2">
                  <p className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] opacity-45">{group.label}</p>
                  <ul className="space-y-0.5">
                    {group.targets.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onSelectedTarget(id)}
                          className={cn(
                            "w-full rounded-lg px-2 py-1.5 text-left text-[10px] leading-snug transition-colors",
                            selectedTarget === id
                              ? "aegis-bio-exec-lab__chip-active font-medium"
                              : "hover:bg-[color:var(--bio-chip)] opacity-85",
                          )}
                        >
                          {id === "silhouette" ? "Silhouette" : id === "overlay" ? "Overlay blur" : HERO_ELEMENT_LABELS[id]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {selectedTarget === "silhouette" ? (
                <LabSection title="Silhouette">
                  <LabSlider label="Largeur" value={sil.widthPct} min={20} max={130} onChange={(widthPct) => setSlice(patchSilhouette(slice, { widthPct }))} />
                  <LabSlider label="Position X" value={sil.leftPct} min={0} max={100} onChange={(leftPct) => setSlice(patchSilhouette(slice, { leftPct }))} />
                  <LabSlider label="Bas" value={sil.bottomPct} min={-35} max={55} onChange={(bottomPct) => setSlice(patchSilhouette(slice, { bottomPct }))} />
                </LabSection>
              ) : selectedTarget === "overlay" ? (
                <OverlayEditor overlay={slice.overlay} onChange={(partial) => setSlice(patchOverlay(slice, partial))} />
              ) : (
                <>
                  <LabSection title="Position">
                    <ElementLayoutEditor
                      element={slice.elements[selectedTarget]}
                      onChange={(partial) => setSlice(patchElement(slice, selectedTarget, partial))}
                    />
                  </LabSection>
                  {isHotspotTarget ? (
                    <LabSection title="Hotspot">
                      <LabSlider
                        label="Taille"
                        value={slice.elements[selectedTarget as HeroElementId].hotspotSizePx ?? 44}
                        min={24}
                        max={96}
                        step={1}
                        suffix="px"
                        onChange={(hotspotSizePx) =>
                          setSlice(patchElement(slice, selectedTarget, { hotspotSizePx }))
                        }
                      />
                    </LabSection>
                  ) : null}
                  {isSideRailTarget ? (
                    <LabSection title="Rail icônes">
                      <LabSlider
                        label="Taille boutons"
                        value={slice.elements.sideRail.railSizePx ?? 44}
                        min={28}
                        max={72}
                        step={1}
                        suffix="px"
                        onChange={(railSizePx) => setSlice(patchElement(slice, "sideRail", { railSizePx }))}
                      />
                    </LabSection>
                  ) : null}
                  {hasTypography ? (
                    <LabSection title="Typographie">
                      <TypographyEditor
                        element={slice.elements[selectedTarget]}
                        onChange={(partial) =>
                          setSlice(
                            patchElement(slice, selectedTarget, {
                              typography: { ...slice.elements[selectedTarget].typography, ...partial },
                            }),
                          )
                        }
                        onLayoutChange={(partial) => setSlice(patchElement(slice, selectedTarget, partial))}
                      />
                    </LabSection>
                  ) : null}
                  <LabSection title="Visibilité" defaultOpen={false}>
                    <LabToggle
                      label="Masquer cet élément"
                      checked={slice.elements[selectedTarget].typography.hidden}
                      onChange={(hidden) =>
                        setSlice(
                          patchElement(slice, selectedTarget, {
                            typography: { ...slice.elements[selectedTarget].typography, hidden },
                          }),
                        )
                      }
                    />
                  </LabSection>
                </>
              )}
            </div>
          </div>

          <footer className="shrink-0 space-y-2 border-t border-[color:var(--bio-frame-border)] p-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => copy(formatHeroLabConfigForCopy(config), "JSON complet")}
                className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
              >
                <Copy size={11} /> JSON complet
              </button>
              <button
                type="button"
                onClick={() => copy(formatHeroLabConfigForCopy(config, activeConfigKey), "JSON breakpoint")}
                className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
              >
                <Copy size={11} /> Breakpoint
              </button>
              <button
                type="button"
                onClick={() => void pasteFromClipboard()}
                title="Coller depuis le presse-papiers (JSON breakpoint ou complet)"
                className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-accent)]/40 bg-[color:var(--bio-chip)]/50 px-2 py-1 text-[10px] font-semibold hover:bg-[color:var(--bio-chip)]"
              >
                <ClipboardPaste size={11} /> Coller JSON
              </button>
              <button
                type="button"
                onClick={() =>
                  onConfigChange({
                    ...config,
                    [activeConfigKey]: structuredClone(DEFAULT_HERO_LAB_CONFIG[activeConfigKey]),
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            {copyLabel ? <p className="text-[10px] aegis-bio-exec-lab__accent-text">Copié · {copyLabel}</p> : null}
            {importFeedback ? (
              <p
                className={cn(
                  "text-[10px]",
                  importFeedback.kind === "ok" ? "aegis-bio-exec-lab__accent-text" : "text-red-600 dark:text-red-400",
                )}
              >
                {importFeedback.text}
              </p>
            ) : null}
          </footer>
        </aside>
      ) : null}

      {pasteModalOpen ? (
        <div
          className="fixed inset-0 z-[92] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-label="Coller JSON Hero"
          onClick={() => setPasteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold">Coller JSON</p>
            <p className="mt-1 text-[10px] opacity-65">
              Format « Breakpoint », complet, ou slice seul → appliqué à{" "}
              {HERO_BREAKPOINT_LABELS[activeConfigKey]}.
            </p>
            <textarea
              value={pasteDraft}
              onChange={(e) => setPasteDraft(e.target.value)}
              rows={10}
              spellCheck={false}
              className="mt-2 w-full rounded-lg border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)]/30 p-2 font-mono text-[10px] leading-snug"
              placeholder='{ "mobilePortrait": { ... } }'
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="rounded-lg border border-[color:var(--bio-frame-border)] px-3 py-1.5 text-[10px] font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => applyImportedJson(pasteDraft)}
                className="rounded-lg bg-[color:var(--bio-accent)] px-3 py-1.5 text-[10px] font-semibold text-[color:var(--accent-ink)]"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ElementLayoutEditor({
  element,
  onChange,
}: {
  element: HeroElementLayout;
  onChange: (partial: Partial<HeroElementLayout>) => void;
}) {
  return (
    <>
      {element.leftPct != null ? (
        <LabSlider label="Gauche" value={element.leftPct} min={0} max={100} onChange={(leftPct) => onChange({ leftPct })} />
      ) : null}
      {element.rightPct != null ? (
        <LabSlider label="Droite" value={element.rightPct} min={0} max={100} onChange={(rightPct) => onChange({ rightPct })} />
      ) : null}
      {element.topPct != null ? (
        <LabSlider label="Haut" value={element.topPct} min={0} max={100} onChange={(topPct) => onChange({ topPct })} />
      ) : null}
      {element.bottomPct != null ? (
        <LabSlider label="Bas" value={element.bottomPct} min={0} max={100} onChange={(bottomPct) => onChange({ bottomPct })} />
      ) : null}
      <LabSegmented
        label="Alignement"
        value={element.textAlign}
        options={[
          { value: "left", label: "Gauche" },
          { value: "center", label: "Centre" },
          { value: "right", label: "Droite" },
        ]}
        onChange={(textAlign) => onChange({ textAlign: textAlign as HeroTextAlign })}
      />
    </>
  );
}

function TypographyEditor({
  element,
  onChange,
  onLayoutChange,
}: {
  element: HeroElementLayout;
  onChange: (partial: Partial<HeroElementLayout["typography"]>) => void;
  onLayoutChange: (partial: Partial<HeroElementLayout>) => void;
}) {
  const t = element.typography;
  return (
    <>
      <LabSelect
        label="Police"
        value={t.fontPreset}
        options={HERO_FONT_PRESETS}
        onChange={(fontPreset) => onChange({ fontPreset: fontPreset as HeroFontPreset })}
      />
      <LabSlider label="Taille" value={t.fontSizePx} min={8} max={72} step={1} suffix="px" onChange={(fontSizePx) => onChange({ fontSizePx })} />
      <LabSelect
        label="Graisse"
        value={String(t.fontWeight)}
        options={[
          { value: "300", label: "Light 300" },
          { value: "400", label: "Regular 400" },
          { value: "500", label: "Medium 500" },
          { value: "600", label: "Semibold 600" },
          { value: "700", label: "Bold 700" },
        ]}
        onChange={(v) => onChange({ fontWeight: Number(v) as HeroElementLayout["typography"]["fontWeight"] })}
      />
      <LabSlider label="Interligne" value={t.lineHeight} min={0.8} max={2.2} step={0.05} suffix="×" onChange={(lineHeight) => onChange({ lineHeight })} />
      <LabSlider label="Tracking" value={t.letterSpacingEm} min={-0.05} max={0.35} step={0.01} suffix="em" onChange={(letterSpacingEm) => onChange({ letterSpacingEm })} />
      <LabSlider label="Opacité texte" value={t.opacityPct} min={0} max={100} step={1} suffix="%" onChange={(opacityPct) => onChange({ opacityPct })} />
      <LabSlider label="Largeur max" value={t.maxWidthPct} min={0} max={100} step={1} suffix="%" onChange={(maxWidthPct) => onChange({ maxWidthPct })} />
      <LabToggle label="Majuscules" checked={t.uppercase} onChange={(uppercase) => onChange({ uppercase })} />
      <LabToggle label="Italique" checked={t.italic} onChange={(italic) => onChange({ italic })} />
      <LabSegmented
        label="Alignement bloc"
        value={element.textAlign}
        options={[
          { value: "left", label: "Gauche" },
          { value: "center", label: "Centre" },
          { value: "right", label: "Droite" },
        ]}
        onChange={(textAlign) => onLayoutChange({ textAlign: textAlign as HeroTextAlign })}
      />
    </>
  );
}

function OverlayEditor({
  overlay,
  onChange,
}: {
  overlay: HeroSilhouetteOverlay;
  onChange: (partial: Partial<HeroSilhouetteOverlay>) => void;
}) {
  return (
    <>
      <LabSection title="Overlay">
        <LabToggle label="Activer" checked={overlay.enabled} onChange={(enabled) => onChange({ enabled })} />
        <LabToggle
          label="Pleine largeur panneau (bords inclus)"
          checked={overlay.columnFullWidth}
          onChange={(columnFullWidth) => onChange({ columnFullWidth })}
        />
        <LabSegmented
          label="Mode blur"
          value={overlay.blurMode}
          options={[
            { value: "gradual", label: "Progressif" },
            { value: "uniform", label: "Uniforme" },
          ]}
          onChange={(blurMode) => onChange({ blurMode: blurMode as HeroSilhouetteOverlay["blurMode"] })}
        />
      </LabSection>
      <LabSection title="Boîte">
        {overlay.columnFullWidth ? (
          <p className="mb-2 text-[10px] leading-snug opacity-60">
            Plein panneau : largeur = toute la colonne hero (bord à bord). Haut / hauteur = % du panneau. Gauche / largeur ignorés.
          </p>
        ) : null}
        {!overlay.columnFullWidth ? (
          <>
            <LabSlider label="Gauche" value={overlay.leftPct} min={0} max={100} onChange={(leftPct) => onChange({ leftPct })} />
            <LabSlider label="Largeur" value={overlay.widthPct} min={5} max={100} onChange={(widthPct) => onChange({ widthPct })} />
          </>
        ) : null}
        <LabSlider label="Haut" value={overlay.topPct} min={0} max={100} onChange={(topPct) => onChange({ topPct })} />
        <LabSlider label="Hauteur" value={overlay.heightPct} min={5} max={100} onChange={(heightPct) => onChange({ heightPct })} />
        <LabSlider label="Coins (rem)" value={overlay.radiusRem} min={0} max={3} step={0.125} suffix="rem" onChange={(radiusRem) => onChange({ radiusRem })} />
      </LabSection>
      <LabSection title="Blur & dégradé">
        {overlay.blurMode === "gradual" ? (
          <>
            <LabSelect
              label="Direction (crescendo)"
              value={overlay.gradualDirection}
              options={[
                { value: "top", label: "Blur max en haut" },
                { value: "bottom", label: "Blur max en bas" },
                { value: "left", label: "Blur max à gauche" },
                { value: "right", label: "Blur max à droite" },
              ]}
              onChange={(gradualDirection) =>
                onChange({ gradualDirection: gradualDirection as HeroSilhouetteOverlay["gradualDirection"] })
              }
            />
            <LabSlider label="Blur min" value={overlay.blurMinPx} min={0} max={48} step={1} suffix="px" onChange={(blurMinPx) => onChange({ blurMinPx })} />
            <LabSlider label="Blur max" value={overlay.blurMaxPx} min={0} max={48} step={1} suffix="px" onChange={(blurMaxPx) => onChange({ blurMaxPx })} />
            <LabSlider label="Opacité min" value={overlay.opacityMinPct} min={0} max={100} step={1} suffix="%" onChange={(opacityMinPct) => onChange({ opacityMinPct })} />
            <LabSlider label="Opacité max" value={overlay.opacityMaxPct} min={0} max={100} step={1} suffix="%" onChange={(opacityMaxPct) => onChange({ opacityMaxPct })} />
            <LabSlider label="Couches" value={overlay.gradualLayers} min={6} max={24} step={1} suffix="#" onChange={(gradualLayers) => onChange({ gradualLayers })} />
          </>
        ) : (
          <>
            <LabSlider label="Blur" value={overlay.blurMaxPx} min={0} max={48} step={1} suffix="px" onChange={(blurMaxPx) => onChange({ blurMaxPx })} />
            <LabSlider label="Opacité" value={overlay.opacityMaxPct} min={0} max={100} step={1} suffix="%" onChange={(opacityMaxPct) => onChange({ opacityMaxPct })} />
          </>
        )}
        <LabSelect
          label="Teinte"
          value={overlay.tint}
          options={[
            { value: "frame", label: "Frame (bio)" },
            { value: "dark", label: "Sombre" },
            { value: "light", label: "Claire" },
            { value: "none", label: "Transparente" },
          ]}
          onChange={(tint) => onChange({ tint: tint as HeroSilhouetteOverlay["tint"] })}
        />
      </LabSection>
    </>
  );
}
