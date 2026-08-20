import { useCallback, useEffect, useState } from "react";

const KEY = "aegis:free-preview";
const EVENT = "aegis:free-preview-changed";

export function isFreePreviewOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setFreePreview(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Admin-only "see the app as a free member" toggle. */
export function useFreePreview() {
  const [enabled, setEnabled] = useState(isFreePreviewOn);

  useEffect(() => {
    const sync = () => setEnabled(isFreePreviewOn());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => setFreePreview(!isFreePreviewOn()), []);

  return { enabled, toggle, setEnabled: setFreePreview };
}
