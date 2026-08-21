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
    setStatus("loading");
    const timer = window.setTimeout(() => {
      void loadUserAssessmentForPdf(meta, locale).then((next) => {
        if (cancelled) return;
        setAssessment(next);
        setStatus(next ? "found" : "missing");
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [markdown, locale]);

  return { assessment, status, handle };
}
