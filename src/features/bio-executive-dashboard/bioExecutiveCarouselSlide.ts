export type BentoSlideProps = { "data-bento-slide"?: number };

/** Carousel slides must not use `role="button"` or drag-scroll and swipe break. */
export function mergeCarouselSlideArticleProps(slideProps?: BentoSlideProps) {
  if (slideProps == null) {
    return { role: "button" as const, tabIndex: 0 };
  }
  return {
    ...slideProps,
    role: "group" as const,
    "aria-roledescription": "slide" as const,
  };
}
