-- Repair toolbox items whose duration label was stored as NaN:NaN
-- (missing duration_min in widget_config, then formatted as a clock).

UPDATE public.toolbox_assignments ta
SET
  duration = src.mins::text || ' min',
  widget_config = jsonb_set(
    COALESCE(ta.widget_config, '{}'::jsonb),
    '{duration_min}',
    to_jsonb(src.mins)
  )
FROM (
  SELECT
    id,
    COALESCE(
      NULLIF(
        CASE
          WHEN widget_config->>'duration_min' ~ '^[0-9]+(\.[0-9]+)?$'
            THEN floor((widget_config->>'duration_min')::numeric)::int
          ELSE 0
        END,
        0
      ),
      NULLIF(
        CASE
          WHEN duration ~* 'nan' THEN 0
          WHEN duration ~ '[0-9]+' THEN (regexp_match(duration, '([0-9]+)'))[1]::int
          ELSE 0
        END,
        0
      ),
      10
    ) AS mins
  FROM public.toolbox_assignments
  WHERE content_type = 'focus_introspectif'
    AND (
      duration IS NULL
      OR btrim(duration) = ''
      OR duration ~* 'nan'
      OR widget_config IS NULL
      OR COALESCE(widget_config->>'duration_min', '') !~ '^[1-9]'
    )
) src
WHERE ta.id = src.id;
