import { useEffect, useState } from 'react'
import { api } from '../services/api'

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  numero_documento: '',
  numero_licencia: '',
  fecha_alta_licencia: '',
  fecha_vencimiento_licencia: '',
}

// El backend devuelve las fechas como texto (AAAA-MM-DD)
function soloFecha(valor) {
  return String(valor || '').slice(0, 10)
}

function formatearFecha(valor) {
  const [anio, mes, dia] = soloFecha(valor).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : ''
}

function Conductores() {
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [errors, setErrors] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true

    api
      .get('/conductores')
      .then((data) => {
        if (activo) {
          setConductores(Array.isArray(data) ? data : [])
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

  const handleEditar = (c) => {
    setEditandoId(c.id)
    setForm({
      nombre: c.nombre,
      apellido: c.apellido,
      numero_documento: String(c.numero_documento),
      numero_licencia: String(c.numero_licencia),
      fecha_alta_licencia: soloFecha(c.fecha_alta_licencia),
      fecha_vencimiento_licencia: soloFecha(c.fecha_vencimiento_licencia),
    })
    setErrors({})
    setErrorServidor('')
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelar = () => {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setErrors({})
    setErrorServidor('')
  }

  const handleEliminar = async (c) => {
    const confirmado = window.confirm(
      `¿Seguro que querés eliminar al conductor ${c.nombre} ${c.apellido}?`,
    )
    if (!confirmado) return

    setErrorServidor('')
    setMensaje('')
    try {
      await api.delete(`/conductores/${c.id}`)
      if (editandoId === c.id) {
        setEditandoId(null)
        setForm(FORM_VACIO)
        setErrors({})
      }
      setMensaje('Conductor eliminado correctamente')
      setRecarga((n) => n + 1)
    } catch (err) {
      setErrorServidor(err.message)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validate = () => {
    const nuevos = {}

    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!form.apellido.trim()) nuevos.apellido = 'El apellido es obligatorio'
    if (!form.numero_documento.trim()) {
      nuevos.numero_documento = 'El número de documento es obligatorio'
    }
    if (!form.numero_licencia.trim()) {
      nuevos.numero_licencia = 'El número de licencia es obligatorio'
    }
    if (!form.fecha_alta_licencia) {
      nuevos.fecha_alta_licencia = 'La fecha de alta de la licencia es obligatoria'
    }
    if (!form.fecha_vencimiento_licencia) {
      nuevos.fecha_vencimiento_licencia = 'La fecha de vencimiento es obligatoria'
    }
    if (
      form.fecha_alta_licencia &&
      form.fecha_vencimiento_licencia &&
      form.fecha_vencimiento_licencia <= form.fecha_alta_licencia
    ) {
      nuevos.fecha_vencimiento_licencia =
        'El vencimiento debe ser posterior a la fecha de alta'
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
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      numero_documento: form.numero_documento.trim(),
      numero_licencia: form.numero_licencia.trim(),
      fecha_alta_licencia: form.fecha_alta_licencia,
      fecha_vencimiento_licencia: form.fecha_vencimiento_licencia,
    }

    setGuardando(true)
    try {
      if (editandoId) {
        await api.put(`/conductores/${editandoId}`, datos)
        setMensaje('Conductor actualizado correctamente')
      } else {
        await api.post('/conductores', datos)
        setMensaje('Conductor guardado correctamente')
      }
      setForm(FORM_VACIO)
      setEditandoId(null)
      setRecarga((n) => n + 1)
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section>
      <h2>Conductores</h2>

      <div className="panel">
        <h3>{editandoId ? 'Editar conductor' : 'Nuevo conductor'}</h3>
        {errorServidor && <div className="error-box">{errorServidor}</div>}
        {mensaje && <div className="success-box">{mensaje}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                className={errors.nombre ? 'invalid' : ''}
              />
              {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={form.apellido}
                onChange={handleChange}
                className={errors.apellido ? 'invalid' : ''}
              />
              {errors.apellido && <span className="error-text">{errors.apellido}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="numero_documento">Número de documento</label>
              <input
                id="numero_documento"
                name="numero_documento"
                type="text"
                value={form.numero_documento}
                onChange={handleChange}
                className={errors.numero_documento ? 'invalid' : ''}
              />
              {errors.numero_documento && (
                <span className="error-text">{errors.numero_documento}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="numero_licencia">Número de licencia</label>
              <input
                id="numero_licencia"
                name="numero_licencia"
                type="text"
                value={form.numero_licencia}
                onChange={handleChange}
                className={errors.numero_licencia ? 'invalid' : ''}
              />
              {errors.numero_licencia && (
                <span className="error-text">{errors.numero_licencia}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="fecha_alta_licencia">Alta de la licencia</label>
              <input
                id="fecha_alta_licencia"
                name="fecha_alta_licencia"
                type="date"
                value={form.fecha_alta_licencia}
                onChange={handleChange}
                className={errors.fecha_alta_licencia ? 'invalid' : ''}
              />
              {errors.fecha_alta_licencia && (
                <span className="error-text">{errors.fecha_alta_licencia}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="fecha_vencimiento_licencia">Vencimiento de la licencia</label>
              <input
                id="fecha_vencimiento_licencia"
                name="fecha_vencimiento_licencia"
                type="date"
                value={form.fecha_vencimiento_licencia}
                onChange={handleChange}
                className={errors.fecha_vencimiento_licencia ? 'invalid' : ''}
              />
              {errors.fecha_vencimiento_licencia && (
                <span className="error-text">{errors.fecha_vencimiento_licencia}</span>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-auto" disabled={guardando}>
              {guardando
                ? 'Guardando...'
                : editandoId
                  ? 'Guardar cambios'
                  : 'Guardar conductor'}
            </button>
            {editandoId && (
              <button
                type="button"
                className="btn btn-auto btn-secondary"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {cargando && <p>Cargando conductores...</p>}

      {error && <div className="error-box">{error}</div>}

      {!cargando && !error && conductores.length === 0 && (
        <p className="empty-text">Todavía no hay conductores cargados.</p>
      )}

      {!cargando && !error && conductores.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Apellido y nombre</th>
                <th>Documento</th>
                <th>Licencia</th>
                <th>Alta</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conductores.map((c) => (
                <tr key={c.id} className={c.id === editandoId ? 'fila-activa' : ''}>
                  <td>{c.apellido}, {c.nombre}</td>
                  <td>{c.numero_documento}</td>
                  <td>{c.numero_licencia}</td>
                  <td>{formatearFecha(c.fecha_alta_licencia)}</td>
                  <td>{formatearFecha(c.fecha_vencimiento_licencia)}</td>
                  <td>
                    <div className="acciones">
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEditar(c)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleEliminar(c)}
                      >
                        Eliminar
                      </button>
                    </div>
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

export default Conductores