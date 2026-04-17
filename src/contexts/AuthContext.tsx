import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdminOnLogin } from "@/services/adminNotifications";

const MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === "true";
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Dev / demo: keep auth `loading` true at least this many ms after mount so the boot loader stays visible. */
const MIN_AUTH_LOADING_MS = Math.min(
  120_000,
  Math.max(0, Number(import.meta.env.VITE_MIN_AUTH_LOADING_MS) || 0)
);

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
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastNotifiedLogin = useRef<string | null>(null);
  const loadingEndScheduled = useRef(false);

  useEffect(() => {
    const mountTime = Date.now();
    let loadingTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const endInitialLoading = () => {
      if (loadingEndScheduled.current) return;
      loadingEndScheduled.current = true;
      const elapsed = Date.now() - mountTime;
      const wait = Math.max(0, MIN_AUTH_LOADING_MS - elapsed);
      if (wait <= 0) {
        setLoading(false);
      } else {
        loadingTimeoutId = window.setTimeout(() => setLoading(false), wait);
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

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
