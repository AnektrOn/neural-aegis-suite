import { supabase } from "@/integrations/supabase/client";

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

export async function notifyAdminOnLogin(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null },
) {
  if (!adminNotificationEmail) return;

  try {
    const { error } = await supabase.functions.invoke("send-email-notification", {
      body: {
        type: "admin_login_alert",
        user_id: user.id,
        data: {
          admin_email: adminNotificationEmail,
          user_email: user.email ?? "unknown",
          user_name: resolveUserDisplayName(user),
          logged_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("Failed to send admin login notification:", error.message);
    }
  } catch (error) {
    console.error("Unexpected error sending admin login notification:", error);
  }
}

export async function notifyAdminOnJournalEntry(
  payload: {
    user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null };
    title?: string | null;
    content: string;
  },
) {
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
