<template>
  <div class="toast-container" role="status" aria-live="polite">
    <transition-group name="toast" tag="div" class="toast-stack">
      <div
        v-for="t in toasts.items"
        :key="t.id"
        :class="['toast', `toast-${t.type}`]"
      >
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" @click="toast.dismiss(t.id)" aria-label="Dismiss">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { toasts, toast } from "@/toast";

export default {
  name: "ToastContainer",
  setup() {
    return { toasts, toast };
  },
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  left: 1rem;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  justify-content: flex-end;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  max-width: 380px;
  width: fit-content;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
  color: #fff;
  background: #334155;
}

.toast-success { background: #16a34a; }
.toast-error   { background: #dc2626; }
.toast-info    { background: #2563eb; }

.toast-msg { flex: 1; }

.toast-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}
.toast-close:hover { color: #fff; }

.toast-enter-active,
.toast-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.toast-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
