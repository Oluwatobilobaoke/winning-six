<template>
  <div class="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 class="text-2xl font-bold mb-4 text-center">{{ editingGameId ? 'Update Game' : 'Add Game' }}</h2>

    <!-- Game Form -->
    <div>
      <!-- Game Date -->
      <div class="mb-4">
        <label class="block font-semibold mb-1">Game Date:</label>
        <Datepicker v-model="gameDate" :enable-time-picker="false" class="w-full" />
      </div>

      <!-- Season -->
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
        <label class="block font-semibold mb-1">Matchday:</label>
        <select v-model="selectedMatchday" class="border rounded-md p-2 w-full" @change="fetchTeams">
          <option v-for="m in matchdays" :key="m.id" :value="m.id">
            {{ m.nickname || formatDate(m.date) }}
          </option>
        </select>
      </div>

      <!-- Teams -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Team A -->
        <div class="mb-4">
          <label class="block font-semibold mb-1">Team A:</label>
          <select v-model="teamA" class="border rounded-md p-2 w-full">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <input v-model="teamAScore" type="number" placeholder="Score" class="border rounded-md p-2 mt-2 w-full" />
        </div>

        <!-- Team B -->
        <div class="mb-4">
          <label class="block font-semibold mb-1">Team B:</label>
          <select v-model="teamB" class="border rounded-md p-2 w-full">
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <input v-model="teamBScore" type="number" placeholder="Score" class="border rounded-md p-2 mt-2 w-full" />
        </div>
      </div>

      <!-- Submit -->
      <button @click="saveGame" class="mt-4 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 w-full">
        {{ editingGameId ? 'Update Game' : 'Save Game' }}
      </button>
      <button v-if="editingGameId" @click="cancelEdit" class="mt-2 p-3 bg-gray-500 text-white rounded-md hover:bg-gray-700 w-full">
        Cancel
      </button>
    </div>

    <!-- Last Games -->
    <!-- Last Games -->
    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4 text-center">Games for this Matchday</h3>
      <ul v-if="lastGames.length" class="space-y-4">
        <li v-for="game in lastGames" :key="game.id" class="p-4 border rounded-md shadow-sm bg-gray-50">
          <p class="text-sm text-gray-600">{{ formatDate(game.date) }}</p>
          <p class="font-semibold">
            {{ getTeamName(game.teamAId) }} ({{ game.teamAScore }}) -
            ({{ game.teamBScore }}) {{ getTeamName(game.teamBId) }}
          </p>
          <div class="flex gap-2 mt-2">
            <button @click="startEdit(game)" class="edit-btn">Edit</button>
            <button @click="deleteGame(game.id)" class="delete-btn">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="text-center text-gray-500">No games for this matchday.</p>
    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { db } from "@/firebase";
import { collection, getDocs, addDoc, query, orderBy, limit, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export default {
  components: { Datepicker },
  setup() {
    const gameDate = ref(new Date());
    const selectedSeason = ref(null);
    const selectedMatchday = ref(null);
    const teamA = ref(null);
    const teamB = ref(null);
    const teamAScore = ref(null);
    const teamBScore = ref(null);
    const editingGameId = ref(null);

    const seasons = ref([]);
    const matchdays = ref([]);
    const teams = ref([]);
    const lastGames = ref([]);

    // Fetch seasons
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

    // Fetch matchdays for season
    const fetchMatchdays = async () => {
      if (!selectedSeason.value) return;
      const q = query(collection(db, 'matchdays'), where('seasonId', '==', selectedSeason.value), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      matchdays.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (matchdays.value.length > 0) {
        selectedMatchday.value = matchdays.value[0].id; // default to most recent
        fetchTeams();
        fetchLastGames();
      }
    };

    // Fetch teams for matchday
    const fetchTeams = async () => {
      if (!selectedMatchday.value) return;
      const q = query(collection(db, 'teams'), where('matchdayId', '==', selectedMatchday.value));
      const snap = await getDocs(q);
      teams.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    // Fetch games for matchday
    const fetchLastGames = async () => {
      if (!selectedMatchday.value) return;
      const q = query(collection(db, 'games'), where('matchdayId', '==', selectedMatchday.value), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      lastGames.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const getTeamName = (id) => {
      const team = teams.value.find(t => t.id === id);
      return team ? team.name : "Unknown Team";
    };

    // Save or Update Game
    const saveGame = async () => {
      if (!selectedSeason.value || !selectedMatchday.value || !teamA.value || !teamB.value) {
        alert("Please select season, matchday, and both teams.");
        return;
      }
      if (teamAScore.value === null || teamBScore.value === null) {
        alert("Please enter scores.");
        return;
      }

      if (editingGameId.value) {
        // Update existing game (date stays the same)
        await updateDoc(doc(db, 'games', editingGameId.value), {
          teamAId: teamA.value,
          teamBId: teamB.value,
          teamAScore: teamAScore.value,
          teamBScore: teamBScore.value,
        });
        alert("Game updated successfully!");
        editingGameId.value = null;
      } else {
        // Create new game
        await addDoc(collection(db, 'games'), {
          date: new Date(), // Use current date and time
          seasonId: selectedSeason.value,
          matchdayId: selectedMatchday.value,
          teamAId: teamA.value,
          teamBId: teamB.value,
          teamAScore: teamAScore.value,
          teamBScore: teamBScore.value,
        });
        alert("Game saved successfully!");
      }

      fetchLastGames();

      // reset
      teamA.value = null;
      teamB.value = null;
      teamAScore.value = null;
      teamBScore.value = null;
    };

    // Start editing a game
    const startEdit = (game) => {
      editingGameId.value = game.id;
      teamA.value = game.teamAId;
      teamB.value = game.teamBId;
      teamAScore.value = game.teamAScore;
      teamBScore.value = game.teamBScore;

      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel editing
    const cancelEdit = () => {
      editingGameId.value = null;
      teamA.value = null;
      teamB.value = null;
      teamAScore.value = null;
      teamBScore.value = null;
    };

    const deleteGame = async (gameId) => {
      if (confirm("Delete this game?")) {
        await deleteDoc(doc(db, 'games', gameId));
        fetchLastGames();
      }
    };

    const formatDate = (ts) => {
      if (ts && ts.seconds) {
        // Convert Firestore Timestamp to milliseconds including nanoseconds
        const milliseconds = ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1000000);
        const date = new Date(milliseconds);

        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return "Invalid Date";
    };

    onMounted(() => {
      fetchSeasons();
    });

    return {
      gameDate,
      selectedSeason,
      selectedMatchday,
      teamA,
      teamB,
      teamAScore,
      teamBScore,
      editingGameId,
      seasons,
      matchdays,
      teams,
      lastGames,
      saveGame,
      deleteGame,
      startEdit,
      cancelEdit,
      fetchMatchdays,
      fetchTeams,
      getTeamName,
      formatDate,
    };
  }
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

.delete-btn:hover {
  background-color: darkred;
}
</style>
