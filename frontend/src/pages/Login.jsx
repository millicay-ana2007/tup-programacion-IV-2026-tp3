import { useState } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevos = validate()
    setErrors(nuevos)
    if (Object.keys(nuevos).length > 0) return
    // Próximo paso: llamar a la API del backend (POST /api/auth/login)
    console.log('Datos válidos', form)
  }

  return (
    <div className="card">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} noValidate>
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
        <button type="submit" className="btn">Ingresar</button>
      </form>
    </div>
  )
}

export default Login