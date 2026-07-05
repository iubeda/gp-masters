# Reglas del Agente — MotoGP Manager

---

## 1. Mapa del Proyecto

No es necesario explorar la estructura del proyecto desde cero en cada tarea. Esta es la arquitectura completa:

```
motogp-manager/
├── backend/                        # API REST — Node.js + Express
│   ├── controllers/
│   │   ├── simulation.controller.js  # Endpoints HTTP y validación
│   │   ├── championship.controller.js
│   │   ├── team.controller.js
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── simulation.service.js     # Coordinación de la simulación y base de datos
│   │   ├── simulation.engine.js      # Motor puro de cálculo físico
│   ├── models/
│   │   ├── simulation.model.js       # Queries de simulación (BD)
│   │   ├── championship.model.js
│   │   ├── team.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── api.js                    # Router raíz, monta sub-routers en /api
│   │   ├── simulation.routes.js
│   │   ├── championship.routes.js
│   │   ├── team.routes.js
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   └── admin.routes.js
│   ├── middleware/
│   │   ├── auth.js                   # Verificación JWT
│   │   └── validation.js
│   ├── utils/
│   │   ├── scheduler.js              # Auto-simulación de carreras (setInterval)
│   │   └── asyncHandler.js
│   ├── config/
│   │   └── database.js               # Pool de conexión PostgreSQL (pg)
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── championship.test.js
│   │   └── testSetup.js
│   ├── schema.sql                    # DDL completo + seeds (pilotos, motos, circuitos)
│   ├── server.js                     # Punto de entrada
│   └── app.js
│
├── frontend/                         # SPA — React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── Auth.jsx              # Login / Registro
│       │   ├── Dashboard.jsx         # Lista de campeonatos
│       │   ├── ChampionshipDetail.jsx # Vista GP + simulación (página más grande)
│       │   ├── Profile.jsx
│       │   └── AdminUsers.jsx
│       ├── components/
│       │   ├── championship/         # Componentes reutilizables del GP
│       │   └── Toast.jsx
│       ├── context/                  # Context API (auth global)
│       ├── App.jsx                   # Router principal (React Router v7)
│       └── main.jsx
│
├── docs/
│   └── simulation-engine.md          # Documentación técnica del motor de simulación
│
├── .agents/
│   └── AGENTS.md                     # Este archivo
│
├── docker-compose.yml                # Orquesta backend + frontend/nginx + postgres
└── README.md
```

### Stack técnico resumido

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v7, Lucide React |
| Backend | Node.js, Express, JWT (jsonwebtoken), bcryptjs |
| Base de datos | PostgreSQL (driver: `pg`) |
| Testing | Vitest + Supertest (backend), Vitest + Testing Library (frontend) |
| Infraestructura | Docker Compose, Nginx (reverse proxy + sirve el build) |

### Comandos útiles

```bash
# Backend (desde /backend)
npm run dev         # Desarrollo con nodemon
npm test            # Ejecutar tests (vitest run)

# Frontend (desde /frontend)
npm run dev         # Servidor de desarrollo Vite (puerto 3000)
npm test            # Tests de componentes

# Docker (desde la raíz)
docker compose up --build
```

---

## 2. Convenciones de Código

- **Backend**: CommonJS (`require`/`module.exports`). Todos los endpoints se envuelven en `asyncHandler` (util propio).
- **Frontend**: ES Modules (`.jsx`). Componentes funcionales con hooks. Estilos con clases de Tailwind directamente en JSX.
- **Idioma del código**: variables, funciones y comentarios en **inglés**. Mensajes de respuesta de la API al usuario en **español**.
- **Validaciones**: en el controller (no en el model). Los models solo contienen queries SQL.
- **Rutas API**: todas bajo el prefijo `/api`. Estructura: `/api/{recurso}/{acción}`.

---

## 3. Base de Datos

- El esquema completo está en `backend/schema.sql`. Si se añade o modifica una tabla, **actualizar este archivo**.
- No usar migraciones — el schema se aplica completo en el arranque (desarrollo) o se gestiona manualmente (producción).
- Las transacciones se hacen con `db.pool.connect()` + `BEGIN/COMMIT/ROLLBACK` (ver `simulation.model.js → saveRaceResults`).
- **Nunca commitear el archivo `.env`**. Las variables de entorno son: `PORT`, `DATABASE_URL`, `JWT_SECRET`.

---

## 4. Documentación Técnica

Cuando modifiques cualquiera de los siguientes archivos:

- `backend/controllers/simulation.controller.js`
- `backend/services/simulation.service.js`
- `backend/services/simulation.engine.js`
- `backend/models/simulation.model.js`
- `backend/utils/scheduler.js`

**Actualiza `docs/simulation-engine.md`** sin esperar a que el usuario lo pida. Esto incluye:

- Actualizar fórmulas, tablas o diagramas Mermaid afectados.
- Añadir nuevas secciones si se introduce funcionalidad nueva.
- Eliminar o marcar como obsoleto cualquier contenido que ya no sea válido.

Asimismo, si modificas lógica de roles, permisos o expulsiones (ej. en `backend/controllers/championship.controller.js` o `backend/controllers/simulation.controller.js`), **actualiza `docs/roles-permissions.md`**.

---

## 5. Tests

- Los tests del backend usan **Vitest + Supertest** y están en `backend/tests/`.
- Si añades un nuevo endpoint, considera si necesita test en el archivo correspondiente.
- El comando para ejecutar los tests del backend es `npm test` (desde `/backend`).
- Los tests del frontend están junto a los componentes (ej: `Auth.test.jsx`, `Toast.test.jsx`).

---

## 6. Restricciones Importantes

- **No instalar nuevas dependencias** sin confirmar con el usuario.
- **No modificar `schema.sql`** sin avisar explícitamente al usuario de que necesitará re-inicializar la base de datos.
- El archivo `ChampionshipDetail.jsx` es el más complejo del frontend (~38KB). Antes de modificarlo, leer su estructura completa.

