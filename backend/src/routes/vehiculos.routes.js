import { Router } from 'express';
import { body, param } from 'express-validator';
import { pool } from '../config/db.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const idParam = param('id').isInt({ min: 1 }).withMessage('ID inválido');

const vehiculoRules = [
  body('marca').trim().notEmpty().withMessage('La marca es obligatoria'),
  body('modelo').trim().notEmpty().withMessage('El modelo es obligatorio'),
  body('patente')
    .trim()
    .notEmpty()
    .withMessage('La patente es obligatoria')
    .isLength({ max: 10 })
    .withMessage('La patente no puede superar los 10 caracteres'),
  body('anio')
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('Año inválido'),
  body('capacidad_carga')
    .isFloat({ gt: 0 })
    .withMessage('La capacidad de carga debe ser mayor a 0'),
];

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehiculos ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', vehiculoRules, validate, async (req, res, next) => {
  try {
    const { marca, modelo, patente, anio, capacidad_carga } = req.body;
    const [result] = await pool.query(
      'INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES (?, ?, ?, ?, ?)',
      [marca, modelo, patente, anio, capacidad_carga]
    );
    res.status(201).json({ id: result.insertId, marca, modelo, patente, anio, capacidad_carga });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'La patente ya existe' });
    }
    next(err);
  }
});

router.put('/:id', [idParam, ...vehiculoRules], validate, async (req, res, next) => {
  try {
    const { marca, modelo, patente, anio, capacidad_carga } = req.body;
    const [result] = await pool.query(
      'UPDATE vehiculos SET marca = ?, modelo = ?, patente = ?, anio = ?, capacidad_carga = ? WHERE id = ?',
      [marca, modelo, patente, anio, capacidad_carga, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json({ id: Number(req.params.id), marca, modelo, patente, anio, capacidad_carga });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'La patente ya existe' });
    }
    next(err);
  }
});

router.delete('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM vehiculos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res
        .status(400)
        .json({ message: 'No se puede eliminar: el vehículo tiene viajes asociados' });
    }
    next(err);
  }
});

export default router;