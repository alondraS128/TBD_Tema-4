<script setup>
import { ref, onMounted } from 'vue'
import tareaService from './services/tareaService'

const tareas = ref([])
const total = ref(0)
const mensaje = ref('')
const idEditando = ref(null)

const formulario = ref({ titulo: '', prioridad: 'media' })
const filtroCompletada = ref('')
const filtroPrioridad = ref('')

// Muestra el mensaje de error que manda la API npm run dev
function mostrarError(e, textoPorDefecto) {
  mensaje.value = e.response?.data?.error ?? textoPorDefecto
  console.error(e)
}

// READ (con filtros opcionales)
async function cargarTareas() {
  try {
    const params = {}
    if (filtroCompletada.value !== '') params.completada = filtroCompletada.value
    if (filtroPrioridad.value !== '') params.prioridad = filtroPrioridad.value

    const { data } = await tareaService.listar(params)
    tareas.value = data.data      // tu API responde { total, data }
    total.value = data.total
  } catch (e) {
    mostrarError(e, 'No se pudo cargar la lista')
  }
}

// CREATE / UPDATE
async function guardar() {
  try {
    if (idEditando.value === null) {
      await tareaService.crear(formulario.value)
      mensaje.value = 'Tarea creada'
    } else {
      await tareaService.actualizar(idEditando.value, formulario.value)
      mensaje.value = 'Tarea actualizada'
    }
    cancelar()
    await cargarTareas()
  } catch (e) {
    mostrarError(e, 'No se pudo guardar')
  }
}

function editar(tarea) {
  idEditando.value = tarea.id
  formulario.value = { titulo: tarea.titulo, prioridad: tarea.prioridad }
  mensaje.value = ''
}

function cancelar() {
  idEditando.value = null
  formulario.value = { titulo: '', prioridad: 'media' }
}

// UPDATE parcial: marcar como completada o pendiente
async function alternarCompletada(tarea) {
  try {
    await tareaService.actualizar(tarea.id, { completada: !tarea.completada })
    await cargarTareas()
  } catch (e) {
    mostrarError(e, 'No se pudo cambiar el estado')
  }
}

// DELETE
async function eliminar(tarea) {
  if (!confirm(`¿Eliminar la tarea "${tarea.titulo}" (ID ${tarea.id})?`)) return
  try {
    await tareaService.eliminar(tarea.id)
    if (idEditando.value === tarea.id) cancelar()
    mensaje.value = `Tarea eliminada: ${tarea.titulo}`
    await cargarTareas()
  } catch (e) {
    mostrarError(e, 'No se pudo eliminar')
  }
}

onMounted(cargarTareas)
</script>

<template>
  <h2>{{ idEditando === null ? 'Nueva Tarea' : 'Editar Tarea #' + idEditando }}</h2>

  <input v-model="formulario.titulo" placeholder="Título (mínimo 3 caracteres)" />
  <select v-model="formulario.prioridad">
    <option value="alta">Alta</option>
    <option value="media">Media</option>
    <option value="baja">Baja</option>
  </select>

  <button @click="guardar">{{ idEditando === null ? 'Guardar' : 'Actualizar' }}</button>
  <button v-if="idEditando !== null" @click="cancelar">Cancelar</button>

  <p v-if="mensaje"><strong>{{ mensaje }}</strong></p>

  <h1>Listado de Tareas</h1>

  <label>Estado:
    <select v-model="filtroCompletada" @change="cargarTareas">
      <option value="">Todas</option>
      <option value="false">Pendientes</option>
      <option value="true">Completadas</option>
    </select>
  </label>
  <label>Prioridad:
    <select v-model="filtroPrioridad" @change="cargarTareas">
      <option value="">Todas</option>
      <option value="alta">Alta</option>
      <option value="media">Media</option>
      <option value="baja">Baja</option>
    </select>
  </label>

  <p>Total registros: {{ total }}</p>

  <table border="1">
    <thead>
      <tr>
        <th>ID</th><th>Título</th><th>Prioridad</th><th>Completada</th><th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="t in tareas" :key="t.id">
        <td>{{ t.id }}</td>
        <td>{{ t.titulo }}</td>
        <td>{{ t.prioridad }}</td>
        <td>
          <input type="checkbox" :checked="t.completada" @change="alternarCompletada(t)" />
        </td>
        <td>
          <button @click="editar(t)">Editar</button>
          <button @click="eliminar(t)">Eliminar</button>
        </td>
      </tr>
      <tr v-if="tareas.length === 0">
        <td colspan="5">No hay registros</td>
      </tr>
    </tbody>
  </table>
</template>