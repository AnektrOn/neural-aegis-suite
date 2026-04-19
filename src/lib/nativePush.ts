import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

const REGISTER_TIMEOUT_MS = 25_000;

export function isNativePushEnvironment(): boolean {
  return Capacitor.isNativePlatform();
}

export async function subscribeNativePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false, reason: "native_only" };

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return { ok: false, reason: "denied" };

  return new Promise((resolve) => {
    let settled = false;
    const done = (r: { ok: boolean; reason?: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(r);
    };

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        await cleanup();
        done({ ok: false, reason: "timeout" });
      })();
    }, REGISTER_TIMEOUT_MS);

    let hReg: Awaited<ReturnType<typeof PushNotifications.addListener>> | undefined;
    let hErr: Awaited<ReturnType<typeof PushNotifications.addListener>> | undefined;

    const cleanup = async () => {
      clearTimeout(timeoutId);
      await hReg?.remove().catch(() => {});
      await hErr?.remove().catch(() => {});
    };

    void (async () => {
      try {
        hReg = await PushNotifications.addListener("registration", async (token) => {
          try {
            const { error } = await supabase.from("native_fcm_tokens").upsert(
              {
                user_id: userId,
                token: token.value,
                platform: Capacitor.getPlatform(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "token" }
            );
            await cleanup();
            done({ ok: !error, reason: error?.message });
          } catch (e) {
            await cleanup();
            done({ ok: false, reason: e instanceof Error ? e.message : String(e) });
          }
        });

        hErr = await PushNotifications.addListener("registrationError", async (err) => {
          await cleanup();
          done({ ok: false, reason: err.error || "registration failed" });
        });

        await PushNotifications.register();
      } catch (e) {
        await cleanup();
        done({ ok: false, reason: e instanceof Error ? e.message : String(e) });
      }
    })();
  });
}

export async function unsubscribeNativePush(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await PushNotifications.unregister();
  } catch {
    // still clear server registrations
  }
  await supabase.from("native_fcm_tokens").delete().eq("user_id", userId);
}

export async function isNativePushSubscribed(userId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { count, error } = await supabase
    .from("native_fcm_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return false;
  return (count ?? 0) > 0;
}
