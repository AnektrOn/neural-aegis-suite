import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  saveToolboxWritingToJournal,
} from "@/features/journal/saveToolboxWritingToJournal";

export interface ToolboxJournalMeta {
  slug: string;
  title: string;
}

export function useSaveToolboxWritingToJournal(meta?: ToolboxJournalMeta | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const saveWriting = useCallback(
    async (content: string, opts?: { extraTags?: string[]; moodScore?: number | null }) => {
      if (!meta?.slug) return true;
      setSaving(true);
      try {
        const result = await saveToolboxWritingToJournal({
          user,
          title: meta.title,
          content,
          slug: meta.slug,
          extraTags: opts?.extraTags,
          moodScore: opts?.moodScore,
        });
        if (!result.ok) {
          toast({
            title: t("journal.saveError"),
            description: "error" in result ? result.error : undefined,
            variant: "destructive",
          });
          return false;
        }
        if (!("skipped" in result) || !result.skipped) {
          toast({ title: t("journal.entryAdded") });
        }
        return true;
      } finally {
        setSaving(false);
      }
    },
    [meta, t, toast, user],
  );

  return { saveWriting, saving };
}
