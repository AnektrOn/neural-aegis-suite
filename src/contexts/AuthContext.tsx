import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdminOnLogin } from "@/services/adminNotifications";

const MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === "true";
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Dev / demo: keep auth `loading` true at least this many ms after mount so the boot loader stays visible. */
const MIN_AUTH_LOADING_MS = Math.min(
  120_000,
  Math.max(0, Number(import.meta.env.VITE_MIN_AUTH_LOADING_MS) || 0)
);

function parseBoundedMs(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(120_000, n);
}

/** Minimum boot overlay on cold start (Capacitor): ensures AEGIS loader is visible every app open. */
function nativeColdBootFloorMs(): number {
  return Capacitor.isNativePlatform()
    ? parseBoundedMs(import.meta.env.VITE_NATIVE_BOOT_MIN_MS, 1650)
    : 0;
}

/** Boot overlay when returning from background (native only). */
function nativeResumeBootMs(): number {
  return Capacitor.isNativePlatform()
    ? parseBoundedMs(import.meta.env.VITE_NATIVE_RESUME_BOOT_MS, 1400)
    : 0;
}

function mockUser(): User {
  return {
    id: MOCK_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "mock@local.dev",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmation_sent_at: undefined,
    confirmed_at: undefined,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    factors: null,
  } as User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** Session bootstrap in progress (Supabase getSession + first auth event). */
  loading: boolean;
  /** Full-screen boot loader: auth bootstrap and/or forced native cold/resume timing. */
  bootScreenActive: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  bootScreenActive: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdResumeBoot, setHoldResumeBoot] = useState(false);
  const lastNotifiedLogin = useRef<string | null>(null);
  const loadingEndScheduled = useRef(false);
  const resumeBootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const subPromise = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) return;
      if (resumeBootTimerRef.current) clearTimeout(resumeBootTimerRef.current);
      setHoldResumeBoot(true);
      const ms = nativeResumeBootMs();
      resumeBootTimerRef.current = setTimeout(() => {
        setHoldResumeBoot(false);
        resumeBootTimerRef.current = null;
      }, ms);
    });

    return () => {
      if (resumeBootTimerRef.current) clearTimeout(resumeBootTimerRef.current);
      void subPromise.then((h) => void h.remove());
    };
  }, []);

  useEffect(() => {
    const mountTime = Date.now();
    let loadingTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const endInitialLoading = () => {
      if (loadingEndScheduled.current) return;
      loadingEndScheduled.current = true;
      const elapsed = Date.now() - mountTime;
      const coldFloor = nativeColdBootFloorMs();
      const minWaitMs = Math.max(MIN_AUTH_LOADING_MS, coldFloor);
      const wait = Math.max(0, minWaitMs - elapsed);
      if (wait <= 0) {
        setLoading(false);
      } else {
        loadingTimeoutId = setTimeout(() => setLoading(false), wait);
      }
    };

    if (MOCK_AUTH) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`aegis_onboarded_${MOCK_USER_ID}`, "true");
      }
      setUser(mockUser());
      setSession(null);
      endInitialLoading();
      return () => {
        if (loadingTimeoutId) window.clearTimeout(loadingTimeoutId);
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        endInitialLoading();

        if (event === "SIGNED_IN" && session?.user) {
          const loginFingerprint = `${session.user.id}:${session.access_token.slice(-12)}`;
          if (lastNotifiedLogin.current !== loginFingerprint) {
            lastNotifiedLogin.current = loginFingerprint;
            void notifyAdminOnLogin(session.user);
          }
        }
      }
    );

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      endInitialLoading();
    });

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutId) window.clearTimeout(loadingTimeoutId);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const bootScreenActive = loading || holdResumeBoot;

  return (
    <AuthContext.Provider value={{ user, session, loading, bootScreenActive, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
