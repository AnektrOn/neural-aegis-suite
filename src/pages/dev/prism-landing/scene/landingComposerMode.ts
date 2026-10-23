/** `?composer=three` conserve le pipeline three/addons ; défaut = pmndrs sur landing travelling. */
export function readLandingUsePmndrsComposer(
  landingTravelling: boolean,
  search = typeof window !== "undefined" ? window.location.search : "",
): boolean {
  if (!landingTravelling) return false;
  const params = new URLSearchParams(search);
  return params.get("composer") !== "three";
}
