import { useEffect, useId, useRef, useState } from "react";

let mermaidReady: Promise<typeof import("mermaid")> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "inherit",
        flowchart: { htmlLabels: true, curve: "basis" },
      });
      return mod;
    });
  }
  return mermaidReady;
}

export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || !source.trim()) return;

    const renderId = `aegis-mermaid-${reactId}-${Date.now()}`;

    void loadMermaid()
      .then((mod) => mod.default.render(renderId, source))
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Impossible de rendre le diagramme");
      });

    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  if (error) {
    return (
      <details className="rounded-xl border border-border-subtle/40 bg-black/15 p-4">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.12em] text-text-tertiary">
          Diagramme archétypal (source)
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
          {source}
        </pre>
      </details>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-xl border border-[hsl(var(--aegis-warm)/0.15)] bg-black/25 p-3 sm:p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      aria-label="Diagramme Mermaid"
    />
  );
}
