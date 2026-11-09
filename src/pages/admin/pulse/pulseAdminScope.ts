import type { PulseCardRow } from "./pulseAdminService";

/** Cartes visibles dans le scope admin selon le filtre user (catalogue / stats). */
export function cardsInUserScope(
  allCards: PulseCardRow[],
  userFilter: string,
): PulseCardRow[] {
  if (userFilter === "unassigned") {
    return allCards.filter(
      (c) => !Array.isArray(c.target_user_ids) || c.target_user_ids.length === 0,
    );
  }
  if (userFilter !== "all") {
    return allCards.filter(
      (c) =>
        Array.isArray(c.target_user_ids) && c.target_user_ids.includes(userFilter),
    );
  }
  return allCards;
}
