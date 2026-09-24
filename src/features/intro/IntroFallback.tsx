import { INTRO_CHAPTERS, INTRO_END, INTRO_ENTRY, pick } from "./intro.copy";

type Props = { isFR: boolean; onFinish: () => void };

export default function IntroFallback({ isFR, onFinish }: Props) {
  return (
    <div className="relative min-h-[100dvh] overflow-y-auto bg-[radial-gradient(ellipse_at_50%_20%,hsl(32_40%_18%)_0%,hsl(222_26%_6%)_65%)] px-6 py-20 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.4em] text-[hsl(38_72%_64%)]">
          {pick(INTRO_ENTRY.eyebrow, isFR)}
        </p>
        <h1 className="mt-6 font-cormorant text-5xl font-light sm:text-6xl">
          <span className="block text-2xl italic text-white/70">{pick(INTRO_ENTRY.titleSmall, isFR)}</span>
          {pick(INTRO_ENTRY.title, isFR)}
        </h1>
        <p className="mt-6 text-white/60">{pick(INTRO_ENTRY.tagline, isFR)}</p>

        <ol className="mt-14 space-y-10">
          {INTRO_CHAPTERS.map((c) => (
            <li key={c.id}>
              <p className="font-display text-[11px] tracking-[0.3em] text-[hsl(38_72%_64%)]">{c.number}</p>
              <h2 className="mt-2 font-cormorant text-3xl font-light">
                {pick(c.titlePrefix, isFR)} <em className="italic">{pick(c.titleEmphasis, isFR)}</em>
              </h2>
              <p className="mt-3 font-cormorant text-lg text-white/70">{c.lines.map((l) => pick(l, isFR)).join(" ")}</p>
            </li>
          ))}
        </ol>

        <p className="mt-16 font-cormorant text-3xl font-light">
          {pick(INTRO_END.title, isFR)} <em className="italic">{pick(INTRO_END.titleEmphasis, isFR)}</em>
        </p>
        <button
          type="button"
          onClick={onFinish}
          className="mt-10 rounded-full bg-[hsl(38_72%_64%)] px-10 py-4 font-display text-[11px] uppercase tracking-[0.3em] text-[hsl(222_26%_6%)] transition-colors hover:bg-[hsl(38_72%_72%)]"
        >
          {pick(INTRO_END.cta, isFR)}
        </button>
      </div>
    </div>
  );
}
