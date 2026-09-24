import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { StoryCanvas } from "./storytelling/StoryCanvas";
import {
  STORY_CHAPTERS,
  pickText,
  type StoryChapterId,
} from "./storytelling/storyCopy";

export default function StorytellingPage() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [index, setIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const chapter = STORY_CHAPTERS[index];

  const goTo = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(STORY_CHAPTERS.length - 1, next)));
    setFadeKey((k) => k + 1);
  }, []);

  const next = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const skip = useCallback(() => {
    if (index >= STORY_CHAPTERS.length - 1) return;
    next();
  }, [index, next]);

  const restart = useCallback(() => {
    goTo(0);
  }, [goTo]);

  const onChapterComplete = useCallback((id: StoryChapterId) => {
    window.setTimeout(() => {
      setIndex((current) => {
        if (STORY_CHAPTERS[current]?.id !== id) return current;
        const nextIndex = Math.min(STORY_CHAPTERS.length - 1, current + 1);
        return nextIndex;
      });
      setFadeKey((k) => k + 1);
    }, 650);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[hsl(222_26%_5%)] text-white">
      <StoryCanvas
        chapter={chapter.id}
        onChapterComplete={onChapterComplete}
        className="absolute inset-0 z-0"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            chapter.id === "silence" || chapter.id === "threshold"
              ? "radial-gradient(ellipse 55% 45% at 50% 40%, transparent 30%, hsl(222 26% 5% / 0.35) 100%)"
              : "linear-gradient(180deg, hsl(222 26% 5% / 0.5) 0%, transparent 26%, transparent 54%, hsl(222 26% 5% / 0.84) 100%)",
        }}
      />

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-white/65 hover:bg-white/10 hover:text-white"
        >
          <Link to="/" aria-label={isFR ? "Retour" : "Back"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-white/40">
          Dev · Storytelling · R3F
        </p>
        {index > 0 && index < STORY_CHAPTERS.length - 1 ? (
          <button
            type="button"
            onClick={skip}
            className="font-display text-[10px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white/80"
          >
            {isFR ? "Passer" : "Skip"}
          </button>
        ) : (
          <div className="w-14" />
        )}
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${chapter.id}-${fadeKey}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg text-center"
          >
            <p className="font-display text-[10px] uppercase tracking-[0.32em] text-[hsl(38_72%_58%/0.9)]">
              {pickText(chapter.eyebrow, isFR)}
            </p>
            <h1
              className={
                chapter.id === "silence"
                  ? "mt-5 font-cormorant-display text-5xl tracking-wide text-white sm:text-6xl"
                  : "mt-3 font-cormorant-display text-3xl leading-tight tracking-wide text-white sm:text-4xl"
              }
            >
              {pickText(chapter.title, isFR)}
            </h1>
            <p className="mx-auto mt-4 max-w-md font-body text-sm leading-relaxed text-white/60 sm:text-base">
              {pickText(chapter.body, isFR)}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-auto mt-7 flex flex-col items-center gap-3">
          {chapter.id === "silence" ? (
            <Button
              size="lg"
              onClick={next}
              className="min-w-[200px] bg-[hsl(24_48%_65%)] text-[hsl(200_35%_7%)] hover:bg-[hsl(24_48%_58%)]"
            >
              {pickText(chapter.hint, isFR)}
            </Button>
          ) : null}

          {chapter.id === "threshold" ? (
            <>
              <Button
                asChild
                size="lg"
                className="min-w-[220px] bg-[hsl(24_48%_65%)] text-[hsl(200_35%_7%)] hover:bg-[hsl(24_48%_58%)]"
              >
                <Link to="/">{pickText(chapter.hint, isFR)}</Link>
              </Button>
              <button
                type="button"
                onClick={restart}
                className="font-display text-[10px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white/70"
              >
                {isFR ? "Recommencer" : "Restart"}
              </button>
            </>
          ) : null}

          {chapter.id !== "silence" && chapter.id !== "threshold" ? (
            <p className="pointer-events-none font-display text-[10px] uppercase tracking-[0.22em] text-white/35">
              {pickText(chapter.hint, isFR)}
            </p>
          ) : null}
        </div>

        <div className="pointer-events-auto mt-8 flex items-center gap-2">
          {STORY_CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.id}
              onClick={() => goTo(i)}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 8,
                background:
                  i === index
                    ? "hsl(38 72% 58%)"
                    : i < index
                      ? "hsl(38 72% 58% / 0.4)"
                      : "hsl(0 0% 100% / 0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
