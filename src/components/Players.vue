<template>
  <div class="container mx-auto p-4">
    <header class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-2xl font-bold">Players</h2>
        <p class="text-sm text-gray-500">
          {{ players.length }} player{{ players.length === 1 ? "" : "s" }}
        </p>
      </div>
      <router-link
        to="/players/bulk"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-blue-600
               text-blue-700 text-sm font-medium hover:bg-blue-50 active:bg-blue-100
               transition-colors"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        Bulk Add Players
      </router-link>
    </header>

    <section class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">Add a player</h3>
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          v-model="playerName"
          type="text"
          placeholder="Enter player name"
          class="p-2 border rounded w-full"
          @keydown.enter="savePlayer"
        />
        <button
          @click="savePlayer"
          class="p-2 bg-blue-500 text-white rounded disabled:opacity-50
                 sm:w-auto w-full whitespace-nowrap hover:bg-blue-600 transition-colors"
          :disabled="!playerName.trim() || saving"
        >
          {{ saving ? "Saving..." : "Save Player" }}
        </button>
      </div>
    </section>

    <section>
      <h3 class="text-sm font-semibold text-gray-700 mb-2">All players</h3>
      <p v-if="loading" class="text-gray-500">Loading...</p>
      <ul v-else class="border rounded divide-y bg-white min-h-[100px]">
        <li
          v-for="player in players"
          :key="player.id"
          class="px-3 py-2 flex justify-between items-center gap-2"
        >
          <span class="truncate">{{ player.name }}</span>
          <button
            @click="deletePlayer(player)"
            class="text-red-600 hover:underline text-sm shrink-0"
          >
            Delete
          </button>
        </li>
        <li v-if="!players.length" class="px-3 py-4 text-gray-500 italic">
          No players yet.
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";
import { confirmAction } from "@/confirm";
import { nameKey } from "@/utils/randomizeTeams";

export default {
  setup() {
    const playerName = ref("");
    const players = ref([]);
    const loading = ref(true);
    const saving = ref(false);

    const fetchPlayers = async () => {
      loading.value = true;
      try {
        players.value = (await api.get("/players")) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load players");
      } finally {
        loading.value = false;
      }
    };

    const savePlayer = async () => {
      const name = playerName.value.trim();
      if (!name) return;

      const key = nameKey(name);
      const existing = players.value.find((p) => nameKey(p.name) === key);
      if (existing) {
        toast.error(`Player already exists: "${existing.name}"`);
        return;
      }

      saving.value = true;
      try {
        const created = await api.post("/players", { name });
        players.value.push(created);
        playerName.value = "";
        toast.success(`Player "${created.name}" created`);
      } catch (err) {
        // Backend's 409 already carries a useful message; just surface it.
        toast.error(err.message || "Failed to create player");
      } finally {
        saving.value = false;
      }
    };

    const deletePlayer = async (player) => {
      const ok = await confirmAction({
        title: `Delete player "${player.name}"?`,
        message:
          "They will disappear from team rosters and leaderboards immediately.\n" +
          "Past games keep their team scores intact.",
        confirmLabel: "Delete player",
        destructive: true,
      });
      if (!ok) return;
      try {
        await api.delete(`/players/${player.id}`);
        players.value = players.value.filter((p) => p.id !== player.id);
        toast.success(`Player "${player.name}" deleted`);
      } catch (err) {
        toast.error(err.message || "Failed to delete player");
      }
    };

    onMounted(fetchPlayers);

    return { playerName, players, savePlayer, deletePlayer, loading, saving };
  },
};
</script>
