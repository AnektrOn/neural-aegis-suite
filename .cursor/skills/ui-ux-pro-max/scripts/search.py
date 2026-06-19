#!/usr/bin/env python3
"""
UI/UX Pro Max search CLI.

Place optional CSV datasets in ./data/ next to this file (e.g. product.csv, style.csv).
Expected columns: flexible — rows are matched if any cell contains the query (case-insensitive).

Without CSVs, returns heuristic guidance so the workflow still runs.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        return [dict(row) for row in reader]


def _row_matches(query: str, row: dict[str, str]) -> bool:
    q = query.lower()
    for v in row.values():
        if v and q in str(v).lower():
            return True
    return False


def _search_domain(domain: str, query: str, limit: int) -> list[dict[str, str]]:
    files = sorted(DATA_DIR.glob(f"{domain}.csv"))
    if not files:
        files = sorted(DATA_DIR.glob("*.csv"))
    hits: list[dict[str, str]] = []
    for fp in files:
        if domain != "any" and fp.stem != domain:
            continue
        try:
            rows = _read_csv_rows(fp)
        except OSError:
            continue
        for row in rows:
            if _row_matches(query, row):
                hits.append({"_source": fp.name, **row})
                if len(hits) >= limit:
                    return hits
    return hits


def _ascii_box(title: str, lines: list[str]) -> str:
    body = "\n".join(lines)
    width = max(len(title), max((len(s) for s in lines), default=0)) + 4
    bar = "═" * (width - 2)
    out = [f"╔{bar}╗", f"║ {title.ljust(width - 4)} ║", f"╠{bar}╣"]
    for line in lines:
        out.append(f"║ {line.ljust(width - 4)} ║")
    out.append(f"╚{bar}╝")
    return "\n".join(out)


def _heuristic_design_system(query: str, project: str | None) -> tuple[list[str], list[str]]:
    q = query.lower()
    style = "minimal, content-first"
    palette = "neutral surfaces + one strong brand accent; semantic tokens (primary, surface, error)"
    typo = "Inter / system UI stack; clear type scale (12–32)"
    if any(k in q for k in ("fintech", "bank", "finance", "crypto")):
        style = "trust-forward, dense data-friendly, restrained motion"
        palette = "navy/slate neutrals + teal or blue accent; tested dark mode pairs"
        typo = "Professional grotesk + tabular figures for numbers"
    elif any(k in q for k in ("beauty", "spa", "wellness")):
        style = "soft elevation, generous whitespace, subtle gradients"
        palette = "warm neutrals + sage or blush accent"
        typo = "Elegant serif headlines + clean sans body"
    elif any(k in q for k in ("game", "gaming", "entertainment")):
        style = "high contrast, bold type, expressive motion (respect reduced-motion)"
        palette = "deep background + saturated accents; avoid red/green-only status"
        typo = "Display sans / geometric for UI; avoid tiny body on mobile"
    elif any(k in q for k in ("saas", "dashboard", "admin", "b2b")):
        style = "efficient density, strong tables/forms, predictable nav"
        palette = "cool neutrals + single accent ramp; semantic status colors"
        typo = "Inter / IBM Plex / Source Sans; 16px body minimum on web"

    anti = [
        "Emoji as icons",
        "Raw hex sprinkled in components",
        "Hover-only critical actions",
        "Removing visible focus",
    ]
    lines = [
        f"Project: {project or '(unnamed)'}",
        f"Query: {query}",
        "",
        f"Style direction: {style}",
        f"Color direction: {palette}",
        f"Typography direction: {typo}",
        "",
        "Add CSVs under .cursor/skills/ui-ux-pro-max/scripts/data/ for database-backed matches.",
        "Full checklists: .cursor/skills/ui-ux-pro-max/reference.md",
    ]
    return lines, anti


def _emit_design_system(query: str, fmt: str, project: str | None) -> str:
    lines, anti = _heuristic_design_system(query, project)
    lines.extend(["", "Anti-patterns to avoid:"])
    lines.extend([f"- {a}" for a in anti])
    if fmt == "markdown":
        body = "\n".join(lines)
        return f"## Design system (heuristic)\n\n{body}\n"
    return _ascii_box("Design system (heuristic)", lines)


def _persist_design_system(query: str, project: str | None, page: str | None) -> None:
    base = Path.cwd() / "design-system"
    base.mkdir(parents=True, exist_ok=True)
    master = _emit_design_system(query, "markdown", project)
    (base / "MASTER.md").write_text(
        "# Design system — MASTER\n\n"
        + master
        + "\n\n---\n\n"
        + "Overrides: see `design-system/pages/<page>.md` when present.\n",
        encoding="utf-8",
    )
    if page:
        pdir = base / "pages"
        pdir.mkdir(parents=True, exist_ok=True)
        safe = re.sub(r"[^a-z0-9_-]+", "-", page.lower()).strip("-") or "page"
        (pdir / f"{safe}.md").write_text(
            f"# Page override: {page}\n\n"
            "Prioritize these rules over MASTER for this page only.\n\n"
            f"_Generated from query:_ `{query}`\n",
            encoding="utf-8",
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="UI/UX Pro Max domain search")
    parser.add_argument("query", nargs="*", help="Search query text")
    parser.add_argument("--design-system", action="store_true", help="Emit full heuristic design system")
    parser.add_argument("--domain", help="Domain name matching data/<domain>.csv")
    parser.add_argument("--stack", help="Stack hint (passed through to output)")
    parser.add_argument("-n", type=int, default=10, help="Max results for domain search")
    parser.add_argument("-p", dest="project", help="Project name label")
    parser.add_argument("-f", dest="format", default="ascii", choices=("ascii", "markdown"))
    parser.add_argument("--persist", action="store_true", help="Write design-system/MASTER.md (+ optional page)")
    parser.add_argument("--page", help="Page name for override file when using --persist")
    args = parser.parse_args()
    query = " ".join(args.query).strip()
    if not query:
        parser.error("Provide a query string")

    if args.design_system:
        out = _emit_design_system(query, "markdown" if args.format == "markdown" else "ascii", args.project)
        print(out)
        if args.persist:
            _persist_design_system(query, args.project, args.page)
            print("\nWrote design-system/MASTER.md", end="")
            if args.page:
                print(f" and design-system/pages/*.md for page={args.page!r}")
            else:
                print()
        return 0

    domain = args.domain or "any"
    hits = _search_domain(domain, query, args.n)
    if args.stack:
        print(f"[stack:{args.stack}]", file=sys.stderr)

    if not hits:
        print(
            f"No CSV matches for domain={domain!r} query={query!r}. "
            f"Drop files into {DATA_DIR} (e.g. ux.csv) or use --design-system.",
            file=sys.stderr,
        )
        print(_emit_design_system(query, "ascii", args.project))
        return 0

    for row in hits:
        bits = [f"{k}={v}" for k, v in row.items() if v and not str(v).isspace()]
        print(" | ".join(bits))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
