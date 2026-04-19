import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BPyTzXutG-VQGkAWopZKLJgmCJtTR891pyAuydNwwBagLKav60f4ge_NNasEoVz2UaC9i9aLivhpNhKfhR-RfGU";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/push-sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
}

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const json = sub.toJSON();
  const endpoint = sub.endpoint;
  const p256dh = json.keys?.p256dh ?? bufToBase64(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? bufToBase64(sub.getKey("auth"));

  const { error } = await supabase
    .from("push_subscriptions" as any)
    .upsert(
      { user_id: userId, endpoint, p256dh, auth, user_agent: navigator.userAgent, last_used_at: new Date().toISOString() },
      { onConflict: "endpoint" }
    );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from("push_subscriptions" as any).delete().eq("endpoint", endpoint);
  }
}

export async function isCurrentlySubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}
