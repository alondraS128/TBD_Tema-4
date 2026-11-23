<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({ valor: { type: Number, default: 0 }, sufijo: { type: String, default: '' } })
const mostrado = ref(0)
let raf

function animar(hasta) {
  cancelAnimationFrame(raf)
  const desde = mostrado.value
  const inicio = performance.now()
  const paso = (t) => {
    const p = Math.min((t - inicio) / 500, 1)
    mostrado.value = Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - p, 3)))
    if (p < 1) raf = requestAnimationFrame(paso)
  }
  raf = requestAnimationFrame(paso)
}

watch(() => props.valor, animar)
onMounted(() => animar(props.valor))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template><span>{{ mostrado }}{{ sufijo }}</span></template>