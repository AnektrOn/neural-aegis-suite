import type { PulseCardRow } from "./pulseAdminService";

/** Cartes visibles dans le scope admin selon le filtre user (catalogue / stats). */
export function cardsInUserScope(
  allCards: PulseCardRow[],
  userFilter: string,
): PulseCardRow[] {
  if (userFilter === "unassigned") {
    return allCards.filter((c) => !c.target_user_ids?.length);
  }
  if (userFilter !== "all") {
    return allCards.filter((c) => c.target_user_ids?.includes(userFilter));
  }
  return allCards;
}
