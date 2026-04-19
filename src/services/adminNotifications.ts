import { supabase } from "@/integrations/supabase/client";

/** Used only for optional Resend delivery; in-app admin alerts use DB triggers + edge (login). */
const adminNotificationEmail = import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL;

function resolveUserDisplayName(
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null },
  fallback = "Utilisateur inconnu",
): string {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;
  return metadataName || user.email || fallback;
}

/** Notifies admins of login: in-app via edge (always); email optional if VITE_ADMIN_NOTIFICATION_EMAIL is set; push via send-push. */
export async function notifyAdminOnLogin(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null },
) {
  const userName = resolveUserDisplayName(user);
  const userEmail = user.email ?? "unknown";

  // 1) email + in-app (existing)
  try {
    const { error } = await supabase.functions.invoke("send-email-notification", {
      body: {
        type: "admin_login_alert",
        user_id: user.id,
        data: {
          ...(adminNotificationEmail ? { admin_email: adminNotificationEmail } : {}),
          user_email: userEmail,
          user_name: userName,
          logged_at: new Date().toISOString(),
        },
      },
    });
    if (error) console.error("admin login email/in-app failed:", error.message);
  } catch (error) {
    console.error("admin login email/in-app unexpected:", error);
  }

  // 2) Web Push to all admin devices (so they get a phone notification even app closed)
  try {
    await supabase.functions.invoke("send-push", {
      body: {
        target: "admins",
        title: "Connexion utilisateur",
        message: `${userName} (${userEmail}) vient de se connecter.`,
        url: "/admin/analytics",
        tag: `login-${user.id}`,
      },
    });
  } catch (error) {
    console.error("admin login push failed:", error);
  }
}

/** Optional email to admin when a user creates a journal entry; in-app notifications come from Postgres triggers. */
export async function notifyAdminOnJournalEntry(payload: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null };
  title?: string | null;
  content: string;
}) {
  if (!adminNotificationEmail) return;

  try {
    const messagePreview = payload.content.slice(0, 160);
    const { error } = await supabase.functions.invoke("send-email-notification", {
      body: {
        type: "admin_user_entry_alert",
        user_id: payload.user.id,
        data: {
          admin_email: adminNotificationEmail,
          user_email: payload.user.email ?? "unknown",
          user_name: resolveUserDisplayName(payload.user),
          entry_title: payload.title || "Sans titre",
          entry_preview: messagePreview,
          created_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("Failed to send admin journal notification:", error.message);
    }
  } catch (error) {
    console.error("Unexpected error sending admin journal notification:", error);
  }
}
