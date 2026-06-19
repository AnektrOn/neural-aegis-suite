# Optional CSV data

Add one file per domain, named `<domain>.csv`, for example:

- `product.csv`, `style.csv`, `color.csv`, `typography.csv`, `landing.csv`, `chart.csv`, `ux.csv`, `google-fonts.csv`, `react.csv`, `web.csv`, `prompt.csv`

**Columns:** Any headers. A row matches the search query if any cell contains the query substring (case-insensitive).

For reasoning-heavy selection (as described in the skill narrative), add your own `ui-reasoning.csv` or extend `search.py` to rank results.
