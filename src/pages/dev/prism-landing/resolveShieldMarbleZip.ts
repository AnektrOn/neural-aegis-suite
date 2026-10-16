/** Prefer highest-res / bit-depth MaterialX zip (e.g. 2k_16b over 1k_8b). */
const marbleZipLoaders = import.meta.glob<string>(
  "./assets/textures/Marble_Orange_Streaks*.zip",
  { query: "?url", import: "default" },
);

function marbleZipScore(path: string): number {
  let score = 0;
  if (/2k/i.test(path)) score += 100;
  else if (/1k/i.test(path)) score += 10;
  if (/16b/i.test(path)) score += 20;
  else if (/8b/i.test(path)) score += 5;
  return score;
}

export async function resolveShieldMarbleZipUrl(): Promise<string> {
  const paths = Object.keys(marbleZipLoaders);
  if (paths.length === 0) {
    throw new Error(
      "Aucune archive Marble_Orange_Streaks*.zip dans assets/textures.",
    );
  }

  paths.sort((a, b) => marbleZipScore(b) - marbleZipScore(a));
  const load = marbleZipLoaders[paths[0]];
  return await load();
}
