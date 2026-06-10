/** True when unmount should count as user abandoning an exercise (not backgrounding). */
export function shouldTreatUnmountAsAbandon(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}
