<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow rounded">
    <h2 class="text-xl font-bold mb-4">Add Matchday</h2>

    <!-- Date -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Date</label>
      <Datepicker v-model="matchdayDate" :enable-time-picker="false" class="w-full" />
    </div>

    <!-- Nickname -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Nickname (optional)</label>
      <input v-model="nickname" type="text" class="border p-2 w-full rounded" placeholder="e.g. Super Sunday" />
    </div>

    <!-- Season -->
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Season</label>
      <select v-model="selectedSeason" class="border rounded p-2 w-full">
        <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <button @click="saveMatchday" class="bg-blue-500 text-white p-2 rounded w-full">Save</button>

    <!-- List -->
    <h3 class="text-lg font-bold mt-6">Matchdays</h3>
    <ul>
      <li v-for="m in matchdays" :key="m.id" class="border p-2 rounded mb-2 flex justify-between">
        <span>{{ formatDate(m.date) }} - {{ m.nickname }}</span>
        <button @click="deleteMatchday(m.id)" class="text-red-500">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

export default {
  components: { Datepicker },
  setup() {
    const matchdayDate = ref(new Date());
    const nickname = ref("");
    const selectedSeason = ref(null);
    const seasons = ref([]);
    const matchdays = ref([]);

    const fetchSeasons = async () => {
      const snap = await getDocs(collection(db, "seasons"));
      seasons.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const fetchMatchdays = async () => {
      const snap = await getDocs(collection(db, "matchdays"));
      matchdays.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const saveMatchday = async () => {
      await addDoc(collection(db, "matchdays"), {
        date: matchdayDate.value,
        nickname: nickname.value,
        seasonId: selectedSeason.value,
      });
      fetchMatchdays();
    };

    const deleteMatchday = async (id) => {
      await deleteDoc(doc(db, "matchdays", id));
      fetchMatchdays();
    };

    const formatDate = (ts) => new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      month: "long", day: "2-digit", year: "numeric"
    });

    onMounted(() => {
      fetchSeasons();
      fetchMatchdays();
    });

    return { matchdayDate, nickname, selectedSeason, seasons, matchdays, saveMatchday, deleteMatchday, formatDate };
  }
};
</script>
