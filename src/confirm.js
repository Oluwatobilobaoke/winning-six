import { reactive } from "vue";

// Imperative confirm: callsite does
//   if (!await confirmAction({...})) return;
// One active request at a time. The modal component (ConfirmDialog.vue)
// reads `state.request` reactively and calls _resolve on the user's choice.

const state = reactive({
  request: null, // { title, message, confirmLabel, destructive, requireText, _resolve }
});

export const confirmStore = state;

export function confirmAction({
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  requireText = null,
} = {}) {
  // If a request is already open, dismiss it as cancelled before opening a new one.
  if (state.request) {
    const prev = state.request;
    state.request = null;
    prev._resolve?.(false);
  }

  return new Promise((resolve) => {
    state.request = {
      title,
      message,
      confirmLabel,
      cancelLabel,
      destructive,
      requireText,
      _resolve: resolve,
    };
  });
}

// Internal helpers used by ConfirmDialog.vue.
export function _resolveCurrent(value) {
  const req = state.request;
  if (!req) return;
  state.request = null;
  req._resolve(value);
}
