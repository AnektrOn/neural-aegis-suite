import { Card } from "@/components/ui/card";
import { BookOpenText } from "lucide-react";
import { buildNarrative, type NarrativeContext } from "./narrativeProfile";

type Props = NarrativeContext;

export function NarrativeProfileCard(props: Props) {
  const text = buildNarrative(props);
  if (!text) return null;

  return (
    <Card className="p-5 sm:p-6 border-primary/30 bg-gradient-to-br from-primary/5 via-background/30 to-secondary/5 backdrop-blur-3xl">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpenText className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-serif text-lg mb-2">
            {props.isFR ? "Ton récit archétypal" : "Your archetypal narrative"}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 italic">
            {text}
          </p>
        </div>
      </div>
    </Card>
  );
}
