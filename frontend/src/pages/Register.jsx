import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const nuevos = {}
    if (!form.nombre.trim()) {
      nuevos.nombre = 'El nombre es obligatorio'
    }
    if (!form.email.trim()) {
      nuevos.email = 'El email es obligatorio'
    } else if (!EMAIL_REGEX.test(form.email)) {
      nuevos.email = 'El email no tiene un formato válido'
    }
    if (!form.password) {
      nuevos.password = 'La contraseña es obligatoria'
    } else if (form.password.length < 6) {
      nuevos.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    return nuevos
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nuevos = validate()
    setErrors(nuevos)
    setErrorServidor('')
    if (Object.keys(nuevos).length > 0) return

    setCargando(true)
    try {
      await api.post(
        '/auth/register',
        {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        { auth: false },
      )
      navigate('/login')
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="card">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit} noValidate>
        {errorServidor && <div className="error-box">{errorServidor}</div>}
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={errors.email ? 'invalid' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className={errors.password ? 'invalid' : ''}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>
        <button type="submit" className="btn" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
    </div>
  )
}

export default Register