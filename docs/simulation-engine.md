# Motor de Simulación de Carreras

> Documentación técnica del motor de simulación de Gran Premio de MotoGP Manager.
> 
> **Archivos clave:**
> - [`backend/controllers/simulation.controller.js`](../backend/controllers/simulation.controller.js) — Lógica principal y endpoints
> - [`backend/models/simulation.model.js`](../backend/models/simulation.model.js) — Modelo de datos y queries
> - [`backend/utils/scheduler.js`](../backend/utils/scheduler.js) — Simulación automática de carreras
> - [`backend/schema.sql`](../backend/schema.sql) — Esquema de base de datos

---

## Visión General

El sistema de simulación implementa un **Gran Premio completo de MotoGP** con tres sesiones diferenciadas: Entrenamientos Libres, Clasificación y Carrera. Cada sesión utiliza el mismo motor de simulación vuelta a vuelta (`simulateLap()`), pero con reglas y restricciones distintas.

---

## Arquitectura del Flujo Completo del GP

```mermaid
flowchart TD
    A["🏁 Inicio del Fin de Semana GP"] --> B1["☁️ Clima Entrenamientos
(race_weekends: practice)"]
    A --> B2["☁️ Clima Clasificación
(race_weekends: qualifying)"]
    A --> B3["☁️ Clima Carrera
(race_weekends: race)"]
    B1 --> C["Crear Estado Equipo
(gp_team_status)"]
    B2 --> C
    B3 --> C
    C --> D["🔧 Entrenamientos Libres
Máx 15 vueltas"]
    D --> E["Feedback del Piloto
(orientación de setup)"]
    E --> F{"¿Quedan
vueltas?"}
    F -- Sí --> D
    F -- No --> G["⏱️ Clasificación
Máx 3 vueltas"]
    G --> H["Ordenar Parrilla
por mejor tiempo"]
    H --> I["💾 Guardar Estrategia
de Carrera"]
    I --> J["🏎️ Carrera
12 vueltas"]
    J --> K["Clasificación Final
+ Puntos + Premios"]
    K --> L["💰 Actualizar Balance
de Equipos"]

    style A fill:#e74c3c,color:#fff
    style B1 fill:#2980b9,color:#fff
    style B2 fill:#8e44ad,color:#fff
    style B3 fill:#16a085,color:#fff
    style D fill:#3498db,color:#fff
    style G fill:#f39c12,color:#fff
    style J fill:#2ecc71,color:#fff
    style K fill:#9b59b6,color:#fff
```

---

## 1. Generación del Clima

Definida en [`getOrCreateWeekend(championshipId, circuitId, sessionType)`](../backend/models/simulation.model.js).

El clima se genera **de forma independiente para cada sesión** del GP. Esto significa que puede llover en clasificación pero lucir el sol en carrera. La función recibe el `session_type` como tercer parámetro y la clave única en BD es `(championship_id, circuit_id, session_type)`.

El endpoint `getGPStatus` obtiene los 3 climas al cargar el Race Center y los devuelve agrupados:
```json
{
  "weather": {
    "practice":   { "weather_condition": "sunny", "temp_ambient": 28, ... },
    "qualifying": { "weather_condition": "rainy", "rain_percentage": 65, ... },
    "race":       { "weather_condition": "cloudy", "temp_ambient": 22, ... }
  }
}
```

| Condición | Probabilidad | Temp. Ambiente | Temp. Asfalto | Lluvia (%) |
|-----------|:------------:|:--------------:|:-------------:|:----------:|
| ☀️ Soleado | 50% | 18–35 °C | Ambiente + 10 | 0% |
| ☁️ Nublado | 30% | 18–35 °C | Ambiente + 2 | 0% |
| 🌧️ Lluvioso | 20% | 12–22 °C | Ambiente − 2 | 30–100% |

> **Nota:** Cada sesión tira sus propios dados de clima de forma independiente. El clima de entrenamientos **no influye** en el de carrera.

---

## 2. Motor de Simulación: `simulateLap()`

Este es el **núcleo matemático** del sistema, ubicado en [`simulation.controller.js`](../backend/controllers/simulation.controller.js). Calcula el tiempo de cada vuelta individual considerando 7 factores.

```mermaid
flowchart LR
    subgraph Inputs["📥 Entradas"]
        P["Piloto<br/>(talent, consistency,<br/>experience, fitness,<br/>aggressiveness)"]
        B["Moto<br/>(engine, gearbox,<br/>suspension, chassis,<br/>wings)"]
        C["Circuito<br/>(distance, curvas,<br/>ratio, asphalt_wear)"]
        W["Clima<br/>(weather, temp,<br/>rain %)"]
        S["Setup del Jugador<br/>(offsets -10 a +10,<br/>suma = 0)"]
        T["Neumático<br/>(soft/medium/<br/>hard/rain)"]
        F["Enfoque Piloto<br/>(aggressive/<br/>balanced/<br/>conservative)"]
    end

    subgraph Engine["⚙️ Motor de Cálculo"]
        BT["1. Tiempo Base"] 
        BF["2. Factor Moto"]
        PF["3. Factor Piloto"]
        SR["4. Reducción Velocidad"]
        TP["5. Delta Neumáticos"]
        TW["6. Desgaste Gomas"]
        FT["7. Fatiga Física"]
        CR["8. Probabilidad Caída"]
    end

    subgraph Outputs["📤 Salidas"]
        LT["⏱️ lap_time"]
        TWO["🛞 tire_wear_pct"]
        HC["💥 has_crashed"]
    end

    P --> PF
    B --> BF
    C --> BT
    C --> BF
    W --> TP
    S --> BF
    T --> TP
    T --> TW
    F --> TP
    
    BT --> SR
    BF --> SR
    PF --> SR
    SR --> LT
    TP --> LT
    TW --> LT
    FT --> LT
    CR --> HC
    TW --> TWO

    style Inputs fill:#2c3e50,color:#ecf0f1
    style Engine fill:#34495e,color:#ecf0f1
    style Outputs fill:#1a252f,color:#ecf0f1
```

### 2.1. Tiempo Base del Circuito

```
baseLapTime = (circuit.distance × 0.0215) + (curvas_derecha + curvas_izquierda) × 0.15
```

Ejemplo para Jerez (4423m, 8 curvas derecha, 5 izquierda):

```
T_base = (4423 × 0.0215) + (8 + 5) × 0.15 = 95.09 + 1.95 = 97.04s
```

### 2.2. Factor de Rendimiento de la Moto

El circuito determina qué componentes de la moto importan más, usando el **ratio curvas/rectas** (`curves_rects_ratio`):

```mermaid
flowchart TD
    R{"curves_rects_ratio"}
    R -- "< 1.1<br/>🏎️ Circuito de Velocidad" --> V["engine × 0.45<br/>gearbox × 0.25<br/>wings × 0.20<br/>chassis × 0.10"]
    R -- "1.1 – 1.4<br/>⚖️ Circuito Equilibrado" --> E["Media aritmética<br/>de los 5 componentes"]
    R -- "> 1.4<br/>🔄 Circuito Técnico" --> T["chassis × 0.45<br/>suspension × 0.25<br/>gearbox × 0.20<br/>engine × 0.10"]

    style V fill:#e74c3c,color:#fff
    style E fill:#f39c12,color:#fff
    style T fill:#3498db,color:#fff
```

> **⚠️ Importante:** Los valores de la moto se **suman con los offsets del setup** del jugador antes de calcular el factor. Ejemplo: `engineEff = bike.engine + setup.setup_engine`. Esto permite al jugador redistribuir puntos (suma = 0) para optimizar según el tipo de circuito.

### 2.3. Factor del Piloto

```
pilotFactor = (talent × 0.4) + (consistency × 0.2) + (experience × 0.2) + (fitness × 0.2)
```

El **talento** pesa el doble que el resto de atributos.

### 2.4. Reducción de Velocidad

Combina piloto y moto al 50/50 para reducir el tiempo base:

```
speedReduction = ((pilotFactor × 0.5) + (bikeFactor × 0.5)) × 0.05
```

> **💡 Tip:** Con un piloto perfecto (100 en todo) y moto perfecta (100 + setup 10), la reducción máxima sería: `((100 × 0.5) + (110 × 0.5)) × 0.05 = 5.25s`

### 2.5. Neumáticos y Climatología

#### Tabla de rendimiento por neumático y condición:

| Neumático | Seco: Delta Tiempo | Seco: Factor Desgaste | Lluvia: Delta Tiempo | Lluvia: Factor Desgaste |
|-----------|:------------------:|:---------------------:|:--------------------:|:-----------------------:|
| 🔴 Soft | −0.35s (rápido) | ×1.6 | — | — |
| 🟡 Medium | 0.0s | ×1.0 | — | — |
| ⚪ Hard | +0.3s (lento) | ×0.65 | — | — |
| 🔵 Rain | +5.5s | ×3.5 ☠️ | +4.0s | ×0.7 |
| Slicks en lluvia | — | — | +13.0s | ×0.5 |

> **🚨 Precaución:** Usar **slicks en lluvia** añade un **+35% de probabilidad de caída** por vuelta. Usar **neumáticos rain en seco** destruye las gomas (factor ×3.5).

#### Modificadores adicionales de clima:
- **Asfalto > 40°C + soft**: desgaste ×1.35 extra
- **Asfalto < 20°C** (sin lluvia): +1% probabilidad de caída (gomas frías)

### 2.6. Enfoque del Piloto

| Enfoque | Delta Tiempo | Desgaste | Probabilidad Caída |
|---------|:----------:|:--------:|:------------------:|
| 🔥 Aggressive | −0.25s | ×1.45 | ×2.5 |
| ⚖️ Balanced | 0.0s | ×1.0 | ×1.0 |
| 🛡️ Conservative | +0.25s | ×0.6 | ×0.2 |

### 2.7. Cálculo del Desgaste de Neumáticos

```
baseTireWear = { soft: 3.8, medium: 2.5, hard: 1.6, rain: 2.2 }

currentLapWear = baseTireWear 
    × (1 + asphalt_wear / 150) 
    × wearFactor 
    × (1 + (aggressiveness - experience / 2) / 200)

newTireWear = min(100, accumulatedWear + currentLapWear)
```

```mermaid
graph LR
    subgraph Penalización["Penalización por desgaste"]
        A["tireHealth = 100 - tire_wear"]
        A --> B{"tireHealth < 60?"}
        B -- Sí --> C["penalty = (60 - tireHealth) × 0.05<br/>Máx: +3.0s"]
        B -- No --> D["penalty = 0s"]
    end

    style Penalización fill:#2c3e50,color:#ecf0f1
```

### 2.8. Fatiga Física del Piloto

```
fatigueStartLap = totalLaps × (0.4 + fitness / 200)
if (lapNum > fatigueStartLap):
    fatiguePenalty = (lapNum - fatigueStartLap) × 0.04
    if (temp_ambient > 32°C):
        fatiguePenalty × 1.35
```

> **📝 Nota:** Un piloto con **fitness = 100** empieza a fatigarse en la vuelta 90% del total. Uno con **fitness = 0**, en la vuelta 40%.

### 2.9. Probabilidad de Caída

```mermaid
flowchart TD
    BASE["Base: 0.15% por vuelta"] --> LLUVIA{"¿Slicks en lluvia?"}
    LLUVIA -- Sí --> PLUS35["+35%"]
    LLUVIA -- No --> COLD{"¿Asfalto < 20°C?"}
    COLD -- Sí --> PLUS1["+1%"]
    COLD -- No --> TIRE{"¿Neumáticos < 30% salud?"}
    TIRE -- Sí --> PLUS25["+2.5%"]
    TIRE -- No --> FOCUS{"Enfoque piloto"}
    FOCUS -- Aggressive --> MULT25["Total × 2.5"]
    FOCUS -- Conservative --> MULT02["Total × 0.2"]
    FOCUS -- Balanced --> MULT1["Total × 1.0"]

    PLUS35 --> CHECK["Math.random() < crashChance?"]
    PLUS1 --> CHECK
    PLUS25 --> CHECK
    MULT25 --> CHECK
    MULT02 --> CHECK
    MULT1 --> CHECK
    CHECK -- Sí --> CRASH["💥 CAÍDA<br/>lap_time = null"]
    CHECK -- No --> OK["✅ Vuelta completada"]

    style CRASH fill:#e74c3c,color:#fff
    style OK fill:#2ecc71,color:#fff
```

### 2.10. Fórmula Final del Tiempo de Vuelta

```
T_vuelta = T_base - speedReduction + Δ_neumático + Δ_enfoque + penalty_desgaste + penalty_fatiga + noise
```

Donde `noise = random(0, 0.3)` introduce variabilidad natural.

---

## 3. Sesiones del Gran Premio

### 3.1. Entrenamientos Libres

**Endpoint:** `runPracticeStint()` en [`simulation.controller.js`](../backend/controllers/simulation.controller.js)

| Parámetro | Valor |
|-----------|-------|
| Vueltas máximas | **15** (repartidas en múltiples stints) |
| Horario | 12:00h – 15:00h |
| Objetivo | Probar setups y recibir feedback del piloto |

**Flujo:**
1. El jugador elige: neumático, enfoque, setup (5 offsets que suman 0)
2. Se simulan N vueltas (sin exceder el límite)
3. Se registra la mejor vuelta del stint
4. Se genera **feedback** comparando con el tiempo óptimo teórico

### 3.2. Clasificación

**Endpoint:** `runQualifyingStint()` en [`simulation.controller.js`](../backend/controllers/simulation.controller.js)

| Parámetro | Valor |
|-----------|-------|
| Vueltas máximas | **3** |
| Horario | 12:00h – 15:00h |
| Objetivo | Establecer posición de parrilla |

**Después de clasificar:**
- Se obtienen todos los equipos del GP
- Se ordenan por `best_qualifying_time` (menor es mejor)
- Se asigna `grid_position` a cada uno

### 3.3. Carrera

**Endpoint:** `runRaceSimulationInternal()` en [`simulation.controller.js`](../backend/controllers/simulation.controller.js)

| Parámetro | Valor |
|-----------|-------|
| Vueltas | **12** |
| Horario | A partir de las 14:00h |
| Participantes | **Todos los equipos** (incluidos los controlados por IA) |

```mermaid
flowchart TD
    START["Cargar Equipos y Parrilla"] --> SORT["Ordenar por grid_position"]
    SORT --> LOOP["🔄 Loop: Vuelta 1 → 12"]
    
    LOOP --> SIM["Simular vuelta de CADA piloto<br/>(simulateLap)"]
    SIM --> CRASHED{"¿Caída?"}
    CRASHED -- Sí --> DNF["Marcar DNF<br/>No corre más"]
    CRASHED -- No --> ACC["Acumular tiempo<br/>total_race_time += lap_time"]
    
    ACC --> OVERTAKE["🏁 Lógica de Adelantamientos"]
    DNF --> NEXT{"¿Más vueltas?"}
    OVERTAKE --> NEXT
    NEXT -- Sí --> LOOP
    NEXT -- No --> CLASSIFY["📊 Clasificación Final"]
    CLASSIFY --> POINTS["Repartir Puntos y Premios"]
    POINTS --> SAVE["Guardar en BD<br/>(transacción)"]

    style LOOP fill:#3498db,color:#fff
    style OVERTAKE fill:#e67e22,color:#fff
    style CLASSIFY fill:#9b59b6,color:#fff
```

#### Lógica de Adelantamientos

Ocurre **después de simular la vuelta de todos**:

1. Se filtran pilotos activos y se ordenan por `total_race_time`
2. Para cada par adyacente, si el gap < **0.4 segundos**:

```
pOvertake = 0.35 
    + (talentA − talentB) × 0.003
    + (aggressivenessA − consistencyB) × 0.004
    + (experienceA − experienceB) × 0.003
    + (setupEngineA − setupEngineB) × 0.002
    + (si aggressive: +0.15)
```

Si `Math.random() < pOvertake`:
- El adelantador: `total_race_time -= 0.1`, `tire_wear += 1.5`
- El adelantado: `total_race_time += 0.3`

#### Puntos y Premios

| Posición | Puntos | Premio (€) |
|:--------:|:------:|:----------:|
| 🥇 1° | 15 | 150.000 |
| 🥈 2° | 12 | 120.000 |
| 🥉 3° | 10 | 100.000 |
| 4° | 8 | 80.000 |
| 5° | 7 | 70.000 |
| 6° | 6 | 60.000 |
| 7° | 5 | 50.000 |
| 8° | 0 | 40.000 |
| 9° | 0 | 30.000 |
| 10° | 0 | 20.000 |
| DNF | 0 | 10.000 |

---

## 4. Sistema de Feedback

Definido en `generateFeedback()` en [`simulation.controller.js`](../backend/controllers/simulation.controller.js). Compara la mejor vuelta del stint con el **tiempo óptimo teórico** (setup perfecto +10, neumático blando, piloto agresivo).

```mermaid
flowchart TD
    BT["Calcular diff =<br/>bestTime − optimalTime"] --> CRASH{"¿Caída?"}
    CRASH -- Sí --> MSG1["💬 'He tenido una caída...'"]
    CRASH -- No --> D1{"diff < 0.35s"}
    D1 -- Sí --> MSG2["💬 '¡La moto se siente espectacular!'"]
    D1 -- No --> D2{"diff ≤ 1.1s"}
    D2 -- Sí --> PREC1{"¿Piloto preciso?<br/>(exp + talent > 165)"}
    PREC1 -- Sí --> RATIO1{"Tipo de circuito"}
    RATIO1 -- Velocidad --> MSG3["💬 Ajustar wings/gearbox"]
    RATIO1 -- Técnico --> MSG4["💬 Ajustar suspension/chassis"]
    PREC1 -- No --> MSG5["💬 Feedback genérico<br/>'Podemos arañar décimas...'"]
    D2 -- No --> PREC2{"¿Piloto preciso?"}
    PREC2 -- Sí --> SPECIFIC["Feedback ESPECÍFICO<br/>según setup negativo<br/>y tipo de circuito"]
    PREC2 -- No --> MSG6["💬 'El ritmo es muy lento...'"]

    style MSG2 fill:#2ecc71,color:#fff
    style MSG1 fill:#e74c3c,color:#fff
    style SPECIFIC fill:#3498db,color:#fff
```

> **📝 Nota:** Los pilotos con **(experience + talent) > 165** dan feedback **específico** indicando qué componente del setup ajustar. Los pilotos menos hábiles dan feedback **genérico**.

---

## 5. Simulación Automática (Scheduler)

El [`scheduler.js`](../backend/utils/scheduler.js) ejecuta un chequeo **cada 60 segundos** buscando carreras pendientes:

- **Condición A**: La fecha de carrera ya pasó (`raceDateStr < today`)
- **Condición B**: Es hoy y ya son las 15:00h o más

Si se cumple alguna, ejecuta `runRaceSimulationInternal()` automáticamente.

> **⚠️ Importante:** La fecha de cada carrera se calcula como: `start_date + (order - 1) × 4 + 2 días`. Es decir, los circuitos se separan 4 días entre sí, y la carrera es siempre el **tercer día** del bloque.

---

## 6. Restricciones del Sistema de Setup

El sistema de **setup de la moto** funciona como un juego de **suma cero**:

- **5 componentes**: engine, gearbox, suspension, chassis, wings
- **Rango** de cada offset: **-10 a +10**
- **Restricción**: la suma de los 5 offsets debe ser exactamente **0**

Esto obliga al jugador a tomar decisiones estratégicas: mejorar un componente implica empeorar otro.

---

## 7. Modelo de Datos Involucrado

```mermaid
erDiagram
    teams ||--o{ gp_team_status : "participa en"
    circuits ||--o{ gp_team_status : "en circuito"
    championships ||--o{ gp_team_status : "del campeonato"
    
    gp_team_status ||--o{ gp_lap_history : "genera"
    
    championships ||--o{ race_weekends : "tiene"
    circuits ||--o{ race_weekends : "en"
    
    teams {
        int id PK
        string name
        int pilot_id FK
        int motorcycle_id FK
        int balance
    }
    
    race_weekends {
        int id PK
        string session_type "'practice' | 'qualifying' | 'race'"
        string weather_condition
        int rain_percentage
        int temp_ambient
        int temp_asphalt
        string status
    }
    
    gp_team_status {
        int practice_laps_used
        decimal best_practice_time
        int qualifying_laps_used
        decimal best_qualifying_time
        string race_tire_type
        string race_pilot_focus
        int grid_position
        int finishing_position
        decimal race_time
        int points_earned
        int earnings
    }
    
    gp_lap_history {
        string session_type
        int stint_number
        int lap_number
        decimal lap_time
        decimal tire_wear_pct
        boolean has_crashed
        text feedback_received
    }
```
