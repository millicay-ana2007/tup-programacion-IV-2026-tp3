# TP3 - Gestión de vehículos, conductores y viajes

Trabajo Práctico 3 de **Programación IV** (Tecnicatura Universitaria en Programación, UTN Facultad Regional La Rioja).

Aplicación web para una empresa de transporte: permite gestionar vehículos y conductores, registrar viajes asociando un vehículo y un conductor, consultar el historial de viajes y calcular el total de kilómetros recorridos.

## Tecnologías

- **Backend:** Node.js, Express 5, MySQL (`mysql2`), `express-validator`, Passport (estrategia JWT), `jsonwebtoken`, `bcrypt`.
- **Frontend:** Vite + React (JavaScript), React Router, `fetch` y CSS puro (sin librerías de estilos).

## Estructura del proyecto

```
tp3-transporte/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── http/            archivos .http para probar la API
│   ├── sql/schema.sql   definición de la base y las tablas
│   └── src/
│       ├── app.js
│       ├── config/      conexión a MySQL y configuración de Passport
│       ├── middlewares/ autenticación (requireAuth) y validaciones
│       └── routes/      auth, vehículos, conductores y viajes
└── frontend/
    └── src/
        ├── components/  Navbar y ProtectedRoute
        ├── context/     contexto de autenticación
        ├── pages/       Home, Login, Register, Vehiculos, Conductores, Viajes, Historial
        ├── services/    api.js (comunicación con el backend)
        └── utils/       funciones de formato
```

## Cómo ejecutar el proyecto

### Requisitos

- Node.js
- MySQL en funcionamiento

### 1. Base de datos

Ejecutar el script `backend/sql/schema.sql` en MySQL (por ejemplo desde MySQL Workbench o con `mysql -u <usuario> -p < backend/sql/schema.sql`). Crea la base `tp3_transporte` y las cuatro tablas.

### 2. Backend

```bash
cd backend
npm install
```

Copiar `.env.example` como `.env` y completar los valores:

```
PORT=3000
DB_HOST=localhost
DB_USER=<usuario de MySQL>
DB_PASSWORD=<contraseña de MySQL>
DB_NAME=tp3_transporte
JWT_SECRET=<una clave secreta>
```

Iniciar el servidor:

```bash
npm run dev
```

La API queda en `http://localhost:3000/api`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. Para empezar hay que registrarse en `/registro` e iniciar sesión.

## API (prefijo `/api`)

| Recurso | Rutas | Acceso |
|---|---|---|
| Autenticación | `POST /auth/register`, `POST /auth/login` | Público |
| Vehículos | `GET /vehiculos`, `GET /vehiculos/:id`, `POST`, `PUT /:id`, `DELETE /:id` | Con token |
| Conductores | `GET /conductores`, `GET /conductores/:id`, `POST`, `PUT /:id`, `DELETE /:id` | Con token |
| Viajes | `GET /viajes`, `GET /viajes/:id`, `POST`, `PUT /:id`, `DELETE /:id` | Con token |
| Historial | `GET /viajes?vehiculo_id=` o `?conductor_id=` | Con token |
| Kilómetros | `GET /viajes/km?vehiculo_id=` o `?conductor_id=` | Con token |

Los archivos de la carpeta `backend/http` tienen ejemplos de cada petición.

## Fundamentación de diseño

- **Autenticación con JWT:** al iniciar sesión el backend devuelve un token que **expira a las 4 horas**. Un middleware de Passport lo verifica en todas las rutas de vehículos, conductores y viajes; sin token válido la respuesta es 401.
- **Contraseñas:** se guardan con hash **bcrypt**, nunca en texto plano. El archivo `.env` con las credenciales no se versiona.
- **Validaciones en dos capas:** el frontend valida campos obligatorios y formatos antes de enviar, y el backend vuelve a validar con `express-validator` todas las rutas de obtención, creación y actualización.
- **Manejo de errores HTTP:** 400 (datos inválidos, duplicados, JSON mal formado, borrar un vehículo o conductor que tiene viajes), 401 (sin sesión o token inválido), 403 (el conductor tenía la licencia vencida en la fecha de salida del viaje), 404 (recurso inexistente) y 500 (error del servidor).
- **Integridad de los datos:** las tablas se relacionan con claves foráneas, y patente, documento, licencia y email son únicos.
- **Fechas:** la conexión a MySQL devuelve las fechas como texto (`dateStrings`), para evitar corrimientos de zona horaria.
- **Frontend:** la comunicación con el backend está centralizada en `services/api.js`, que agrega el token a cada petición y traduce los errores a mensajes legibles. La sesión se guarda en `localStorage` y las páginas de gestión están protegidas con un componente `ProtectedRoute`. La página principal, el login y el registro son públicos.