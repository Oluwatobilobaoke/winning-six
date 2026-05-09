<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 class="text-2xl font-bold mb-4 text-center">{{ editingGameId ? "Update Game" : "Add Game" }}</h2>

    <div>
      <div class="mb-4">
        <label class="block font-semibold mb-1">Season</label>
        <select v-model="selectedSeason" class="border rounded-md p-2 w-full" @change="onSeasonChange" :disabled="!!editingGameId">
          <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block font-semibold mb-1">Matchday</label>
        <select v-model="selectedMatchday" class="border rounded-md p-2 w-full" @change="onMatchdayChange" :disabled="!!editingGameId">
          <option v-for="m in matchdays" :key="m.id" :value="m.id">
            {{ m.nickname || formatDate(m.date) }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="mb-4">
          <label class="block font-semibold mb-1">Team A</label>
          <select v-model="teamA" class="border rounded-md p-2 w-full">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <input v-model.number="teamAScore" type="number" min="0" placeholder="Score" class="border rounded-md p-2 mt-2 w-full" />
        </div>

        <div class="mb-4">
          <label class="block font-semibold mb-1">Team B</label>
          <select v-model="teamB" class="border rounded-md p-2 w-full">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <input v-model.number="teamBScore" type="number" min="0" placeholder="Score" class="border rounded-md p-2 mt-2 w-full" />
        </div>
      </div>

      <p v-if="editingGameId" class="text-xs text-gray-500 mb-2">
        Note: matchday is locked while editing. Changing the teams will clear any per-player stats on this game.
      </p>

      <button
        @click="saveGame"
        class="mt-2 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 w-full disabled:opacity-50"
        :disabled="!canSave || saving"
      >
        {{ saving ? "Saving..." : (editingGameId ? "Update Game" : "Save Game") }}
      </button>
      <button
        v-if="editingGameId"
        @click="cancelEdit"
        class="mt-2 p-3 bg-gray-500 text-white rounded-md hover:bg-gray-700 w-full"
      >
        Cancel
      </button>

    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4 text-center">Games for this Matchday</h3>
      <p v-if="loading" class="text-center text-gray-500">Loading...</p>
      <ul v-else-if="lastGames.length" class="space-y-4">
        <li v-for="game in lastGames" :key="game.id" class="p-4 border rounded-md shadow-sm bg-gray-50">
          <p class="text-sm text-gray-600">{{ formatDateTime(game.played_at || game.created_at) }}</p>
          <p class="font-semibold">
            {{ getTeamName(game.team_a_id) }} ({{ game.team_a_score }}) -
            ({{ game.team_b_score }}) {{ getTeamName(game.team_b_id) }}
          </p>
          <div class="flex gap-2 mt-2">
            <button @click="startEdit(game)" class="edit-btn">Edit</button>
            <button @click="deleteGame(game)" class="delete-btn">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-center text-gray-500">No games for this matchday.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";

export default {
  setup() {
    const seasons = ref([]);
    const matchdays = ref([]);
    const teams = ref([]);
    const lastGames = ref([]);
    const selectedSeason = ref(null);
    const selectedMatchday = ref(null);
    const teamA = ref(null);
    const teamB = ref(null);
    const teamAScore = ref(0);
    const teamBScore = ref(0);
    const editingGameId = ref(null);
    const loading = ref(false);
    const saving = ref(false);

    const canSave = computed(() => {
      return (
        !!selectedMatchday.value &&
        !!teamA.value &&
        !!teamB.value &&
        teamA.value !== teamB.value &&
        teamAScore.value != null &&
        teamBScore.value != null
      );
    });

    const fetchSeasons = async () => {
      try {
        seasons.value = (await api.get("/seasons")) || [];
        if (seasons.value.length) {
          selectedSeason.value = seasons.value[0].id;
          await fetchMatchdays();
        }
      } catch (err) {
        toast.error(err.message || "Failed to load seasons");
      }
    };

    const fetchMatchdays = async () => {
      matchdays.value = [];
      teams.value = [];
      lastGames.value = [];
      if (!selectedSeason.value) return;
      try {
        const data = await api.get(`/seasons/${selectedSeason.value}/matchdays`);
        matchdays.value = (data || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        if (matchdays.value.length) {
          selectedMatchday.value = matchdays.value[0].id;
          await Promise.all([fetchTeams(), fetchGames()]);
        } else {
          selectedMatchday.value = null;
        }
      } catch (err) {
        toast.error(err.message || "Failed to load matchdays");
      }
    };

    const fetchTeams = async () => {
      teams.value = [];
      if (!selectedMatchday.value) return;
      try {
        teams.value = (await api.get(`/matchdays/${selectedMatchday.value}/teams`)) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load teams");
      }
    };

    const fetchGames = async () => {
      lastGames.value = [];
      if (!selectedMatchday.value) return;
      loading.value = true;
      try {
        const data = await api.get(`/matchdays/${selectedMatchday.value}/games`);
        lastGames.value = (data || []).slice().sort((a, b) => {
          const ta = a.played_at || a.created_at || "";
          const tb = b.played_at || b.created_at || "";
          return tb.localeCompare(ta);
        });
      } catch (err) {
        toast.error(err.message || "Failed to load games");
      } finally {
        loading.value = false;
      }
    };

    const onSeasonChange = async () => {
      if (editingGameId.value) cancelEdit();
      await fetchMatchdays();
    };

    const onMatchdayChange = async () => {
      if (editingGameId.value) cancelEdit();
      await Promise.all([fetchTeams(), fetchGames()]);
    };

    const getTeamName = (id) => teams.value.find((t) => t.id === id)?.name || "Unknown Team";

    const saveGame = async () => {
      if (!canSave.value) return;
      saving.value = true;
      const isEdit = !!editingGameId.value;
      try {
        if (isEdit) {
          await api.patch(`/games/${editingGameId.value}`, {
            team_a_id: teamA.value,
            team_b_id: teamB.value,
            team_a_score: teamAScore.value,
            team_b_score: teamBScore.value,
          });
        } else {
          await api.post(`/matchdays/${selectedMatchday.value}/games`, {
            team_a_id: teamA.value,
            team_b_id: teamB.value,
            team_a_score: teamAScore.value,
            team_b_score: teamBScore.value,
            played_at: new Date().toISOString(),
          });
        }
        resetForm();
        await fetchGames();
        toast.success(isEdit ? "Game updated" : "Game saved");
      } catch (err) {
        toast.error(err.message || "Failed to save game");
      } finally {
        saving.value = false;
      }
    };

    const startEdit = (game) => {
      editingGameId.value = game.id;
      teamA.value = game.team_a_id;
      teamB.value = game.team_b_id;
      teamAScore.value = game.team_a_score;
      teamBScore.value = game.team_b_score;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => resetForm();

    const resetForm = () => {
      editingGameId.value = null;
      teamA.value = null;
      teamB.value = null;
      teamAScore.value = 0;
      teamBScore.value = 0;
    };

    const deleteGame = async (game) => {
      if (!confirm("Delete this game?")) return;
      try {
        await api.delete(`/games/${game.id}`);
        await fetchGames();
        toast.success("Game deleted");
      } catch (err) {
        toast.error(err.message || "Failed to delete game");
      }
    };

    const formatDate = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
    };

    const formatDateTime = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    };

    onMounted(fetchSeasons);

    return {
      seasons, matchdays, teams, lastGames,
      selectedSeason, selectedMatchday,
      teamA, teamB, teamAScore, teamBScore,
      editingGameId,
      saveGame, deleteGame, startEdit, cancelEdit,
      onSeasonChange, onMatchdayChange,
      getTeamName, formatDate, formatDateTime,
      canSave, loading, saving,
    };
  },
};
</script>

<style scoped>
.delete-btn {
  background-color: red;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.delete-btn:hover { background-color: darkred; }

.edit-btn {
  background-color: #2563eb;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.edit-btn:hover { background-color: #1d4ed8; }
</style>
