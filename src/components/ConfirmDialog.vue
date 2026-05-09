<template>
  <transition name="confirm">
    <div
      v-if="store.request"
      class="confirm-backdrop"
      @click.self="cancel"
      @keydown.esc="cancel"
    >
      <div
        class="confirm-card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <h3 :id="titleId" class="confirm-title">{{ store.request.title }}</h3>

        <p v-if="store.request.message" class="confirm-message">
          {{ store.request.message }}
        </p>

        <div v-if="store.request.requireText" class="confirm-typed">
          <label class="confirm-typed-label">
            Type <code>{{ store.request.requireText }}</code> to confirm:
          </label>
          <input
            ref="inputEl"
            v-model="typed"
            type="text"
            class="confirm-typed-input"
            :placeholder="store.request.requireText"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter="onConfirm"
            @keydown.esc="cancel"
          />
        </div>

        <div class="confirm-actions">
          <button type="button" class="confirm-btn-cancel" @click="cancel">
            {{ store.request.cancelLabel || "Cancel" }}
          </button>
          <button
            type="button"
            :class="['confirm-btn-confirm', store.request.destructive ? 'is-destructive' : 'is-primary']"
            :disabled="!canConfirm"
            @click="onConfirm"
          >
            {{ store.request.confirmLabel || "Confirm" }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { confirmStore, _resolveCurrent } from "@/confirm";

let nextId = 1;

export default {
  name: "ConfirmDialog",
  setup() {
    const store = confirmStore;
    const typed = ref("");
    const inputEl = ref(null);
    const titleId = `confirm-title-${nextId++}`;

    const required = computed(() => store.request?.requireText || null);

    const canConfirm = computed(() => {
      if (!store.request) return false;
      if (!required.value) return true;
      return typed.value.trim() === required.value;
    });

    const cancel = () => _resolveCurrent(false);
    const onConfirm = () => {
      if (!canConfirm.value) return;
      _resolveCurrent(true);
    };

    // Reset typed text and focus the right element each time a request opens.
    watch(
      () => store.request,
      async (req) => {
        if (req) {
          typed.value = "";
          await nextTick();
          if (inputEl.value) inputEl.value.focus();
        }
      },
      { immediate: true }
    );

    // Global Esc handler — works even when the input has focus, since the
    // input also stops propagation via its own @keydown.esc.
    const onKey = (e) => {
      if (!store.request) return;
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      } else if (e.key === "Enter" && !required.value) {
        // For non-typed dialogs, Enter anywhere confirms.
        e.preventDefault();
        onConfirm();
      }
    };

    onMounted(() => window.addEventListener("keydown", onKey));
    onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

    return { store, typed, inputEl, canConfirm, cancel, onConfirm, titleId };
  },
};
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.confirm-card {
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  max-width: 460px;
  width: 100%;
  padding: 1.25rem 1.25rem 1rem;
}

.confirm-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
}

.confirm-message {
  font-size: 0.9rem;
  color: #374151;
  white-space: pre-line;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.confirm-typed {
  margin: 0 0 1rem;
}

.confirm-typed-label {
  display: block;
  font-size: 0.85rem;
  color: #4b5563;
  margin-bottom: 0.35rem;
}

.confirm-typed-label code {
  background: #f3f4f6;
  padding: 0 0.35rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #111827;
  font-weight: 600;
}

.confirm-typed-input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.confirm-typed-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.confirm-btn-cancel,
.confirm-btn-confirm {
  padding: 0.5rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.confirm-btn-cancel {
  background: #e5e7eb;
  color: #111827;
}
.confirm-btn-cancel:hover { background: #d1d5db; }

.confirm-btn-confirm {
  color: #fff;
}
.confirm-btn-confirm.is-primary { background: #2563eb; }
.confirm-btn-confirm.is-primary:hover { background: #1d4ed8; }
.confirm-btn-confirm.is-destructive { background: #dc2626; }
.confirm-btn-confirm.is-destructive:hover { background: #b91c1c; }
.confirm-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
