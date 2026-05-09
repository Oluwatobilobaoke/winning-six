import { reactive } from "vue";

const DEFAULT_DURATION_MS = 3500;
const ERROR_DURATION_MS = 5500;

let nextId = 1;

const state = reactive({
  items: [],
});

function push(type, message, duration) {
  const id = nextId++;
  state.items.push({ id, type, message });
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id) {
  const idx = state.items.findIndex((t) => t.id === id);
  if (idx !== -1) state.items.splice(idx, 1);
}

export const toasts = state;

export const toast = {
  success(message, duration = DEFAULT_DURATION_MS) {
    return push("success", message, duration);
  },
  error(message, duration = ERROR_DURATION_MS) {
    return push("error", message, duration);
  },
  info(message, duration = DEFAULT_DURATION_MS) {
    return push("info", message, duration);
  },
  dismiss,
};
