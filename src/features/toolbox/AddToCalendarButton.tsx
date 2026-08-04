import { useState } from "react";
import { CalendarPlus, Apple, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  parseDurationMinutes,
  type CalendarEventInput,
} from "@/lib/calendar-export";

interface AddToCalendarButtonProps {
  title: string;
  description?: string | null;
  duration?: string | null;
  url?: string;
  compact?: boolean;
}

export default function AddToCalendarButton({
  title,
  description,
  duration,
  url,
  compact = false,
}: AddToCalendarButtonProps) {
  const { t } = useLanguage();
  const [daily, setDaily] = useState(false);

  const event = (): CalendarEventInput => ({
    title,
    description: description ?? undefined,
    durationMin: parseDurationMinutes(duration),
    recurringDaily: daily,
    url,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex min-h-[34px] items-center gap-1.5 rounded-full border border-border/50 bg-background/30 px-3 text-[9px] uppercase tracking-[0.14em] text-text-secondary transition-colors hover:border-primary/40 hover:text-primary ${
            compact ? "px-2" : ""
          }`}
        >
          <CalendarPlus size={12} />
          {compact ? null : t("calendarExport.button")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          {t("calendarExport.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setDaily((v) => !v);
          }}
          className="text-xs"
        >
          <span className="flex size-4 items-center justify-center">{daily ? <Check size={12} /> : null}</span>
          {t("calendarExport.daily")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs"
          onSelect={() => window.open(buildGoogleCalendarUrl(event()), "_blank", "noopener,noreferrer")}
        >
          <CalendarPlus size={13} />
          {t("calendarExport.google")}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={() => downloadIcs(event())}>
          <Apple size={13} />
          {t("calendarExport.ics")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
