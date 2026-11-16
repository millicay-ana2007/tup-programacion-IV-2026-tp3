// El backend devuelve las fechas como texto (AAAA-MM-DD HH:MM:SS)
export function formatearFechaHora(valor) {
  const texto = String(valor || '').replace('T', ' ')
  const [fecha, hora] = texto.split(' ')
  const [anio, mes, dia] = (fecha || '').split('-')
  if (!anio || !mes || !dia) return ''
  return `${dia}/${mes}/${anio}${hora ? ` ${hora.slice(0, 5)}` : ''}`
}

export function nombreVehiculo(v) {
  return v ? `${v.patente} (${v.marca} ${v.modelo})` : ''
}

export function nombreConductor(c) {
  return c ? `${c.apellido}, ${c.nombre}` : ''
}