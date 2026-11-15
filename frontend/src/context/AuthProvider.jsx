import { useState } from 'react'
import { AuthContext } from './AuthContext'

function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))
  } catch {
    return null
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [usuario, setUsuario] = useState(leerUsuario)

  const login = (nuevoToken, nuevoUsuario) => {
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario))
    setToken(nuevoToken)
    setUsuario(nuevoUsuario)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
  }

  const value = { token, usuario, estaLogueado: Boolean(token), login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider