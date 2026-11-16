import {
  BookOpenIcon,
  CloudIcon,
  EyeIcon,
  HeartIcon,
  LinkIcon as HeroLinkIcon,
  QrCodeIcon,
  ShieldExclamationIcon,
  SparklesIcon,
  StarIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";
import { createAppIcon } from "@/lib/icons/appIcon";

export { Headphones } from "@/lib/icons/memberNav";
export { Zap } from "@/lib/icons/layoutChrome";

export const BookOpen = createAppIcon(BookOpenIcon, "BookOpen");
export const Eye = createAppIcon(EyeIcon, "Eye");
export const Heart = createAppIcon(HeartIcon, "Heart");
export const Link = createAppIcon(HeroLinkIcon, "Link");
export const Scan = createAppIcon(QrCodeIcon, "Scan");
export const ShieldAlert = createAppIcon(ShieldExclamationIcon, "ShieldAlert");
export const Sparkles = createAppIcon(SparklesIcon, "Sparkles");
export const Stars = createAppIcon(StarIcon, "Stars");
export const Target = createAppIcon(ViewfinderCircleIcon, "Target");
export const Wind = createAppIcon(CloudIcon, "Wind");