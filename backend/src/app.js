import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import './config/passport.js';
import { pool } from './config/db.js';
import { requireAuth } from './middlewares/auth.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(passport.initialize());

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'conectada' });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);

// Ruta protegida de prueba (después se puede quitar)
app.get('/api/perfil', requireAuth, (req, res) => res.json(req.user));

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
  console.log(`API escuchando en http://localhost:${PORT}`);
});