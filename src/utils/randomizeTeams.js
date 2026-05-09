function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Lenient name key: case-insensitive + collapses runs of whitespace to a single space.
// "Paul  Jimmy " vs "PAUL JIMMY" vs "paul jimmy" all map to "paul jimmy".
// Exported so any other player-name lookup uses the same normalizer.
export function nameKey(s) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolveNames(rawText, allPlayers) {
  const lines = rawText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const byKey = new Map();
  for (const p of allPlayers) {
    byKey.set(nameKey(p.name), p);
  }

  const matched = [];
  const unmatched = [];
  const seen = new Set();
  for (const line of lines) {
    const key = nameKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = byKey.get(key);
    if (hit) matched.push(hit);
    else unmatched.push(line);
  }
  return { matched, unmatched };
}

export function runRandomize({ matchedPlayers, top4Ids = [], teamCount, perTeam }) {
  const top4Set = new Set(top4Ids);
  const top4 = matchedPlayers.filter((p) => top4Set.has(p.id));
  const rest = matchedPlayers.filter((p) => !top4Set.has(p.id));

  const teams = Array.from({ length: teamCount }, () => []);

  const top4Shuffled = shuffle(top4).slice(0, teamCount);
  top4Shuffled.forEach((p, i) => teams[i].push(p));
  const startIdx = Math.min(top4.length, teamCount) % teamCount;

  shuffle(rest).forEach((p, i) => {
    teams[(startIdx + i) % teamCount].push(p);
  });

  const target = teamCount * perTeam;
  return {
    teams,
    surplus: matchedPlayers.length - target,
  };
}
