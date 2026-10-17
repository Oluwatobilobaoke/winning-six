// Run with: node --test src/utils/randomizeTeams.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveNames, runRandomize, similarPlayers } from "./randomizeTeams.js";

const players = Array.from({ length: 24 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Player ${i + 1}`,
}));

const top4Ids = players.slice(0, 4).map((p) => p.id); // p1 is the #1
const last4Ids = players.slice(-4).map((p) => p.id); // p21..p24, disjoint from top4

const teamOf = (teams, id) => teams.findIndex((t) => t.some((p) => p.id === id));

test("4-team case: #1 always in last team, last-4 never share a team", () => {
  for (let run = 0; run < 200; run++) {
    const { teams } = runRandomize({
      matchedPlayers: players,
      top4Ids,
      last4Ids,
      teamCount: 4,
      perTeam: 7,
    });

    assert.equal(teams.length, 4, "should produce 4 teams");

    // Scenario 1: leaderboard #1 is pinned to the last team.
    assert.equal(teamOf(teams, top4Ids[0]), 3, "#1 must be in the last team");

    // Scenario 2: the last 4 pasted names land in distinct teams.
    const last4Teams = last4Ids.map((id) => teamOf(teams, id));
    assert.ok(
      last4Teams.every((i) => i !== -1),
      "all last-4 players must be placed"
    );
    assert.equal(
      new Set(last4Teams).size,
      4,
      "last-4 players must each be in a different team"
    );

    // Sanity: every player placed exactly once.
    const flat = teams.flat().map((p) => p.id);
    assert.equal(flat.length, players.length, "all players placed");
    assert.equal(new Set(flat).size, players.length, "no duplicate placements");
  }
});

test("similarPlayers: flags spacing and small typos, ignores exact and unrelated names", () => {
  const roster = [
    { id: "a", name: "TayCode" },
    { id: "b", name: "JayNaija" },
    { id: "c", name: "Tobi" },
    { id: "d", name: "Ifeanyi" },
  ];
  const names = (n) => similarPlayers(n, roster).map((p) => p.name);

  assert.deepEqual(names("Tay Code"), ["TayCode"]);
  assert.deepEqual(names("Jay Najia"), ["JayNaija"]);
  assert.deepEqual(names("jay naija"), ["JayNaija"]);
  assert.deepEqual(names("taycode"), [], "exact lenient match is not a 'did you mean'");
  assert.deepEqual(names("Toby"), [], "short names need an exact match to avoid false alarms");
  assert.deepEqual(names("Bolade"), []);
});

test("resolveNames: hand-picked and skipped names keep pasted order and never double up", () => {
  const roster = [
    { id: "a", name: "TayCode" },
    { id: "b", name: "JayNaija" },
    { id: "c", name: "Tobi" },
  ];
  const raw = "Tobi\nJay Najia\nNewbie\nTayCode\nTay Code";

  const before = resolveNames(raw, roster);
  assert.deepEqual(before.matched.map((p) => p.id), ["c", "a"]);
  assert.deepEqual(before.unmatched, ["Jay Najia", "Newbie", "Tay Code"]);

  const after = resolveNames(raw, roster, {
    "jay najia": roster[1],
    newbie: null,
    "tay code": roster[0],
  });
  assert.deepEqual(after.matched.map((p) => p.id), ["c", "b", "a"]);
  assert.deepEqual(after.unmatched, []);
});
