/** Last N calendar days (oldest → newest), averaged mood value per day (0 if none). */
export function buildDailyMoodSeries(
  moods: Array<{ value: number; logged_at: string }>,
  days = 7,
): number[] {
  const byDay = new Map<string, number[]>();
  for (const m of moods) {
    const day = m.logged_at.split("T")[0];
    const bucket = byDay.get(day);
    if (bucket) bucket.push(m.value);
    else byDay.set(day, [m.value]);
  }

  const series: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const vals = byDay.get(key);
    series.push(vals?.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  }
  return series;
}

export function computeMoodWeekTrend(
  moods: Array<{ value: number; logged_at: string }>,
): { moodTrend: "up" | "down" | "stable"; moodDelta: number } {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const thisWeek = moods.filter((m) => new Date(m.logged_at) >= thisWeekStart);
  const lastWeek = moods.filter(
    (m) => new Date(m.logged_at) >= lastWeekStart && new Date(m.logged_at) < thisWeekStart,
  );

  const avg = (arr: typeof moods) =>
    arr.length > 0 ? arr.reduce((s, m) => s + m.value, 0) / arr.length : 0;

  const delta = +(avg(thisWeek) - avg(lastWeek)).toFixed(1);
  return {
    moodTrend: delta > 0.3 ? "up" : delta < -0.3 ? "down" : "stable",
    moodDelta: Math.abs(delta),
  };
}
