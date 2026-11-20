const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRIORIDADES = ['alta', 'media', 'baja'];

// GET /api/tareas?completada=true&prioridad=alta
const getTareas = async (req, res, next) => {
  try {
    const { completada, prioridad } = req.query;
    const where = {};
    if (completada !== undefined) where.completada = completada === 'true';
    if (prioridad) where.prioridad = prioridad;

    const data = await prisma.tarea.findMany({ where, orderBy: { id: 'asc' } });
    res.json({ total: data.length, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/tareas/:id
const getTareaById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const tarea = await prisma.tarea.findUnique({ where: { id } });
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(tarea);
  } catch (err) {
    next(err);
  }
};

// POST /api/tareas  
const createTarea = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
      return res.status(400).json({ error: 'Envía al menos una tarea' });
    }

    const data = [];
    for (const [i, item] of items.entries()) {
      const titulo = item?.titulo;
      const prioridad = item?.prioridad ?? 'media';

      if (typeof titulo !== 'string' || titulo.trim().length < 3) {
        return res.status(400).json({
          error: `Tarea ${i + 1}: el título debe tener al menos 3 caracteres`
        });
      }
      if (!PRIORIDADES.includes(prioridad)) {
        return res.status(400).json({
          error: `Tarea ${i + 1}: la prioridad debe ser alta, media o baja`
        });
      }
      data.push({ titulo: titulo.trim(), prioridad });
    }

    const creadas = await prisma.tarea.createManyAndReturn({ data });
    res.status(201).json(Array.isArray(req.body) ? creadas : creadas[0]);
  } catch (err) {
    next(err);
  }
};
// PUT /api/tareas/:id
const updateTarea = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { titulo, completada, prioridad } = req.body;
    const data = {};

    if (titulo !== undefined) {
      if (titulo.trim().length < 3) return res.status(400).json({ error: 'Título muy corto' });
      data.titulo = titulo.trim();
    }
    if (completada !== undefined) data.completada = Boolean(completada);
    if (prioridad !== undefined) {
      if (!PRIORIDADES.includes(prioridad)) return res.status(400).json({ error: 'Prioridad inválida' });
      data.prioridad = prioridad;
    }

    const actualizada = await prisma.tarea.update({ where: { id }, data });
    res.json(actualizada);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tarea no encontrada' });
    next(err);
  }
};

// DELETE /api/tareas/:id
const deleteTarea = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    await prisma.tarea.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Tarea no encontrada' });
    next(err);
  }
};

module.exports = { getTareas, getTareaById, createTarea, updateTarea, deleteTarea };