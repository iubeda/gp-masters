# Guía de Roles y Permisos — MotoGP Manager

Esta documentación describe en detalle los distintos roles de usuario que existen en **MotoGP Manager** y las acciones y permisos específicos asignados a cada uno para la gestión de campeonatos, escuderías y simulaciones.

---

## Resumen General de Roles

La plataforma cuenta con 4 roles de usuario (definidos en la tabla `users` de la base de datos):

| Rol | Nivel | Creación de Campeonatos | Gestión de Calendario | Expulsión de Usuarios | Simulación Manual |
|-----|-------|-------------------------|------------------------|-----------------------|-------------------|
| **player** | Básico | No permitido | No permitido | No permitido | No permitido |
| **manager**| Medio | Solo Públicos | Solo si es Creador | Solo si es Creador (Antes de empezar) | No permitido |
| **master** | Alto | Públicos y Privados | Solo si es Creador | Solo si es Creador (Antes de empezar) | No permitido |
| **admin**  | Total | Públicos y Privados | Permitido siempre | Permitido (Con restricciones de seguridad) | Permitido siempre (Bypass dev) |

---

## Detalle de Permisos por Rol

### 1. Player (Jugador / Mánager de Escudería)
Es el rol base para competir en la plataforma.
* **Inscripción**: Puede inscribirse en campeonatos públicos o privados (para los privados se requiere introducir el PIN de acceso).
* **Gestión de Escudería**: Configura el setup, compuesto de neumático y enfoque de conducción para su propio piloto y moto asignados de manera aleatoria.
* **Simulaciones Individuales**: Puede rodar y simular tandas de entrenamientos libres (máximo 15 vueltas) y tandas de clasificación (máximo 3 vueltas) para su propio equipo en la ventana horaria correspondiente.
* **Historial y Telemetría**: Accede a la telemetría detallada de sus propias vueltas y a los tiempos oficiales generales.
* *Restricciones*: No puede crear campeonatos, añadir circuitos, expulsar a otros usuarios ni forzar la simulación global de carreras.

### 2. Manager
Diseñado para creadores de ligas públicas y organizadores estándar.
* **Creación de Campeonatos**: Puede crear campeonatos, pero **únicamente públicos**.
* **Gestión del Calendario**: Si es el creador de un campeonato, puede añadir circuitos del catálogo (máximo 15) y definir su orden.
* **Gestión de Participantes (Expulsión)**: Como creador, puede expulsar a mánagers del campeonato, bajo las siguientes condiciones:
  * Solo puede hacerlo **antes de que comience el campeonato** (antes de que se haya completado el primer Gran Premio).
  * No puede expulsarse a sí mismo.
* *Restricciones*: No puede crear campeonatos privados con PIN ni forzar simulaciones de carrera globales.

### 3. Master
Pensado para administradores de ligas privadas completas o comunidades cerradas.
* **Creación de Campeonatos**: Puede crear campeonatos tanto **públicos** como **privados** (generando un código PIN de acceso).
* **Gestión del Calendario y Participantes**: Mismas capacidades que el rol `manager` (solo en campeonatos que haya creado y antes de que inicien).
* *Restricciones*: No puede forzar simulaciones de carrera globales.

### 4. Admin (Administrador Global de la Plataforma)
Control total sobre la aplicación para mantenimiento y pruebas.
* **Creación**: Puede crear campeonatos de cualquier tipo.
* **Gestión de Calendarios**: Puede añadir o modificar el calendario de circuitos en **cualquier** campeonato de la plataforma, sea o no el creador.
* **Gestión de Participantes (Expulsiones con Reglas de Seguridad)**: Puede expulsar a usuarios de cualquier campeonato con total flexibilidad, pero sujeto a estrictas medidas de seguridad:
  1. **Protección al creador**: El administrador **no puede expulsar al usuario creador** de un campeonato para evitar usurpaciones de campeonatos comunitarios.
  2. **Protección de disputas**: El administrador **no puede expulsar a un usuario que ya haya disputado alguna carrera** en la temporada (es decir, que tenga un registro de resultados en la tabla `gp_team_status` de cualquier circuito completado). Esto protege la integridad del histórico del campeonato.
  3. *Nota de flexibilidad*: A diferencia de los creadores normales, el administrador puede expulsar a usuarios inactivos o inapropiados a mitad de la temporada, siempre que dicho usuario no haya corrido ninguna carrera aún.
* **Simulación Global de Carreras**: Puede simular manualmente y completar cualquier carrera en cualquier campeonato de forma manual, y tiene acceso a la casilla de **Bypass de restricciones horarias** para acelerar el desarrollo del calendario.
* **Visualización sin Participación**: No necesita registrar un equipo ni ocupar una plaza en la parrilla para acceder al "GP Activo" de un campeonato. Al ingresar, visualiza una interfaz especial de **Modo Administrador** que le oculta las herramientas individuales pero le permite ver el estado general y forzar la simulación del Gran Premio.
