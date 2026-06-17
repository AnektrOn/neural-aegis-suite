/**
 * Houses72HouseNav — 12-house chip navigation strip.
 */

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { HOUSES_72_QUESTIONS_PER_HOUSE } from "../../archetype-assessment/domain/questionsHouses72";
import { getHouse72Title, getHouse72Theme } from "../../archetype-assessment/domain/houses72Locale";

interface Props {
  populatedHouses: number[];
  activeHouse: number;
  completionMap: Record<number, number>;
  onSelectHouse: (house: number) => void;
}

type HouseStatus = "not-started" | "partial" | "complete";

function getStatus(house: number, completionMap: Record<number, number>): HouseStatus {
  const count = completionMap[house] ?? 0;
  if (count === 0) return "not-started";
  if (count >= HOUSES_72_QUESTIONS_PER_HOUSE) return "complete";
  return "partial";
}

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

export function Houses72HouseNav({
  populatedHouses,
  activeHouse,
  completionMap,
  onSelectHouse,
}: Props) {
  const { locale, t } = useLanguage();

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
          const populated = populatedHouses.includes(house);
          const status = populated ? getStatus(house, completionMap) : "not-started";
          const isActive = house === activeHouse;
          const title = getHouse72Title(house, locale);

          return (
            <button
              key={house}
              type="button"
              disabled={!populated}
              onClick={() => populated && onSelectHouse(house)}
              title={title}
              aria-label={`${t("houses72.houseLabel", { roman: ROMAN[house] ?? String(house) })} — ${title}${!populated ? ` ${t("houses72.houseComingSoon")}` : ""}`}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-12 h-12 rounded-full text-xs font-semibold transition-all duration-200",
                "border-2 select-none",
                isActive && "ring-2 ring-offset-2 ring-primary/70",
                !populated && "border-muted/40 text-muted/40 cursor-not-allowed bg-transparent",
                populated && status === "not-started" && "border-muted text-muted-foreground bg-transparent hover:border-primary/50 hover:text-primary cursor-pointer",
                populated && status === "partial" && "border-primary/60 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer",
                populated && status === "complete" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer",
              )}
            >
              {status === "complete" && (
                <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-primary bg-background rounded-full" />
              )}
              <span>{ROMAN[house]}</span>
            </button>
          );
        })}
      </div>

      {activeHouse && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-foreground">{getHouse72Title(activeHouse, locale)}</p>
          <p className="text-xs text-muted-foreground">{getHouse72Theme(activeHouse, locale)}</p>
        </div>
      )}
    </div>
  );
}
