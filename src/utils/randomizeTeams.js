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

function squashKey(s) {
  return nameKey(s).replace(/ /g, "");
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function allowedTypos(len) {
  if (len <= 4) return 0;
  if (len <= 7) return 1;
  return 2;
}

// Players whose names look like `name` but aren't an exact (lenient) match:
// spacing differences ("Tay Code" vs "TayCode") or small typos ("Jay Najia" vs "JayNaija").
export function similarPlayers(name, allPlayers) {
  const key = nameKey(name);
  const squashed = squashKey(name);
  if (!squashed) return [];
  const hits = [];
  for (const p of allPlayers) {
    if (nameKey(p.name) === key) continue;
    const other = squashKey(p.name);
    const limit = allowedTypos(Math.min(squashed.length, other.length));
    if (other === squashed || editDistance(squashed, other) <= limit) hits.push(p);
  }
  return hits;
}

// `resolutions` maps nameKey(line) to a player (picked by hand) or null (skipped).
export function resolveNames(rawText, allPlayers, resolutions = {}) {
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
  const seenIds = new Set();
  for (const line of lines) {
    const key = nameKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = byKey.get(key) ?? resolutions[key];
    if (hit === null) continue;
    if (!hit) {
      unmatched.push(line);
      continue;
    }
    if (seenIds.has(hit.id)) continue;
    seenIds.add(hit.id);
    matched.push(hit);
  }
  return { matched, unmatched };
}

export function runRandomize({ matchedPlayers, top4Ids = [], last4Ids = [], teamCount, perTeam, sizes = null }) {
  const caps = sizes && sizes.length
    ? sizes
    : Array.from({ length: teamCount }, () => perTeam);
  const tc = caps.length;
  const teams = Array.from({ length: tc }, () => []);

  const byId = new Map(matchedPlayers.map((p) => [p.id, p]));
  const placed = new Set();
  const place = (p, i) => {
    teams[i].push(p);
    placed.add(p.id);
  };

  // Spread a group of player ids across distinct, emptiest teams that have room.
  // Players already placed are skipped; if teams run out, the rest fall through
  // to the general round-robin below.
  const spread = (ids) => {
    const avail = teams
      .map((_, i) => i)
      .filter((i) => teams[i].length < caps[i])
      .sort((a, b) => teams[a].length - teams[b].length);
    for (const id of ids) {
      if (placed.has(id) || !byId.has(id)) continue;
      const i = avail.shift();
      if (i === undefined) break;
      place(byId.get(id), i);
    }
  };

  // 1. Leaderboard #1 is pinned to the last team.
  const firstId = top4Ids[0];
  if (tc && firstId !== undefined && byId.has(firstId)) place(byId.get(firstId), tc - 1);

  // 2. Remaining top-4 spread across the other teams.
  spread(shuffle(top4Ids.slice(1)));

  // 3. Last 4 pasted names spread so they don't share a team.
  spread(shuffle(last4Ids));

  let cursor = 0;

  for (const p of shuffle(matchedPlayers.filter((p) => !placed.has(p.id)))) {
    let scanned = 0;
    while (teams[cursor].length >= caps[cursor] && scanned < tc) {
      cursor = (cursor + 1) % tc;
      scanned++;
    }
    if (scanned >= tc) {
      // All caps reached — drop surplus into the smallest team.
      let minIdx = 0;
      for (let i = 1; i < tc; i++) {
        if (teams[i].length < teams[minIdx].length) minIdx = i;
      }
      teams[minIdx].push(p);
    } else {
      teams[cursor].push(p);
      cursor = (cursor + 1) % tc;
    }
  }

  const target = caps.reduce((a, b) => a + b, 0);
  return {
    teams,
    surplus: matchedPlayers.length - target,
  };
}
