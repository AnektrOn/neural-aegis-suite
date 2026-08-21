import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const memCache = new Map<string, boolean>();
const storageKey = (uid: string) => `aegis_quiz_done_${uid}`;

function readPersisted(uid: string): boolean | null {
  try {
    return localStorage.getItem(storageKey(uid)) === "1" ? true : null;
  } catch {
    return null;
  }
}

/** True dès que l'utilisateur a terminé le questionnaire archétypal. */
export async function fetchQuizCompleted(userId: string): Promise<boolean> {
  const [scoresRes, sessionRes] = await Promise.all([
    supabase
      .from("archetype_scores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("assessment_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "submitted"),
  ]);
  return (scoresRes.count ?? 0) > 0 || (sessionRes.count ?? 0) > 0;
}

export interface QuizCompletionState {
  loading: boolean;
  completed: boolean;
}

export function useQuizCompletion(): QuizCompletionState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const cached = userId ? memCache.get(userId) ?? readPersisted(userId) : null;
  const [completed, setCompleted] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState<boolean>(cached === null);

  useEffect(() => {
    if (!userId) {
      setCompleted(false);
      setLoading(false);
      return;
    }
    const known = memCache.get(userId) ?? readPersisted(userId);
    if (known) {
      setCompleted(true);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchQuizCompleted(userId)
      .then((done) => {
        if (!alive) return;
        memCache.set(userId, done);
        if (done) {
          try {
            localStorage.setItem(storageKey(userId), "1");
          } catch {
            /* ignore */
          }
        }
        setCompleted(done);
      })
      .catch(() => {
        // En cas d'erreur réseau on ne force pas l'onboarding.
        if (alive) setCompleted(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  return { loading, completed };
}
