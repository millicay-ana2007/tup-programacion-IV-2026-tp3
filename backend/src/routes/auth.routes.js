import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').trim().isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, email, password } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
        [nombre, email, hash]
      );
      res.status(201).json({ id: result.insertId, nombre, email });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
      const usuario = rows[0];
      if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }
      const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '4h' });
      res.json({
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;