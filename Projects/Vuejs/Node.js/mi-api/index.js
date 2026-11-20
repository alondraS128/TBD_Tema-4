const express = require('express');
const tareasRoutes = require('./routes/tareas');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
// ── Logging básico (sin librerías externas) ──
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── Rutas ──
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API REST funcionando',
    endpoints: {
      tareas: '/api/tareas'
    }
  });
});

app.use('/api/tareas', tareasRoutes);

// ── 404 y error handlers (deben ir AL FINAL) ──
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ API REST corriendo en http://localhost:${PORT}`);
});