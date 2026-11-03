import type { ReactNode } from "react";
import { RevealOnScroll } from "./RevealOnScroll";

export function LandingSection({
  id,
  label,
  title,
  children,
  dark = false,
  className = "",
}: {
  id?: string;
  label?: string;
  title?: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  const bg = dark
    ? "bg-[color:var(--aegis-dark)] text-[color:var(--aegis-dark-text)]"
    : "bg-[color:var(--aegis-page)] text-[color:var(--aegis-text)]";
  return (
    <section id={id} className={`${bg} py-16 md:py-24 ${className}`}>
      <div className="aegis-landing__container">
        <RevealOnScroll>
          {label ? <p className="aegis-landing__section-label mb-6">{label}</p> : null}
          {title ? (
            <h2 className="aegis-landing__headline mb-10 max-w-3xl whitespace-pre-line text-[clamp(2rem,4vw,3.25rem)]">
              {title}
            </h2>
          ) : null}
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}
