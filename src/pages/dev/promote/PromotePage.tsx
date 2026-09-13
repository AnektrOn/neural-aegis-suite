import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { PromoteDirectorHud } from "./PromoteDirectorHud";
import { PromotePhoneChrome } from "./PromotePhoneChrome";
import { PromotePlayerProvider } from "./PromotePlayerContext";
import {
  PATH_TO_PROMOTE_SLUG,
  PROMOTE_SCENES,
  promoteSceneIndex,
} from "./promoteScenes";
import { PromoteSceneView } from "./scenes/PromoteSceneView";

const PHONE_W = 390;
const PHONE_H = 844;
const SWIPE_PX = 56;

function promotePath(slug: string, search: string) {
  return `/dev/promote/${slug}${search ? `?${search}` : ""}`;
}

function slugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/\/dev\/promote\/([^/]+)/);
  return match?.[1];
}

export default function PromotePage() {
  const { scene: sceneParam } = useParams<{ scene: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const isMobile = useIsMobile();
  const forceFilm = searchParams.get("film") === "1";
  const autoMs = Number(searchParams.get("auto") ?? 0) || 0;

  const [slug, setSlug] = useState(() => PROMOTE_SCENES[promoteSceneIndex(sceneParam)].slug);
  const [search, setSearch] = useState(() => searchParams.toString());
  const [hudHidden, setHudHidden] = useState(() => forceFilm || isMobile);

  const index = promoteSceneIndex(slug);
  const scene = PROMOTE_SCENES[index];
  const filmMode = hudHidden;
  const framed = !isMobile && !filmMode && scene.chrome === "app";

  const indexRef = useRef(index);
  indexRef.current = index;
  const searchRef = useRef(search);
  searchRef.current = search;
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const goToRef = useRef<(nextSlug: string) => void>(() => {});

  const syncUrl = useCallback((nextSlug: string, nextSearch: string, replace = false) => {
    const url = promotePath(nextSlug, nextSearch);
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }, []);

  const goTo = useCallback(
    (nextSlug: string) => {
      const resolved = PROMOTE_SCENES[promoteSceneIndex(nextSlug)].slug;
      if (resolved === slugRef.current) return;
      setSlug(resolved);
      syncUrl(resolved, searchRef.current);
    },
    [syncUrl],
  );

  const goIndex = useCallback(
    (nextIndex: number) => {
      const wrapped = (nextIndex + PROMOTE_SCENES.length) % PROMOTE_SCENES.length;
      goTo(PROMOTE_SCENES[wrapped].slug);
    },
    [goTo],
  );

  const next = useCallback(() => goIndex(indexRef.current + 1), [goIndex]);
  const prev = useCallback(() => goIndex(indexRef.current - 1), [goIndex]);
  goToRef.current = goTo;

  useEffect(() => {
    if (!sceneParam) {
      syncUrl(slug, search, true);
    } else if (sceneParam !== slug) {
      const resolved = PROMOTE_SCENES[promoteSceneIndex(sceneParam)].slug;
      setSlug(resolved);
      if (sceneParam !== resolved) syncUrl(resolved, search, true);
    }
    // First paint only — later scene changes are pushState + local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = () => {
      const fromPath = slugFromPathname(window.location.pathname);
      setSlug(PROMOTE_SCENES[promoteSceneIndex(fromPath)].slug);
      setSearch(window.location.search.replace(/^\?/, ""));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setHudHidden((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    if (!autoMs) return;
    const t = window.setTimeout(next, autoMs);
    return () => window.clearTimeout(t);
  }, [autoMs, index, next]);

  useLayoutEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
      const [pathWithOrigin, qs] = href.split("?");
      const path = pathWithOrigin.replace(/^https?:\/\/[^/]+/, "");
      if (!path.startsWith("/")) return;
      if (path.startsWith("/dev/promote")) {
        event.preventDefault();
        event.stopPropagation();
        const nextSlug = slugFromPathname(path);
        if (nextSlug) goToRef.current(nextSlug);
        if (qs !== undefined) {
          setSearch(qs);
          syncUrl(slugFromPathname(path) ?? slugRef.current, qs, true);
        }
        return;
      }
      const mapped = PATH_TO_PROMOTE_SLUG[path];
      if (!mapped) return;
      event.preventDefault();
      event.stopPropagation();
      goToRef.current(mapped);
    };
    window.addEventListener("click", onClick, true);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [syncUrl]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) next();
    else prev();
  };

  const api = useMemo(
    () => ({ goTo, next, prev, filmMode, isFR, sceneSlug: scene.slug }),
    [filmMode, goTo, isFR, next, prev, scene.slug],
  );

  const stage = (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden bg-bg-base"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {scene.chrome === "app" ? (
        <PromotePhoneChrome>
          <PromoteSceneView slug={scene.slug} />
        </PromotePhoneChrome>
      ) : (
        <PromoteSceneView slug={scene.slug} />
      )}
      <button
        type="button"
        aria-label="Plan précédent"
        className="absolute bottom-[5.25rem] left-0 top-0 z-[70] w-11 bg-transparent"
        onClick={prev}
      />
      <button
        type="button"
        aria-label="Plan suivant"
        className="absolute bottom-[5.25rem] right-0 top-0 z-[70] w-11 bg-transparent"
        onClick={next}
      />
    </div>
  );

  return (
    <PromotePlayerProvider value={api}>
      <div className={cn("relative h-[100dvh] w-full overflow-hidden", framed ? "flex items-center justify-center bg-neutral-950" : "")}>
        <PromoteDirectorHud
          index={index}
          title={isFR ? scene.titleFr : scene.titleEn}
          filmMode={filmMode}
          onPrev={prev}
          onNext={next}
          onToggleFilm={() => {
            setHudHidden((v) => {
              const nextHidden = !v;
              const params = new URLSearchParams(searchRef.current);
              if (nextHidden) params.set("film", "1");
              else params.delete("film");
              const qs = params.toString();
              setSearch(qs);
              syncUrl(slugRef.current, qs, true);
              return nextHidden;
            });
          }}
        />
        {framed ? (
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            style={{ width: PHONE_W, height: PHONE_H, maxHeight: "calc(100dvh - 72px)" }}
          >
            {stage}
          </div>
        ) : (
          stage
        )}
      </div>
    </PromotePlayerProvider>
  );
}
