import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Network, LayoutGrid, Plus, X, Save, Trash2,
  TrendingUp, Send, MessageSquare, ChevronDown, Star,
  AlertCircle, CheckCircle2, Edit3, ArrowLeft, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { PeoplePlacesPanel } from "@/components/PeoplePlacesPanel";

const NeuralMap = lazy(() => import("@/components/NeuralMap"));
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CONTACT_PROXIMITY_LABELS,
  CONTACT_PROXIMITY_VALUES,
  DEFAULT_CONTACT_PROXIMITY,
  type ContactProximity,
  normalizeContactProximity,
} from "@/lib/contactProximity";

type MapPeriod = "1d" | "3d" | "7d" | "14d" | "1m" | "3m" | "6m" | "1y" | "all";

const MAP_PERIOD_KEYS: Record<MapPeriod, string> = {
  "1d": "1J", "3d": "3J", "7d": "1 Sem", "14d": "2 Sem",
  "1m": "people.tf.1m", "3m": "people.tf.3m", "6m": "people.tf.6m", "1y": "people.tf.1y", all: "people.tf.all",
};
const MAP_PERIOD_PLAIN: Partial<Record<MapPeriod, string>> = {
  "1d": "1J", "3d": "3J", "7d": "1 Sem", "14d": "2 Sem",
};

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
  proximity?: string | null;
}

interface QualityHistory {
  id: string;
  contact_id: string;
  quality: number;
  recorded_at: string;
  note: string | null;
}

const qualityColor = (q: number) => {
  if (q >= 8) return "hsl(176 70% 48%)";
  if (q >= 6) return "hsl(35 80% 55%)";
  return "hsl(0 70% 50%)";
};

const qualityBg = (q: number) => {
  if (q >= 8) return "hsl(176 70% 48% / 0.12)";
  if (q >= 6) return "hsl(35 80% 55% / 0.12)";
  return "hsl(0 70% 50% / 0.12)";
};

const qualityLabel = (q: number) => {
  if (q >= 8) return "Excellente";
  if (q >= 6) return "Bonne";
  if (q >= 4) return "Neutre";
  return "À relancer";
};

type Period = "1d" | "7d" | "30d" | "90d" | "quarter" | "semester" | "year";

const periodDays: Record<Period, number> = {
  "1d": 1, "7d": 7, "30d": 30, "90d": 90, quarter: 90, semester: 180, year: 365,
};

const NEURAL_RECENT_LOGS_LIMIT = 500;
const NEURAL_LOGS_PER_CONTACT = 3;

function formatNeuralLogDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Panneau md+ : liste des relations et derniers entrées relation_quality_history */
function NeuralRelationsSidebar({
  people,
  localQualities,
  localProximities,
  logsByContact,
  onOpenHistory,
}: {
  people: Person[];
  localQualities: Record<string, number>;
  localProximities: Record<string, ContactProximity>;
  logsByContact: Record<string, QualityHistory[]>;
  onOpenHistory: (p: Person) => void;
}) {
  const { t } = useLanguage();
  return (
    <aside
      className="hidden md:flex flex-col w-full md:max-w-[20rem] lg:max-w-[22rem] shrink-0 rounded-2xl border border-white/[0.06] overflow-hidden min-h-0"
      style={{
        background: "hsl(220 15% 7% / 0.92)",
        maxHeight: "min(520px, calc(100vh - 12rem))",
      }}
    >
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Relations</p>
        <p className="text-[11px] text-white/25 mt-0.5">Derniers journaux par contact</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {people.map((person) => {
          const q = localQualities[person.id] ?? person.quality;
          const px = localProximities[person.id] ?? normalizeContactProximity(person.proximity);
          const logs = logsByContact[person.id] ?? [];
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onOpenHistory(person)}
              className="w-full text-left px-3 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
            >
              <div className="flex items-start gap-2.5">
                <Avatar name={person.name} quality={q} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white/90 truncate">{person.name}</span>
                    <QualityBadge value={q} />
                  </div>
                  {person.role && (
                    <p className="text-[10px] text-white/30 truncate mt-0.5">{person.role}</p>
                  )}
                  <p className="text-[9px] uppercase tracking-[0.1em] text-white/35 mt-1">
                    {CONTACT_PROXIMITY_LABELS[px]}
                  </p>
                  {logs.length === 0 ? (
                    <p className="text-[11px] text-white/20 mt-2 italic">{t("people.noRecentJournal")}</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {logs.map((h) => (
                        <li
                          key={h.id}
                          className="rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] text-white/30 tabular-nums">
                              {formatNeuralLogDate(h.recorded_at)}
                            </span>
                            <span
                              className="text-[10px] font-medium tabular-nums shrink-0"
                              style={{ color: qualityColor(h.quality) }}
                            >
                              {h.quality}/10
                            </span>
                          </div>
                          {h.note && (
                            <p className="text-[11px] text-white/45 mt-1 line-clamp-2 leading-snug">
                              « {h.note} »
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Initials avatar ────────────────────────────────────────────────────────
function Avatar({ name, quality, size = "md" }: { name: string; quality: number; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-2xl flex items-center justify-center font-['Cormorant_Garamond'] font-semibold shrink-0 transition-all`}
      style={{
        background: qualityBg(quality),
        border: `1.5px solid ${qualityColor(quality)}40`,
        color: qualityColor(quality),
      }}
    >
      {initials}
    </div>
  );
}

// ─── Quality pill ────────────────────────────────────────────────────────────
function QualityBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
      style={{ background: qualityBg(value), color: qualityColor(value) }}
    >
      <span className="font-['Cormorant_Garamond'] text-xs font-semibold">{value}</span>
      <span className="opacity-60">/10</span>
    </span>
  );
}

// ─── Mobile-optimized range slider ──────────────────────────────────────────
function QualitySlider({
  value, onChange, id,
}: { value: number; onChange: (v: number) => void; id: string }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">Note relation</span>
        <QualityBadge value={value} />
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/[0.06]" />
        <div
          className="absolute left-0 h-1 rounded-full transition-all"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(0 70% 50%), ${qualityColor(value)})` }}
        />
        <input
          type="range" min={1} max={10} value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-6 opacity-0 cursor-pointer"
          style={{ WebkitAppearance: "none" }}
        />
        <div
          className="absolute w-5 h-5 rounded-full border-2 shadow-lg pointer-events-none transition-all"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: "hsl(220 15% 10%)",
            borderColor: qualityColor(value),
            boxShadow: `0 0 12px ${qualityColor(value)}50`,
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-white/20">
        <span>Difficile</span>
        <span className="font-medium" style={{ color: `${qualityColor(value)}80` }}>{qualityLabel(value)}</span>
        <span>Excellente</span>
      </div>
    </div>
  );
}

// ─── Person card (mobile-first) ──────────────────────────────────────────────
function PersonCard({
  person, localQ, localPx, localNote, hasChanges,
  onQualityChange, onProximityChange, onNoteChange,
  onHistory, onDelete,
}: {
  person: Person;
  localQ: number;
  localPx: ContactProximity;
  localNote: string;
  hasChanges: boolean;
  onQualityChange: (v: number) => void;
  onProximityChange: (v: ContactProximity) => void;
  onNoteChange: (v: string) => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        hasChanges
          ? "ring-1 ring-primary/40 shadow-[0_0_24px_hsl(176_70%_48%/0.08)]"
          : ""
      }`}
      style={{ background: "hsl(220 15% 8% / 0.7)", backdropFilter: "blur(12px)" }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.02] transition-colors"
      >
        <Avatar name={person.name} quality={localQ} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
            {hasChanges && (
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-white/35 truncate">{person.role || "—"}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <QualityBadge value={localQ} />
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-white/20" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06] pt-4">
              {/* Proximity select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.14em] text-white/30">
                  Proximité
                </label>
                <div className="relative">
                  <select
                    value={localPx}
                    onChange={(e) => onProximityChange(e.target.value as ContactProximity)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 appearance-none pr-8"
                  >
                    {CONTACT_PROXIMITY_VALUES.map((v) => (
                      <option key={v} value={v}>{CONTACT_PROXIMITY_LABELS[v]}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Quality slider */}
              <QualitySlider value={localQ} onChange={onQualityChange} id={person.id} />

              {/* Note textarea */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/30">
                  <MessageSquare size={9} />
                  Note du jour
                </label>
                <textarea
                  value={localNote}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder={t("people.notePlaceholder")}
                  rows={2}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-foreground/80 placeholder:text-white/20 focus:outline-none focus:border-primary/30 transition-colors resize-none"
                />
              </div>

              {/* Insight */}
              {person.insight && (
                <p className="text-xs text-white/30 italic leading-relaxed border-l-2 border-white/[0.06] pl-3">
                  {person.insight}
                </p>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={onHistory}
                  className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-primary transition-colors py-2 px-3 rounded-xl hover:bg-primary/5"
                >
                  <TrendingUp size={12} />
                  {t("people.seeEvolution")}
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-destructive transition-colors py-2 px-3 rounded-xl hover:bg-destructive/5"
                >
                  <Trash2 size={12} />
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip({ people }: { people: Person[] }) {
  if (!people.length) return null;
  const avg = (people.reduce((s, p) => s + p.quality, 0) / people.length).toFixed(1);
  const high = people.filter((p) => p.quality >= 8).length;
  const low = people.filter((p) => p.quality < 5).length;

  return (
    <div className="flex items-stretch gap-px overflow-hidden rounded-2xl border border-white/[0.06]">
      {[
        { label: "Moy.", value: avg, icon: <Star size={10} />, color: "text-white/50" },
        { label: "Top", value: high, icon: <CheckCircle2 size={10} />, color: "text-emerald-400/70" },
        { label: "Relancer", value: low, icon: <AlertCircle size={10} />, color: "text-red-400/70" },
      ].map((stat, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-2"
          style={{ background: "hsl(220 15% 8% / 0.6)" }}
        >
          <div className={`flex items-center gap-1 ${stat.color} text-[9px] uppercase tracking-[0.12em]`}>
            {stat.icon}
            {stat.label}
          </div>
          <span className="font-['Cormorant_Garamond'] text-xl text-white/70">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Add person sheet (mobile bottom sheet) ──────────────────────────────────
function AddPersonSheet({
  open, onClose, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "", role: "", quality: 7, insight: "",
    proximity: DEFAULT_CONTACT_PROXIMITY as ContactProximity,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ name: "", role: "", quality: 7, insight: "", proximity: DEFAULT_CONTACT_PROXIMITY });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-white/[0.08] pb-safe"
        style={{ background: "hsl(220 15% 7%)", maxHeight: "92dvh", overflowY: "auto" }}
      >
        <SheetHeader className="mb-6">
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-4" />
          <SheetTitle className="text-foreground text-lg font-['Cormorant_Garamond']">
            Nouveau contact
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-white/30">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Sarah Chen"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-foreground placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-white/30">{t("people.roleLabel")}</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder={t("people.rolePlaceholder")}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-foreground placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.14em] text-white/30">Proximité</label>
            <div className="relative">
              <select
                value={form.proximity}
                onChange={(e) => setForm({ ...form, proximity: e.target.value as ContactProximity })}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary/40 appearance-none pr-8"
              >
                {CONTACT_PROXIMITY_VALUES.map((v) => (
                  <option key={v} value={v}>{CONTACT_PROXIMITY_LABELS[v]}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
            <p className="text-[10px] text-white/20">{t("people.proximityHint")}</p>
          </div>

          <QualitySlider
            value={form.quality}
            onChange={(v) => setForm({ ...form, quality: v })}
            id="new-person"
          />

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.14em] text-white/30">Observation</label>
            <input
              type="text"
              value={form.insight}
              onChange={(e) => setForm({ ...form, insight: e.target.value })}
              placeholder={t("people.observationsPlaceholder")}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm text-foreground placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, hsl(176 70% 48% / 0.15), hsl(176 70% 48% / 0.08))",
              border: "1px solid hsl(176 70% 48% / 0.3)",
              color: "hsl(176 70% 48%)",
            }}
          >
            <Save size={14} />
            Ajouter le contact
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── History sheet ────────────────────────────────────────────────────────────
function HistorySheet({
  open, person, onClose, period, onPeriodChange, chartData, history, periodLabels,
}: {
  open: boolean;
  person: Person | null;
  onClose: () => void;
  period: Period;
  onPeriodChange: (p: Period) => void;
  chartData: any[];
  history: QualityHistory[];
  periodLabels: Record<Period, string>;
}) {
  const { t } = useLanguage();
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/[0.08] p-3 shadow-xl text-xs"
        style={{ background: "hsl(220 15% 7%)" }}>
        <p className="text-white/40 mb-1">{label}</p>
        <p className="font-['Cormorant_Garamond'] text-base" style={{ color: qualityColor(d.quality) }}>
          {d.quality}/10
        </p>
        {d.note && <p className="text-white/50 mt-1 italic max-w-[160px]">"{d.note}"</p>}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-white/[0.08] pb-safe"
        style={{ background: "hsl(220 15% 7%)", maxHeight: "92dvh", overflowY: "auto" }}
      >
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />

        {person && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <Avatar name={person.name} quality={person.quality} size="lg" />
            <div>
              <h3 className="text-lg font-['Cormorant_Garamond'] text-foreground">{person.name}</h3>
              <p className="text-xs text-white/35">{person.role || "—"}</p>
            </div>
            <div className="ml-auto">
              <QualityBadge value={person.quality} />
            </div>
          </div>
        )}

        {/* Period tabs — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-[0.14em] transition-all border ${
                period === p
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-white/[0.06] text-white/30 hover:text-white/50"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-44 mb-5">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 15%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220 10% 40%)" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "hsl(220 10% 40%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="quality"
                  stroke="hsl(176 70% 48%)" strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(176 70% 48%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full rounded-2xl border border-white/[0.04]">
              <p className="text-white/25 text-sm text-center px-6">
                {chartData.length === 1
                  ? t("people.singleDataPoint")
                  : t("people.noDataPeriod")}
              </p>
            </div>
          )}
        </div>

        {/* History log */}
        {history.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/25 mb-3 px-1">
              Journal
            </p>
            <div className="space-y-1">
              {[...history].reverse().map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-3 py-3 px-3 rounded-xl"
                  style={{ background: "hsl(220 15% 10% / 0.5)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: qualityColor(h.quality) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-['Cormorant_Garamond']"
                        style={{ color: qualityColor(h.quality) }}
                      >
                        {h.quality}/10
                      </span>
                      <span className="text-[10px] text-white/25">
                        {new Date(h.recorded_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-xs text-white/50 mt-0.5 italic truncate">"{h.note}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PeopleBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const periodLabels: Record<Period, string> = {
    "1d": t("people.periodDay"), "7d": t("people.period7d"), "30d": t("people.period30d"),
    "90d": t("people.period90d"), quarter: t("people.periodQuarter"),
    semester: t("people.periodSemester"), year: t("people.periodYear"),
  };

  const [view, setView] = useState<"neural" | "card" | "places">("card");
  const [people, setPeople] = useState<Person[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historySheet, setHistorySheet] = useState<{ open: boolean; person: Person | null }>({ open: false, person: null });
  const [history, setHistory] = useState<QualityHistory[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [localQualities, setLocalQualities] = useState<Record<string, number>>({});
  const [localProximities, setLocalProximities] = useState<Record<string, ContactProximity>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mapPeriod, setMapPeriod] = useState<MapPeriod>("all");
  const [saving, setSaving] = useState(false);
  const [neuralLogsByContact, setNeuralLogsByContact] = useState<Record<string, QualityHistory[]>>({});

  useEffect(() => { if (user) loadPeople(); }, [user]);

  useEffect(() => {
    if (view !== "neural" || !user || people.length === 0) {
      setNeuralLogsByContact({});
      return;
    }
    let cancelled = false;
    const ids = people.map((p) => p.id);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("relation_quality_history")
          .select("*")
          .eq("user_id", user.id)
          .in("contact_id", ids)
          .order("recorded_at", { ascending: false })
          .limit(NEURAL_RECENT_LOGS_LIMIT);
        if (cancelled || error) {
          if (error) console.error("neural sidebar logs:", error.message);
          return;
        }
        const rows = (data ?? []) as QualityHistory[];
        const sorted = [...rows].sort(
          (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        );
        const by: Record<string, QualityHistory[]> = {};
        for (const row of sorted) {
          if (!by[row.contact_id]) by[row.contact_id] = [];
          if (by[row.contact_id].length < NEURAL_LOGS_PER_CONTACT) by[row.contact_id].push(row);
        }
        if (!cancelled) setNeuralLogsByContact(by);
      } catch (e) {
        console.error("neural sidebar logs:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, user, people]);

  const loadPeople = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("people_contacts").select("*").eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) {
      setPeople(data as any);
      const quals: Record<string, number> = {};
      const prox: Record<string, ContactProximity> = {};
      (data as any[]).forEach((p: Person) => {
        quals[p.id] = p.quality;
        prox[p.id] = normalizeContactProximity(p.proximity);
      });
      setLocalQualities(quals);
      setLocalProximities(prox);
      setLocalNotes({});
    }
    setLoading(false);
  };

  const handleCreate = async (form: any) => {
    if (!user) return;
    const { error } = await supabase.from("people_contacts").insert({
      user_id: user.id, name: form.name, role: form.role || null,
      quality: form.quality, insight: form.insight || null, proximity: form.proximity,
    } as any);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("people.contactAdded") });
      setShowAddSheet(false);
      loadPeople();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("people_contacts").delete().eq("id", id);
    loadPeople();
  };

  const handleLocalQualityChange = (id: string, quality: number) => {
    setLocalQualities((prev) => ({ ...prev, [id]: quality }));
    setHasUnsavedChanges(true);
  };
  const handleLocalNoteChange = (id: string, note: string) => {
    setLocalNotes((prev) => ({ ...prev, [id]: note }));
    setHasUnsavedChanges(true);
  };
  const handleLocalProximityChange = (id: string, proximity: ContactProximity) => {
    setLocalProximities((prev) => ({ ...prev, [id]: proximity }));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    if (!user || saving) return;
    setSaving(true);
    const updates: Promise<any>[] = [];
    for (const person of people) {
      const newQ = localQualities[person.id] ?? person.quality;
      const newPx = localProximities[person.id] ?? normalizeContactProximity(person.proximity);
      const note = localNotes[person.id];
      const qualityChanged = newQ !== person.quality;
      const proximityChanged = newPx !== normalizeContactProximity(person.proximity);
      const hasNote = note && note.trim().length > 0;

      if (qualityChanged || proximityChanged) {
        updates.push((async () => {
          const patch: { quality?: number; proximity?: string } = {};
          if (qualityChanged) patch.quality = newQ;
          if (proximityChanged) patch.proximity = newPx;
          await supabase.from("people_contacts").update(patch as any).eq("id", person.id);
        })());
      }
      if (qualityChanged || hasNote) {
        updates.push((async () => {
          await supabase.from("relation_quality_history").insert({
            contact_id: person.id, user_id: user.id,
            quality: qualityChanged ? newQ : person.quality,
            note: hasNote ? note!.trim() : null,
          } as any);
        })());
      }
    }
    if (updates.length === 0) {
      toast({ title: t("common.noChangesToSave") });
      setSaving(false);
      return;
    }
    await Promise.all(updates);
    toast({ title: t("people.relationsUpdated", { count: updates.length }) });
    setHasUnsavedChanges(false);
    setLocalNotes({});
    setSaving(false);
    loadPeople();
  };

  const openHistory = async (person: Person) => {
    setHistorySheet({ open: true, person });
    loadHistory(person.id);
  };

  const loadHistory = async (contactId: string) => {
    const since = new Date();
    since.setDate(since.getDate() - periodDays[period]);
    const { data } = await supabase
      .from("relation_quality_history").select("*").eq("contact_id", contactId)
      .gte("recorded_at", since.toISOString()).order("recorded_at", { ascending: true });
    if (data) setHistory(data as any);
  };

  useEffect(() => {
    if (historySheet.person) loadHistory(historySheet.person.id);
  }, [period]);

  const chartData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    quality: h.quality,
    note: h.note,
  }));

  return (
    <div
      className={`space-y-5 ${isMobile ? "pb-44" : "pb-32"} ${view === "neural" || view === "places" ? "max-w-7xl" : "max-w-6xl"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-neural-label mb-1">{t("people.relationalIntelligence")}</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">
            {t("people.boardTitle")}
          </h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          <button
            onClick={() => setView("card")}
            className={`p-2.5 rounded-xl border transition-all ${
              view === "card"
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            <LayoutGrid size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setView("neural")}
            className={`p-2.5 rounded-xl border transition-all ${
              view === "neural"
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            <Network size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setView("places")}
            className={`p-2.5 rounded-xl border transition-all ${
              view === "places"
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            }`}
            title={t("people.placesTab")}
          >
            <MapPin size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsStrip people={people} />

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : people.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 py-20 rounded-3xl border border-white/[0.05]"
          style={{ background: "hsl(220 15% 8% / 0.5)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(220 15% 12%)", border: "1px solid hsl(220 15% 18%)" }}
          >
            <Users size={24} strokeWidth={1} className="text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-sm text-white/40 mb-1">{t("common.noContactsHint")}</p>
            <p className="text-xs text-white/20">Commencez par ajouter votre premier contact</p>
          </div>
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
            style={{
              background: "hsl(176 70% 48% / 0.1)",
              border: "1px solid hsl(176 70% 48% / 0.25)",
              color: "hsl(176 70% 48%)",
            }}
          >
            <Plus size={14} />
            Ajouter un contact
          </button>
        </motion.div>
      ) : view === "places" ? (
        <PeoplePlacesPanel contacts={people.map((p) => ({ id: p.id, name: p.name }))} />
      ) : view === "neural" ? (
        <div className="flex flex-col gap-4 md:min-h-[min(720px,calc(100vh-12rem))] md:flex-row md:items-stretch">
          <div className="flex flex-1 min-h-[min(520px,70vh)] min-w-0 flex-col md:min-h-[min(640px,calc(100vh-14rem))]">
            <div
              className="flex overflow-x-auto border-b border-white/[0.06]"
              style={{ scrollbarWidth: "none" }}
            >
              {(Object.keys(MAP_PERIOD_KEYS) as MapPeriod[]).map((id) => {
                const k = MAP_PERIOD_KEYS[id];
                const label = MAP_PERIOD_PLAIN[id] ?? t(k as any);
                return (
                  <button
                    key={id}
                    onClick={() => setMapPeriod(id)}
                    className={[
                      "flex-shrink-0 whitespace-nowrap border-r border-white/[0.05] bg-transparent px-3 py-2 font-sans text-[9px] uppercase tracking-[0.14em] transition-colors",
                      mapPeriod === id
                        ? "border-b border-white/60 bg-white/[0.03] text-white/90"
                        : "text-white/20 hover:text-white/45",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Suspense
              fallback={
                <div
                  className="flex w-full items-center justify-center rounded-2xl border border-white/[0.06] bg-black"
                  style={{ minHeight: 480 }}
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              }
            >
              <NeuralMap
                people={people}
                proximityById={localProximities}
                qualityById={localQualities}
                onPersonClick={openHistory}
                showFilters={false}
                period={mapPeriod}
                onPeriodChange={setMapPeriod}
                immersive
              />
            </Suspense>
          </div>
          <NeuralRelationsSidebar
            people={people}
            localQualities={localQualities}
            localProximities={localProximities}
            logsByContact={neuralLogsByContact}
            onOpenHistory={openHistory}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {people.map((person, i) => {
            const localQ = localQualities[person.id] ?? person.quality;
            const localPx = localProximities[person.id] ?? normalizeContactProximity(person.proximity);
            const localNote = localNotes[person.id] ?? "";
            const changed = localQ !== person.quality;
            const proxChanged = localPx !== normalizeContactProximity(person.proximity);
            const hasChanges = changed || proxChanged || localNote.trim().length > 0;
            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PersonCard
                  person={person}
                  localQ={localQ}
                  localPx={localPx}
                  localNote={localNote}
                  hasChanges={hasChanges}
                  onQualityChange={(v) => handleLocalQualityChange(person.id, v)}
                  onProximityChange={(v) => handleLocalProximityChange(person.id, v)}
                  onNoteChange={(v) => handleLocalNoteChange(person.id, v)}
                  onHistory={() => openHistory(person)}
                  onDelete={() => handleDelete(person.id)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating bottom bar — sticky action buttons */}
      <AnimatePresence>
        {(hasUnsavedChanges || true) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={
              isMobile
                ? "fixed left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bottom-[calc(3.5rem+var(--safe-bottom))]"
                : "fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 pb-safe"
            }
            style={{
              background: "linear-gradient(to top, hsl(220 15% 6%) 60%, transparent)",
              backdropFilter: "blur(12px)",
            }}
          >
            {hasUnsavedChanges && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={saveAllChanges}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, hsl(176 70% 38%), hsl(176 60% 30%))",
                  color: "hsl(176 70% 90%)",
                  boxShadow: "0 8px 32px hsl(176 70% 48% / 0.25)",
                }}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {saving ? "Enregistrement…" : "Synchroniser les relations"}
              </motion.button>
            )}
            <button
              onClick={() => setShowAddSheet(true)}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.97] ${
                hasUnsavedChanges ? "w-14 shrink-0" : "flex-1"
              }`}
              style={{
                background: hasUnsavedChanges
                  ? "hsl(220 15% 14%)"
                  : "linear-gradient(135deg, hsl(176 70% 38%), hsl(176 60% 30%))",
                border: hasUnsavedChanges ? "1px solid hsl(220 15% 20%)" : "none",
                color: hasUnsavedChanges ? "hsl(220 10% 55%)" : "hsl(176 70% 90%)",
                boxShadow: hasUnsavedChanges ? "none" : "0 8px 32px hsl(176 70% 48% / 0.25)",
              }}
            >
              <Plus size={16} />
              {!hasUnsavedChanges && "Ajouter un contact"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add sheet */}
      <AddPersonSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSubmit={handleCreate}
      />

      {/* History sheet */}
      <HistorySheet
        open={historySheet.open}
        person={historySheet.person}
        onClose={() => setHistorySheet({ open: false, person: null })}
        period={period}
        onPeriodChange={setPeriod}
        chartData={chartData}
        history={history}
        periodLabels={periodLabels}
      />
    </div>
  );
}