import type { BlogArticleMeta } from "./types";

const articles: BlogArticleMeta[] = [];

const byPath = new Map(articles.map((a) => [a.path, a]));
const byId = new Map(articles.map((a) => [a.id, a]));

export function getBlogArticleByPath(pathname: string): BlogArticleMeta | undefined {
  return byPath.get(pathname);
}

export function getBlogArticleBySlug(slug: string): BlogArticleMeta | undefined {
  return byId.get(slug);
}

export function listBlogArticles(): BlogArticleMeta[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function isPublicBlogPath(pathname: string): boolean {
  return pathname === "/blog" || pathname.startsWith("/blog/");
}