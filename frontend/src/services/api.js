const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function obtenerMensaje(data, status) {
  // Errores de validación: { errors: [ { msg, path, ... } ] }
  if (data && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.msg).join('. ')
  }
  // Otros errores: { message: '...' }
  if (data && data.message) {
    return data.message
  }
  return `Error ${status}`
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const token = localStorage.getItem('token')
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }

  // 204: eliminación correcta, no hay cuerpo
  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    // Token vencido o inválido: se borra la sesión y se vuelve al login
    if (response.status === 401 && auth && token) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    throw new Error(obtenerMensaje(data, response.status))
  }

  return data
}

export const api = {
  get: (path, opciones) => request(path, { ...opciones }),
  post: (path, body, opciones) => request(path, { method: 'POST', body, ...opciones }),
  put: (path, body, opciones) => request(path, { method: 'PUT', body, ...opciones }),
  delete: (path, opciones) => request(path, { method: 'DELETE', ...opciones }),
}