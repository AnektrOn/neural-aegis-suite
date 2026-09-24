import { useEffect, useRef, type MutableRefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { INTRO_CHAPTERS, INTRO_END, INTRO_ENTRY, INTRO_UI, pick, type IntroChapter } from "./intro.copy";
import type { IntroState } from "./useIntroMachine";
import type { HoldState } from "./useHoldProgress";

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
      if (ring.current) ring.current.style.strokeDashoffset = String(RING_LENGTH * (1 - s.progress));
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

function ChapterTitle({ chapter, isFR }: { chapter: IntroChapter; isFR: boolean }) {
  return (
    <motion.div
      key={`title-${chapter.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="font-display text-[11px] uppercase tracking-[0.4em] text-[hsl(38_72%_64%)]"
      >
        {pick(INTRO_UI.chapter, isFR)} {chapter.number}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.3, ease: EASE, delay: 0.2 }}
        className="mt-6 font-cormorant text-4xl font-light leading-tight text-white drop-shadow-[0_2px_18px_rgba(30,14,0,0.85)] sm:text-6xl"
      >
        {pick(chapter.titlePrefix, isFR)}
        <br />
        <em className="font-medium italic">{pick(chapter.titleEmphasis, isFR)}</em>
      </motion.h2>
    </motion.div>
  );
}

function NarrativeLines({
  chapter,
  isFR,
  lineMs,
  onNext,
}: {
  chapter: IntroChapter;
  isFR: boolean;
  lineMs: number;
  onNext: () => void;
}) {
  const isLast = chapter.number === INTRO_CHAPTERS.length;
  return (
    <motion.div
      key={`lines-${chapter.id}`}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      aria-live="polite"
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
    >
      {chapter.lines.map((line, i) => (
        <motion.p
          key={line.en}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: EASE, delay: (i * lineMs) / 1000 }}
          className={`max-w-2xl font-cormorant font-light leading-snug text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] ${
            pick(line, isFR).length > LONG_LINE_CHARS ? "text-xl sm:text-3xl" : "text-2xl sm:text-4xl"
          }`}
        >
          {pick(line, isFR)}
        </motion.p>
      ))}
      <motion.button
        type="button"
        onClick={onNext}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: (chapter.lines.length * lineMs) / 1000 }}
        className="pointer-events-auto mt-8 rounded-full border border-white/30 px-9 py-4 font-display text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:border-[hsl(38_72%_64%)] hover:bg-[hsl(38_72%_64%)] hover:text-[hsl(222_26%_6%)]"
      >
        {pick(isLast ? INTRO_UI.toEnd : INTRO_UI.nextChapter, isFR)}
      </motion.button>
    </motion.div>
  );
}

export default function IntroOverlay({
  state,
  hold,
  isFR,
  isTouch,
  narrateLineMs,
  onEnter,
  onNext,
  onSkipChapter,
  onSkipIntro,
  onFinish,
  onRestart,
}: Props) {
  const chapter = INTRO_CHAPTERS[state.chapterIndex];
  const inChapter = state.phase === "chapterTitle" || state.phase === "interact" || state.phase === "narrate";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none text-white">
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="font-display text-[10px] uppercase tracking-[0.34em] text-white/55">Aegis</span>
        {state.phase !== "end" ? (
          <button
            type="button"
            onClick={onSkipIntro}
            className="font-display text-[10px] uppercase tracking-[0.26em] text-white/55 transition-colors hover:text-white"
          >
            {pick(INTRO_UI.skipIntro, isFR)}
          </button>
        ) : null}
      </header>

      {inChapter ? (
        <nav
          aria-label={isFR ? "Chapitres" : "Chapters"}
          className="absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-4 md:flex"
        >
          {INTRO_CHAPTERS.map((c, i) => {
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
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="font-display text-[10px] uppercase tracking-[0.4em] text-[hsl(38_72%_64%)]"
            >
              {pick(INTRO_ENTRY.eyebrow, isFR)}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
              className="mt-8 font-cormorant font-light leading-[0.95] text-white"
            >
              <span className="block text-2xl italic text-white/70 sm:text-3xl">{pick(INTRO_ENTRY.titleSmall, isFR)}</span>
              <span className="mt-2 block text-5xl sm:text-7xl md:text-8xl">{pick(INTRO_ENTRY.title, isFR)}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.1 }}
              className="mt-8 max-w-md font-body text-sm leading-relaxed text-white/60 sm:text-base"
            >
              {pick(INTRO_ENTRY.tagline, isFR)}
            </motion.p>
            <motion.button
              type="button"
              onClick={onEnter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.7 }}
              className="pointer-events-auto group mt-12 rounded-full border border-white/30 px-9 py-4 font-display text-[11px] uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:border-[hsl(38_72%_64%)] hover:bg-[hsl(38_72%_64%)] hover:text-[hsl(222_26%_6%)]"
            >
              {pick(INTRO_ENTRY.cta, isFR)}
            </motion.button>
          </motion.div>
        ) : null}

        {state.phase === "chapterTitle" && chapter ? <ChapterTitle key={`t-${chapter.id}`} chapter={chapter} isFR={isFR} /> : null}

        {state.phase === "interact" && chapter ? (
          <motion.div
            key={`hint-${chapter.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
          >
            <p className="font-cormorant text-lg italic text-white/85 sm:text-xl">
              {pick(isTouch ? chapter.hintTouch : chapter.hintPointer, isFR)}
            </p>
          </motion.div>
        ) : null}

        {state.phase === "narrate" && chapter ? (
          <NarrativeLines key={`n-${chapter.id}`} chapter={chapter} isFR={isFR} lineMs={narrateLineMs} onNext={onNext} />
        ) : null}

        {state.phase === "end" ? (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          >
            <p className="font-display text-[10px] uppercase tracking-[0.4em] text-[hsl(38_72%_64%)]">
              {pick(INTRO_END.eyebrow, isFR)}
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
              className="mt-7 max-w-3xl font-cormorant text-3xl font-light leading-tight sm:text-5xl"
            >
              {pick(INTRO_END.title, isFR)} <em className="italic">{pick(INTRO_END.titleEmphasis, isFR)}</em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.1 }}
              className="mt-6 max-w-md font-body text-sm text-white/60 sm:text-base"
            >
              {pick(INTRO_END.body, isFR)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.6 }}
              className="pointer-events-auto mt-10 flex flex-col items-center gap-5"
            >
              <button
                type="button"
                onClick={onFinish}
                className="rounded-full bg-[hsl(38_72%_64%)] px-10 py-4 font-display text-[11px] uppercase tracking-[0.3em] text-[hsl(222_26%_6%)] transition-colors hover:bg-[hsl(38_72%_72%)]"
              >
                {pick(INTRO_END.cta, isFR)}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="font-display text-[10px] uppercase tracking-[0.26em] text-white/50 transition-colors hover:text-white"
              >
                {pick(INTRO_END.restart, isFR)}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {inChapter ? (
        <div className="pointer-events-auto absolute bottom-6 right-5 sm:right-8">
          <button
            type="button"
            onClick={onSkipChapter}
            className="font-display text-[10px] uppercase tracking-[0.26em] text-white/45 transition-colors hover:text-white"
          >
            {pick(INTRO_UI.skipChapter, isFR)}
          </button>
        </div>
      ) : null}

      {state.phase === "interact" ? <HoldIndicator hold={hold} /> : null}
    </div>
  );
}
