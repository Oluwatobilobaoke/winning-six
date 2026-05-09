<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow rounded">
    <h2 class="text-xl font-bold mb-4">{{ editingTeamId ? "Edit Team" : "Add Team" }}</h2>

    <div class="mb-4">
      <label class="block font-semibold mb-1">Season</label>
      <select v-model="selectedSeason" class="border rounded-md p-2 w-full" @change="fetchMatchdays">
        <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Matchday</label>
      <select v-model="selectedMatchday" class="border rounded p-2 w-full" @change="fetchTeams">
        <option v-for="m in matchdays" :key="m.id" :value="m.id">
          {{ m.nickname || formatDate(m.date) }}
        </option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Team Name</label>
      <input v-model="teamName" type="text" class="border p-2 w-full rounded" placeholder="e.g. Team A" />
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Players</label>
      <TagInput v-model="selectedPlayers" :suggestions="players" />
    </div>

    <button
      @click="saveTeam"
      class="bg-blue-500 text-white p-2 rounded w-full disabled:opacity-50"
      :disabled="!canSave || saving"
    >
      {{ saving ? "Saving..." : (editingTeamId ? "Update Team" : "Save Team") }}
    </button>
    <button
      v-if="editingTeamId"
      @click="cancelEdit"
      class="mt-2 bg-gray-400 text-white p-2 rounded w-full"
    >
      Cancel
    </button>

    <h3 class="text-lg font-bold mt-6 mb-3">Teams</h3>
    <p v-if="loading" class="text-gray-500">Loading...</p>

    <ul v-else class="space-y-3">
      <li v-for="t in teams" :key="t.id" class="border rounded-lg p-4 bg-gray-50">
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-gray-800">
            {{ t.name }}
            <span class="text-sm text-gray-500">({{ teamRosters[t.id]?.length || 0 }} players)</span>
          </h4>
          <div class="space-x-3">
            <button @click="editTeam(t)" class="text-blue-600 hover:underline">Edit</button>
            <button @click="deleteTeam(t)" class="text-red-600 hover:underline">Delete</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="p in teamRosters[t.id] || []"
            :key="p.id"
            class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
          >
            {{ p.name }}
          </span>
          <span v-if="!teamRosters[t.id]?.length" class="text-sm text-gray-400 italic">
            No players assigned
          </span>
        </div>
      </li>
      <li v-if="!teams.length" class="text-gray-500 italic">No teams for this matchday.</li>
    </ul>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";
import { confirmAction } from "@/confirm";
import TagInput from "./TagInput.vue";

export default {
  components: { TagInput },
  setup() {
    const seasons = ref([]);
    const matchdays = ref([]);
    const teams = ref([]);
    const teamRosters = ref({}); // teamId -> [{id, name}]
    const players = ref([]);
    const selectedSeason = ref(null);
    const selectedMatchday = ref(null);
    const teamName = ref("");
    const selectedPlayers = ref([]);
    const editingTeamId = ref(null);
    const loading = ref(false);
    const saving = ref(false);

    const canSave = computed(() => !!selectedMatchday.value && !!teamName.value.trim());

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
      teamRosters.value = {};
      if (!selectedSeason.value) return;
      try {
        const data = await api.get(`/seasons/${selectedSeason.value}/matchdays`);
        matchdays.value = (data || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        if (matchdays.value.length) {
          selectedMatchday.value = matchdays.value[0].id;
          await fetchTeams();
        } else {
          selectedMatchday.value = null;
        }
      } catch (err) {
        toast.error(err.message || "Failed to load matchdays");
      }
    };

    const fetchPlayers = async () => {
      try {
        players.value = (await api.get("/players")) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load players");
      }
    };

    const fetchTeams = async () => {
      teamRosters.value = {};
      if (!selectedMatchday.value) {
        teams.value = [];
        return;
      }
      loading.value = true;
      try {
        teams.value = (await api.get(`/matchdays/${selectedMatchday.value}/teams`)) || [];
        const rosters = {};
        await Promise.all(
          teams.value.map(async (t) => {
            const detail = await api.get(`/teams/${t.id}`);
            rosters[t.id] = detail.players || [];
          })
        );
        teamRosters.value = rosters;
      } catch (err) {
        toast.error(err.message || "Failed to load teams");
      } finally {
        loading.value = false;
      }
    };

    const saveTeam = async () => {
      if (!canSave.value) return;
      saving.value = true;
      const isEdit = !!editingTeamId.value;
      const name = teamName.value.trim();
      const payload = {
        name,
        player_ids: selectedPlayers.value.map((p) => p.id),
      };
      try {
        if (isEdit) {
          await api.patch(`/teams/${editingTeamId.value}`, payload);
        } else {
          await api.post(`/matchdays/${selectedMatchday.value}/teams`, payload);
        }
        resetForm();
        await fetchTeams();
        toast.success(isEdit ? `Team "${name}" updated` : `Team "${name}" created`);
      } catch (err) {
        toast.error(err.message || "Failed to save team");
      } finally {
        saving.value = false;
      }
    };

    const editTeam = (team) => {
      teamName.value = team.name;
      selectedPlayers.value = (teamRosters.value[team.id] || []).map((p) => ({ id: p.id, name: p.name }));
      editingTeamId.value = team.id;
    };

    const cancelEdit = () => resetForm();

    const resetForm = () => {
      teamName.value = "";
      selectedPlayers.value = [];
      editingTeamId.value = null;
    };

    const deleteTeam = async (team) => {
      const ok = await confirmAction({
        title: `Delete team "${team.name}"?`,
        message:
          "This also deletes every game this team played in.\n" +
          "Players are kept (they're shared).\n\n" +
          "This cannot be undone.",
        confirmLabel: "Delete team",
        destructive: true,
        requireText: team.name,
      });
      if (!ok) return;
      try {
        await api.delete(`/teams/${team.id}`);
        await fetchTeams();
        toast.success(`Team "${team.name}" deleted`);
      } catch (err) {
        toast.error(err.message || "Failed to delete team");
      }
    };

    const formatDate = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
    };

    onMounted(() => {
      fetchSeasons();
      fetchPlayers();
    });

    return {
      seasons, matchdays, teams, teamRosters, players,
      selectedSeason, selectedMatchday, teamName, selectedPlayers, editingTeamId,
      saveTeam, editTeam, cancelEdit, deleteTeam,
      fetchMatchdays, fetchTeams,
      canSave, loading, saving,
      formatDate,
    };
  },
};
</script>
