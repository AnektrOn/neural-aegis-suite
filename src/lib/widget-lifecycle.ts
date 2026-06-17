/** Set while tab/app is backgrounded — unmount must not count as abandon. */
let suppressUnmountAbandon = false;
let guardsInstalled = false;

export function installWidgetLifecycleGuards(): void {
  if (typeof document === "undefined" || guardsInstalled) return;
  guardsInstalled = true;

  const markBackgrounded = () => {
    suppressUnmountAbandon = true;
  };
  const markForegrounded = () => {
    suppressUnmountAbandon = false;
  };

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") markBackgrounded();
      else markForegrounded();
    },
    { capture: true },
  );
  window.addEventListener("pagehide", markBackgrounded, { capture: true });
  window.addEventListener("blur", markBackgrounded, { capture: true });
  window.addEventListener("focus", markForegrounded, { capture: true });
}

/** True when unmount should count as user abandoning an exercise (not backgrounding). */
export function shouldTreatUnmountAsAbandon(): boolean {
  if (typeof document === "undefined") return true;
  if (suppressUnmountAbandon) return false;
  if (document.visibilityState === "hidden") return false;
  return true;
}
