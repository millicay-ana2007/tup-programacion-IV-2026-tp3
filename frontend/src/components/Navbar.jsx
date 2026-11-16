import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Navbar() {
  const { estaLogueado, usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <span className="navbar-brand">🚚 Transporte</span>
      <nav className="navbar-links">
        <NavLink to="/" end>Inicio</NavLink>
        {estaLogueado && <NavLink to="/vehiculos">Vehículos</NavLink>}
        {estaLogueado && <NavLink to="/conductores">Conductores</NavLink>}
        {!estaLogueado && <NavLink to="/login">Iniciar sesión</NavLink>}
        {!estaLogueado && <NavLink to="/registro">Registrarse</NavLink>}
      </nav>
      {estaLogueado && (
        <div className="navbar-user">
          <span>Hola, {usuario?.nombre}</span>
          <button type="button" className="btn-link" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}

export default Navbar