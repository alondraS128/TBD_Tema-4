<script setup>
import { useToast } from '../composables/useToast'
const { toasts, cerrar } = useToast()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast-item" :class="t.tipo" @click="cerrar(t.id)">
        <i class="bi" :class="t.tipo === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'"></i>
        <span>{{ t.texto }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>