# GP Masters Manager MVP

¡Bienvenido a **GP Masters Manager**, una plataforma de simulación y gestión de escuderías de MotoGP! Esta aplicación permite a los usuarios sumergirse en el rol de un mánager de carreras, compitiendo contra otros jugadores en campeonatos personalizados.

---

## 📋 Descripción del Producto

**GP Masters Manager** es un juego de gestión deportiva en formato web (MVP) que incluye las siguientes características clave:

*   **Autenticación de Usuarios:** Registro e inicio de sesión seguro para gestionar tu perfil y tus equipos de manera persistente.
*   **Gestión de Campeonatos:** 
    *   Crea campeonatos indicando nombre, temporada, fecha de inicio y tipo de visibilidad.
    *   **Públicos o Privados:** Los campeonatos privados requieren de un código PIN para que otros mánagers puedan unirse.
    *   **Calendario Personalizado:** El creador del campeonato puede seleccionar y ordenar hasta un máximo de **15 circuitos** del catálogo predefinido.
*   **Registro de Escuderías:**
    *   Cada campeonato acepta un máximo de **10 escuderías** (límite de 1 escudería por usuario en cada campeonato).
    *   **Asignación de Piloto y Moto:** Al unirte a un campeonato, se te asignará de forma aleatoria un piloto disponible (sin duplicados en el mismo campeonato) y una motocicleta del catálogo predefinido.
*   **Secreto de Sumario (Privacidad de Datos):** 
    *   Los mánagers pueden ver el listado de escuderías rivales y sus pilotos/motos.
    *   Sin embargo, **los atributos detallados de los pilotos y motos rivales, así como el correo de su dueño, están ocultos (redactados)**. ¡Solo tú conoces los secretos técnicos de tu escudería para mantener la ventaja competitiva!
*   **Catálogo Realista:** Incluye escuderías, circuitos y pilotos inspirados en el campeonato del mundo real (Ducati, KTM, Aprilia, Yamaha, Honda con sus respectivas estadísticas de motor, chasis, aerodinámica, talento de piloto, etc.).

---

## 📖 Documentación Técnica

| Documento | Descripción |
|-----------|-------------|
| [Motor de Simulación de Carreras](docs/simulation-engine.md) | Análisis completo del motor de simulación: fórmulas matemáticas, lógica de neumáticos, adelantamientos, feedback del piloto y diagramas de flujo |
| [Roles y Permisos de Usuarios](docs/roles-permissions.md) | Guía detallada sobre los roles de la plataforma (admin, master, manager, player) y los permisos asignados a cada uno para la gestión de campeonatos y simulación |

---

## 🛠️ Tecnologías Utilizadas

El proyecto está construido sobre una arquitectura moderna desacoplada en Frontend y Backend:

### 💻 Frontend (Cliente)
*   **React 18:** Biblioteca para la interfaz de usuario reactiva y modular.
*   **Vite:** Herramienta de compilación ultra rápida para desarrollo moderno.
*   **Tailwind CSS:** Framework de diseño utilitario para una interfaz fluida, estética y totalmente adaptada a dispositivos móviles.
*   **React Router DOM v7:** Enrutamiento del lado del cliente para una experiencia de aplicación de página única (SPA).
*   **Lucide React:** Set de iconos limpios y consistentes.

### ⚙️ Backend (Servidor y API)
*   **Node.js & Express:** Servidor HTTP y API REST robusta y ligera.
*   **PostgreSQL:** Base de datos relacional para el almacenamiento persistente de usuarios, campeonatos, equipos y relaciones.
*   **JWT en Cookies HTTP-Only:** Autenticación sin estado, almacenando los JWT en cookies seguras (con protección CSRF) eliminando el uso de LocalStorage.
*   **Seguridad y Trazabilidad:** Uso de `helmet` para headers HTTP, `express-rate-limit` contra fuerza bruta y `winston` para logging estructurado en producción.
*   **bcryptjs:** Encriptación y hashing de contraseñas de usuario y PINs de campeonato en la base de datos.
*   **pg (node-postgres):** Cliente no bloqueante para interactuar con la base de datos PostgreSQL.

### 🐳 Infraestructura y Despliegue
*   **Docker & Docker Compose:** Contenedores para una fácil orquestación del entorno de producción y base de datos.
*   **Nginx:** Servidor web encargado de servir la build estática del Frontend y realizar la función de **proxy inverso** redirigiendo las llamadas `/api` hacia el contenedor del Backend.

---

## 🚀 Cómo Arrancar el Proyecto

Existen dos alternativas para arrancar el entorno de ejecución del proyecto:

### Opción A: Mediante Docker Compose (Recomendado y rápido)
Este método es ideal para levantar todo el ecosistema (Base de Datos + Backend + Frontend/Nginx) en un solo comando sin necesidad de instalar dependencias adicionales en tu máquina.

1.  **Prerrequisitos:** Asegúrate de tener instalado **Docker** y **Docker Compose** en tu sistema.
2.  **Iniciar los contenedores:** Sitúate en la raíz del proyecto y ejecuta:
    ```bash
    docker compose up --build
    ```
3.  **Acceder a la aplicación:**
    *   **Frontend (Nginx):** Abre tu navegador en [http://localhost:3000](http://localhost:3000)
    *   **Backend (API):** Disponible en [http://localhost:5000](http://localhost:5000) (las llamadas desde el frontend se redirigen automáticamente a través de Nginx).
    *   **Base de datos:** Postgres se levantará internamente en el puerto `5432`. El backend ejecutará automáticamente las migraciones (`node-pg-migrate`) para inicializar el esquema y los datos en el primer arranque.

---

### Opción B: Arranque Local Manual (Para Desarrollo)
Si deseas modificar el código en tiempo real con recarga automática sin reconstruir contenedores Docker.

#### 1. Configuración de la Base de Datos (PostgreSQL)
1.  Inicia tu servicio local de PostgreSQL.
2.  Crea una base de datos vacía llamada `motogp_db`.

#### 2. Configurar y Arrancar el Backend
1.  Ve al directorio del backend:
    ```bash
    cd backend
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Configura las variables de entorno creando/revisando el archivo `.env` en la carpeta `backend/` con el siguiente contenido:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://motogp_user:motogp_password@localhost:5432/motogp_db
    JWT_SECRET=pon_aqui_una_cadena_aleatoria_muy_larga_y_segura
    ```
    *(Ajusta `motogp_user` y `motogp_password` según las credenciales de tu Postgres local).*
4.  Arranca el servidor en modo de desarrollo:
    ```bash
    npm run dev
    ```
    El servidor backend se iniciará en [http://localhost:5000](http://localhost:5000) y nodemon recargará automáticamente el servidor ante cambios de código.
    
    *(Nota: El esquema de base de datos se maneja mediante migraciones con `node-pg-migrate`. Para aplicar cambios o inicializar la BBDD, ejecuta `npm run migrate:up`)*.

#### 3. Configurar y Arrancar el Frontend
1.  Abre una nueva terminal y navega al directorio del frontend:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo de Vite:
    ```bash
    npm run dev
    ```
4.  **Acceder a la aplicación:** Abre tu navegador en [http://localhost:3000](http://localhost:3000). Vite tiene configurado un proxy interno que redirigirá cualquier petición realizada a `/api/*` al backend local corriendo en el puerto `5000`.
