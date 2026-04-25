<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow rounded">
    <h2 class="text-xl font-bold mb-4">Add Team</h2>

    <div class="mb-4">
      <label class="block font-semibold mb-1">Season:</label>
      <select v-model="selectedSeason" class="border rounded-md p-2 w-full" @change="fetchMatchdays">
        <option v-for="s in seasons" :key="s.id" :value="s.id">
          {{ s.name }}
        </option>
      </select>
    </div>

    <!-- Matchday -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Matchday</label>
      <select v-model="selectedMatchday" class="border rounded p-2 w-full" @change="fetchTeams">
        <option v-for="m in matchdays" :key="m.id" :value="m.id">{{ m.nickname || formatDate(m.date) }}</option>
      </select>
    </div>

    <!-- Team Name -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Team Name</label>
      <input v-model="teamName" type="text" class="border p-2 w-full rounded" placeholder="e.g. Team A" />
    </div>

    <!-- Players -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Players</label>
      <TagInput v-model="selectedPlayers" :suggestions="players" />
    </div>

    <button @click="saveTeam" class="bg-blue-500 text-white p-2 rounded w-full">
      {{ editingTeamId ? "Update Team" : "Save Team" }}
    </button>
    <!-- List -->
    <h3 class="text-lg font-bold mt-6 mb-3">Teams</h3>

    <ul class="space-y-3">
      <li v-for="t in teams" :key="t.id" class="border rounded-lg p-4 bg-gray-50">
        <!-- Header -->
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-gray-800">
            {{ t.name }}
            <span class="text-sm text-gray-500">
              ({{ t.players.length }} players)
            </span>
          </h4>

          <div class="space-x-3">
            <button @click="editTeam(t)" class="text-blue-600 hover:underline">
              Edit
            </button>
            <button @click="deleteTeam(t.id)" class="text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </div>

        <!-- Players -->
        <div class="flex flex-wrap gap-2">
          <span v-for="playerId in t.players" :key="playerId"
            class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
            {{players.find(p => p.id === playerId)?.name || "Unknown"}}
          </span>

          <span v-if="!t.players.length" class="text-sm text-gray-400 italic">
            No players assigned
          </span>
        </div>
      </li>
    </ul>

  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, updateDoc } from "firebase/firestore";
import TagInput from "./TagInput.vue";

export default {
  components: { TagInput },
  setup() {
    const matchdays = ref([]);
    const selectedMatchday = ref(null);
    const teamName = ref("");
    const selectedPlayers = ref([]);
    const players = ref([]);
    const teams = ref([]);
    const seasons = ref([]);
    const selectedSeason = ref([]);
    const editingTeamId = ref(null);


    const fetchSeasons = async () => {

      const querySnapshot = await getDocs(
        query(collection(db, "seasons"), orderBy("createdAt", "desc"))
      );
      seasons.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Default to the most recent season
      if (seasons.value.length) {
        selectedSeason.value = seasons.value[0].id;
        fetchMatchdays()
      }
    };

    const fetchMatchdays = async () => {

      const snap = await getDocs(
        query(collection(db, "matchdays"), orderBy("date", "desc"))
      );
      matchdays.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(matchdays.value)
      if (matchdays.value.length) {
        selectedMatchday.value = matchdays.value[0].id
        fetchTeams()
      }

    };

    const fetchPlayers = async () => {
      const snap = await getDocs(collection(db, "players"));
      players.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const fetchTeams = async () => {
      if (!selectedMatchday.value) return;
      console.log(selectedMatchday.value);
      const snap = await getDocs(
        query(collection(db, "teams"), where("matchdayId", "==", selectedMatchday.value))
      );
      console.log(snap.docs)
      teams.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(teams.value.length)
    };

    const saveTeam = async () => {
      const matchday = matchdays.value.find(m => m.id === selectedMatchday.value);

      const payload = {
        name: teamName.value,
        players: selectedPlayers.value.map(p => p.id),
        matchdayId: selectedMatchday.value,
        seasonId: matchday ? matchday.seasonId : null
      };

      if (editingTeamId.value) {
        // EDIT
        await updateDoc(doc(db, "teams", editingTeamId.value), payload);
      } else {
        // CREATE
        await addDoc(collection(db, "teams"), payload);
      }

      resetForm();
      fetchTeams();
    };

    const resetForm = () => {
      teamName.value = "";
      selectedPlayers.value = [];
      editingTeamId.value = null;
    };


    const deleteTeam = async (id) => {
      await deleteDoc(doc(db, "teams", id));
      fetchTeams();
    };

    const formatDate = (ts) => new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      month: "long", day: "2-digit", year: "numeric"
    });

    const editTeam = (team) => {
      teamName.value = team.name;
      selectedMatchday.value = team.matchdayId;

      // Convert stored player IDs back to player objects for TagInput
      selectedPlayers.value = players.value.filter(p =>
        team.players.includes(p.id)
      );

      editingTeamId.value = team.id;
    };


    onMounted(() => {
      fetchSeasons();
      fetchPlayers();
    });

    return {
      matchdays,
      selectedMatchday,
      teamName,
      selectedPlayers,
      players,
      seasons,
      selectedSeason,
      teams,
      saveTeam,
      deleteTeam,
      editTeam,
      formatDate,
      fetchTeams,
      editingTeamId
    };

  }
};
</script>
