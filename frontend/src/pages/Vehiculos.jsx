import { useEffect, useState } from 'react'
import { api } from '../services/api'

function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true

    api
      .get('/vehiculos')
      .then((data) => {
        if (activo) setVehiculos(Array.isArray(data) ? data : [])
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
  }, [])

  return (
    <section>
      <h2>Vehículos</h2>

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