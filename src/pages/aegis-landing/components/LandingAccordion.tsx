import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingAccordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <Accordion type="single" collapsible className="w-full border-t border-[color:var(--aegis-hairline)]">
      {items.map((item, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="border-b border-[color:var(--aegis-hairline)]">
          <AccordionTrigger
            className="min-h-[44px] py-4 text-left font-barlow text-base hover:no-underline [&[data-state=open]]:text-[color:var(--aegis-text)]"
          >
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-4 leading-relaxed text-[color:var(--aegis-text-secondary)]">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
