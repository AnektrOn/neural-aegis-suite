import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUturnLeftIcon,
  Bars3CenterLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { createAppIcon } from "@/lib/icons/appIcon";
import { FilledCircle } from "@/lib/icons/custom/FilledCircle";

export const X = createAppIcon(XMarkIcon, "X");
export const Loader2 = createAppIcon(ArrowPathIcon, "Loader2");
export const ArrowLeft = createAppIcon(ArrowLeftIcon, "ArrowLeft");
export const ArrowRight = createAppIcon(ArrowRightIcon, "ArrowRight");
export const Check = createAppIcon(CheckIcon, "Check");
export const ChevronDown = createAppIcon(ChevronDownIcon, "ChevronDown");
export const ChevronLeft = createAppIcon(ChevronLeftIcon, "ChevronLeft");
export const ChevronRight = createAppIcon(ChevronRightIcon, "ChevronRight");
export const ChevronUp = createAppIcon(ChevronUpIcon, "ChevronUp");
export const MoreHorizontal = createAppIcon(EllipsisHorizontalIcon, "MoreHorizontal");
export const Search = createAppIcon(MagnifyingGlassIcon, "Search");
export const HelpCircle = createAppIcon(QuestionMarkCircleIcon, "HelpCircle");
export const RotateCcw = createAppIcon(ArrowUturnLeftIcon, "RotateCcw");
export const Settings2 = createAppIcon(Cog6ToothIcon, "Settings2");
export const PanelLeft = createAppIcon(Bars3CenterLeftIcon, "PanelLeft");
export const GripVertical = createAppIcon(EllipsisVerticalIcon, "GripVertical");
export const Circle = FilledCircle;
export const Dot = FilledCircle;