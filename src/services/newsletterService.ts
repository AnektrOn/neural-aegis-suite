import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/translations";

export type NewsletterStatus = "active" | "unsubscribed" | null;

export interface NewsletterSubscription {
  email: string;
  status: NewsletterStatus;
}

export interface NewsletterEdition {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  bodyFr: string;
  bodyEn: string;
  status: "draft" | "published";
  publishedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

type RpcResult = { ok: boolean; error?: string; status?: string; email?: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapEditionRow(row: {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string;
  excerpt_en: string;
  body_fr: string;
  body_en: string;
  status: string;
  published_at: string | null;
  email_sent_at: string | null;
  created_at: string;
}): NewsletterEdition {
  return {
    id: row.id,
    slug: row.slug,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    excerptFr: row.excerpt_fr,
    excerptEn: row.excerpt_en,
    bodyFr: row.body_fr,
    bodyEn: row.body_en,
    status: row.status as "draft" | "published",
    publishedAt: row.published_at,
    emailSentAt: row.email_sent_at,
    createdAt: row.created_at,
  };
}

async function dispatchNewsletterQueue(limit = 10): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-newsletter-email", {
      body: { action: "process_queue", limit },
    });
    if (error) console.error("dispatchNewsletterQueue:", error.message);
  } catch (err) {
    console.error("dispatchNewsletterQueue:", err);
  }
}

async function sendWelcomeEmailDirect(email: string, locale: Locale): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-newsletter-email", {
      body: { action: "welcome", email, locale },
    });
    if (error) console.error("sendWelcomeEmailDirect:", error.message);
  } catch (err) {
    console.error("sendWelcomeEmailDirect:", err);
  }
}

export async function subscribeNewsletter(params: {
  email: string;
  locale: Locale;
  source?: string;
}): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const email = normalizeEmail(params.email);
  try {
    const { data, error } = await supabase.rpc("subscribe_newsletter", {
      p_email: email,
      p_locale: params.locale,
      p_source: params.source ?? "web",
    });

    if (error) {
      console.error("subscribe_newsletter:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as RpcResult | null;
    if (!result?.ok) {
      const code = result?.error ?? "unknown";
      return {
        ok: false,
        error: code === "invalid_email" ? "invalid_email" : code,
      };
    }

    void sendWelcomeEmailDirect(email, params.locale);
    void dispatchNewsletterQueue(5);

    return { ok: true, email: (result.email as string) ?? email };
  } catch (err) {
    console.error("subscribeNewsletter:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function unsubscribeNewsletter(
  email: string,
): Promise<{ ok: boolean }> {
  const normalized = normalizeEmail(email);
  try {
    const { data, error } = await supabase.rpc("unsubscribe_newsletter", {
      p_email: normalized,
    });

    if (error) {
      console.error("unsubscribe_newsletter:", error.message);
      return { ok: false };
    }

    const result = data as { ok?: boolean } | null;
    return { ok: Boolean(result?.ok) };
  } catch (err) {
    console.error("unsubscribeNewsletter:", err);
    return { ok: false };
  }
}

export async function getNewsletterSubscriptionForUser(
  userId: string,
): Promise<NewsletterSubscription | null> {
  try {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("getNewsletterSubscriptionForUser:", error.message);
      return null;
    }

    if (!data) return null;
    return {
      email: data.email,
      status: data.status as NewsletterStatus,
    };
  } catch (err) {
    console.error("getNewsletterSubscriptionForUser:", err);
    return null;
  }
}

export async function listPublishedNewsletterEditions(): Promise<NewsletterEdition[]> {
  try {
    const { data, error } = await supabase
      .from("newsletter_editions")
      .select(
        "id, slug, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, email_sent_at, created_at",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("listPublishedNewsletterEditions:", error.message);
      return [];
    }

    return (data ?? []).map(mapEditionRow);
  } catch (err) {
    console.error("listPublishedNewsletterEditions:", err);
    return [];
  }
}

export async function getNewsletterEditionBySlug(
  slug: string,
): Promise<NewsletterEdition | null> {
  try {
    const { data, error } = await supabase
      .from("newsletter_editions")
      .select(
        "id, slug, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, email_sent_at, created_at",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("getNewsletterEditionBySlug:", error.message);
      return null;
    }

    return data ? mapEditionRow(data) : null;
  } catch (err) {
    console.error("getNewsletterEditionBySlug:", err);
    return null;
  }
}

export async function listAllNewsletterEditionsAdmin(): Promise<NewsletterEdition[]> {
  try {
    const { data, error } = await supabase
      .from("newsletter_editions")
      .select(
        "id, slug, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, email_sent_at, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listAllNewsletterEditionsAdmin:", error.message);
      return [];
    }

    return (data ?? []).map(mapEditionRow);
  } catch (err) {
    console.error("listAllNewsletterEditionsAdmin:", err);
    return [];
  }
}

export async function upsertNewsletterEditionAdmin(
  edition: Partial<NewsletterEdition> & {
    slug: string;
    titleFr: string;
    titleEn: string;
  },
  userId: string,
): Promise<NewsletterEdition | null> {
  try {
    const payload = {
      slug: edition.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      title_fr: edition.titleFr,
      title_en: edition.titleEn,
      excerpt_fr: edition.excerptFr ?? "",
      excerpt_en: edition.excerptEn ?? "",
      body_fr: edition.bodyFr ?? "",
      body_en: edition.bodyEn ?? "",
      status: edition.status ?? "draft",
      created_by: userId,
    };

    const { data, error } = edition.id
      ? await supabase
          .from("newsletter_editions")
          .update(payload)
          .eq("id", edition.id)
          .select(
            "id, slug, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, email_sent_at, created_at",
          )
          .single()
      : await supabase
          .from("newsletter_editions")
          .insert(payload)
          .select(
            "id, slug, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, email_sent_at, created_at",
          )
          .single();

    if (error) {
      console.error("upsertNewsletterEditionAdmin:", error.message);
      return null;
    }

    return data ? mapEditionRow(data) : null;
  } catch (err) {
    console.error("upsertNewsletterEditionAdmin:", err);
    return null;
  }
}

export async function publishNewsletterEditionAdmin(
  editionId: string,
): Promise<{ ok: boolean; queued?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("publish_newsletter_edition", {
      p_edition_id: editionId,
    });

    if (error) {
      console.error("publish_newsletter_edition:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as { ok?: boolean; queued?: number; error?: string } | null;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    await dispatchNewsletterQueue(50);

    await supabase
      .from("newsletter_editions")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", editionId);

    return { ok: true, queued: result.queued ?? 0 };
  } catch (err) {
    console.error("publishNewsletterEditionAdmin:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
