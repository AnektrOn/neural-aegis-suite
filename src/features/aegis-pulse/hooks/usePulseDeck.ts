import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import {
  FREE_ACTIVE_PULSE_CARDS,
  SOLO_ACTIVE_PULSE_CARDS,
} from "@/lib/soloPlanQuotas";
import type { DeckLoadState } from "../domain/types";
import { fetchPulseDeck } from "../services/pulseService";

export function usePulseDeck() {
  const { locale } = useLanguage();
  const { isActive, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [state, setState] = useState<DeckLoadState>({ status: "idle" });

  const deckLimit =
    isActive || isAdmin ? SOLO_ACTIVE_PULSE_CARDS : FREE_ACTIVE_PULSE_CARDS;

  const load = useCallback(async () => {
    if (subLoading || adminLoading) return;
    setState({ status: "loading" });
    const result = await fetchPulseDeck(locale, deckLimit);
    if ("error" in result) {
      setState({ status: "error", message: result.error });
      return;
    }
    setState({ status: "ready", cards: result.cards });
  }, [locale, deckLimit, subLoading, adminLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
