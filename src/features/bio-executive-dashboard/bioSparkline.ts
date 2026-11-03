/** Map mood values (0–10) to SVG polyline points in viewBox 0 0 width x height. */
export function moodSeriesToPolyline(
  series: number[],
  width: number,
  height: number,
  paddingY = 8,
): string {
  if (series.length === 0) return "";
  const innerH = height - paddingY * 2;
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  const points = series.map((v, i) => {
    const x = series.length > 1 ? i * step : width / 2;
    const norm = Math.max(0, Math.min(10, v)) / 10;
    const y = height - paddingY - norm * innerH;
    return `${x},${y}`;
  });
  return points.join(" ");
}

export function scoreTrendToPolyline(
  scores: number[],
  width: number,
  height: number,
  paddingY = 8,
): string {
  if (scores.length === 0) return "";
  const innerH = height - paddingY * 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;
  const step = scores.length > 1 ? width / (scores.length - 1) : 0;
  const points = scores.map((v, i) => {
    const x = scores.length > 1 ? i * step : width / 2;
    const norm = (v - min) / span;
    const y = height - paddingY - norm * innerH;
    return `${x},${y}`;
  });
  return points.join(" ");
}

export function sparklineAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function sparklineDeltaVsPrevious(scores: number[]): number | null {
  if (scores.length < 2) return null;
  return scores[scores.length - 1] - scores[scores.length - 2];
}

export function formatSparklineDelta(scores: number[]): string | null {
  const delta = sparklineDeltaVsPrevious(scores);
  if (delta == null) return null;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} vs hier`;
}

export function sparklineY(
  value: number,
  scores: number[],
  height: number,
  paddingY = 8,
): number {
  if (scores.length === 0) return height / 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;
  const innerH = height - paddingY * 2;
  return height - paddingY - ((value - min) / span) * innerH;
}
