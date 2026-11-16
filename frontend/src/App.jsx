import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Vehiculos from './pages/Vehiculos'

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
        </Routes>
      </main>
    </>
  )
}

export default App