import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <span className="navbar-brand">🚚 Transporte</span>
      <nav className="navbar-links">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/login">Iniciar sesión</NavLink>
        <NavLink to="/registro">Registrarse</NavLink>
      </nav>
    </header>
  )
}

export default Navbar