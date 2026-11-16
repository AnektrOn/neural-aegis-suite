import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BoltIcon,
  CpuChipIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  GlobeAltIcon,
  LanguageIcon,
  MoonIcon,
  PlusIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { createAppIcon } from "@/lib/icons/appIcon";

export {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "@/lib/icons/primitives";
export { Settings2, Smartphone, Sparkles } from "@/lib/icons/memberNav";

export const LogOut = createAppIcon(ArrowRightOnRectangleIcon, "LogOut");
export const Shield = createAppIcon(ShieldCheckIcon, "Shield");
export const MoreVertical = createAppIcon(EllipsisVerticalIcon, "MoreVertical");
export const Languages = createAppIcon(LanguageIcon, "Languages");
export const LayoutGrid = createAppIcon(Squares2X2Icon, "LayoutGrid");
export const Plus = createAppIcon(PlusIcon, "Plus");
export const Menu = createAppIcon(Bars3Icon, "Menu");
export const Globe = createAppIcon(GlobeAltIcon, "Globe");
export const Bell = createAppIcon(BellIcon, "Bell");
export const Eye = createAppIcon(EyeIcon, "Eye");
export const EyeOff = createAppIcon(EyeSlashIcon, "EyeOff");
export const Brain = createAppIcon(CpuChipIcon, "Brain");
export const Flame = createAppIcon(FireIcon, "Flame");
export const Moon = createAppIcon(MoonIcon, "Moon");
export const Zap = createAppIcon(BoltIcon, "Zap");