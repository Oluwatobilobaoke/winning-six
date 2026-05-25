<template>
  <div class="max-w-5xl mx-auto p-4 sm:p-6 bg-white shadow rounded">
    <h2 class="text-2xl font-bold mb-4">Randomize Teams</h2>

    <!-- Season + matchday selectors -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block font-semibold mb-1">Season</label>
        <select v-model="selectedSeason" class="border rounded p-2 w-full" @change="onSeasonChange">
          <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div>
        <label class="block font-semibold mb-1">Matchday</label>
        <select v-model="matchdayChoice" class="border rounded p-2 w-full" @change="onMatchdayChange">
          <option v-for="m in matchdays" :key="m.id" :value="m.id">
            {{ matchdayLabel(m) }}
          </option>
          <option value="__new__">+ New matchday</option>
        </select>
      </div>
    </div>

    <!-- Inline new matchday form -->
    <div v-if="matchdayChoice === '__new__'" class="border rounded p-4 mb-4 bg-gray-50">
      <h3 class="font-semibold mb-2">New matchday</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm mb-1">Date</label>
          <Datepicker v-model="newMatchdayDate" :enable-time-picker="false" class="w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Nickname (optional)</label>
          <input
            v-model="newMatchdayNickname"
            type="text"
            class="border rounded p-2 w-full"
            placeholder="e.g. Sunday Funday"
          />
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <button
          @click="createMatchdayInline"
          class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          :disabled="!newMatchdayDate || creatingMatchday"
        >
          {{ creatingMatchday ? "Creating..." : "Create matchday" }}
        </button>
        <button @click="cancelNewMatchday" class="bg-gray-300 text-gray-800 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>

    <!-- Shape -->
    <div class="grid grid-cols-2 gap-4 mb-2">
      <div>
        <label class="block font-semibold mb-1">Teams</label>
        <input
          v-model.number="teamCount"
          type="number"
          min="2"
          max="10"
          class="border rounded p-2 w-full disabled:bg-gray-100 disabled:text-gray-500"
          :disabled="!!parsedSizes"
        />
      </div>
      <div>
        <label class="block font-semibold mb-1">Players per team</label>
        <input
          v-model.number="perTeam"
          type="number"
          min="1"
          max="20"
          class="border rounded p-2 w-full disabled:bg-gray-100 disabled:text-gray-500"
          :disabled="!!parsedSizes"
        />
      </div>
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1">Custom team sizes (optional)</label>
      <input
        v-model="customSizes"
        type="text"
        placeholder="e.g. 6,6,6,4"
        class="border rounded p-2 w-full"
      />
      <p v-if="customSizes && !parsedSizes" class="text-xs text-red-600 mt-1">
        Use comma-separated positive numbers, e.g. 6,6,6,4
      </p>
      <p v-else-if="parsedSizes" class="text-xs text-gray-500 mt-1">
        Overriding teams &amp; per-team — {{ parsedSizes.length }} teams of {{ parsedSizes.join("/") }}
      </p>
    </div>

    <!-- Paste box -->
    <div class="mb-4">
      <label class="block font-semibold mb-1">Paste names (one per line)</label>
      <textarea
        v-model="rawNames"
        rows="8"
        class="border rounded p-2 w-full font-mono text-sm"
        :placeholder="placeholderNames"
      />
      <p class="text-xs text-gray-500 mt-1">
        {{ pastedCount }} names · target {{ targetCount }}
        ({{ parsedSizes ? parsedSizes.join("+") : `${teamCount} × ${perTeam}` }})
      </p>
    </div>

    <button
      @click="onRandomize"
      class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      :disabled="!canRandomize"
    >
      {{ resultReady ? "↻ Re-shuffle" : "Randomize" }}
    </button>

    <!-- Result -->
    <div v-if="resultReady" class="mt-6">
      <!-- Top-4 indicator -->
      <p
        :class="[
          'mb-3 px-3 py-2 rounded text-sm',
          top4Active ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600',
        ]"
      >
        <span v-if="top4Active">
          ✔ Top-4 split rule: ACTIVE
          <span class="text-gray-700">
            ({{ top4Names.join(", ") }} — one per team)
          </span>
        </span>
        <span v-else>
          ⓘ Top-4 split rule: SKIPPED (no leaderboard yet for this season)
        </span>
      </p>

      <!-- Unmatched -->
      <div v-if="unmatched.length" class="mb-4 p-3 border border-amber-300 rounded bg-amber-50">
        <p class="font-semibold text-amber-800 mb-2">
          ⚠ {{ unmatched.length }} unmatched name{{ unmatched.length === 1 ? "" : "s" }}:
        </p>
        <ul class="space-y-1">
          <li
            v-for="name in unmatched"
            :key="name"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm"
          >
            <span class="font-mono break-all">"{{ name }}"</span>
            <span class="flex flex-wrap gap-x-3 gap-y-1 shrink-0">
              <button
                @click="createUnmatched(name)"
                class="text-blue-600 hover:underline disabled:opacity-50 text-left"
                :disabled="creatingPlayer === name"
              >
                {{ creatingPlayer === name ? "Creating..." : "+ Create as new player" }}
              </button>
              <button @click="skipUnmatched(name)" class="text-gray-600 hover:underline text-left">
                Skip
              </button>
            </span>
          </li>
        </ul>
      </div>

      <!-- Team cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="(team, idx) in teams"
          :key="idx"
          class="border rounded p-3 bg-gray-50"
        >
          <h4 class="font-semibold mb-2">
            {{ teamCityNames[idx] }}
            <span class="text-sm text-gray-500">({{ team.length }})</span>
          </h4>
          <ul class="space-y-1">
            <li
              v-for="p in team"
              :key="p.id"
              class="flex justify-between items-center bg-white border rounded px-2 py-1 text-sm"
            >
              <span :class="{ 'font-semibold text-green-700': top4Set.has(p.id) }">
                {{ p.name }}
                <span v-if="top4Set.has(p.id)" class="text-xs text-green-600">★</span>
              </span>
              <button
                @click="moveToUnassigned(idx, p)"
                class="text-red-500 hover:text-red-700 text-xs"
                title="Move to Unassigned"
              >
                ✕
              </button>
            </li>
            <li v-if="!team.length" class="text-xs text-gray-400 italic px-2 py-1">empty</li>
          </ul>
        </div>
      </div>

      <!-- Unassigned -->
      <div class="mt-4 border rounded p-3 bg-gray-50">
        <h4 class="font-semibold mb-2">
          Unassigned <span class="text-sm text-gray-500">({{ unassigned.length }})</span>
        </h4>
        <p v-if="!unassigned.length" class="text-xs text-gray-500 italic">
          (drop a player here by clicking ✕ above)
        </p>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="p in unassigned"
            :key="p.id"
            @click="moveToSmallestTeam(p)"
            class="px-3 py-1 text-sm bg-white border rounded-full hover:bg-blue-50"
            title="Add to smallest team"
          >
            {{ p.name }} <span class="text-xs text-gray-500">+</span>
          </button>
        </div>
      </div>

      <p v-if="surplusMessage" class="mt-3 text-sm text-amber-700">{{ surplusMessage }}</p>

      <div class="mt-6 flex flex-wrap gap-3 items-center">
        <button
          @click="reshuffle"
          class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          ↻ Re-shuffle
        </button>
        <button
          @click="proceed"
          class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          :disabled="!canProceed || proceeding"
        >
          {{ proceeding ? "Creating..." : "Proceed: create teams in matchday" }}
        </button>
        <span v-if="!canProceed" class="text-xs text-gray-500">
          (every team must have at least 1 player)
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api";
import { toast } from "@/toast";
import { resolveNames, runRandomize } from "@/utils/randomizeTeams";
import { pickTeamNames } from "@/utils/cityNames";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const placeholder = `Juwon
Bolade
Ifeanyi
...`;

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
  name: "Randomize",
  components: { Datepicker },
  setup() {
    const router = useRouter();

    const seasons = ref([]);
    const matchdays = ref([]);
    const players = ref([]);
    const top4Ids = ref([]);

    const selectedSeason = ref(null);
    const matchdayChoice = ref(null); // existing matchday id, or "__new__", or null
    const newMatchdayDate = ref(new Date());
    const newMatchdayNickname = ref("");
    const creatingMatchday = ref(false);

    const teamCount = ref(4);
    const perTeam = ref(7);
    const customSizes = ref("");
    const rawNames = ref("");

    // result state
    const teams = ref([]);
    const unassigned = ref([]);
    const unmatched = ref([]);
    const teamCityNames = ref([]);
    const surplusMessage = ref("");
    const resultReady = ref(false);
    const top4Active = ref(false);
    const creatingPlayer = ref(null);
    const proceeding = ref(false);

    const top4Set = computed(() => new Set(top4Ids.value));
    const top4Names = computed(() =>
      top4Ids.value
        .map((id) => players.value.find((p) => p.id === id)?.name)
        .filter(Boolean)
    );
    const pastedCount = computed(
      () => rawNames.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).length
    );
    const parsedSizes = computed(() => {
      const s = customSizes.value.trim();
      if (!s) return null;
      const parts = s.split(/[,\s]+/).filter(Boolean).map((x) => Number(x));
      if (!parts.length || parts.some((n) => !Number.isInteger(n) || n < 1)) return null;
      return parts;
    });
    const effectiveTeamCount = computed(() =>
      parsedSizes.value ? parsedSizes.value.length : teamCount.value
    );
    const targetCount = computed(() =>
      parsedSizes.value
        ? parsedSizes.value.reduce((a, b) => a + b, 0)
        : teamCount.value * perTeam.value
    );
    const placeholderNames = computed(() => placeholder);

    const selectedMatchdayId = computed(() =>
      matchdayChoice.value && matchdayChoice.value !== "__new__"
        ? matchdayChoice.value
        : null
    );

    const canRandomize = computed(() => {
      if (!selectedMatchdayId.value || !rawNames.value.trim()) return false;
      if (parsedSizes.value) return parsedSizes.value.length >= 2;
      return teamCount.value >= 2 && perTeam.value >= 1;
    });
    const canProceed = computed(
      () => resultReady.value && teams.value.every((t) => t.length > 0)
    );

    const matchdayLabel = (m) => {
      const date = m.date || "";
      return m.nickname ? `${date} — ${m.nickname}` : date;
    };

    const fetchSeasons = async () => {
      try {
        seasons.value = (await api.get("/seasons")) || [];
        if (seasons.value.length) {
          selectedSeason.value = seasons.value[0].id;
          await onSeasonChange();
        }
      } catch (err) {
        toast.error(err.message || "Failed to load seasons");
      }
    };

    const fetchPlayers = async () => {
      try {
        players.value = (await api.get("/players")) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load players");
      }
    };

    const fetchMatchdays = async () => {
      matchdays.value = [];
      if (!selectedSeason.value) return;
      try {
        const data = await api.get(`/seasons/${selectedSeason.value}/matchdays`);
        matchdays.value = (data || [])
          .slice()
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        if (matchdays.value.length) {
          matchdayChoice.value = matchdays.value[0].id;
        } else {
          matchdayChoice.value = "__new__";
        }
      } catch (err) {
        toast.error(err.message || "Failed to load matchdays");
      }
    };

    const fetchLeaderboard = async () => {
      top4Ids.value = [];
      if (!selectedSeason.value) return;
      try {
        const data = await api.get(`/seasons/${selectedSeason.value}/leaderboard`);
        top4Ids.value = (data || []).slice(0, 4).map((row) => row.id);
      } catch (err) {
        toast.error(err.message || "Failed to load leaderboard");
      }
    };

    const onSeasonChange = async () => {
      resultReady.value = false;
      await Promise.all([fetchMatchdays(), fetchLeaderboard()]);
    };

    const onMatchdayChange = () => {
      resultReady.value = false;
    };

    const createMatchdayInline = async () => {
      if (!selectedSeason.value || !newMatchdayDate.value) return;
      creatingMatchday.value = true;
      try {
        const created = await api.post(`/seasons/${selectedSeason.value}/matchdays`, {
          date: toIsoDate(newMatchdayDate.value),
          nickname: newMatchdayNickname.value.trim() || undefined,
        });
        await fetchMatchdays();
        matchdayChoice.value = created.id;
        newMatchdayNickname.value = "";
        newMatchdayDate.value = new Date();
        toast.success(`Matchday ${created.date} created`);
      } catch (err) {
        toast.error(err.message || "Failed to create matchday");
      } finally {
        creatingMatchday.value = false;
      }
    };

    const cancelNewMatchday = () => {
      if (matchdays.value.length) {
        matchdayChoice.value = matchdays.value[0].id;
      } else {
        matchdayChoice.value = null;
      }
    };

    let lastMatched = []; // remembered between reshuffles

    const onRandomize = () => {
      const { matched, unmatched: missed } = resolveNames(rawNames.value, players.value);
      lastMatched = matched;
      unmatched.value = missed;
      computeTeams();
      pickCityNamesForTeams();
      resultReady.value = true;
    };

    const computeTeams = () => {
      const result = runRandomize({
        matchedPlayers: lastMatched,
        top4Ids: top4Ids.value,
        teamCount: teamCount.value,
        perTeam: perTeam.value,
        sizes: parsedSizes.value,
      });
      teams.value = result.teams;
      unassigned.value = [];
      top4Active.value = top4Ids.value.length > 0;
      surplusMessage.value =
        result.surplus > 0
          ? `Note: ${result.surplus} more player(s) than ${targetCount.value} target — some teams will be larger.`
          : result.surplus < 0
          ? `Note: ${-result.surplus} fewer player(s) than ${targetCount.value} target — some teams will be smaller.`
          : "";
    };

    const reshuffle = () => {
      // Re-roll across all currently-matched players (teams + unassigned).
      lastMatched = [...teams.value.flat(), ...unassigned.value];
      computeTeams();
      pickCityNamesForTeams();
    };

    const pickCityNamesForTeams = async () => {
      let taken = [];
      if (selectedMatchdayId.value) {
        try {
          const existing = await api.get(`/matchdays/${selectedMatchdayId.value}/teams`);
          taken = (existing || []).map((t) => t.name);
        } catch {
          // non-fatal — just no dedupe
        }
      }
      teamCityNames.value = pickTeamNames(effectiveTeamCount.value, taken);
    };

    const moveToUnassigned = (teamIdx, player) => {
      teams.value[teamIdx] = teams.value[teamIdx].filter((p) => p.id !== player.id);
      unassigned.value.push(player);
    };

    const moveToSmallestTeam = (player) => {
      let minIdx = 0;
      for (let i = 1; i < teams.value.length; i++) {
        if (teams.value[i].length < teams.value[minIdx].length) minIdx = i;
      }
      teams.value[minIdx].push(player);
      unassigned.value = unassigned.value.filter((p) => p.id !== player.id);
    };

    const createUnmatched = async (name) => {
      creatingPlayer.value = name;
      try {
        const created = await api.post("/players", { name });
        players.value.push(created);
        unmatched.value = unmatched.value.filter((n) => n !== name);
        // Inject into the smallest team so they're not lost.
        let minIdx = 0;
        for (let i = 1; i < teams.value.length; i++) {
          if (teams.value[i].length < teams.value[minIdx].length) minIdx = i;
        }
        teams.value[minIdx].push(created);
        toast.success(`Player "${created.name}" created`);
      } catch (err) {
        toast.error(err.message || "Failed to create player");
      } finally {
        creatingPlayer.value = null;
      }
    };

    const skipUnmatched = (name) => {
      unmatched.value = unmatched.value.filter((n) => n !== name);
    };

    const proceed = async () => {
      if (!canProceed.value || !selectedMatchdayId.value) return;
      proceeding.value = true;
      try {
        // Warn if matchday already has teams.
        const existing = await api.get(`/matchdays/${selectedMatchdayId.value}/teams`);
        if ((existing || []).length > 0) {
          toast.error(
            `Matchday already has ${existing.length} team(s) — appending new ones.`
          );
        }

        const total = teams.value.length;
        for (let i = 0; i < total; i++) {
          const cityName = teamCityNames.value[i];
          await api.post(`/matchdays/${selectedMatchdayId.value}/teams`, {
            name: cityName,
            player_ids: teams.value[i].map((p) => p.id),
          });
          toast.success(`Team ${cityName} created (${i + 1}/${total})`);
        }
        toast.success("Matchday teams ready");
        router.push("/teams");
      } catch (err) {
        toast.error(err.message || "Failed to create teams");
      } finally {
        proceeding.value = false;
      }
    };

    onMounted(async () => {
      await Promise.all([fetchSeasons(), fetchPlayers()]);
    });

    return {
      seasons, matchdays, players,
      selectedSeason, matchdayChoice, selectedMatchdayId,
      newMatchdayDate, newMatchdayNickname, creatingMatchday,
      teamCount, perTeam, customSizes, parsedSizes, rawNames,
      teams, unassigned, unmatched, teamCityNames, surplusMessage,
      resultReady, top4Active, top4Ids, top4Names, top4Set,
      pastedCount, targetCount, placeholderNames,
      canRandomize, canProceed,
      matchdayLabel,
      onSeasonChange, onMatchdayChange,
      createMatchdayInline, cancelNewMatchday,
      onRandomize, reshuffle,
      moveToUnassigned, moveToSmallestTeam,
      createUnmatched, skipUnmatched, creatingPlayer,
      proceed, proceeding,
    };
  },
};
</script>
