
import { ref } from 'vue'

const toasts = ref([])
let contador = 0

export function useToast() {
  function cerrar(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function mostrar(texto, tipo = 'ok', ms = 3500) {
    const id = ++contador
    toasts.value.push({ id, texto, tipo })

    setTimeout(() => cerrar(id), ms)
  }

  return { toasts, mostrar, cerrar }
}
