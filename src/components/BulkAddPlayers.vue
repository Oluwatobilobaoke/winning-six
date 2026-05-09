<template>
  <div class="container mx-auto p-4 max-w-3xl">
    <router-link
      to="/players"
      class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-3"
    >
      <span aria-hidden="true">←</span> Back to Players
    </router-link>

    <header class="mb-4">
      <h2 class="text-2xl font-bold">Bulk Add Players</h2>
      <p class="text-sm text-gray-600 mt-1">
        Paste one player per line. Optionally add a position after a comma —
        e.g. <code class="bg-gray-100 px-1 rounded">Tobi, MID</code>.
        Allowed positions: GK, DEF, MID, FWD.
      </p>
    </header>

    <div class="rounded-lg border bg-white shadow-sm p-3 sm:p-4">
      <label for="bulk-textarea" class="sr-only">Players</label>
      <textarea
        id="bulk-textarea"
        v-model="raw"
        rows="10"
        class="p-2 border rounded w-full font-mono text-sm focus:outline-none
               focus:ring-2 focus:ring-blue-500 resize-y min-h-[180px]"
        placeholder="Tobi, MID&#10;Lekan&#10;Funmi, GK"
      ></textarea>

      <div
        class="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <span class="text-sm text-gray-600">
          {{
            parsed.length
              ? `Will create ${parsed.length} player${parsed.length === 1 ? "" : "s"}`
              : "Nothing to submit yet"
          }}
        </span>
        <button
          @click="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded font-medium
                 disabled:opacity-50 hover:bg-blue-700 active:bg-blue-800
                 transition-colors w-full sm:w-auto"
          :disabled="!parsed.length || saving"
        >
          {{ saving ? "Saving..." : "Create Players" }}
        </button>
      </div>
    </div>

    <div
      v-if="duplicates.length"
      class="mt-4 p-3 sm:p-4 border border-red-300 bg-red-50 rounded-lg text-sm"
      role="alert"
    >
      <p class="font-semibold text-red-700 mb-2">
        These names already exist or are repeated — fix them and try again:
      </p>
      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="name in duplicates"
          :key="name"
          class="px-2 py-0.5 bg-white border border-red-300 text-red-700 rounded"
        >
          {{ name }}
        </li>
      </ul>
    </div>

    <div
      v-if="failures.length"
      class="mt-4 p-3 sm:p-4 border border-yellow-300 bg-yellow-50 rounded-lg text-sm"
      role="alert"
    >
      <p class="font-semibold text-yellow-800 mb-2">
        {{ failures.length }} row{{ failures.length === 1 ? "" : "s" }} failed:
      </p>
      <ul class="space-y-1 text-yellow-900">
        <li
          v-for="f in failures"
          :key="f.index"
          class="flex flex-col sm:flex-row sm:gap-2"
        >
          <span class="font-mono text-yellow-700 shrink-0">
            Line {{ f.index + 1 }} · {{ f.name || "blank" }}
          </span>
          <span>— {{ f.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api";
import { toast } from "@/toast";

const VALID_POSITIONS = ["GK", "DEF", "MID", "FWD"];

function parseLines(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, position] = line.split(",").map((part) => part.trim());
      const entry = { name };
      if (position) entry.position = position.toUpperCase();
      return entry;
    });
}

export default {
  setup() {
    const router = useRouter();
    const raw = ref("");
    const saving = ref(false);
    const duplicates = ref([]);
    const failures = ref([]);

    const parsed = computed(() => parseLines(raw.value));

    const submit = async () => {
      duplicates.value = [];
      failures.value = [];

      const players = parsed.value;
      if (!players.length) return;

      // Quick local sanity check on positions so the user gets immediate feedback.
      const localBad = players.find(
        (p) => p.position && !VALID_POSITIONS.includes(p.position)
      );
      if (localBad) {
        toast.error(
          `Invalid position "${localBad.position}". Use GK, DEF, MID, or FWD.`
        );
        return;
      }

      saving.value = true;
      try {
        const resp = await api.post("/players/bulk", { players });
        const created = resp?.created ?? [];
        const failed = resp?.failed ?? [];

        if (failed.length === 0) {
          toast.success(
            `Created ${created.length} player${created.length === 1 ? "" : "s"}`
          );
          router.push("/players");
          return;
        }

        // Partial success: keep the page open, surface the failures, drop the
        // successful rows from the textarea so the user can fix what's left.
        // Non-blank lines correspond 1:1 with the players array, so the
        // backend's `failed[].index` maps directly onto line positions.
        failures.value = failed;
        const failedKeys = new Set(failed.map((f) => f.index));
        raw.value = raw.value
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .filter((_, i) => failedKeys.has(i))
          .join("\n");
        toast.error(
          `Created ${created.length}, ${failed.length} failed — see below`
        );
      } catch (err) {
        if (err instanceof ApiError && err.code === "DUPLICATE_NAMES") {
          duplicates.value = err.details ?? [];
          toast.error("Duplicate names — see below");
        } else {
          toast.error(err.message || "Failed to bulk create players");
        }
      } finally {
        saving.value = false;
      }
    };

    return { raw, parsed, saving, duplicates, failures, submit };
  },
};
</script>
