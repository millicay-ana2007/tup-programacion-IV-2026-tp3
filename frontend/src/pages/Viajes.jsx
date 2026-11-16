import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatearFechaHora, nombreConductor, nombreVehiculo } from '../utils/formato'

const FORM_VACIO = {
  vehiculo_id: '',
  conductor_id: '',
  fecha_salida: '',
  fecha_llegada: '',
  origen: '',
  destino: '',
  kilometros: '',
  observaciones: '',
}

function Viajes() {
  const [viajes, setViajes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  const [form, setForm] = useState(FORM_VACIO)
  const [errors, setErrors] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true

    Promise.all([api.get('/viajes'), api.get('/vehiculos'), api.get('/conductores')])
      .then(([datosViajes, datosVehiculos, datosConductores]) => {
        if (!activo) return
        setViajes(Array.isArray(datosViajes) ? datosViajes : [])
        setVehiculos(Array.isArray(datosVehiculos) ? datosVehiculos : [])
        setConductores(Array.isArray(datosConductores) ? datosConductores : [])
        setError('')
      })
      .catch((err) => {
        if (activo) setError(err.message)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [recarga])

  const vehiculoPorId = Object.fromEntries(vehiculos.map((v) => [v.id, v]))
  const conductorPorId = Object.fromEntries(conductores.map((c) => [c.id, c]))

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const nuevos = {}

    if (!form.vehiculo_id) nuevos.vehiculo_id = 'Elegí un vehículo'
    if (!form.conductor_id) nuevos.conductor_id = 'Elegí un conductor'
    if (!form.fecha_salida) nuevos.fecha_salida = 'La fecha de salida es obligatoria'

    if (form.fecha_llegada && form.fecha_salida && form.fecha_llegada < form.fecha_salida) {
      nuevos.fecha_llegada = 'La llegada no puede ser anterior a la salida'
    }

    if (!form.origen.trim()) nuevos.origen = 'El origen es obligatorio'
    if (!form.destino.trim()) nuevos.destino = 'El destino es obligatorio'

    const km = Number(form.kilometros)
    if (form.kilometros === '') {
      nuevos.kilometros = 'Los kilómetros son obligatorios'
    } else if (Number.isNaN(km) || km <= 0) {
      nuevos.kilometros = 'Los kilómetros deben ser mayores a 0'
    }

    return nuevos
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nuevos = validate()
    setErrors(nuevos)
    setErrorServidor('')
    setMensaje('')
    if (Object.keys(nuevos).length > 0) return

    const datos = {
      vehiculo_id: Number(form.vehiculo_id),
      conductor_id: Number(form.conductor_id),
      fecha_salida: form.fecha_salida,
      origen: form.origen.trim(),
      destino: form.destino.trim(),
      kilometros: Number(form.kilometros),
    }
    if (form.fecha_llegada) datos.fecha_llegada = form.fecha_llegada
    if (form.observaciones.trim()) datos.observaciones = form.observaciones.trim()

    setGuardando(true)
    try {
      await api.post('/viajes', datos)
      setForm(FORM_VACIO)
      setMensaje('Viaje registrado correctamente')
      setRecarga((n) => n + 1)
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (v) => {
    const confirmado = window.confirm('¿Seguro que querés eliminar este viaje?')
    if (!confirmado) return

    setErrorServidor('')
    setMensaje('')
    try {
      await api.delete(`/viajes/${v.id}`)
      setMensaje('Viaje eliminado correctamente')
      setRecarga((n) => n + 1)
    } catch (err) {
      setErrorServidor(err.message)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const faltanDatos = !cargando && (vehiculos.length === 0 || conductores.length === 0)

  return (
    <section>
      <h2>Viajes</h2>

      <div className="panel">
        <h3>Registrar viaje</h3>
        {faltanDatos && (
          <p className="empty-text">
            Para registrar un viaje primero cargá al menos un vehículo y un conductor.
          </p>
        )}
        {errorServidor && <div className="error-box">{errorServidor}</div>}
        {mensaje && <div className="success-box">{mensaje}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="vehiculo_id">Vehículo</label>
              <select
                id="vehiculo_id"
                name="vehiculo_id"
                value={form.vehiculo_id}
                onChange={handleChange}
                className={errors.vehiculo_id ? 'invalid' : ''}
              >
                <option value="">Elegí un vehículo</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {nombreVehiculo(v)}
                  </option>
                ))}
              </select>
              {errors.vehiculo_id && <span className="error-text">{errors.vehiculo_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="conductor_id">Conductor</label>
              <select
                id="conductor_id"
                name="conductor_id"
                value={form.conductor_id}
                onChange={handleChange}
                className={errors.conductor_id ? 'invalid' : ''}
              >
                <option value="">Elegí un conductor</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {nombreConductor(c)}
                  </option>
                ))}
              </select>
              {errors.conductor_id && <span className="error-text">{errors.conductor_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="fecha_salida">Fecha y hora de salida</label>
              <input
                id="fecha_salida"
                name="fecha_salida"
                type="datetime-local"
                value={form.fecha_salida}
                onChange={handleChange}
                className={errors.fecha_salida ? 'invalid' : ''}
              />
              {errors.fecha_salida && <span className="error-text">{errors.fecha_salida}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="fecha_llegada">Fecha y hora de llegada (opcional)</label>
              <input
                id="fecha_llegada"
                name="fecha_llegada"
                type="datetime-local"
                value={form.fecha_llegada}
                onChange={handleChange}
                className={errors.fecha_llegada ? 'invalid' : ''}
              />
              {errors.fecha_llegada && <span className="error-text">{errors.fecha_llegada}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="origen">Origen</label>
              <input
                id="origen"
                name="origen"
                type="text"
                value={form.origen}
                onChange={handleChange}
                className={errors.origen ? 'invalid' : ''}
              />
              {errors.origen && <span className="error-text">{errors.origen}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="destino">Destino</label>
              <input
                id="destino"
                name="destino"
                type="text"
                value={form.destino}
                onChange={handleChange}
                className={errors.destino ? 'invalid' : ''}
              />
              {errors.destino && <span className="error-text">{errors.destino}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="kilometros">Kilómetros</label>
              <input
                id="kilometros"
                name="kilometros"
                type="number"
                step="any"
                value={form.kilometros}
                onChange={handleChange}
                className={errors.kilometros ? 'invalid' : ''}
              />
              {errors.kilometros && <span className="error-text">{errors.kilometros}</span>}
            </div>
            <div className="form-group form-group-wide">
              <label htmlFor="observaciones">Observaciones (opcional)</label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows="3"
                value={form.observaciones}
                onChange={handleChange}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-auto" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar viaje'}
          </button>
        </form>
      </div>

      {cargando && <p>Cargando viajes...</p>}

      {error && <div className="error-box">{error}</div>}

      {!cargando && !error && viajes.length === 0 && (
        <p className="empty-text">Todavía no hay viajes registrados.</p>
      )}

      {!cargando && !error && viajes.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Salida</th>
                <th>Llegada</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Km</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((v) => (
                <tr key={v.id}>
                  <td>{formatearFechaHora(v.fecha_salida)}</td>
                  <td>{formatearFechaHora(v.fecha_llegada) || '—'}</td>
                  <td>{nombreVehiculo(vehiculoPorId[v.vehiculo_id])}</td>
                  <td>{nombreConductor(conductorPorId[v.conductor_id])}</td>
                  <td>{v.origen}</td>
                  <td>{v.destino}</td>
                  <td>{Number(v.kilometros).toLocaleString('es-AR')}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleEliminar(v)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Viajes