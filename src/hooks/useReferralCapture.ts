import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  REFERRAL_STORAGE_KEY,
  claimReferral,
  trackReferralClick,
} from "@/services/affiliateService";

/**
 * Referral attribution:
 * 1. `?ref=CODE` on any public page → stored locally + click counted.
 * 2. Once the visitor is authenticated → the code is attached to their account (once).
 */
export function useReferralCapture() {
  const { search, pathname } = useLocation();
  const { user } = useAuth();
  const claimed = useRef(false);

  useEffect(() => {
    const code = new URLSearchParams(search).get("ref");
    if (!code) return;
    const clean = code.trim().slice(0, 64);
    if (!clean) return;
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    } catch {
      /* storage unavailable */
    }
    void trackReferralClick(clean, pathname).catch(() => undefined);
  }, [search, pathname]);

  useEffect(() => {
    if (!user?.id || claimed.current) return;
    let code: string | null = null;
    try {
      code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    } catch {
      code = null;
    }
    if (!code) return;
    claimed.current = true;
    void claimReferral(code)
      .then(() => {
        try {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        } catch {
          /* noop */
        }
      })
      .catch(() => undefined);
  }, [user?.id]);
}
