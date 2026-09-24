import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Film,
  Map,
  Scan,
  Sparkles,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

type DevFeature = {
  path: string;
  title: string;
  titleEn: string;
  blurb: string;
  blurbEn: string;
  status: "active" | "playground" | "film";
  tags: string[];
  icon: typeof Sparkles;
  accent: string;
};

const FEATURES: DevFeature[] = [
  {
    path: "/dev/dien-chan",
    title: "Diện Chẩn",
    titleEn: "Dien Chan",
    blurb: "Carte faciale 3D, points BQC, protocoles et playback.",
    blurbEn: "3D face map, BQC points, protocols and playback.",
    status: "active",
    tags: ["three.js", "wireframe", "BQC"],
    icon: Map,
    accent: "from-teal-500/20 to-cyan-500/5",
  },
  {
    path: "/dev/body-scan",
    title: "Body Scan",
    titleEn: "Body Scan",
    blurb: "Figure skinned Mixamo Xbot + zones de scan corporelles.",
    blurbEn: "Mixamo Xbot skinned figure + body-scan zones.",
    status: "active",
    tags: ["GLTF", "skinning", "toolbox"],
    icon: Scan,
    accent: "from-emerald-500/20 to-lime-500/5",
  },
  {
    path: "/dev/storytelling",
    title: "Storytelling",
    titleEn: "Storytelling",
    blurb: "Chapitres narratifs 3D (brouillard, réseau, gourde…).",
    blurbEn: "Narrative 3D chapters (fog, network, gourd…).",
    status: "active",
    tags: ["R3F", "chapters", "GLB"],
    icon: Film,
    accent: "from-amber-500/20 to-orange-500/5",
  },
  {
    path: "/dev/promote",
    title: "Promote",
    titleEn: "Promote",
    blurb: "Film promo scène par scène (phone chrome + director HUD).",
    blurbEn: "Scene-by-scene promo film (phone chrome + director HUD).",
    status: "film",
    tags: ["scenes", "HUD", "demo"],
    icon: Film,
    accent: "from-rose-500/20 to-pink-500/5",
  },
  {
    path: "/dev/quantum-nebula",
    title: "Quantum Nebula",
    titleEn: "Quantum Nebula",
    blurb: "Tuning audio / visuel de la nébuleuse générative.",
    blurbEn: "Audio / visual tuning for the generative nebula.",
    status: "playground",
    tags: ["particles", "audio", "WebGL"],
    icon: Waves,
    accent: "from-sky-500/20 to-indigo-500/5",
  },
  {
    path: "/dev/toolbox-nebula",
    title: "Toolbox × Nebula",
    titleEn: "Toolbox × Nebula",
    blurb: "Exercices toolbox branchés sur les presets nébuleuse.",
    blurbEn: "Toolbox exercises wired to nebula presets.",
    status: "playground",
    tags: ["toolbox", "presets", "widgets"],
    icon: Sparkles,
    accent: "from-violet-500/20 to-fuchsia-500/5",
  },
  {
    path: "/dev/aegis-core",
    title: "Aegis Core",
    titleEn: "Aegis Core",
    blurb: "Évolution céleste — états seed / emerging / evolved.",
    blurbEn: "Celestial evolution — seed / emerging / evolved states.",
    status: "playground",
    tags: ["3D", "evolution"],
    icon: Box,
    accent: "from-slate-500/20 to-zinc-500/5",
  },
];

const STATUS_LABEL: Record<DevFeature["status"], { fr: string; en: string }> = {
  active: { fr: "En cours", en: "Active" },
  playground: { fr: "Playground", en: "Playground" },
  film: { fr: "Film", en: "Film" },
};

export default function DevLabPage() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
      />

      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/" aria-label={isFR ? "Retour" : "Back"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dev lab
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight">
              {isFR ? "Features en cours" : "Work in progress"}
            </h1>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex font-mono text-[10px]">
            {FEATURES.length} previews
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          {isFR
            ? "Hub des prototypes /dev — Diện Chẩn, body scan, storytelling, promote, nébuleuses."
            : "Hub for /dev prototypes — Dien Chan, body scan, storytelling, promote, nebulas."}
        </p>

        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.path}>
                <Link
                  to={feature.path}
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4 transition",
                    "hover:border-primary/40 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition group-hover:opacity-100",
                      feature.accent,
                    )}
                  />
                  <div className="relative flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                      <Icon className="h-4 w-4 text-foreground/80" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-semibold tracking-tight">
                          {isFR ? feature.title : feature.titleEn}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] font-normal"
                        >
                          {isFR
                            ? STATUS_LABEL[feature.status].fr
                            : STATUS_LABEL[feature.status].en}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {isFR ? feature.blurb : feature.blurbEn}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-border/50 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                          {feature.path}
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
