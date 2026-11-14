import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { pool } from '../config/db.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const SELECT_VIAJES = `
  SELECT v.id, v.vehiculo_id, v.conductor_id, v.fecha_salida, v.fecha_llegada,
         v.origen, v.destino, v.kilometros, v.observaciones,
         ve.patente, ve.marca, ve.modelo,
         c.nombre AS conductor_nombre, c.apellido AS conductor_apellido
  FROM viajes v
  JOIN vehiculos ve ON ve.id = v.vehiculo_id
  JOIN conductores c ON c.id = v.conductor_id`;

const FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

// Devuelve un Date si el texto es una fecha y hora real, o null si no lo es
const parseFechaHora = (valor) => {
  const m = FECHA_HORA.exec(String(valor));
  if (!m) return null;
  const [anio, mes, dia, hora, min, seg] = m
    .slice(1)
    .map((x) => (x === undefined ? 0 : Number(x)));
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, hora, min, seg));
  const valida =
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia &&
    fecha.getUTCHours() === hora &&
    fecha.getUTCMinutes() === min &&
    fecha.getUTCSeconds() === seg;
  return valida ? fecha : null;
};

// "2026-11-10T08:00" o "2026-11-10 08:00" -> "2026-11-10 08:00:00"
const aFormatoSql = (valor) => {
  const texto = valor.replace('T', ' ');
  return texto.length === 16 ? `${texto}:00` : texto;
};

const idParam = param('id').isInt({ min: 1 }).withMessage('ID inválido');

const viajeRules = [
  body('vehiculo_id').isInt({ min: 1 }).withMessage('El vehículo es obligatorio'),
  body('conductor_id').isInt({ min: 1 }).withMessage('El conductor es obligatorio'),
  body('fecha_salida').custom((valor) => {
    if (!parseFechaHora(valor)) {
      throw new Error('La fecha de salida debe tener formato AAAA-MM-DD HH:MM');
    }
    return true;
  }),
  body('fecha_llegada')
    .optional({ values: 'falsy' })
    .custom((valor) => {
      if (!parseFechaHora(valor)) {
        throw new Error('La fecha de llegada debe tener formato AAAA-MM-DD HH:MM');
      }
      return true;
    })
    .bail()
    .custom((valor, { req }) => {
      const salida = parseFechaHora(req.body.fecha_salida);
      if (salida && parseFechaHora(valor) < salida) {
        throw new Error('La fecha de llegada no puede ser anterior a la de salida');
      }
      return true;
    }),
  body('origen')
    .trim()
    .notEmpty()
    .withMessage('El origen es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El origen no puede superar los 100 caracteres'),
  body('destino')
    .trim()
    .notEmpty()
    .withMessage('El destino es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El destino no puede superar los 100 caracteres'),
  body('kilometros')
    .isFloat({ gt: 0, max: 99999999.99 })
    .withMessage('Los kilómetros deben ser un número mayor a 0'),
  body('observaciones')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Las observaciones deben ser texto')
    .isLength({ max: 1000 })
    .withMessage('Las observaciones no pueden superar los 1000 caracteres'),
];

const extraerDatos = (datos) => ({
  vehiculoId: datos.vehiculo_id,
  conductorId: datos.conductor_id,
  salida: aFormatoSql(datos.fecha_salida),
  llegada: datos.fecha_llegada ? aFormatoSql(datos.fecha_llegada) : null,
  origen: datos.origen,
  destino: datos.destino,
  kilometros: datos.kilometros,
  observaciones: datos.observaciones || null,
});

// Comprueba que existan el vehículo y el conductor, y que la licencia estuviera vigente
const validarReferencias = async (vehiculoId, conductorId, salidaSql) => {
  const [vehiculos] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [vehiculoId]);
  if (vehiculos.length === 0) {
    return { status: 404, message: 'Vehículo no encontrado' };
  }
  const [conductores] = await pool.query(
    'SELECT fecha_vencimiento_licencia FROM conductores WHERE id = ?',
    [conductorId]
  );
  if (conductores.length === 0) {
    return { status: 404, message: 'Conductor no encontrado' };
  }
  if (salidaSql.slice(0, 10) > conductores[0].fecha_vencimiento_licencia) {
    return {
      status: 403,
      message: 'La licencia del conductor estaba vencida en la fecha de salida',
    };
  }
  return null;
};

// Historial: todos los viajes, o filtrados por vehículo y/o conductor
router.get(
  '/',
  [
    query('vehiculo_id').optional().isInt({ min: 1 }).withMessage('vehiculo_id inválido'),
    query('conductor_id').optional().isInt({ min: 1 }).withMessage('conductor_id inválido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const condiciones = [];
      const params = [];
      if (req.query.vehiculo_id) {
        condiciones.push('v.vehiculo_id = ?');
        params.push(req.query.vehiculo_id);
      }
      if (req.query.conductor_id) {
        condiciones.push('v.conductor_id = ?');
        params.push(req.query.conductor_id);
      }
      const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
      const [rows] = await pool.query(
        `${SELECT_VIAJES}${where} ORDER BY v.fecha_salida DESC, v.id DESC`,
        params
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// Total de kilómetros por vehículo o por conductor (esta ruta va antes de /:id)
router.get(
  '/km',
  [
    query('vehiculo_id').optional().isInt({ min: 1 }).withMessage('vehiculo_id inválido'),
    query('conductor_id').optional().isInt({ min: 1 }).withMessage('conductor_id inválido'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { vehiculo_id, conductor_id } = req.query;
      if (!vehiculo_id && !conductor_id) {
        return res.status(400).json({ message: 'Indica vehiculo_id o conductor_id' });
      }
      const condiciones = [];
      const params = [];
      if (vehiculo_id) {
        const [vehiculos] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [vehiculo_id]);
        if (vehiculos.length === 0) {
          return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        condiciones.push('vehiculo_id = ?');
        params.push(vehiculo_id);
      }
      if (conductor_id) {
        const [conductores] = await pool.query('SELECT id FROM conductores WHERE id = ?', [
          conductor_id,
        ]);
        if (conductores.length === 0) {
          return res.status(404).json({ message: 'Conductor no encontrado' });
        }
        condiciones.push('conductor_id = ?');
        params.push(conductor_id);
      }
      const [rows] = await pool.query(
        `SELECT COALESCE(SUM(kilometros), 0) AS total_km, COUNT(*) AS cantidad_viajes
         FROM viajes WHERE ${condiciones.join(' AND ')}`,
        params
      );
      res.json({
        total_km: Number(rows[0].total_km),
        cantidad_viajes: Number(rows[0].cantidad_viajes),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_VIAJES} WHERE v.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', viajeRules, validate, async (req, res, next) => {
  try {
    const d = extraerDatos(req.body);
    const error = await validarReferencias(d.vehiculoId, d.conductorId, d.salida);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }
    const [result] = await pool.query(
      `INSERT INTO viajes
        (vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.vehiculoId, d.conductorId, d.salida, d.llegada, d.origen, d.destino, d.kilometros, d.observaciones]
    );
    const [rows] = await pool.query(`${SELECT_VIAJES} WHERE v.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', [idParam, ...viajeRules], validate, async (req, res, next) => {
  try {
    const d = extraerDatos(req.body);
    const error = await validarReferencias(d.vehiculoId, d.conductorId, d.salida);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }
    const [result] = await pool.query(
      `UPDATE viajes
       SET vehiculo_id = ?, conductor_id = ?, fecha_salida = ?, fecha_llegada = ?,
           origen = ?, destino = ?, kilometros = ?, observaciones = ?
       WHERE id = ?`,
      [
        d.vehiculoId,
        d.conductorId,
        d.salida,
        d.llegada,
        d.origen,
        d.destino,
        d.kilometros,
        d.observaciones,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }
    const [rows] = await pool.query(`${SELECT_VIAJES} WHERE v.id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', [idParam], validate, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM viajes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;