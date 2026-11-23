<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  titulo: String,
  mensaje: String,
  textoConfirmar: { type: String, default: 'Eliminar' }
})
const emit = defineEmits(['confirmar', 'cancelar'])
const botonOk = ref(null)

function tecla(e) {
  if (e.key === 'Escape') emit('cancelar')
}
onMounted(() => {
  document.addEventListener('keydown', tecla)
  botonOk.value?.focus()
})
onBeforeUnmount(() => document.removeEventListener('keydown', tecla))
</script>

<template>
  <div class="modal-fondo" @click.self="emit('cancelar')">
    <div class="modal-caja" role="alertdialog" aria-modal="true">
      <div class="modal-icono"><i class="bi bi-trash3-fill"></i></div>
      <h3>{{ titulo }}</h3>
      <p>{{ mensaje }}</p>
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-suave" @click="emit('cancelar')">Cancelar</button>
        <button ref="botonOk" type="button" class="btn btn-peligro" @click="emit('confirmar')">
          {{ textoConfirmar }}
        </button>
      </div>
    </div>
  </div>
</template>