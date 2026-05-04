import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Database, Calendar as CalendarIcon, Users, Loader2, FileText, FileJson, FileArchive } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/i18n/LanguageContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MonthGrid, { MonthKey, monthsToRanges } from "@/features/admin-export/MonthGrid";
import UserPicker from "@/features/admin-export/UserPicker";
import { DATA_SOURCES, DataSourceKey, fetchSource } from "@/features/admin-export/dataSources";
import { exportCsvZip, exportJson, exportMarkdown } from "@/features/admin-export/exporters";

type Preset = "7d" | "30d" | "quarter" | "year" | null;

const PRESET_DEFS: { key: Exclude<Preset, null>; labelKey: "admin.export.preset7d" | "admin.export.preset30d" | "admin.export.presetQuarter" | "admin.export.presetYear"; days: number }[] = [
  { key: "7d", labelKey: "admin.export.preset7d", days: 7 },
  { key: "30d", labelKey: "admin.export.preset30d", days: 30 },
  { key: "quarter", labelKey: "admin.export.presetQuarter", days: 90 },
  { key: "year", labelKey: "admin.export.presetYear", days: 365 },
];

export default function AdminExport() {
  const { t, locale } = useLanguage();
  const dfLocale = locale === "fr" ? fr : enUS;
  const PRESETS = useMemo(
    () => PRESET_DEFS.map((p) => ({ ...p, label: t(p.labelKey) })),
    [t]
  );
  const [selectedSources, setSelectedSources] = useState<DataSourceKey[]>(["mood", "decisions", "habits"]);
  const [dateMode, setDateMode] = useState<"preset" | "custom" | "none">("preset");
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [months, setMonths] = useState<MonthKey[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const toggleSource = (k: DataSourceKey) =>
    setSelectedSources((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const toggleMonth = (m: MonthKey) =>
    setMonths((cur) => {
      const exists = cur.find((c) => c.year === m.year && c.month === m.month);
      return exists ? cur.filter((c) => !(c.year === m.year && c.month === m.month)) : [...cur, m];
    });

  const dateRange = useMemo(() => {
    if (dateMode === "preset" && preset) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - PRESET_DEFS.find((p) => p.key === preset)!.days);
      return { from, to };
    }
    if (dateMode === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return null;
  }, [dateMode, preset, customFrom, customTo]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    parts.push(t("admin.export.summaryTypes", { n: selectedSources.length }));
    if (dateRange) {
      parts.push(`${format(dateRange.from, "d MMM yyyy", { locale: dfLocale })} → ${format(dateRange.to, "d MMM yyyy", { locale: dfLocale })}`);
    } else if (months.length > 0) {
      parts.push(t("admin.export.summaryMonths", { n: months.length }));
    } else {
      parts.push(t("admin.export.summaryAllPeriods"));
    }
    parts.push(userIds.length === 0 ? t("admin.export.summaryAllUsers") : t("admin.export.summaryNUsers", { n: userIds.length }));
    return parts.join(" · ");
  }, [selectedSources, dateRange, months, userIds, t, dfLocale]);

  async function runExport(format: "csv" | "json" | "md") {
    if (selectedSources.length === 0) {
      toast.error(t("admin.export.errorSelectSource"));
      return;
    }
    setExporting(true);
    try {
      const ranges = months.length > 0 ? monthsToRanges(months) : dateRange ? [dateRange] : [null];

      const datasets = await Promise.all(
        selectedSources.map(async (key) => {
          const source = DATA_SOURCES.find((s) => s.key === key)!;
          const allRows: Record<string, any>[] = [];
          for (const r of ranges) {
            const rows = await fetchSource({
              source,
              userIds,
              fromIso: r ? r.from.toISOString() : null,
              toIso: r ? r.to.toISOString() : null,
            });
            allRows.push(...rows);
          }
          // dedupe by id if present
          const seen = new Set();
          const deduped = allRows.filter((row) => {
            const id = row.id;
            if (id && seen.has(id)) return false;
            if (id) seen.add(id);
            return true;
          });
          return { key, label: source.label, rows: deduped };
        })
      );

      const total = datasets.reduce((n, d) => n + d.rows.length, 0);
      const baseName = `aegis-export-${new Date().toISOString().slice(0, 10)}`;
      const meta = {
        sources: selectedSources,
        date_mode: dateMode,
        preset,
        custom_from: customFrom?.toISOString() ?? null,
        custom_to: customTo?.toISOString() ?? null,
        months: months.map((m) => `${m.year}-${String(m.month + 1).padStart(2, "0")}`),
        user_ids: userIds,
        total_rows: total,
      };

      if (format === "csv") await exportCsvZip(datasets, baseName);
      else if (format === "json") exportJson(datasets, baseName, meta);
      else exportMarkdown(datasets, baseName, meta);

      toast.success(t("admin.export.success", { n: total }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? t("admin.export.errorGeneric"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-[0.2em] uppercase text-text-primary">Export</h1>
        <p className="text-xs text-text-tertiary mt-1 tracking-wider">
          {t("admin.export.subtitle")}
        </p>
      </div>

      {/* Data Type */}
      <Section icon={Database} title={t("admin.export.sectionDataType")}>
        <div className="flex flex-wrap gap-2">
          {DATA_SOURCES.map((s) => {
            const active = selectedSources.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSource(s.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium tracking-wider border transition-all",
                  active
                    ? "bg-accent-warning/15 border-accent-warning/50 text-accent-warning shadow-[0_0_14px_-4px_hsl(var(--accent-warning)/0.5)]"
                    : "border-border-subtle text-text-secondary hover:border-accent-warning/30 hover:text-text-primary"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Date Range */}
      <Section icon={CalendarIcon} title={t("admin.export.sectionDateRange")}>
        <div className="flex gap-2 mb-4">
          {(["preset", "custom", "none"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDateMode(m)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest border transition",
                dateMode === m
                  ? "bg-accent-warning/15 border-accent-warning/50 text-accent-warning"
                  : "border-border-subtle text-text-tertiary hover:text-text-primary"
              )}
            >
              {m === "preset" ? t("admin.export.dateModePreset") : m === "custom" ? t("admin.export.dateModeCustom") : t("admin.export.dateModeNone")}
            </button>
          ))}
        </div>

        {dateMode === "preset" && (
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs border transition",
                  preset === p.key
                    ? "bg-accent-warning/15 border-accent-warning/50 text-accent-warning"
                    : "border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-warning/30"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {dateMode === "custom" && (
          <div className="flex flex-wrap gap-3">
            <DateField label={t("admin.export.dateFrom")} value={customFrom} onChange={setCustomFrom} dfLocale={dfLocale} pickLabel={t("admin.export.pickDate")} />
            <DateField label={t("admin.export.dateTo")} value={customTo} onChange={setCustomTo} dfLocale={dfLocale} pickLabel={t("admin.export.pickDate")} />
          </div>
        )}
      </Section>

      {/* Month Picker */}
      <Section icon={CalendarIcon} title={t("admin.export.sectionMonths")}>
        <MonthGrid selected={months} onToggle={toggleMonth} />
        {months.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {months
              .slice()
              .sort((a, b) => a.year - b.year || a.month - b.month)
              .map((m) => (
                <span
                  key={`${m.year}-${m.month}`}
                  className="px-2 py-1 rounded-md bg-accent-warning/10 border border-accent-warning/25 text-[11px] text-accent-warning"
                >
                  {format(new Date(m.year, m.month, 1), "MMM yyyy", { locale: dfLocale })}
                </span>
              ))}
            <button
              type="button"
              onClick={() => setMonths([])}
              className="px-2 py-1 text-[10px] uppercase tracking-widest text-text-tertiary hover:text-accent-warning"
            >
              {t("admin.export.clearMonths")}
            </button>
          </div>
        )}
        {months.length > 0 && dateMode !== "none" && (
          <p className="mt-2 text-[10px] text-text-tertiary tracking-wider">
            {t("admin.export.monthsOverrideHint")}
          </p>
        )}
      </Section>

      {/* Users */}
      <Section icon={Users} title={t("admin.export.sectionUsers")}>
        <UserPicker selected={userIds} onChange={setUserIds} />
      </Section>

      {/* Summary + Actions */}
      <div className="ethereal-glass rounded-2xl p-5 sticky bottom-4 backdrop-blur-3xl border border-border-subtle">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">{t("admin.export.activeSelection")}</div>
            <div className="text-sm text-text-primary truncate">{summary}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportBtn icon={FileArchive} label="CSV (zip)" disabled={exporting} onClick={() => runExport("csv")} />
            <ExportBtn icon={FileJson} label="JSON" disabled={exporting} onClick={() => runExport("json")} />
            <ExportBtn icon={FileText} label="Markdown" disabled={exporting} onClick={() => runExport("md")} />
          </div>
        </div>
        {exporting && (
          <div className="mt-3 flex items-center gap-2 text-xs text-accent-warning">
            <Loader2 size={14} className="animate-spin" /> {t("admin.export.preparing")}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="ethereal-glass rounded-2xl p-5 border border-border-subtle"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} strokeWidth={1.5} className="text-accent-warning" />
        <h2 className="font-display text-[11px] tracking-[0.25em] uppercase text-text-secondary">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function DateField({
  label,
  value,
  onChange,
  dfLocale,
  pickLabel,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
  dfLocale: typeof fr;
  pickLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "px-3 py-2 rounded-lg border border-border-subtle text-sm flex items-center gap-2 hover:border-accent-warning/40 transition",
            !value && "text-text-tertiary"
          )}
        >
          <CalendarIcon size={14} strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary">{label}</span>
          <span>{value ? format(value, "d MMM yyyy", { locale: dfLocale }) : pickLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function ExportBtn({ icon: Icon, label, onClick, disabled }: { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent-warning/40 bg-accent-warning/10 text-accent-warning hover:bg-accent-warning/20 hover:shadow-[0_0_18px_-4px_hsl(var(--accent-warning)/0.6)] transition-all disabled:opacity-50 disabled:pointer-events-none"
    >
      <Icon size={14} strokeWidth={1.5} />
      <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );
}
