import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AnalyticsData } from "@/hooks/useAnalyticsData";
import type { TranslationKey } from "@/i18n/translations";
import { useAegisMotion } from "@/hooks/useAegisMotion";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(24 72% 58%)",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(220, 70%, 60%)",
];

interface AnalyticsChartsProps {
  data: AnalyticsData;
  t: (key: TranslationKey) => string;
}

export function AnalyticsCharts({ data, t }: AnalyticsChartsProps) {
  const { fadeUp } = useAegisMotion();
  const { moodData, sleepStressData, habitData, decisionData } = data;

  const decisionPieData = [
    { name: t("analytics.decisionPending"), value: decisionData.pending },
    { name: t("analytics.decisionDecided"), value: decisionData.decided },
    { name: t("analytics.decisionDeferred"), value: decisionData.deferred },
  ].filter((d) => d.value > 0);

  const habitRadialData =
    habitData.length > 0
      ? [
          {
            name: "Moy",
            taux: Math.round(habitData.reduce((s, d) => s + d.taux, 0) / habitData.length),
            fill: COLORS[0],
          },
        ]
      : [];

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    color: "hsl(var(--foreground))",
  };

  return (
    <>
      <motion.div {...fadeUp()} className="dashboard-panel p-4 sm:p-8">
        <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
          {t("analytics.mood30d")}
        </p>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="humeur"
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], r: 3 }}
                name={t("analytics.moodKey")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp(0.1)} className="dashboard-panel p-8">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
            {t("analytics.sleepStressTrends")}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="sommeil" stroke={COLORS[5]} strokeWidth={2} dot={{ r: 2 }} name={t("analytics.sleepKey")} />
                <Line type="monotone" dataKey="stress" stroke={COLORS[4]} strokeWidth={2} dot={{ r: 2 }} name={t("analytics.stressKey")} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="dashboard-panel p-8">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
            {t("analytics.mealsPerDay")}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="repas" fill={COLORS[2]} radius={[6, 6, 0, 0]} name={t("analytics.mealsKey")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...fadeUp(0.2)} className="dashboard-panel p-8">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
            {t("analytics.habitCompletion7d")}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="jour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="complétées" fill={COLORS[3]} radius={[6, 6, 0, 0]} name={t("analytics.completedKey")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.25)} className="dashboard-panel p-8 flex flex-col items-center justify-center">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
            {t("analytics.avgCompletionRate")}
          </p>
          <div className="h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={habitRadialData} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="taux" cornerRadius={10} fill={COLORS[0]} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-2xl font-cormorant text-foreground mt-2">
            {habitRadialData.length > 0 ? `${habitRadialData[0].taux}%` : "—"}
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="dashboard-panel p-8">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-6">
            {t("analytics.decisionsOverview")}
          </p>
          {decisionPieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {decisionPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">{t("common.noDecisionYet")}</p>
            </div>
          )}
          <div className="text-center mt-2">
            <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70">
              {t("analytics.avgPriority")}
            </p>
            <p className="text-lg font-cormorant text-foreground">{decisionData.avgPriority}/5</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
