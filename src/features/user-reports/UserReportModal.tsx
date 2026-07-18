import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import type { UserReport } from "./types";
import { parseFrontmatter, filterMarkdownByLocale } from "./parseReportMd";

interface Props {
  report: UserReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserReportModal({ report, open, onOpenChange }: Props) {
  const { locale } = useLanguage();

  const body = useMemo(() => {
    if (!report) return "";
    const { body } = parseFrontmatter(report.content_md);
    return filterMarkdownByLocale(body, locale);
  }, [report, locale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-cormorant-display text-2xl flex items-center gap-2">
            {report?.glyph ? <span aria-hidden>{report.glyph}</span> : null}
            <span>{report?.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-2 -mr-2">
          <article className="prose prose-invert prose-sm max-w-none prose-headings:font-cormorant-display prose-headings:font-normal prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
