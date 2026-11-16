import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Conductores from './pages/Conductores'
import Historial from './pages/Historial'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Vehiculos from './pages/Vehiculos'
import Viajes from './pages/Viajes'

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/vehiculos"
            element={
              <ProtectedRoute>
                <Vehiculos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conductores"
            element={
              <ProtectedRoute>
                <Conductores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viajes"
            element={
              <ProtectedRoute>
                <Viajes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <Historial />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  )
}

export default App