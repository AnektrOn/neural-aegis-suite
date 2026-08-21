import { AnimatePresence, motion } from "framer-motion";

interface Props {
  text: string | null;
}

/** Centered subtitle overlay for Guardian guide voice. */
export function GuardianCaptions({ text }: Props) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[22%] z-30 flex justify-center px-6"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {text ? (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="max-w-xl text-center font-barlow text-base leading-relaxed text-foreground sm:text-lg"
            style={{
              textShadow:
                "0 1px 2px rgba(0,0,0,0.35), 0 0 14px rgba(255,255,255,0.35)",
            }}
          >
            {text}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
