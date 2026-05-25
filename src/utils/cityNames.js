export const CITY_NAMES = [
  "Paris", "London", "Madrid", "Berlin", "Rome", "Amsterdam", "Vienna", "Lisbon",
  "Athens", "Prague", "Budapest", "Warsaw", "Stockholm", "Copenhagen", "Oslo",
  "Helsinki", "Dublin", "Edinburgh", "Brussels", "Zurich", "Munich", "Hamburg",
  "Barcelona", "Seville", "Valencia", "Milan", "Naples", "Florence", "Venice",
  "Turin", "Marseille", "Lyon", "Nice", "Bordeaux", "Porto", "Geneva", "Bern",
  "Krakow", "Reykjavik", "Tallinn", "Riga", "Vilnius", "Bucharest", "Sofia",
  "Belgrade", "Zagreb", "Ljubljana", "Sarajevo", "Bratislava", "Antwerp",
];

export const BASE_COLORS = ["Red", "Blue", "White", "Black"];
export const EXTRA_COLORS = ["Yellow", "Green", "Orange", "Purple", "Pink"];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickTeamNames(count, taken = []) {
  if (count <= BASE_COLORS.length) {
    return BASE_COLORS.slice(0, count);
  }
  const lowerTaken = new Set(taken.map((n) => n.toLowerCase()));
  const cityPool = CITY_NAMES.filter((c) => !lowerTaken.has(c.toLowerCase()));
  const cities = shuffle(cityPool).slice(0, count);
  while (cities.length < count) cities.push(`Team ${cities.length + 1}`);
  const colorPool = shuffle([...BASE_COLORS, ...EXTRA_COLORS]);
  return cities.map((city, i) => `${city}(${colorPool[i % colorPool.length]})`);
}
