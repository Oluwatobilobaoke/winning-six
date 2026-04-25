<template>
  <div class="container">
    <h1 class="title">Ranking</h1>

    <!-- Season Selector -->
    <div class="season-selector">
      <label for="season">Select Season:</label>
      <select v-model="selectedSeason" @change="fetchGamesAndRankings">
        <option v-for="season in seasons" :key="season.id" :value="season.id">
          {{ season.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <!-- Ranking Table -->
    <div v-if="rankings.length" class="ranking-table">
      <h2 class="subtitle">Leaderboard - {{ selectedSeasonName }}</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>W%</th>
            <th>TG</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in rankings" :key="player.id">
            <td>{{ index + 1 }}</td>
            <td>{{ player.name }}</td>
            <td>{{ player.totalGames }}</td>
            <td>{{ player.wins }}</td>
            <td>{{ player.draws }}</td>
            <td>{{ player.losses }}</td>
            <td>{{ player.winRatio.toFixed(2) }}</td>
            <td>{{ player.totalTeamGoals }}</td>
            <td>{{ player.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>No rankings available.</p>


    <!-- Accordion Content -->

    <div v-if="lastMatchdayGames.length" class="games-list">
      <h2 class="text-xl font-bold mb-2">Games Played - Last Matchday</h2>
      <ul>
        <li v-for="(game, index) in lastMatchdayGames" :key="game.id" class="border p-3 mb-3 rounded bg-gray-50">
          <!-- Accordion Header -->
          <button @click="toggleGame(index)"
            class="w-full flex justify-between items-center p-2 bg-blue-200 hover:bg-blue-300 rounded">
            <span class="font-semibold">{{ formatDate(game.date) }} - ({{ getScoreLine(game) }})</span>
            <span>{{ openGameIndex === index ? "▲" : "▼" }}</span>
          </button>

          <!-- Accordion Content -->
          <transition name="accordion">
            <div v-show="openGameIndex === index" class="mt-3">
              <!-- Team A -->
              <div class="team">
                <p class="font-bold text-green-700">
                  {{ getTeamName(game.teamAId) }} ({{ game.teamAScore }})
                </p>
                <ul class="list-disc pl-5">
                  <li v-for="playerId in teamsById[game.teamAId]?.players || []" :key="playerId">
                    {{ players[playerId] }}
                  </li>
                </ul>
              </div>

              <!-- Team B -->
              <div class="team mt-3">
                <p class="font-bold text-red-700">
                  {{ teamsById[game.teamBId]?.name || "Team B" }} ({{ game.teamBScore }})
                </p>
                <ul class="list-disc pl-5">
                  <li v-for="playerId in teamsById[game.teamBId]?.players || []" :key="playerId">
                    {{ players[playerId] }}
                  </li>
                </ul>
              </div>
            </div>
          </transition>
        </li>
      </ul>
    </div>
    <p v-else>No games played in this season.</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export default {
  setup() {
    const seasons = ref([]);
    const selectedSeason = ref(null);
    const games = ref([]);
    const rankings = ref([]);
    const players = ref({});
    const openGameIndex = ref(null); // Track which game is open
    const loading = ref(true);
    const teamsById = ref([]);

    // Fetch all seasons (ordered by newest first)
    const fetchSeasons = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "seasons"), orderBy("createdAt", "desc"))
        );
        seasons.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Default to the most recent season
        if (seasons.value.length) {
          selectedSeason.value = seasons.value[0].id;
          fetchGamesAndRankings();
        }
      } catch (error) {
        console.error("Error fetching seasons:", error);
      }
    };

    // Fetch all players and map by ID
    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const playerData = {};
        querySnapshot.forEach(doc => {
          playerData[doc.id] = doc.data().name; // Assuming player has a `name` field
        });
        players.value = playerData;
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    // Fetch games and calculate rankings
    const fetchGamesAndRankings = async () => {
      if (!selectedSeason.value) return;

      try {
        await fetchPlayers();

        // Fetch all teams for the season
        const teamQuery = query(
          collection(db, "teams"),
          where("seasonId", "==", selectedSeason.value)
        );
        const teamSnapshot = await getDocs(teamQuery);

        const teamsById = {};
        const teamMap = {};
        teamSnapshot.forEach(doc => {
          teamMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        teamsById.value = teamMap;

        console.log("Fetched teams:", teamsById.value);

        // Fetch games
        const gameQuery = query(
          collection(db, "games"),
          where("seasonId", "==", selectedSeason.value),
          orderBy("date", "desc")
        );
        const gameSnapshot = await getDocs(gameQuery);
        games.value = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate rankings with team structure
        calculateRankings(teamsById.value);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        loading.value = false;
      }
    };

    const calculateRankings = (teamsById) => {
      const playerStats = {};

      games.value.forEach(game => {
        const teamA = teamsById[game.teamAId];
        const teamB = teamsById[game.teamBId];

        if (!teamA || !teamB) return;

        if (game.teamAScore > game.teamBScore) {
          // Team A wins, Team B loses
          teamA.players.forEach(playerId => recordWin(playerId, game.teamAScore));
          teamB.players.forEach(playerId => recordLoss(playerId, game.teamBScore));
        } else if (game.teamBScore > game.teamAScore) {
          // Team B wins, Team A loses
          teamB.players.forEach(playerId => recordWin(playerId, game.teamBScore));
          teamA.players.forEach(playerId => recordLoss(playerId, game.teamAScore));
        } else {
          // Draw
          teamA.players.forEach(playerId => recordDraw(playerId, game.teamAScore));
          teamB.players.forEach(playerId => recordDraw(playerId, game.teamBScore));
        }
      });

      rankings.value = Object.entries(playerStats).map(([id, stats]) => ({
        id,
        ...stats,
        winRatio: stats.totalGames ? (stats.wins / stats.totalGames) * 100 : 0,
      }));

      // Sort (same as before, add alphabetic tie-breaker)
      rankings.value.sort((a, b) =>
        b.points - a.points ||
        b.winRatio - a.winRatio ||
        b.totalTeamGoals - a.totalTeamGoals ||
        a.name.localeCompare(b.name)
      );

      function recordWin(playerId, goals) {
        if (!playerStats[playerId]) playerStats[playerId] = createPlayerStats(playerId);
        playerStats[playerId].wins++;
        playerStats[playerId].points += 3;
        playerStats[playerId].totalGames++;
        playerStats[playerId].totalTeamGoals += goals;
      }

      function recordLoss(playerId, goals) {
        if (!playerStats[playerId]) playerStats[playerId] = createPlayerStats(playerId);
        playerStats[playerId].losses++;
        playerStats[playerId].totalGames++;
        playerStats[playerId].totalTeamGoals += goals;
      }

      function recordDraw(playerId, goals) {
        if (!playerStats[playerId]) playerStats[playerId] = createPlayerStats(playerId);
        playerStats[playerId].draws++;
        playerStats[playerId].points++;
        playerStats[playerId].totalGames++;
        playerStats[playerId].totalTeamGoals += goals;
      }
    };

    const createPlayerStats = (playerId) => ({
      id: playerId,
      name: players.value[playerId] || "Unknown Player",
      wins: 0,
      losses: 0, 
      draws: 0,
      points: 0,
      totalGames: 0,
      totalTeamGoals: 0,
    });


    // Get selected season name
    const selectedSeasonName = computed(() => {
      return seasons.value.find(season => season.id === selectedSeason.value)?.name || "Unknown Season";
    });

    // Get only games from the last matchday for display
    const lastMatchdayGames = computed(() => {
      if (games.value.length === 0) return [];

      // Find the most recent matchdayId from the games
      const sortedGames = [...games.value].sort((a, b) => {
        const aTime = a.date?.seconds || 0;
        const bTime = b.date?.seconds || 0;
        return bTime - aTime;
      });

      const mostRecentMatchdayId = sortedGames[0]?.matchdayId;

      if (!mostRecentMatchdayId) return [];

      // Filter games to only include those from the last matchday
      return games.value.filter(game => game.matchdayId === mostRecentMatchdayId);
    });

    // Toggle accordion for a game
    const toggleGame = (index) => {
      openGameIndex.value = openGameIndex.value === index ? null : index;
    };

    const formatDate = (ts) => {
      if (ts && ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return "Invalid Date";
    };

    const getScoreLine = (game) => {
      return `${game.teamAScore}-${game.teamBScore}`;
    };

    const getTeamName = (id) => {

      return teamsById[id]?.name || "Unknown team";
      
    };

    onMounted(fetchSeasons);

    return {
      seasons,
      selectedSeason,
      selectedSeasonName,
      games,
      lastMatchdayGames,
      rankings,
      fetchGamesAndRankings,
      openGameIndex,
      toggleGame,
      loading,
      players,
      formatDate,
      getScoreLine,
      teamsById,
      getTeamName
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.season-selector {
  text-align: center;
  margin-bottom: 20px;
}

.season-selector select {
  padding: 10px;
  font-size: 16px;
}

.ranking-table {
  margin-top: 20px;
}

.subtitle {
  font-size: 20px;
  margin-bottom: 10px;
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

th {
  background: #007bff;
  color: white;
}

.games-list {
  margin-top: 20px;
}

.games-list ul {
  list-style: none;
  padding: 0;
}

.games-list li {
  background: #f5f5f5;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 5px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #3498db;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}


/* Smooth accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.accordion-enter,
.accordion-leave-to {
  max-height: 0;
  overflow: hidden;
}

.game-result {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 20px;
}

.winners,
.losers {
  flex: 1;
}

.player-name {
  display: inline-block;
  margin-right: 8px;
}
</style>
