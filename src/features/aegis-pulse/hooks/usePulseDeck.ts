import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DeckLoadState } from "../domain/types";
import { fetchPulseDeck } from "../services/pulseService";

export function usePulseDeck() {
  const { locale } = useLanguage();
  const [state, setState] = useState<DeckLoadState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await fetchPulseDeck(locale);
    if (!result.ok) {
      setState({ status: "error", message: result.error });
      return;
    }
    setState({ status: "ready", cards: result.cards });
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
