export const CITY_NAMES = [
  "Paris", "London", "Madrid", "Berlin", "Rome", "Amsterdam", "Vienna", "Lisbon",
  "Athens", "Prague", "Budapest", "Warsaw", "Stockholm", "Copenhagen", "Oslo",
  "Helsinki", "Dublin", "Edinburgh", "Brussels", "Zurich", "Munich", "Hamburg",
  "Barcelona", "Seville", "Valencia", "Milan", "Naples", "Florence", "Venice",
  "Turin", "Marseille", "Lyon", "Nice", "Bordeaux", "Porto", "Geneva", "Bern",
  "Krakow", "Reykjavik", "Tallinn", "Riga", "Vilnius", "Bucharest", "Sofia",
  "Belgrade", "Zagreb", "Ljubljana", "Sarajevo", "Bratislava", "Antwerp",
];

export function pickFreshCityNames(count, taken = []) {
  const lowerTaken = new Set(taken.map((n) => n.toLowerCase()));
  const pool = CITY_NAMES.filter((c) => !lowerTaken.has(c.toLowerCase()));
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.length >= count) return shuffled.slice(0, count);
  const extras = [];
  let n = 2;
  while (extras.length + shuffled.length < count) {
    for (const base of CITY_NAMES) {
      const candidate = `${base} ${n}`;
      if (!lowerTaken.has(candidate.toLowerCase())) {
        extras.push(candidate);
        if (extras.length + shuffled.length >= count) break;
      }
    }
    n++;
  }
  return [...shuffled, ...extras].slice(0, count);
}
