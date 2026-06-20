// Run with: node --test src/utils/randomizeTeams.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { runRandomize } from "./randomizeTeams.js";

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
