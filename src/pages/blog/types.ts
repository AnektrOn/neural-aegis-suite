import type { ReactNode } from "react";

export type BlogLocale = "fr" | "en";

export type BlogArticleSeo = {
  title: string;
  description: string;
};

export type BlogArticleMeta = {
  /** URL slug: /blog/:slug */
  id: string;
  path: string;
  publishedAt: string;
  readingMinutes: number;
  category: Record<BlogLocale, string>;
  seo: Record<BlogLocale, BlogArticleSeo>;
  kicker: Record<BlogLocale, string>;
  title: Record<BlogLocale, string>;
  excerpt: Record<BlogLocale, string>;
  renderBody: (locale: BlogLocale) => ReactNode;
};