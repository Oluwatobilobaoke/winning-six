<template>
  <div class="container mx-auto p-4">
    <h2 class="text-xl font-bold mb-4">Seasons</h2>

    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <input
        v-model="newSeason"
        type="text"
        placeholder="Enter season name"
        class="border p-2 flex-grow"
        @keydown.enter="addSeason"
      />
      <button
        @click="addSeason"
        class="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
        :disabled="!newSeason.trim() || saving"
      >
        {{ saving ? "Saving..." : "Add Season" }}
      </button>
    </div>

    <p v-if="loading" class="text-gray-500">Loading...</p>

    <div v-else-if="seasons.length > 0">
      <div
        v-for="season in seasons"
        :key="season.id"
        class="flex justify-between items-center border p-3 mb-2 rounded shadow-sm bg-white"
      >
        <span class="font-semibold">{{ season.name }}</span>
        <button
          @click="deleteSeason(season)"
          class="bg-red-500 text-white px-3 py-1 rounded"
        >
          Delete
        </button>
      </div>
    </div>
    <p v-else-if="!loading" class="text-gray-500">No seasons available.</p>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";
import { confirmAction } from "@/confirm";

export default {
  setup() {
    const seasons = ref([]);
    const newSeason = ref("");
    const loading = ref(true);
    const saving = ref(false);

    const fetchSeasons = async () => {
      loading.value = true;
      try {
        seasons.value = (await api.get("/seasons")) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load seasons");
      } finally {
        loading.value = false;
      }
    };

    const addSeason = async () => {
      const name = newSeason.value.trim();
      if (!name) return;
      saving.value = true;
      try {
        const created = await api.post("/seasons", { name });
        seasons.value.push(created);
        newSeason.value = "";
        toast.success(`Season "${created.name}" created`);
      } catch (err) {
        toast.error(err.message || "Failed to create season");
      } finally {
        saving.value = false;
      }
    };

    const deleteSeason = async (season) => {
      const ok = await confirmAction({
        title: `Delete season "${season.name}"?`,
        message:
          "This also deletes every matchday, team, and game in this season.\n" +
          "Players are kept (they're shared across seasons).\n\n" +
          "This cannot be undone.",
        confirmLabel: "Delete season",
        destructive: true,
        requireText: season.name,
      });
      if (!ok) return;
      try {
        await api.delete(`/seasons/${season.id}`);
        seasons.value = seasons.value.filter((s) => s.id !== season.id);
        toast.success(`Season "${season.name}" deleted`);
      } catch (err) {
        toast.error(err.message || "Failed to delete season");
      }
    };

    onMounted(fetchSeasons);

    return { seasons, newSeason, addSeason, deleteSeason, loading, saving };
  },
};
</script>

<style>
.container {
  max-width: 600px;
  margin: auto;
}
</style>
