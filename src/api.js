import { getToken, clearToken, isValid } from "@/token";
import { toast } from "@/toast";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function bounceToLogin(reason) {
  clearToken();
  if (location.pathname !== "/login") {
    if (reason) toast.error(reason);
    location.href = "/login";
  }
}

async function request(method, path, { body, auth = true, query } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (!isValid(token)) {
      bounceToLogin("Session expired, please log in again.");
      throw new ApiError(401, "UNAUTHORIZED", "session expired");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      bounceToLogin("Session expired, please log in again.");
    }
    const code = data?.error?.code || "REQUEST_FAILED";
    const message = data?.error?.message || res.statusText || "request failed";
    throw new ApiError(res.status, code, message, data?.error?.details);
  }

  return data;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
