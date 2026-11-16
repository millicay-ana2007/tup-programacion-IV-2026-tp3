import { useEffect, useState } from 'react'
import { api } from '../services/api'

const ANIO_MINIMO = 1950
const ANIO_MAXIMO = new Date().getFullYear() + 1
const FORM_VACIO = { patente: '', marca: '', modelo: '', anio: '', capacidad_carga: '' }

function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
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

    api
      .get('/vehiculos')
      .then((data) => {
        if (activo) {
          setVehiculos(Array.isArray(data) ? data : [])
          setError('')
        }
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const nuevos = {}

    if (!form.patente.trim()) {
      nuevos.patente = 'La patente es obligatoria'
    } else if (form.patente.trim().length > 10) {
      nuevos.patente = 'La patente no puede tener más de 10 caracteres'
    }

    if (!form.marca.trim()) nuevos.marca = 'La marca es obligatoria'
    if (!form.modelo.trim()) nuevos.modelo = 'El modelo es obligatorio'

    const anio = Number(form.anio)
    if (form.anio === '') {
      nuevos.anio = 'El año es obligatorio'
    } else if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
      nuevos.anio = `El año debe ser un número entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}`
    }

    const capacidad = Number(form.capacidad_carga)
    if (form.capacidad_carga === '') {
      nuevos.capacidad_carga = 'La capacidad de carga es obligatoria'
    } else if (Number.isNaN(capacidad) || capacidad <= 0) {
      nuevos.capacidad_carga = 'La capacidad de carga debe ser mayor a 0'
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

    setGuardando(true)
    try {
      await api.post('/vehiculos', {
        patente: form.patente.trim().toUpperCase(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: Number(form.anio),
        capacidad_carga: Number(form.capacidad_carga),
      })
      setForm(FORM_VACIO)
      setMensaje('Vehículo guardado correctamente')
      setRecarga((n) => n + 1)
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section>
      <h2>Vehículos</h2>

      <div className="panel">
        <h3>Nuevo vehículo</h3>
        {errorServidor && <div className="error-box">{errorServidor}</div>}
        {mensaje && <div className="success-box">{mensaje}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="patente">Patente</label>
              <input
                id="patente"
                name="patente"
                type="text"
                value={form.patente}
                onChange={handleChange}
                className={errors.patente ? 'invalid' : ''}
              />
              {errors.patente && <span className="error-text">{errors.patente}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="marca">Marca</label>
              <input
                id="marca"
                name="marca"
                type="text"
                value={form.marca}
                onChange={handleChange}
                className={errors.marca ? 'invalid' : ''}
              />
              {errors.marca && <span className="error-text">{errors.marca}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                name="modelo"
                type="text"
                value={form.modelo}
                onChange={handleChange}
                className={errors.modelo ? 'invalid' : ''}
              />
              {errors.modelo && <span className="error-text">{errors.modelo}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="anio">Año</label>
              <input
                id="anio"
                name="anio"
                type="number"
                value={form.anio}
                onChange={handleChange}
                className={errors.anio ? 'invalid' : ''}
              />
              {errors.anio && <span className="error-text">{errors.anio}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="capacidad_carga">Capacidad de carga</label>
              <input
                id="capacidad_carga"
                name="capacidad_carga"
                type="number"
                step="any"
                value={form.capacidad_carga}
                onChange={handleChange}
                className={errors.capacidad_carga ? 'invalid' : ''}
              />
              {errors.capacidad_carga && (
                <span className="error-text">{errors.capacidad_carga}</span>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-auto" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        </form>
      </div>

      {cargando && <p>Cargando vehículos...</p>}

      {error && <div className="error-box">{error}</div>}

      {!cargando && !error && vehiculos.length === 0 && (
        <p className="empty-text">Todavía no hay vehículos cargados.</p>
      )}

      {!cargando && !error && vehiculos.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Capacidad de carga</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id}>
                  <td>{v.patente}</td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.anio}</td>
                  <td>{Number(v.capacidad_carga).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Vehiculos