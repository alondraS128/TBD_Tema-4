import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/tareas',
  timeout: 8000
})

// Convierte cualquier error de axios en un mensaje claro
export function mensajeDeError(e, porDefecto = 'Ocurrió un error inesperado') {
  if (e?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder'
  if (!e?.response) return 'No hay conexión con el servidor. ¿Está corriendo la API?'
  return e.response.data?.error ?? porDefecto
}

export default {
  listar: (filtros = {}) => api.get('/', { params: filtros }),
  obtener: (id) => api.get(`/${id}`),
  crear: (tarea) => api.post('/', tarea),
  actualizar: (id, cambios) => api.put(`/${id}`, cambios),
  eliminar: (id) => api.delete(`/${id}`)
}