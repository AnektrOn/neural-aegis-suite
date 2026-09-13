import { useEffect, useState } from "react";
import { loadUserAssessmentForPdf } from "./loadUserAssessment";
import { pdfUserHandles, type MdPdfAssessment } from "./assessmentPrint";
import { resolveMdPdfMeta } from "./markdownToPrintHtml";

export function useMdPdfAssessment(markdown: string | undefined, locale: "fr" | "en") {
  const [assessment, setAssessment] = useState<MdPdfAssessment | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const [handle, setHandle] = useState("");

  useEffect(() => {
    if (!markdown?.trim()) {
      setAssessment(null);
      setStatus("idle");
      setHandle("");
      return;
    }
    const meta = resolveMdPdfMeta(markdown, "");
    const handles = pdfUserHandles(meta.user, meta.tags);
    setHandle(handles[0] ?? "");
    if (handles.length === 0) {
      setAssessment(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let failSafe = 0;
    setStatus("loading");
    const timer = window.setTimeout(() => {
      failSafe = window.setTimeout(() => {
        if (cancelled) return;
        // Don't leave the studio stuck on "loading" if Supabase hangs.
        setStatus((prev) => (prev === "loading" ? "missing" : prev));
      }, 8_000);
      void loadUserAssessmentForPdf(meta, locale)
        .then((next) => {
          if (cancelled) return;
          window.clearTimeout(failSafe);
          setAssessment(next);
          setStatus(next ? "found" : "missing");
        })
        .catch((err) => {
          console.error("[md-pdf] assessment lookup failed", err);
          if (cancelled) return;
          window.clearTimeout(failSafe);
          setAssessment(null);
          setStatus("missing");
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(failSafe);
    };
  }, [markdown, locale]);

  return { assessment, status, handle };
}
