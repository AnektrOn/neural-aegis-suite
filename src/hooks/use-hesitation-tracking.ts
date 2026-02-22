import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks time between focus and first input on form fields.
 * Call trackHesitation(inputName) on focus, and stopHesitation(inputName) on first change.
 * Or use the auto-attach mode which listens to all inputs on the page.
 */
export function useHesitationTracking(autoAttach = true) {
  const { user } = useAuth();
  const location = useLocation();
  const focusTimes = useRef<Map<string, number>>(new Map());
  const reported = useRef<Set<string>>(new Set());

  const trackHesitation = useCallback((inputName: string) => {
    if (reported.current.has(inputName)) return;
    focusTimes.current.set(inputName, Date.now());
  }, []);

  const stopHesitation = useCallback(
    async (inputName: string) => {
      if (!user) return;
      const start = focusTimes.current.get(inputName);
      if (!start || reported.current.has(inputName)) return;

      const hesitationMs = Date.now() - start;
      reported.current.add(inputName);
      focusTimes.current.delete(inputName);

      if (hesitationMs < 200) return; // ignore instant fills

      await supabase.from("input_hesitations" as any).insert({
        user_id: user.id,
        page: location.pathname,
        input_name: inputName,
        hesitation_ms: hesitationMs,
      } as any);
    },
    [user, location.pathname]
  );

  // Auto-attach to all inputs on the page
  useEffect(() => {
    if (!autoAttach || !user) return;

    // Reset on page change
    reported.current.clear();
    focusTimes.current.clear();

    const handleFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        const name = (el as HTMLInputElement).name || (el as HTMLInputElement).placeholder || el.id || el.tagName;
        trackHesitation(name);
      }
    };

    const handleInput = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        const name = (el as HTMLInputElement).name || (el as HTMLInputElement).placeholder || el.id || el.tagName;
        stopHesitation(name);
      }
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("input", handleInput);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("input", handleInput);
    };
  }, [autoAttach, user, location.pathname, trackHesitation, stopHesitation]);

  return { trackHesitation, stopHesitation };
}
