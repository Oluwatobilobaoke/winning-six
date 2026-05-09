import { ref, computed } from "vue";
import { api } from "@/api";
import { getToken, setToken, clearToken, decodeClaims, isValid } from "@/token";

const tokenRef = ref(getToken());

export const isAuthenticated = computed(() => isValid(tokenRef.value));

export const currentUser = computed(() => {
  const claims = decodeClaims(tokenRef.value);
  if (!claims) return null;
  return {
    id: claims.sub || claims.user_id,
    email: claims.email,
    role: claims.role,
  };
});

export const isAdmin = computed(() => currentUser.value?.role === "admin");

export async function login(email, password) {
  const data = await api.post("/auth/login", { email, password }, { auth: false });
  setToken(data.token);
  tokenRef.value = data.token;
  return data.user;
}

export function logout() {
  clearToken();
  tokenRef.value = null;
}
