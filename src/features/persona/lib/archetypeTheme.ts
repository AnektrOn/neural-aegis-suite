import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Sword,
  Heart,
  Crown,
  Compass,
  Sparkles,
  Shield,
  Wand2,
  Flame,
  Laugh,
  Leaf,
  Eye,
} from "lucide-react";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";

const ICONS: Record<ArchetypeKey, LucideIcon> = {
  sage: BookOpen,
  warrior: Sword,
  lover: Heart,
  sovereign: Crown,
  explorer: Compass,
  creator: Sparkles,
  caregiver: Shield,
  magician: Wand2,
  rebel: Flame,
  mystic: Eye,
  jester: Laugh,
  healer: Leaf,
  child: Sparkles,
  victim: Shield,
  saboteur: Flame,
  prostitute: Wand2,
};

export function themeFor(key: AnyArchetypeKey) {
  const meta = archetypeMeta(key as ArchetypeKey);
  const k = key as ArchetypeKey;
  return {
    icon: ICONS[k] ?? Sparkles,
    color: meta?.color ?? "hsl(var(--primary))",
  };
}
