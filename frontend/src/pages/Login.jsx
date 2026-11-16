import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const nuevos = {}
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
      const data = await api.post(
        '/auth/login',
        { email: form.email.trim(), password: form.password },
        { auth: false },
      )
      login(data.token, data.usuario)
      navigate('/')
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} noValidate>
        {errorServidor && <div className="error-box">{errorServidor}</div>}
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
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

export default Login