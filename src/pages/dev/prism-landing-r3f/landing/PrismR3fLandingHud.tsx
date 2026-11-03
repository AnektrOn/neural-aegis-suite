import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePrismR3fLandingChapter } from "../config/PrismR3fLandingChapterContext";
import { isPrismLandingCinematicHud } from "./prismR3fLandingBeats";

const CHAPTER_TOTAL = 6;

export function PrismR3fLandingHud() {
  const { chapter, chapterIndex, goNext, goPrev, canGoNext, canGoPrev, isTransitioning } =
    usePrismR3fLandingChapter();
  const isCinematicHud = isPrismLandingCinematicHud(chapterIndex);
  const [soundOn, setSoundOn] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const prevChapterId = useRef(chapter.id);

  useEffect(() => {
    if (prevChapterId.current === chapter.id) return;
    prevChapterId.current = chapter.id;
    setHeroVisible(false);
    const t = window.setTimeout(() => setHeroVisible(true), 40);
    return () => window.clearTimeout(t);
  }, [chapter.id]);

  const openMenu = () => {
    dialogRef.current?.showModal();
  };

  const closeMenu = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeMenu();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [closeMenu]);

  const menuLinks = [
    "About",
    "Projects",
    "Careers",
    "Contact",
    "News",
    "Investor Relations",
    "Privacy Policy",
    "Terms And Conditions",
  ];

  return (
    <div
      className={`prism-r3f-landing-hud${isTransitioning ? " prism-r3f-landing-hud--travel" : ""}`}
    >
      <div className="prism-r3f-landing-hud__frame" aria-hidden />

      <header className="prism-r3f-landing-hud__top">
        <Link to="/dev/prism" className="prism-r3f-landing-hud__logo">
          PRISM
        </Link>
        <div className="prism-r3f-landing-hud__top-actions">
          <button type="button" className="prism-r3f-landing-hud__btn" onClick={() => {}}>
            LOGIN
          </button>
          <button type="button" className="prism-r3f-landing-hud__btn" onClick={openMenu}>
            MENU
          </button>
        </div>
      </header>

      <main
        className={`prism-r3f-landing-hud__hero ${heroVisible ? "is-visible" : "is-fading"}`}
      >
        <p className="prism-r3f-landing-hud__chapter-label">{chapter.label}</p>
        <h1
          className={`prism-r3f-landing-hud__title ${isCinematicHud ? "prism-r3f-landing-hud__title--travel" : ""}`}
        >
          {chapter.title}
        </h1>
        {!isCinematicHud ? <p className="prism-r3f-landing-hud__body">{chapter.body}</p> : null}
        {chapterIndex < 5 ? (
          <a
            href="#"
            className="prism-r3f-landing-hud__cta"
            onClick={(e) => e.preventDefault()}
          >
            {chapter.cta}
          </a>
        ) : (
          <span className="prism-r3f-landing-hud__cta prism-r3f-landing-hud__cta--static">
            {chapter.cta}
          </span>
        )}
      </main>

      <footer className="prism-r3f-landing-hud__bottom">
        <button
          type="button"
          className="prism-r3f-landing-hud__sound"
          onClick={() => setSoundOn((v) => !v)}
        >
          {soundOn ? "Sound On" : "Sound Off"}
        </button>

        <nav className="prism-r3f-landing-hud__chapter-nav" aria-label="Chapitres">
          {canGoPrev ? (
            <button
              type="button"
              className="prism-r3f-landing-hud__nav-btn"
              onClick={goPrev}
              disabled={isTransitioning}
            >
              PREV.
            </button>
          ) : (
            <span className="prism-r3f-landing-hud__nav-spacer" aria-hidden />
          )}
          {canGoNext ? (
            <button
              type="button"
              className="prism-r3f-landing-hud__nav-btn prism-r3f-landing-hud__nav-next"
              onClick={goNext}
              disabled={isTransitioning}
            >
              NEXT
            </button>
          ) : (
            <span className="prism-r3f-landing-hud__nav-spacer" aria-hidden />
          )}
        </nav>

        <div className="prism-r3f-landing-hud__bottom-spacer" aria-hidden />
      </footer>

      {import.meta.env.DEV ? (
        <p className="prism-r3f-landing-hud__debug" aria-hidden>
          Chapitre {chapterIndex + 1}/{CHAPTER_TOTAL}
        </p>
      ) : null}

      <dialog ref={dialogRef} className="prism-r3f-landing-menu" aria-label="Menu">
        <div className="prism-r3f-landing-menu__inner">
          <button type="button" className="prism-r3f-landing-menu__close" onClick={closeMenu}>
            CLOSE
          </button>
          <ul className="prism-r3f-landing-menu__links">
            {menuLinks.map((label) => (
              <li key={label}>
                <a href="#" onClick={(e) => e.preventDefault()}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </div>
  );
}
