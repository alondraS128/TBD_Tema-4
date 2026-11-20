import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api/tareas'   
})

export default {
  listar: (filtros = {}) => api.get('/', { params: filtros }),
  obtener: (id) => api.get(`/${id}`),
  crear: (tarea) => api.post('/', tarea),
  actualizar: (id, cambios) => api.put(`/${id}`, cambios),
  eliminar: (id) => api.delete(`/${id}`)
}