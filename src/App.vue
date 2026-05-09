<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      v-if="user"
      class="fixed z-50 inset-y-0 left-0 w-64 bg-blue-900 text-white p-4
             transform transition-transform duration-300
             md:static md:translate-x-0
             "
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <h2 class="text-2xl font-bold mb-6">Football Ranking</h2>

      <nav>
        <ul>
          <li class="mb-2">
            <router-link to="/" class="nav-link" @click="closeSidebar">Ranking</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/games" class="nav-link" @click="closeSidebar">Games</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/teams" class="nav-link" @click="closeSidebar">Teams</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/matchdays" class="nav-link" @click="closeSidebar">MatchDay</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/randomize" class="nav-link" @click="closeSidebar">Randomize</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/players" class="nav-link" @click="closeSidebar">Players</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/seasons" class="nav-link" @click="closeSidebar">Season</router-link>
          </li>
          <li class="mb-2">
            <router-link to="/admins" class="nav-link" @click="closeSidebar">Admins</router-link>
          </li>

          <button
            v-if="user"
            class="mt-4 w-full p-2 rounded hover:bg-blue-700 text-left"
            @click="handleLogout"
          >
            Logout
          </button>
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Top bar (always visible; hamburger only when logged in on mobile) -->
      <header class="bg-white shadow p-4 flex items-center justify-between md:hidden">
        <div class="flex items-center">
          <button v-if="user" @click="sidebarOpen = true" class="mr-4" aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="font-bold text-lg">Football Ranking</h1>
        </div>
        <router-link
          v-if="!user && $route.name !== 'Login'"
          to="/login"
          class="text-sm text-blue-700 font-medium hover:underline"
        >
          Sign in
        </router-link>
      </header>

      <!-- Desktop floating Sign-in for anonymous visitors -->
      <router-link
        v-if="!user && $route.name !== 'Login'"
        to="/login"
        class="hidden md:inline-flex items-center self-end m-4 px-3 py-1.5 rounded
               bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
      >
        Sign in
      </router-link>

      <main class="flex-1 p-6 overflow-y-auto">
        <router-view />
      </main>
    </div>

    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { isAuthenticated, logout } from "@/auth";
import ToastContainer from "@/components/ToastContainer.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

export default {
  name: "AppLayout",
  components: { ToastContainer, ConfirmDialog },
  setup() {
    const router = useRouter();
    const sidebarOpen = ref(false);

    const handleLogout = () => {
      logout();
      router.push("/login");
    };

    const closeSidebar = () => {
      sidebarOpen.value = false;
    };

    return {
      user: isAuthenticated,
      sidebarOpen,
      handleLogout,
      closeSidebar,
    };
  },
};
</script>

<style>
.router-link-active {
  background-color: #2563eb;
}

.nav-link {
  display: block;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.nav-link:hover {
  background-color: #1d4ed8;
}
</style>
