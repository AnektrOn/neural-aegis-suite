import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  INTRO_V2_CHAPTERS,
  INTRO_V2_END,
  INTRO_V2_ENTRY,
  INTRO_UI,
  pick,
  type IntroV2Chapter,
} from "./introV2Copy";
import type { IntroPhase, IntroState } from "@/features/intro/useIntroMachine";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import { sampleAsteroidNarrative } from "./scenes/asteroid-fall/asteroidNarrative";
import type { IntroAudioPrefs } from "@/features/intro/useIntroAudio";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  INTRO_V2_PAD_BOTTOM,
  INTRO_V2_PAD_TOP,
  INTRO_V2_PAD_X,
  INTRO_V2_TEXT_STAGE,
  introLineTypography,
} from "./introV2Layout";

const EASE = [0.22, 1, 0.36, 1] as const;
const RING_RADIUS = 26;
const LONG_LINE_CHARS = 65;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

type Props = {
  state: IntroState;
  hold: MutableRefObject<HoldState>;
  isFR: boolean;
  isTouch: boolean;
  narrateLineMs: number;
  audioPrefs: IntroAudioPrefs;
  onToggleMusic: () => void;
  onEnter: () => void;
  onNext: () => void;
  onSkipChapter: () => void;
  onSkipIntro: () => void;
  onFinish: () => void;
  onRestart: () => void;
};

function HoldIndicator({ hold }: { hold: MutableRefObject<HoldState> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    let x = hold.current.client.x;
    let y = hold.current.client.y;
    const tick = () => {
      const s = hold.current;
      x += (s.client.x - x) * 0.2;
      y += (s.client.y - y) * 0.2;
      if (wrap.current) {
        wrap.current.style.transform = `translate3d(${x - 32}px, ${y - 32}px, 0) scale(${s.holding ? 1.15 : 1})`;
      }
      const ringFill = Math.max(s.latched, s.progress);
      if (ring.current) ring.current.style.strokeDashoffset = String(RING_LENGTH * (1 - ringFill));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hold]);

  return (
    <div
      ref={wrap}
      className="pointer-events-none fixed left-0 top-0 z-40 h-16 w-16 transition-[scale] duration-300"
      style={{ willChange: "transform" }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="hsl(0 0% 100% / 0.22)" strokeWidth="1" />
        <circle
          ref={ring}
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          stroke="hsl(38 72% 64%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH}
        />
      </svg>
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
    </div>
  );
}

function AudioToggle({
  label,
  on,
  isFR,
  onToggle,
  large = false,
  compact = false,
}: {
  label: string;
  on: boolean;
  isFR: boolean;
  onToggle: () => void;
  large?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`pointer-events-auto flex shrink-0 items-center gap-2 font-display uppercase transition-colors hover:text-white ${
        large
          ? "text-[11px] tracking-[0.26em] text-white/75"
          : compact
            ? "text-[9px] tracking-[0.16em] text-white/55"
            : "text-[10px] tracking-[0.22em] text-white/55"
      }`}
    >
      <span
        className={`relative inline-block h-3.5 w-6 rounded-full border transition-colors duration-300 ${
          on ? "border-[hsl(38_72%_64%)] bg-[hsl(38_72%_64%)]/30" : "border-white/35"
        }`}
      >
        <span
          className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full transition-all duration-300 ${
            on ? "left-[13px] bg-[hsl(38_72%_64%)]" : "left-[2px] bg-white/50"
          }`}
        />
      </span>
      {compact ? <span className="sr-only">{label}</span> : label}
      <span className="sr-only">{pick(on ? INTRO_UI.on : INTRO_UI.off, isFR)}</span>
    </button>
  );
}

function LanguageToggle({ isFR, large = false }: { isFR: boolean; large?: boolean }) {
  const { setLocale } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocale(isFR ? "en" : "fr")}
      className={`pointer-events-auto flex shrink-0 items-center gap-2 font-display uppercase transition-colors hover:text-white ${
        large ? "text-[11px] tracking-[0.26em] text-white/75" : "text-[9px] tracking-[0.16em] text-white/55 sm:text-[10px] sm:tracking-[0.22em]"
      }`}
      aria-label={isFR ? "Switch to English" : "Passer en français"}
    >
      <span className={isFR ? "text-[hsl(38_72%_64%)]" : "text-white/40"}>FR</span>
      <span className="text-white/25">/</span>
      <span className={!isFR ? "text-[hsl(38_72%_64%)]" : "text-white/40"}>EN</span>
    </button>
  );
}

function ChapterTitle({ chapter, isFR }: { chapter: IntroV2Chapter; isFR: boolean }) {
  return (
    <motion.div
      key={`title-${chapter.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className={`absolute inset-0 flex flex-col items-center justify-center overflow-y-auto overscroll-contain ${INTRO_V2_PAD_X} ${INTRO_V2_TEXT_STAGE} text-center`}
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="font-display text-[10px] uppercase tracking-[0.32em] text-[hsl(38_72%_64%)] sm:text-[11px] sm:tracking-[0.4em]"
      >
        {pick(INTRO_UI.chapter, isFR)} {chapter.number}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.3, ease: EASE, delay: 0.2 }}
        className="mt-4 max-w-[18ch] font-cormorant text-[clamp(1.75rem,6vw+0.5rem,3.75rem)] font-light leading-tight text-white drop-shadow-[0_2px_18px_rgba(30,14,0,0.85)] sm:mt-6 sm:max-w-none"
      >
        {pick(chapter.titlePrefix, isFR)}
        <br />
        <em className="font-medium italic">{pick(chapter.titleEmphasis, isFR)}</em>
      </motion.h2>
    </motion.div>
  );
}

function lineClass(text: string) {
  return `max-w-[min(100%,42rem)] font-cormorant font-light text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] ${introLineTypography(text.length > LONG_LINE_CHARS)}`;
}

/** Scene 1: each voiceover line occupies an equal slice of the hold. */
function HoldSyncedLines({
  chapter,
  hold,
  phase,
  isFR,
  isTouch,
}: {
  chapter: IntroV2Chapter;
  hold: MutableRefObject<HoldState>;
  phase: IntroPhase;
  isFR: boolean;
  isTouch: boolean;
}) {
  const [index, setIndex] = useState(-1);
  const [textBackdrop, setTextBackdrop] = useState(0);

  useEffect(() => {
    setIndex(-1);
    setTextBackdrop(0);
  }, [chapter.id]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const mix = holdChapterMix(hold.current, phase);
      const holdLines = chapter.prologueThenHold ? chapter.lines.slice(1) : chapter.lines;
      let lineIdx = -1;
      let backdrop = 0;
      if (chapter.id === "asteroids") {
        const sample = sampleAsteroidNarrative(mix);
        lineIdx = sample.holdLineIndex;
        backdrop = sample.textBackdrop;
      } else {
        lineIdx = mix <= 0 ? -1 : Math.min(holdLines.length - 1, Math.floor(mix * holdLines.length));
        backdrop = mix > 0.35 ? Math.min(0.45, (mix - 0.35) * 0.7) : 0;
      }
      const next = lineIdx < 0 ? -1 : Math.min(holdLines.length - 1, lineIdx);
      setIndex((prev) => (prev === next ? prev : next));
      setTextBackdrop((prev) => (Math.abs(prev - backdrop) < 0.01 ? prev : backdrop));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chapter.id, chapter.lines, chapter.prologueThenHold, hold, phase]);

  if (index < 0) {
    const preHoldLine = chapter.prologueThenHold ? chapter.lines[0] : null;
    return (
      <motion.div
        key={`hint-${chapter.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className={
          preHoldLine
            ? "absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
            : `absolute inset-x-0 bottom-0 z-30 flex flex-col items-center ${INTRO_V2_PAD_X} pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] text-center`
        }
      >
        {preHoldLine ? (
          <p className={`max-w-[min(100%,42rem)] font-cormorant font-light text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] ${introLineTypography(false)}`}>
            {pick(preHoldLine, isFR)}
          </p>
        ) : (
          <p className="font-cormorant text-lg italic text-white/85 sm:text-xl">
            {pick(isTouch ? chapter.hintTouch : chapter.hintPointer, isFR)}
          </p>
        )}
      </motion.div>
    );
  }

  const holdLines = chapter.prologueThenHold ? chapter.lines.slice(1) : chapter.lines;
  const line = holdLines[index];
  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center overflow-y-auto overscroll-contain ${INTRO_V2_PAD_X} ${INTRO_V2_TEXT_STAGE} text-center`}
    >
      {textBackdrop > 0.05 ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.35)_45%,transparent_75%)] transition-opacity duration-1000"
          style={{ opacity: textBackdrop }}
          aria-hidden
        />
      ) : null}
      <AnimatePresence mode="wait">
        <motion.p
          key={`${chapter.id}-hold-${index}`}
          initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(6px)", transition: { duration: 0.9, ease: "easeInOut" } }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className={`relative z-10 ${lineClass(pick(line, isFR))}`}
        >
          {pick(line, isFR)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function NarrativeLines({
  chapter,
  isFR,
  lineMs,
  onNext,
}: {
  chapter: IntroV2Chapter;
  isFR: boolean;
  lineMs: number;
  onNext: () => void;
}) {
  const [index, setIndex] = useState(() => (chapter.linesDuringHold ? chapter.lines.length - 1 : 0));
  const count = chapter.lines.length;
  const line = chapter.lines[index];
  const isLastChapter = chapter.number === INTRO_V2_CHAPTERS.length;
  const isLastLine = index >= count - 1;

  useEffect(() => {
    if (chapter.linesDuringHold || isLastLine) return;
    const id = window.setTimeout(() => setIndex((current) => current + 1), lineMs);
    return () => window.clearTimeout(id);
  }, [chapter.linesDuringHold, index, isLastLine, lineMs]);

  return (
    <motion.div
      key={`lines-${chapter.id}`}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      aria-live="polite"
      className={`absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto overscroll-contain ${INTRO_V2_PAD_X} ${INTRO_V2_TEXT_STAGE} text-center`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={`${chapter.id}-${index}`}
          initial={chapter.linesDuringHold ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.45 } }}
          transition={{ duration: 1.1, ease: EASE }}
          className={lineClass(pick(line, isFR))}
        >
          {pick(line, isFR)}
        </motion.p>
      </AnimatePresence>
      {isLastLine ? (
        <motion.button
          type="button"
          onClick={onNext}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
          className="pointer-events-auto mt-8 rounded-full border border-white/30 px-9 py-4 font-display text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:border-[hsl(38_72%_64%)] hover:bg-[hsl(38_72%_64%)] hover:text-[hsl(222_26%_6%)]"
        >
          {pick(isLastChapter ? INTRO_UI.toEnd : INTRO_UI.nextChapter, isFR)}
        </motion.button>
      ) : null}
    </motion.div>
  );
}

export default function IntroV2Overlay({
  state,
  hold,
  isFR,
  isTouch,
  narrateLineMs,
  audioPrefs,
  onToggleMusic,
  onEnter,
  onNext,
  onSkipChapter,
  onSkipIntro,
  onFinish,
  onRestart,
}: Props) {
  const chapter = INTRO_V2_CHAPTERS[state.chapterIndex];
  const inChapter = state.phase === "chapterTitle" || state.phase === "interact" || state.phase === "narrate";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none text-white">
      <header
        className={`pointer-events-auto absolute inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 ${INTRO_V2_PAD_X} ${INTRO_V2_PAD_TOP} pb-2 sm:gap-x-4 sm:pb-5`}
      >
        <span className="font-display text-[9px] uppercase tracking-[0.28em] text-white/55 sm:text-[10px] sm:tracking-[0.34em]">
          Aegis
        </span>
        <div className="flex max-w-[min(100%,22rem)] flex-wrap items-center justify-end gap-2 sm:max-w-none sm:gap-5 md:gap-7">
          <LanguageToggle isFR={isFR} />
          {state.phase !== "entry" ? (
            <AudioToggle
              compact={isTouch}
              label={pick(INTRO_UI.soundtrack, isFR)}
              on={audioPrefs.music}
              isFR={isFR}
              onToggle={onToggleMusic}
            />
          ) : null}
          {state.phase !== "end" ? (
            <button
              type="button"
              onClick={onSkipIntro}
              className="shrink-0 font-display text-[9px] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white sm:text-[10px] sm:tracking-[0.26em]"
            >
              {pick(INTRO_UI.skipIntro, isFR)}
            </button>
          ) : null}
        </div>
      </header>

      {inChapter ? (
        <nav
          aria-label={isFR ? "Chapitres" : "Chapters"}
          className={`pointer-events-none absolute inset-x-0 top-[max(3.25rem,calc(env(safe-area-inset-top,0px)+2.75rem))] z-40 flex justify-center gap-2 md:hidden ${INTRO_V2_PAD_X}`}
        >
          {INTRO_V2_CHAPTERS.map((c, i) => (
            <span
              key={c.id}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === state.chapterIndex
                  ? "w-6 bg-[hsl(38_72%_64%)]"
                  : i < state.chapterIndex
                    ? "w-2 bg-white/45"
                    : "w-2 bg-white/20"
              }`}
            />
          ))}
        </nav>
      ) : null}

      {inChapter ? (
        <nav
          aria-label={isFR ? "Chapitres" : "Chapters"}
          className="absolute left-[max(1.5rem,env(safe-area-inset-left,0px))] top-1/2 hidden -translate-y-1/2 flex-col gap-4 md:flex"
        >
          {INTRO_V2_CHAPTERS.map((c, i) => {
            const active = i === state.chapterIndex;
            return (
              <div key={c.id} className="flex items-center gap-3">
                <span
                  className={`font-display text-[11px] tabular-nums transition-colors duration-500 ${
                    active ? "text-[hsl(38_72%_64%)]" : i < state.chapterIndex ? "text-white/50" : "text-white/25"
                  }`}
                >
                  {c.number}
                </span>
                <span
                  className={`h-px transition-all duration-700 ${active ? "w-8 bg-[hsl(38_72%_64%)]" : "w-3 bg-white/25"}`}
                />
                <span
                  className={`font-cormorant text-base italic transition-opacity duration-500 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {pick(c.shortTitle, isFR)}
                </span>
              </div>
            );
          })}
        </nav>
      ) : null}

      <AnimatePresence mode="wait">
        {state.phase === "entry" ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className={`absolute inset-0 flex flex-col items-center justify-center overflow-y-auto overscroll-contain ${INTRO_V2_PAD_X} ${INTRO_V2_TEXT_STAGE} text-center`}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="font-display text-[10px] uppercase tracking-[0.32em] text-[hsl(38_72%_64%)] sm:tracking-[0.4em]"
            >
              {pick(INTRO_V2_ENTRY.eyebrow, isFR)}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
              className="mt-8 font-cormorant font-light leading-[0.95] text-white"
            >
              <span className="block text-2xl italic text-white/70 sm:text-3xl">{pick(INTRO_V2_ENTRY.titleSmall, isFR)}</span>
              <span className="mt-2 block text-[clamp(2.5rem,12vw,6rem)] leading-none sm:text-7xl md:text-8xl">
                {pick(INTRO_V2_ENTRY.title, isFR)}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.1 }}
              className="mt-8 max-w-md font-body text-sm leading-relaxed text-white/60 sm:text-base"
            >
              {pick(INTRO_V2_ENTRY.tagline, isFR)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-8"
            >
              <LanguageToggle large isFR={isFR} />
              <AudioToggle large label={pick(INTRO_UI.soundtrack, isFR)} on={audioPrefs.music} isFR={isFR} onToggle={onToggleMusic} />
            </motion.div>
            <motion.button
              type="button"
              onClick={onEnter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.7 }}
              className="pointer-events-auto group mt-10 min-h-11 rounded-full border border-white/30 px-8 py-3.5 font-display text-[10px] uppercase tracking-[0.26em] text-white transition-colors duration-500 hover:border-[hsl(38_72%_64%)] hover:bg-[hsl(38_72%_64%)] hover:text-[hsl(222_26%_6%)] sm:px-9 sm:py-4 sm:text-[11px] sm:tracking-[0.3em]"
            >
              {pick(INTRO_V2_ENTRY.cta, isFR)}
            </motion.button>
          </motion.div>
        ) : null}

        {state.phase === "chapterTitle" && chapter ? <ChapterTitle key={`t-${chapter.id}`} chapter={chapter} isFR={isFR} /> : null}

        {state.phase === "interact" && chapter?.linesDuringHold ? (
          <HoldSyncedLines
            key={`hold-sync-${chapter.id}`}
            chapter={chapter}
            hold={hold}
            phase={state.phase}
            isFR={isFR}
            isTouch={isTouch}
          />
        ) : null}

        {state.phase === "interact" && chapter && !chapter.linesDuringHold ? (
          <motion.div
            key={`hint-${chapter.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className={`absolute inset-x-0 bottom-0 flex flex-col items-center ${INTRO_V2_PAD_X} pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] text-center`}
          >
            <p className="max-w-[min(100%,28rem)] font-cormorant text-base italic leading-relaxed text-white/85 sm:text-xl">
              {pick(isTouch ? chapter.hintTouch : chapter.hintPointer, isFR)}
            </p>
          </motion.div>
        ) : null}

        {state.phase === "narrate" && chapter && chapter.skipPostHoldNarrate ? (
          <motion.div
            key={`post-${chapter.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute inset-0 flex flex-col items-center justify-center ${INTRO_V2_PAD_X} ${INTRO_V2_PAD_BOTTOM} text-center`}
          >
            <motion.button
              type="button"
              onClick={onNext}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="pointer-events-auto min-h-11 rounded-full border border-white/30 px-8 py-3.5 font-display text-[10px] uppercase tracking-[0.26em] text-white transition-colors duration-500 hover:border-[hsl(38_72%_64%)] hover:bg-[hsl(38_72%_64%)] hover:text-[hsl(222_26%_6%)] sm:px-9 sm:py-4 sm:text-[11px] sm:tracking-[0.3em]"
            >
              {pick(chapter.number === INTRO_V2_CHAPTERS.length ? INTRO_UI.toEnd : INTRO_UI.nextChapter, isFR)}
            </motion.button>
          </motion.div>
        ) : null}

        {state.phase === "narrate" && chapter && !chapter.skipPostHoldNarrate ? (
          <NarrativeLines key={`n-${chapter.id}`} chapter={chapter} isFR={isFR} lineMs={narrateLineMs} onNext={onNext} />
        ) : null}

        {state.phase === "end" ? (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className={`absolute inset-0 flex flex-col items-center justify-center overflow-y-auto overscroll-contain ${INTRO_V2_PAD_X} ${INTRO_V2_TEXT_STAGE} text-center`}
          >
            <p className="font-display text-[10px] uppercase tracking-[0.32em] text-[hsl(38_72%_64%)] sm:tracking-[0.4em]">
              {pick(INTRO_V2_END.eyebrow, isFR)}
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
              className="mt-5 max-w-[min(100%,48rem)] font-cormorant text-[clamp(1.5rem,5vw+0.5rem,3rem)] font-light leading-tight sm:mt-7 sm:text-5xl"
            >
              {pick(INTRO_V2_END.title, isFR)} <em className="italic">{pick(INTRO_V2_END.titleEmphasis, isFR)}</em>
            </motion.h2>
            {pick(INTRO_V2_END.body, isFR) ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.1 }}
                className="mt-6 max-w-md font-body text-sm text-white/60 sm:text-base"
              >
                {pick(INTRO_V2_END.body, isFR)}
              </motion.p>
            ) : null}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.6 }}
              className="pointer-events-auto mt-10 flex flex-col items-center gap-5"
            >
              <button
                type="button"
                onClick={onFinish}
                className="min-h-11 rounded-full bg-[hsl(38_72%_64%)] px-9 py-3.5 font-display text-[10px] uppercase tracking-[0.26em] text-[hsl(222_26%_6%)] transition-colors hover:bg-[hsl(38_72%_72%)] sm:px-10 sm:py-4 sm:text-[11px] sm:tracking-[0.3em]"
              >
                {pick(INTRO_V2_END.cta, isFR)}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="font-display text-[10px] uppercase tracking-[0.26em] text-white/50 transition-colors hover:text-white"
              >
                {pick(INTRO_V2_END.restart, isFR)}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {inChapter ? (
        <div
          className={`pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] sm:right-8`}
        >
          <button
            type="button"
            onClick={onSkipChapter}
            className="min-h-10 font-display text-[9px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white sm:text-[10px] sm:tracking-[0.26em]"
          >
            {pick(INTRO_UI.skipChapter, isFR)}
          </button>
        </div>
      ) : null}

      {state.phase === "interact" && !isTouch ? <HoldIndicator hold={hold} /> : null}
    </div>
  );
}
