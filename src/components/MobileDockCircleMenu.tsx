import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM = 44;
const OPEN_STAGGER = 0.022;
const CLOSE_STAGGER = 0.052;
/** Space reserved above each satellite for the text label (points outward from hub). */
const LABEL_OUTER = 30;
/** Minimum margin from viewport edge to outermost label / button. */
const VIEW_MARGIN = 20;

function pointOnCircle(i: number, n: number, r: number) {
  const theta = (2 * Math.PI * i) / n - Math.PI / 2;
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

function maxOrbitRadius(viewW: number, viewH: number, n: number): number {
  const half = Math.min(viewW, viewH) / 2;
  const outerFromOrbit = ITEM / 2 + LABEL_OUTER;
  const fit = half - outerFromOrbit - VIEW_MARGIN;
  const preferred = 58 + n * 1.95;
  return Math.max(40, Math.min(fit, preferred));
}

export type MobileDockCircleItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
};

type MobileDockCircleMenuProps = {
  items: MobileDockCircleItem[];
  /** e.g. “Autres destinations” */
  ariaLabel: string;
  /** Dialog title (sr-only) */
  menuTitle: string;
  /** Ring on trigger when a shortcut route is active */
  hasActiveShortcut: boolean;
  /** Parent can lift nav z-index above the dim layer */
  onOpenChange?: (open: boolean) => void;
};

export function MobileDockCircleMenu({
  items,
  ariaLabel,
  menuTitle,
  hasActiveShortcut,
  onOpenChange,
}: MobileDockCircleMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState({ w: 390, h: 780 });
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const measureView = useCallback(() => {
    setView({
      w: window.innerWidth,
      h: window.innerHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureView();
    const vv = window.visualViewport;
    const onResize = () => measureView();
    window.addEventListener("resize", onResize);
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, [open, measureView]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const spring = reduceMotion
    ? { type: "tween" as const, duration: 0.16, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 400, damping: 32 };

  const n = items.length;
  const orbitR = maxOrbitRadius(view.w, view.h, n);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) measureView();
      return next;
    });
  };

  const portal =
    mounted && open
      ? createPortal(
          <>
            <motion.div
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[94] bg-bg-base/70 backdrop-blur-[4px]"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-dock-radial-title"
              className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center overflow-visible p-4"
              style={
                {
                  paddingTop: "max(1rem, var(--safe-top, env(safe-area-inset-top, 0px)))",
                  paddingBottom: "max(1rem, var(--safe-bottom, env(safe-area-inset-bottom, 0px)))",
                  paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
                  paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
                } as React.CSSProperties
              }
            >
              <span id="mobile-dock-radial-title" className="sr-only">
                {menuTitle}
              </span>
              <div className="pointer-events-auto relative flex h-0 w-0 shrink-0 items-center justify-center">
                {items.map((item, index) => {
                  const { x, y } = pointOnCircle(index, n, orbitR);
                  return (
                    <motion.div
                      key={item.to}
                      className="absolute left-0 top-0"
                      initial={false}
                      animate={{
                        x: open ? x : 0,
                        y: open ? y : 0,
                        opacity: open ? 1 : 0,
                        scale: open ? 1 : 0.42,
                      }}
                      transition={{
                        ...spring,
                        delay: open ? index * OPEN_STAGGER : (n - 1 - index) * CLOSE_STAGGER,
                      }}
                      style={{ marginLeft: -ITEM / 2, marginTop: -ITEM / 2 }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        title={item.label}
                        aria-current={item.isActive ? "page" : undefined}
                        className={cn(
                          "relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border text-text-secondary shadow-[0_6px_22px_hsl(0_0%_0%/0.14)] transition-colors duration-200 active:scale-95",
                          item.isActive
                            ? "border-accent-primary/55 bg-accent-primary/18 text-accent-primary"
                            : "border-border-subtle bg-bg-surface hover:border-accent-primary/40 hover:bg-bg-elevated hover:text-accent-primary",
                        )}
                        style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                      >
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 max-w-[4.75rem] -translate-x-1/2 text-center font-barlow text-[7px] font-medium uppercase leading-tight tracking-[0.1em] text-text-tertiary line-clamp-2 sm:text-[8px]">
                          {item.label}
                        </span>
                        <item.Icon size={18} strokeWidth={1.5} aria-hidden className="shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative flex h-14 w-[52px] shrink-0 flex-col items-center justify-center overflow-visible">
        <motion.button
          type="button"
          onClick={toggle}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            "relative z-[2] flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_4px_18px_hsl(0_0%_0%/0.1)] outline-none transition-all duration-200 active:scale-95",
            open
              ? "border-accent-primary bg-accent-primary text-primary-foreground shadow-[0_0_26px_hsl(var(--primary)/0.28)]"
              : cn(
                  "border-border-subtle bg-bg-elevated text-accent-primary hover:border-accent-primary/45 hover:bg-accent-primary/12",
                  hasActiveShortcut && "ring-1 ring-accent-primary/40 ring-offset-2 ring-offset-background",
                ),
          )}
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" } as React.CSSProperties}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, scale: 0.65, rotate: -50 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.65, rotate: 40 }}
                transition={{ duration: 0.17 }}
                className="flex items-center justify-center"
              >
                <X size={20} strokeWidth={1.75} aria-hidden />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ opacity: 0, scale: 0.65 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.65 }}
                transition={{ duration: 0.17 }}
                className="flex items-center justify-center"
              >
                <LayoutGrid size={19} strokeWidth={1.5} aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      {portal}
    </>
  );
}
