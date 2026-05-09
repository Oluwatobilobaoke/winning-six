<template>
  <div class="container">
    <h1 class="title">Ranking</h1>

    <!-- Season Selector -->
    <div class="season-selector">
      <label for="season">Select Season:</label>
      <select v-model="selectedSeason" @change="fetchSeasonData">
        <option v-for="season in seasons" :key="season.id" :value="season.id">
          {{ season.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

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
            <td>{{ player.played }}</td>
            <td>{{ player.wins }}</td>
            <td>{{ player.draws }}</td>
            <td>{{ player.losses }}</td>
            <td>{{ formatPct(player.win_pct) }}</td>
            <td>{{ player.team_goals }}</td>
            <td>{{ player.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!loading && selectedSeason">No rankings available.</p>

    <!-- Last Matchday Games -->
    <div v-if="lastMatchdayGames.length" class="games-list">
      <h2 class="text-xl font-bold mb-2">Games Played - Last Matchday</h2>
      <ul>
        <li v-for="(game, index) in lastMatchdayGames" :key="game.id" class="border p-3 mb-3 rounded bg-gray-50">
          <button @click="toggleGame(index)"
            class="w-full flex justify-between items-center p-2 bg-blue-200 hover:bg-blue-300 rounded">
            <span class="font-semibold">{{ formatDate(game.played_at) }} - ({{ getScoreLine(game) }})</span>
            <span>{{ openGameIndex === index ? "▲" : "▼" }}</span>
          </button>

          <transition name="accordion">
            <div v-show="openGameIndex === index" class="mt-3">
              <div class="team">
                <p class="font-bold text-green-700">
                  {{ teamsById[game.team_a_id]?.team?.name || "Team A" }} ({{ game.team_a_score }})
                </p>
                <ul class="list-disc pl-5">
                  <li v-for="player in teamsById[game.team_a_id]?.players || []" :key="player.id">
                    {{ player.name }}
                  </li>
                </ul>
              </div>

              <div class="team mt-3">
                <p class="font-bold text-red-700">
                  {{ teamsById[game.team_b_id]?.team?.name || "Team B" }} ({{ game.team_b_score }})
                </p>
                <ul class="list-disc pl-5">
                  <li v-for="player in teamsById[game.team_b_id]?.players || []" :key="player.id">
                    {{ player.name }}
                  </li>
                </ul>
              </div>
            </div>
          </transition>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { api } from "@/api";

export default {
  setup() {
    const seasons = ref([]);
    const selectedSeason = ref(null);
    const rankings = ref([]);
    const lastMatchdayGames = ref([]);
    const teamsById = ref({});
    const openGameIndex = ref(null);
    const loading = ref(true);
    const errorMessage = ref("");

    const selectedSeasonName = computed(
      () => seasons.value.find((s) => s.id === selectedSeason.value)?.name || ""
    );

    const fetchSeasons = async () => {
      try {
        const data = await api.get("/seasons", { auth: false });
        seasons.value = data || [];
        if (seasons.value.length) {
          selectedSeason.value = seasons.value[0].id;
          await fetchSeasonData();
        }
      } catch (err) {
        errorMessage.value = err.message || "failed to load seasons";
      } finally {
        loading.value = false;
      }
    };

    const fetchSeasonData = async () => {
      if (!selectedSeason.value) return;
      loading.value = true;
      errorMessage.value = "";
      rankings.value = [];
      lastMatchdayGames.value = [];
      teamsById.value = {};

      try {
        const [leaderboard, matchdays] = await Promise.all([
          api.get(`/seasons/${selectedSeason.value}/leaderboard`, { auth: false }),
          api.get(`/seasons/${selectedSeason.value}/matchdays`, { auth: false }),
        ]);
        rankings.value = leaderboard || [];

        const sortedMatchdays = (matchdays || []).slice().sort((a, b) => {
          return (b.date || "").localeCompare(a.date || "");
        });
        const latest = sortedMatchdays[0];
        if (latest) {
          await loadMatchdayGames(latest.id);
        }
      } catch (err) {
        errorMessage.value = err.message || "failed to load season data";
      } finally {
        loading.value = false;
      }
    };

    const loadMatchdayGames = async (matchdayId) => {
      const [games, teams] = await Promise.all([
        api.get(`/matchdays/${matchdayId}/games`, { auth: false }),
        api.get(`/matchdays/${matchdayId}/teams`, { auth: false }),
      ]);
      lastMatchdayGames.value = games || [];

      const teamMap = {};
      await Promise.all(
        (teams || []).map(async (t) => {
          const detail = await api.get(`/teams/${t.id}`, { auth: false });
          teamMap[t.id] = detail;
        })
      );
      teamsById.value = teamMap;
    };

    const toggleGame = (index) => {
      openGameIndex.value = openGameIndex.value === index ? null : index;
    };

    const formatDate = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const getScoreLine = (game) => `${game.team_a_score}-${game.team_b_score}`;

    const formatPct = (val) => {
      const n = Number(val);
      return Number.isFinite(n) ? n.toFixed(1) : "0.0";
    };

    onMounted(fetchSeasons);

    return {
      seasons,
      selectedSeason,
      selectedSeasonName,
      rankings,
      lastMatchdayGames,
      teamsById,
      openGameIndex,
      toggleGame,
      loading,
      errorMessage,
      fetchSeasonData,
      formatDate,
      getScoreLine,
      formatPct,
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

.error {
  color: #b91c1c;
  text-align: center;
  margin: 10px 0;
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

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.accordion-enter,
.accordion-leave-to {
  max-height: 0;
  overflow: hidden;
}
</style>
