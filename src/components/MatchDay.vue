<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow rounded">
    <h2 class="text-xl font-bold mb-4">Add Matchday</h2>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Season</label>
      <select v-model="selectedSeason" class="border rounded p-2 w-full" @change="fetchMatchdays">
        <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Date</label>
      <Datepicker v-model="matchdayDate" :enable-time-picker="false" class="w-full" />
    </div>

    <div class="mb-4">
      <label class="block mb-1 font-semibold">Nickname (optional)</label>
      <input v-model="nickname" type="text" class="border p-2 w-full rounded" placeholder="e.g. Super Sunday" />
    </div>

    <button
      @click="saveMatchday"
      class="bg-blue-500 text-white p-2 rounded w-full disabled:opacity-50"
      :disabled="!canSave || saving"
    >
      {{ saving ? "Saving..." : "Save" }}
    </button>

    <h3 class="text-lg font-bold mt-6">Matchdays</h3>
    <p v-if="loading" class="text-gray-500">Loading...</p>
    <ul v-else>
      <li
        v-for="m in matchdays"
        :key="m.id"
        class="border p-2 rounded mb-2 flex justify-between items-center"
      >
        <span>{{ formatDate(m.date) }}{{ m.nickname ? ` — ${m.nickname}` : "" }}</span>
        <button @click="deleteMatchday(m)" class="text-red-500 hover:underline">Delete</button>
      </li>
      <li v-if="!matchdays.length" class="text-gray-500 italic">No matchdays for this season.</li>
    </ul>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";
import { confirmAction } from "@/confirm";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const toIsoDate = (d) => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default {
  components: { Datepicker },
  setup() {
    const matchdayDate = ref(new Date());
    const nickname = ref("");
    const selectedSeason = ref(null);
    const seasons = ref([]);
    const matchdays = ref([]);
    const loading = ref(false);
    const saving = ref(false);

    const canSave = computed(() => !!selectedSeason.value && !!matchdayDate.value);

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
      if (!selectedSeason.value) {
        matchdays.value = [];
        return;
      }
      loading.value = true;
      try {
        const data = await api.get(`/seasons/${selectedSeason.value}/matchdays`);
        matchdays.value = (data || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      } catch (err) {
        toast.error(err.message || "Failed to load matchdays");
      } finally {
        loading.value = false;
      }
    };

    const saveMatchday = async () => {
      if (!canSave.value) return;
      saving.value = true;
      try {
        const created = await api.post(`/seasons/${selectedSeason.value}/matchdays`, {
          date: toIsoDate(matchdayDate.value),
          nickname: nickname.value.trim() || undefined,
        });
        nickname.value = "";
        await fetchMatchdays();
        toast.success(`Matchday ${formatDate(created.date)} created`);
      } catch (err) {
        toast.error(err.message || "Failed to save matchday");
      } finally {
        saving.value = false;
      }
    };

    const deleteMatchday = async (m) => {
      const label = m.nickname ? `${formatDate(m.date)} — ${m.nickname}` : formatDate(m.date);
      const ok = await confirmAction({
        title: `Delete matchday "${label}"?`,
        message:
          "This also deletes every team and game in this matchday.\n" +
          "Players are kept (they're shared across matchdays).\n\n" +
          "This cannot be undone.",
        confirmLabel: "Delete matchday",
        destructive: true,
      });
      if (!ok) return;
      try {
        await api.delete(`/matchdays/${m.id}`);
        matchdays.value = matchdays.value.filter((x) => x.id !== m.id);
        toast.success(`Matchday ${formatDate(m.date)} deleted`);
      } catch (err) {
        toast.error(err.message || "Failed to delete matchday");
      }
    };

    const formatDate = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
    };

    onMounted(fetchSeasons);

    return {
      matchdayDate, nickname, selectedSeason, seasons, matchdays,
      saveMatchday, deleteMatchday, formatDate, fetchMatchdays,
      canSave, loading, saving,
    };
  },
};
</script>
