<template>
  <div class="container mx-auto p-4 max-w-3xl">
    <header class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-2xl font-bold">Admins</h2>
        <p class="text-sm text-gray-500">
          {{ admins.length }} admin{{ admins.length === 1 ? "" : "s" }}
        </p>
      </div>
    </header>

    <!-- Add form -->
    <section class="mb-6 border rounded-lg p-4 bg-white">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Invite a new admin</h3>
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          v-model="newEmail"
          type="email"
          placeholder="email@example.com"
          autocomplete="off"
          class="p-2 border rounded"
          @keydown.enter="addAdmin"
        />
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="password (min 8)"
            autocomplete="new-password"
            class="p-2 border rounded w-full pr-16"
            @keydown.enter="addAdmin"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "hide" : "show" }}
          </button>
        </div>
        <button
          @click="addAdmin"
          class="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          :disabled="!canAdd || saving"
        >
          {{ saving ? "Inviting..." : "Add admin" }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        They sign in immediately with this email + password. Share both over a secure channel.
      </p>
    </section>

    <!-- List -->
    <section>
      <h3 class="text-sm font-semibold text-gray-700 mb-2">All admins</h3>
      <p v-if="loading" class="text-gray-500">Loading...</p>
      <ul v-else class="border rounded-lg divide-y bg-white">
        <li
          v-for="admin in admins"
          :key="admin.id"
          class="px-3 py-3 flex items-center justify-between gap-3"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium truncate">{{ admin.email }}</span>
              <span
                v-if="admin.id === currentUserId"
                class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 shrink-0"
              >
                you
              </span>
            </div>
            <div class="text-xs text-gray-500">
              joined {{ formatDate(admin.created_at) }}
            </div>
          </div>
          <button
            @click="removeAdmin(admin)"
            :disabled="admin.id === currentUserId || admins.length <= 1"
            :title="
              admin.id === currentUserId
                ? 'You cannot delete yourself'
                : admins.length <= 1
                ? 'Cannot delete the last admin'
                : 'Remove this admin'
            "
            class="text-red-600 hover:underline text-sm shrink-0 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </li>
        <li v-if="!admins.length" class="px-3 py-4 text-gray-500 italic">
          No admins yet (somehow).
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { api } from "@/api";
import { toast } from "@/toast";
import { confirmAction } from "@/confirm";
import { currentUser } from "@/auth";

export default {
  name: "Admins",
  setup() {
    const admins = ref([]);
    const newEmail = ref("");
    const newPassword = ref("");
    const showPassword = ref(false);
    const loading = ref(true);
    const saving = ref(false);

    const currentUserId = computed(() => currentUser.value?.id || null);
    const canAdd = computed(
      () =>
        newEmail.value.trim().length > 0 &&
        newPassword.value.length >= 8
    );

    const fetchAdmins = async () => {
      loading.value = true;
      try {
        admins.value = (await api.get("/users")) || [];
      } catch (err) {
        toast.error(err.message || "Failed to load admins");
      } finally {
        loading.value = false;
      }
    };

    const addAdmin = async () => {
      if (!canAdd.value) {
        if (newPassword.value.length < 8) {
          toast.error("Password must be at least 8 characters");
        }
        return;
      }
      const email = newEmail.value.trim();
      saving.value = true;
      try {
        await api.post("/auth/register", {
          email,
          password: newPassword.value,
        });
        toast.success(`Admin "${email}" invited`);
        newEmail.value = "";
        newPassword.value = "";
        showPassword.value = false;
        await fetchAdmins();
      } catch (err) {
        toast.error(err.message || "Failed to add admin");
      } finally {
        saving.value = false;
      }
    };

    const removeAdmin = async (admin) => {
      const ok = await confirmAction({
        title: `Remove admin "${admin.email}"?`,
        message:
          "They will lose access immediately. Their existing JWT stays valid until expiry (max 24 h) but can't be refreshed.\n\n" +
          "This cannot be undone.",
        confirmLabel: "Remove admin",
        destructive: true,
        requireText: admin.email,
      });
      if (!ok) return;
      try {
        await api.delete(`/users/${admin.id}`);
        toast.success(`Admin "${admin.email}" removed`);
        admins.value = admins.value.filter((a) => a.id !== admin.id);
      } catch (err) {
        toast.error(err.message || "Failed to remove admin");
      }
    };

    const formatDate = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    onMounted(fetchAdmins);

    return {
      admins,
      newEmail,
      newPassword,
      showPassword,
      loading,
      saving,
      canAdd,
      currentUserId,
      addAdmin,
      removeAdmin,
      formatDate,
    };
  },
};
</script>
