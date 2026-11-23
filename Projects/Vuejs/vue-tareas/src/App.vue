<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import tareaService, { mensajeDeError } from './services/tareaService'
import { useToast } from './composables/useToast'
import { useTema } from './composables/useTema'
import ToastContenedor from './components/ToastContenedor.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import NumeroAnimado from './components/NumeroAnimado.vue'

const { mostrar } = useToast()
const { oscuro, alternar: alternarTema } = useTema()

const todas = ref([])
const cargando = ref(true)
const errorCarga = ref('')
const guardando = ref(false)
const idEditando = ref(null)
const formulario = ref({ titulo: '', prioridad: 'media' })
const errorTitulo = ref('')
const busqueda = ref('')
const filtroEstado = ref('')
const filtroPrioridad = ref('')
const confirmacion = ref(null)
const enLinea = ref(navigator.onLine)
const promptInstalar = ref(null)
const inputTitulo = ref(null)
const inputBusqueda = ref(null)

// ---------- Datos calculados ----------
const pendientes = computed(() => todas.value.filter((t) => !t.completada).length)
const completadas = computed(() => todas.value.length - pendientes.value)
const avance = computed(() =>
  todas.value.length ? Math.round((completadas.value / todas.value.length) * 100) : 0
)
const visibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return todas.value.filter(
    (t) =>
      (!filtroEstado.value || String(t.completada) === filtroEstado.value) &&
      (!filtroPrioridad.value || t.prioridad === filtroPrioridad.value) &&
      (!q || t.titulo.toLowerCase().includes(q) || String(t.id) === q)
  )
})
const hayFiltros = computed(() => busqueda.value || filtroEstado.value || filtroPrioridad.value)

watch(() => formulario.value.titulo, () => (errorTitulo.value = ''))

// ---------- READ ----------
async function cargar(primeraVez = false) {
  if (primeraVez) cargando.value = true
  try {
    const { data } = await tareaService.listar()
    todas.value = Array.isArray(data) ? data : data.data
    errorCarga.value = ''
  } catch (e) {
    errorCarga.value = mensajeDeError(e, 'No se pudo cargar la lista')
  } finally {
    cargando.value = false
  }
}

// ---------- CREATE / UPDATE ----------
async function guardar() {
  const titulo = formulario.value.titulo.trim()
  if (titulo.length < 3) {
    errorTitulo.value = 'El título necesita al menos 3 caracteres'
    inputTitulo.value?.focus()
    return
  }
  guardando.value = true
  try {
    const datos = { titulo, prioridad: formulario.value.prioridad }
    if (idEditando.value === null) {
      await tareaService.crear(datos)
      mostrar('Tarea creada')
    } else {
      await tareaService.actualizar(idEditando.value, datos)
      mostrar('Tarea actualizada')
    }
    cancelar()
    await cargar()
    inputTitulo.value?.focus()
  } catch (e) {
    mostrar(mensajeDeError(e, 'No se pudo guardar'), 'error')
  } finally {
    guardando.value = false
  }
}

function editar(t) {
  idEditando.value = t.id
  formulario.value = { titulo: t.titulo, prioridad: t.prioridad }
  nextTick(() => {
    inputTitulo.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    inputTitulo.value?.focus()
  })
}

function cancelar() {
  idEditando.value = null
  formulario.value = { titulo: '', prioridad: 'media' }
  errorTitulo.value = ''
}

// Marcar completada: la pantalla cambia al instante y, si falla, se revierte
async function alternarCompletada(t) {
  const nuevo = !t.completada
  t.completada = nuevo
  try {
    await tareaService.actualizar(t.id, { completada: nuevo })
  } catch (e) {
    t.completada = !nuevo
    mostrar(mensajeDeError(e, 'No se pudo cambiar el estado'), 'error')
  }
}

// ---------- DELETE (con ventana de confirmación) ----------
function pedirEliminar(t) {
  confirmacion.value = {
    titulo: '¿Eliminar tarea?',
    mensaje: `"${t.titulo}" (ID ${t.id}) se borrará de forma permanente.`,
    texto: 'Eliminar',
    accion: () => eliminar(t)
  }
}

async function eliminar(t) {
  try {
    await tareaService.eliminar(t.id)
    todas.value = todas.value.filter((x) => x.id !== t.id)
    if (idEditando.value === t.id) cancelar()
    mostrar(`Tarea eliminada: ${t.titulo}`)
  } catch (e) {
    mostrar(mensajeDeError(e, 'No se pudo eliminar'), 'error')
  }
}

function pedirLimpiar() {
  confirmacion.value = {
    titulo: '¿Limpiar completadas?',
    mensaje: `Se eliminarán ${completadas.value} tareas completadas de forma permanente.`,
    texto: 'Limpiar',
    accion: limpiarCompletadas
  }
}

async function limpiarCompletadas() {
  const hechas = todas.value.filter((t) => t.completada)
  const res = await Promise.allSettled(hechas.map((t) => tareaService.eliminar(t.id)))
  const fallidas = res.filter((r) => r.status === 'rejected').length
  await cargar()
  if (fallidas) mostrar(`No se pudieron eliminar ${fallidas} tareas`, 'error')
  else mostrar(`${hechas.length} tareas eliminadas`)
}

async function confirmar() {
  const { accion } = confirmacion.value
  confirmacion.value = null
  await accion()
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroEstado.value = ''
  filtroPrioridad.value = ''
}

// ---------- Comportamiento de "app" ----------
function atajos(e) {
  const enCampo = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)
  if (e.key === '/' && !enCampo) {
    e.preventDefault()
    inputBusqueda.value?.focus()
  }
  if (e.key === 'Escape' && !confirmacion.value) {
    if (idEditando.value !== null) cancelar()
    else if (document.activeElement === inputBusqueda.value) {
      busqueda.value = ''
      inputBusqueda.value.blur()
    }
  }
}
function volvioInternet() {
  enLinea.value = true
  mostrar('Conexión restablecida')
  cargar()
}
function sinInternet() {
  enLinea.value = false
  mostrar('Sin conexión a internet', 'error')
}
function antesDeInstalar(e) {
  e.preventDefault()
  promptInstalar.value = e
}
async function instalar() {
  promptInstalar.value.prompt()
  await promptInstalar.value.userChoice
  promptInstalar.value = null
}

onMounted(() => {
  cargar(true)
  document.addEventListener('keydown', atajos)
  window.addEventListener('online', volvioInternet)
  window.addEventListener('offline', sinInternet)
  window.addEventListener('beforeinstallprompt', antesDeInstalar)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', atajos)
  window.removeEventListener('online', volvioInternet)
  window.removeEventListener('offline', sinInternet)
  window.removeEventListener('beforeinstallprompt', antesDeInstalar)
})
</script>


<template>
  <div class="app-shell" :data-bs-theme="oscuro ? 'dark' : 'light'">
    <div class="layout-app">

      <!-- BARRA LATERAL -->
      <aside class="sidebar">
        <a href="#resumen" class="sidebar-brand">
          <div class="sidebar-logo">
            <i class="bi bi-check2-square"></i>
          </div>
          <div>
            <strong>TaskFlow</strong>
            <span>WORKSPACE</span>
          </div>
        </a>

        <div class="sidebar-label">MENÚ PRINCIPAL</div>

        <nav class="sidebar-nav">
          <a href="#resumen" class="sidebar-link active">
            <i class="bi bi-grid"></i>
            <span>Resumen</span>
          </a>

          <a href="#nueva-tarea" class="sidebar-link">
            <i class="bi bi-plus-circle"></i>
            <span>Nueva tarea</span>
          </a>

          <a href="#listado" class="sidebar-link">
            <i class="bi bi-list-task"></i>
            <span>Mis tareas</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          <div class="sidebar-help">
            <i class="bi bi-lightbulb"></i>
            <strong>Consejo del día</strong>
            <p>Organiza tus prioridades y avanza paso a paso.</p>
          </div>

          <div class="sidebar-version">
            <span class="status-dot"></span>
            Sistema operativo
            <small>TaskFlow · 2026</small>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="workspace">

        <!-- BARRA SUPERIOR -->
        <header class="topbar">
          <div>
            <div class="topbar-breadcrumb">Workspace / <strong>Resumen</strong></div>
            <h1>Mi espacio de trabajo</h1>
          </div>

          <div class="topbar-actions">
            <span v-if="!enLinea" class="chip-offline">
              <i class="bi bi-wifi-off"></i> Sin conexión
            </span>

            <button v-if="promptInstalar" class="btn btn-tema"
                    type="button" @click="instalar">
              <i class="bi bi-download me-2"></i>Instalar
            </button>

            <button class="theme-button" type="button" @click="alternarTema">
              <i class="bi" :class="oscuro ? 'bi-sun-fill' : 'bi-moon-stars-fill'"></i>
              <span>{{ oscuro ? 'Modo claro' : 'Modo oscuro' }}</span>
            </button>
          </div>
        </header>

        <main class="dashboard-content">

          <!-- BIENVENIDA -->
          <section class="welcome-section">
            <div>
              <span class="welcome-eyebrow">TU PRODUCTIVIDAD, EN UN SOLO LUGAR</span>
              <h2>¡Hola! Vamos a organizar tu día.</h2>
              <p>Estas son tus actividades y tu progreso actual.</p>
            </div>
            <a href="#nueva-tarea" class="btn btn-primario">
              <i class="bi bi-plus-lg me-1"></i> Nueva tarea
            </a>
          </section>

          <!-- ESTADÍSTICAS -->
          <section id="resumen" class="stats-grid">
            <div class="stat stat-modern">
              <div class="stat-icono azul">
                <i class="bi bi-list-check"></i>
              </div>
              <div>
                <p class="stat-etiqueta">Total de tareas</p>
                <p class="stat-valor"><NumeroAnimado :valor="todas.length" /></p>
                <span class="stat-caption">Tareas registradas</span>
              </div>
            </div>

            <div class="stat stat-modern">
              <div class="stat-icono ambar">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div>
                <p class="stat-etiqueta">Pendientes</p>
                <p class="stat-valor"><NumeroAnimado :valor="pendientes" /></p>
                <span class="stat-caption">Por completar</span>
              </div>
            </div>

            <div class="stat stat-modern">
              <div class="stat-icono verde">
                <i class="bi bi-check-circle"></i>
              </div>
              <div>
                <p class="stat-etiqueta">Completadas</p>
                <p class="stat-valor"><NumeroAnimado :valor="completadas" /></p>
                <span class="stat-caption">Objetivos alcanzados</span>
              </div>
            </div>

            <div class="stat stat-modern">
              <div class="stat-icono violeta">
                <i class="bi bi-graph-up-arrow"></i>
              </div>
              <div class="stat-progress-content">
                <p class="stat-etiqueta">Avance general</p>
                <p class="stat-valor"><NumeroAnimado :valor="avance" sufijo="%" /></p>
                <div class="avance">
                  <div class="avance-barra" :style="{ width: avance + '%' }"></div>
                </div>
                <span class="stat-caption">Progreso de tus tareas</span>
              </div>
            </div>
          </section>

          <!-- FORMULARIO -->
          <section id="nueva-tarea" class="panel card">
            <div class="panel-heading">
              <div>
                <span class="panel-eyebrow">GESTIÓN</span>
                <h2 class="titulo-seccion">
                  <i class="bi"
                     :class="idEditando === null ? 'bi-plus-circle-fill' : 'bi-pencil-square'"></i>
                  {{ idEditando === null ? 'Crear una tarea' : 'Editar tarea #' + idEditando }}
                </h2>
              </div>
              <span v-if="idEditando !== null" class="chip">
                Modo edición · Esc para cancelar
              </span>
            </div>

            <div class="card-body">
              <form @submit.prevent="guardar" novalidate>
                <div class="row g-3 align-items-end">
                  <div class="col-lg-6">
                    <label for="titulo" class="form-label">Nombre de la tarea</label>
                    <div class="input-group">
                      <span class="input-group-text">
                        <i class="bi bi-pencil"></i>
                      </span>
                      <input
                        id="titulo"
                        ref="inputTitulo"
                        v-model="formulario.titulo"
                        type="text"
                        class="form-control"
                        :class="{ 'is-invalid': errorTitulo }"
                        placeholder="¿Qué necesitas hacer?"
                        autocomplete="off"
                      />
                    </div>
                    <div v-if="errorTitulo" class="error-campo">{{ errorTitulo }}</div>
                  </div>

                  <div class="col-lg-3">
                    <label for="prioridad" class="form-label">Prioridad</label>
                    <select id="prioridad" v-model="formulario.prioridad"
                            class="form-select">
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div class="col-lg-3 d-flex gap-2">
                    <button v-if="idEditando !== null" type="button"
                            class="btn btn-suave flex-fill" @click="cancelar">
                      Cancelar
                    </button>
                    <button type="submit" class="btn btn-primario flex-fill"
                            :disabled="guardando">
                      <span v-if="guardando"
                            class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-check2-circle me-1"></i>
                      {{ idEditando === null ? 'Guardar tarea' : 'Actualizar' }}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          <!-- LISTADO -->
          <section id="listado" class="panel card">
            <div class="panel-heading panel-heading-list">
              <div>
                <span class="panel-eyebrow">ORGANIZACIÓN</span>
                <h2 class="titulo-seccion">
                  <i class="bi bi-list-task"></i> Mis tareas
                </h2>
                <p class="panel-description">
                  Administra y supervisa tus actividades.
                </p>
              </div>

              <div class="filters-area">
                <div class="input-group buscador">
                  <span class="input-group-text">
                    <i class="bi bi-search"></i>
                  </span>
                  <input
                    ref="inputBusqueda"
                    v-model="busqueda"
                    type="search"
                    class="form-control"
                    placeholder="Buscar tarea..."
                    aria-label="Buscar tareas"
                  />
                </div>

                <select v-model="filtroEstado" class="form-select filtro"
                        aria-label="Filtrar por estado">
                  <option value="">Todos los estados</option>
                  <option value="false">Pendientes</option>
                  <option value="true">Completadas</option>
                </select>

                <select v-model="filtroPrioridad" class="form-select filtro"
                        aria-label="Filtrar por prioridad">
                  <option value="">Todas las prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 tabla-moderna">
                <thead>
                  <tr>
                    <th style="width: 60px"></th>
                    <th>Tarea</th>
                    <th>Prioridad</th>
                    <th class="d-none d-md-table-cell">Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>

                <tbody v-if="cargando">
                  <tr v-for="n in 4" :key="n">
                    <td><div class="esqueleto" style="width:22px;height:22px;border-radius:50%"></div></td>
                    <td><div class="esqueleto" style="width:60%;height:16px"></div></td>
                    <td><div class="esqueleto" style="width:70px;height:22px"></div></td>
                    <td class="d-none d-md-table-cell"><div class="esqueleto" style="width:90px;height:22px"></div></td>
                    <td><div class="esqueleto ms-auto" style="width:76px;height:32px"></div></td>
                  </tr>
                </tbody>

                <TransitionGroup v-else tag="tbody" name="fila">
                  <tr v-for="t in visibles" :key="t.id"
                      :class="{ 'tarea-hecha': t.completada }">
                    <td>
                      <input type="checkbox" class="form-check-input check-tarea"
                             :checked="t.completada"
                             :title="t.completada ? 'Marcar como pendiente' : 'Marcar como completada'"
                             @change="alternarCompletada(t)" />
                    </td>
                    <td @dblclick="editar(t)">
                      <div class="titulo-tarea">{{ t.titulo }}</div>
                      <div class="texto-suave small">#{{ t.id }}</div>
                    </td>
                    <td>
                      <span class="pastilla" :class="t.prioridad">{{ t.prioridad }}</span>
                    </td>
                    <td class="d-none d-md-table-cell">
                      <span class="pastilla"
                            :class="t.completada ? 'completada' : 'pendiente'">
                        {{ t.completada ? 'Completada' : 'Pendiente' }}
                      </span>
                    </td>
                    <td class="text-end text-nowrap">
                      <button type="button" class="btn-icono btn-editar me-1"
                              title="Editar" aria-label="Editar"
                              @click="editar(t)">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button type="button" class="btn-icono btn-borrar"
                              title="Eliminar" aria-label="Eliminar"
                              @click="pedirEliminar(t)">
                        <i class="bi bi-trash3-fill"></i>
                      </button>
                    </td>
                  </tr>
                </TransitionGroup>
              </table>
            </div>

            <div v-if="!cargando && errorCarga && !todas.length" class="vacio">
              <i class="bi bi-cloud-slash"></i>
              <div class="mb-3">{{ errorCarga }}</div>
              <button type="button" class="btn btn-primario" @click="cargar(true)">
                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
              </button>
            </div>

            <div v-else-if="!cargando && !todas.length" class="vacio">
              <i class="bi bi-inbox"></i>
              Aún no tienes tareas. ¡Crea la primera!
            </div>

            <div v-else-if="!cargando && !visibles.length" class="vacio">
              <i class="bi bi-search"></i>
              <div class="mb-3">Ninguna tarea coincide con tu búsqueda</div>
              <button v-if="hayFiltros" type="button" class="btn btn-suave"
                      @click="limpiarFiltros">
                Quitar filtros
              </button>
            </div>

            <div class="pie-tabla d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>Mostrando {{ visibles.length }} de {{ todas.length }} tareas</span>
              <button v-if="completadas" type="button"
                      class="btn btn-suave btn-sm" @click="pedirLimpiar">
                <i class="bi bi-trash3 me-1"></i>
                Limpiar completadas ({{ completadas }})
              </button>
            </div>
          </section>

          <footer class="dashboard-footer">
            <span>TaskFlow · Gestión inteligente de tareas</span>
            <span>Desarrollado con Vue · Express · Prisma · PostgreSQL</span>
          </footer>
        </main>
      </div>
    </div>

    <ConfirmModal
      v-if="confirmacion"
      :titulo="confirmacion.titulo"
      :mensaje="confirmacion.mensaje"
      :texto-confirmar="confirmacion.texto"
      @confirmar="confirmar"
      @cancelar="confirmacion = null"
    />
    <ToastContenedor />
  </div>
</template>
