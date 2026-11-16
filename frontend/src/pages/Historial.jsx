import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatearFechaHora, nombreConductor, nombreVehiculo } from '../utils/formato'

function Historial() {
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [cargandoListas, setCargandoListas] = useState(true)

  const [tipo, setTipo] = useState('vehiculo')
  const [seleccionId, setSeleccionId] = useState('')
  const [errorForm, setErrorForm] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    let activo = true

    Promise.all([api.get('/vehiculos'), api.get('/conductores')])
      .then(([datosVehiculos, datosConductores]) => {
        if (!activo) return
        setVehiculos(Array.isArray(datosVehiculos) ? datosVehiculos : [])
        setConductores(Array.isArray(datosConductores) ? datosConductores : [])
      })
      .catch((err) => {
        if (activo) setError(err.message)
      })
      .finally(() => {
        if (activo) setCargandoListas(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const vehiculoPorId = Object.fromEntries(vehiculos.map((v) => [v.id, v]))
  const conductorPorId = Object.fromEntries(conductores.map((c) => [c.id, c]))

  const opciones =
    tipo === 'vehiculo'
      ? vehiculos.map((v) => ({ id: v.id, texto: nombreVehiculo(v) }))
      : conductores.map((c) => ({ id: c.id, texto: nombreConductor(c) }))

  const handleTipo = (e) => {
    setTipo(e.target.value)
    setSeleccionId('')
    setErrorForm('')
    setError('')
    setResultado(null)
  }

  const handleConsultar = async (e) => {
    e.preventDefault()
    setError('')

    if (!seleccionId) {
      setErrorForm(tipo === 'vehiculo' ? 'Elegí un vehículo' : 'Elegí un conductor')
      return
    }
    setErrorForm('')

    const parametro = `${tipo === 'vehiculo' ? 'vehiculo_id' : 'conductor_id'}=${seleccionId}`
    const titulo = opciones.find((o) => String(o.id) === String(seleccionId))?.texto || ''

    setConsultando(true)
    try {
      const [viajes, km] = await Promise.all([
        api.get(`/viajes?${parametro}`),
        api.get(`/viajes/km?${parametro}`),
      ])
      setResultado({
        titulo,
        viajes: Array.isArray(viajes) ? viajes : [],
        total_km: Number(km?.total_km || 0),
        cantidad_viajes: Number(km?.cantidad_viajes || 0),
      })
    } catch (err) {
      setError(err.message)
      setResultado(null)
    } finally {
      setConsultando(false)
    }
  }

  return (
    <section>
      <h2>Historial de viajes</h2>

      <div className="panel">
        <h3>Consultar</h3>
        <form onSubmit={handleConsultar} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tipo">Consultar por</label>
              <select id="tipo" value={tipo} onChange={handleTipo}>
                <option value="vehiculo">Vehículo</option>
                <option value="conductor">Conductor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="seleccion">{tipo === 'vehiculo' ? 'Vehículo' : 'Conductor'}</label>
              <select
                id="seleccion"
                value={seleccionId}
                onChange={(e) => setSeleccionId(e.target.value)}
                className={errorForm ? 'invalid' : ''}
              >
                <option value="">
                  {tipo === 'vehiculo' ? 'Elegí un vehículo' : 'Elegí un conductor'}
                </option>
                {opciones.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.texto}
                  </option>
                ))}
              </select>
              {errorForm && <span className="error-text">{errorForm}</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-auto" disabled={consultando || cargandoListas}>
            {consultando ? 'Consultando...' : 'Consultar'}
          </button>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      {resultado && (
        <>
          <h3>Resultado para: {resultado.titulo}</h3>

          <div className="resumen">
            <div className="resumen-item">
              <span>Total de kilómetros</span>
              <strong>{resultado.total_km.toLocaleString('es-AR')} km</strong>
            </div>
            <div className="resumen-item">
              <span>Cantidad de viajes</span>
              <strong>{resultado.cantidad_viajes.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          {resultado.viajes.length === 0 ? (
            <p className="empty-text">No hay viajes registrados para esta selección.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Salida</th>
                    <th>Llegada</th>
                    <th>Vehículo</th>
                    <th>Conductor</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Km</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.viajes.map((v) => (
                    <tr key={v.id}>
                      <td>{formatearFechaHora(v.fecha_salida)}</td>
                      <td>{formatearFechaHora(v.fecha_llegada) || '—'}</td>
                      <td>{nombreVehiculo(vehiculoPorId[v.vehiculo_id])}</td>
                      <td>{nombreConductor(conductorPorId[v.conductor_id])}</td>
                      <td>{v.origen}</td>
                      <td>{v.destino}</td>
                      <td>{Number(v.kilometros).toLocaleString('es-AR')}</td>
                      <td>{v.observaciones || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Historial