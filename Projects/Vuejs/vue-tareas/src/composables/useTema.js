
import { ref, watch } from 'vue'

function inicial() {
  try {
    const g = localStorage.getItem('tema')
    if (g) return g === 'oscuro'
  } catch {}

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const oscuro = ref(inicial())

watch(
  oscuro,
  (v) => {
    try {
      localStorage.setItem('tema', v ? 'oscuro' : 'claro')
    } catch {}

    document.documentElement.dataset.tema = v ? 'oscuro' : 'claro'
  },
  { immediate: true }
)

export function useTema() {
  return {
    oscuro,
    alternar: () => (oscuro.value = !oscuro.value)
  }
}
