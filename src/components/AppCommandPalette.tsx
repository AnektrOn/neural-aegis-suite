import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useLanguage } from "@/i18n/LanguageContext";
import { APP_NAV_SECTIONS } from "@/lib/appNavConfig";

type AppCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickLog: () => void;
};

export default function AppCommandPalette({ open, onOpenChange, onQuickLog }: AppCommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const go = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate(to);
    },
    [navigate, onOpenChange],
  );

  const handleQuickLog = useCallback(() => {
    onOpenChange(false);
    onQuickLog();
  }, [onOpenChange, onQuickLog]);

  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("layout.commandSearch")} />
      <CommandList>
        <CommandEmpty>{t("layout.commandEmpty")}</CommandEmpty>
        <CommandGroup heading={t("layout.commandActions")}>
          <CommandItem value={`quick-log ${t("dashboard.quickLogCta")}`} onSelect={handleQuickLog}>
            <Plus size={16} strokeWidth={1.5} className="mr-2 shrink-0 opacity-70" />
            <span>{t("dashboard.quickLogCta")}</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {APP_NAV_SECTIONS.map((section) => (
          <CommandGroup key={section.id} heading={t(section.labelKey)}>
            {section.items.map((item) => (
              <CommandItem
                key={item.to}
                value={`${t(section.labelKey)} ${t(item.labelKey)} ${item.to}`}
                onSelect={() => go(item.to)}
              >
                <item.icon size={16} strokeWidth={1.5} className="mr-2 shrink-0 opacity-70" />
                <span>{t(item.labelKey)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
        <span className="font-display uppercase tracking-[0.14em]">{t("layout.commandHint")}</span>
        <CommandShortcut className="ml-2">{shortcutLabel}</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
