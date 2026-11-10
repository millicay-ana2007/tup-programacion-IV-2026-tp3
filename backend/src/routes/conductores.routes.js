import { Router } from 'express';
import { body, param } from 'express-validator';
import { pool } from '../config/db.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const idParam = param('id').isInt({ min: 1 }).withMessage('ID inválido');

const conductorRules = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede superar los 50 caracteres'),
  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio')
    .isLength({ max: 50 })
    .withMessage('El apellido no puede superar los 50 caracteres'),
  body('numero_documento')
    .trim()
    .notEmpty()
    .withMessage('El número de documento es obligatorio')
    .isLength({ max: 20 })
    .withMessage('El número de documento no puede superar los 20 caracteres'),
  body('numero_licencia')
    .trim()
    .notEmpty()
    .withMessage('El número de licencia es obligatorio')
    .isLength({ max: 30 })
    .withMessage('El número de licencia no puede superar los 30 caracteres'),
  body('fecha_alta_licencia')
    .isISO8601({ strict: true })
    .withMessage('La fecha de alta de la licencia debe tener formato AAAA-MM-DD'),
  body('fecha_vencimiento_licencia')
    .isISO8601({ strict: true })
    .withMessage('La fecha de vencimiento de la licencia debe tener formato AAAA-MM-DD')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.fecha_alta_licencia)) {
        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de alta');
      }
      return true;
    }),
];

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM conductores ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM conductores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Conductor no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', conductorRules, validate, async (req, res, next) => {
  try {
    const {
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia,
    } = req.body;
    const [result] = await pool.query(
      `INSERT INTO conductores
        (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        numero_documento,
        numero_licencia,
        fecha_alta_licencia,
        fecha_vencimiento_licencia,
      ]
    );
    res.status(201).json({
      id: result.insertId,
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(400)
        .json({ message: 'El número de documento o de licencia ya existe' });
    }
    next(err);
  }
});

router.put('/:id', [idParam, ...conductorRules], validate, async (req, res, next) => {
  try {
    const {
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia,
    } = req.body;
    const [result] = await pool.query(
      `UPDATE conductores
       SET nombre = ?, apellido = ?, numero_documento = ?, numero_licencia = ?,
           fecha_alta_licencia = ?, fecha_vencimiento_licencia = ?
       WHERE id = ?`,
      [
        nombre,
        apellido,
        numero_documento,
        numero_licencia,
        fecha_alta_licencia,
        fecha_vencimiento_licencia,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Conductor no encontrado' });
    }
    res.json({
      id: Number(req.params.id),
      nombre,
      apellido,
      numero_documento,
      numero_licencia,
      fecha_alta_licencia,
      fecha_vencimiento_licencia,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(400)
        .json({ message: 'El número de documento o de licencia ya existe' });
    }
    next(err);
  }
});

router.delete('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM conductores WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Conductor no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res
        .status(400)
        .json({ message: 'No se puede eliminar: el conductor tiene viajes asociados' });
    }
    next(err);
  }
});

export default router;