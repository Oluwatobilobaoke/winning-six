const STORAGE_KEY = "winning_six_token";

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeClaims(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isExpired(token) {
  const claims = decodeClaims(token);
  if (!claims || typeof claims.exp !== "number") return true;
  return claims.exp * 1000 <= Date.now();
}

export function isValid(token) {
  return !!token && !isExpired(token);
}
