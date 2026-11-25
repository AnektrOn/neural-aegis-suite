import { useLayoutEffect, useState } from "react";

const PRERENDER_DESC_SELECTOR = 'meta[name="description"][data-seo-prerender="1"]';

/** Keep a single meta description: update the build-time tag instead of letting Helmet add a second one. */
export function useSyncPrerenderMetaDescription(description: string): boolean {
  const [hasPrerender] = useState(
    () => typeof document !== "undefined" && !!document.querySelector(PRERENDER_DESC_SELECTOR),
  );

  useLayoutEffect(() => {
    const el = document.querySelector(PRERENDER_DESC_SELECTOR);
    if (el) {
      el.setAttribute("content", description);
    }
  }, [description]);

  return hasPrerender;
}