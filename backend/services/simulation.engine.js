// =============================================================================
// simulation.engine.js — Motor de Simulación Puro
// Sin dependencias externas (sin BD, sin modelos). Testeable de forma unitaria.
// =============================================================================

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const PRACTICE_MAX_LAPS = 15;
const QUALIFYING_MAX_LAPS = 3;
const RACE_LAPS = 12;

// Puntos por posición (posición 1 a 7; el resto = 0)
const POINTS_TABLE = [15, 12, 10, 8, 7, 6, 5];

// Premio económico por posición (posición 1 a 10; el resto = 10000 mínimo DNF)
const EARNINGS_TABLE = [150000, 120000, 100000, 80000, 70000, 60000, 50000, 40000, 30000, 20000];

// ---------------------------------------------------------------------------
// generateWeather — Generación de climatología aleatoria para un fin de semana
// ---------------------------------------------------------------------------
/**
 * Genera un objeto de condiciones climáticas aleatorias para un GP.
 * @returns {{ weather_condition: string, rain_percentage: number, temp_ambient: number, temp_asphalt: number }}
 */
const generateWeather = () => {
  const randWeather = Math.random();

  let weatherCondition = 'sunny';
  let rainPercentage = 0;
  let tempAmbient = Math.floor(Math.random() * (35 - 18 + 1)) + 18; // 18–35 ºC
  let tempAsphalt = tempAmbient + 10;

  if (randWeather < 0.20) {
    // 20% lluvia
    weatherCondition = 'rainy';
    rainPercentage = Math.floor(Math.random() * (100 - 30 + 1)) + 30; // 30–100%
    tempAmbient = Math.floor(Math.random() * (22 - 12 + 1)) + 12; // 12–22 ºC
    tempAsphalt = tempAmbient - 2;
  } else if (randWeather < 0.50) {
    // 30% nublado
    weatherCondition = 'cloudy';
    tempAsphalt = tempAmbient + 2;
  }

  return { weather_condition: weatherCondition, rain_percentage: rainPercentage, temp_ambient: tempAmbient, temp_asphalt: tempAsphalt };
};

// ---------------------------------------------------------------------------
// calculateBikeFactor — Factor de rendimiento de la moto según el circuito
// ---------------------------------------------------------------------------
/**
 * Calcula el factor de rendimiento de la moto ponderado según el tipo de circuito.
 * @param {{ engine, gearbox, suspension, chassis, wings }} bike - Stats base de la moto
 * @param {{ setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings }} setup - Offsets de setup
 * @param {{ curves_rects_ratio }} circuit - Datos del circuito
 * @returns {number}
 */
const calculateBikeFactor = (bike, setup, circuit) => {
  const engineEff     = bike.engine     + (setup.setup_engine     || 0);
  const gearboxEff    = bike.gearbox    + (setup.setup_gearbox    || 0);
  const suspensionEff = bike.suspension + (setup.setup_suspension || 0);
  const chassisEff    = bike.chassis    + (setup.setup_chassis    || 0);
  const wingsEff      = bike.wings      + (setup.setup_wings      || 0);

  const ratio = parseFloat(circuit.curves_rects_ratio);

  if (ratio < 1.1) {
    // Circuito de velocidad
    return (engineEff * 0.45) + (gearboxEff * 0.25) + (wingsEff * 0.2) + (chassisEff * 0.1);
  } else if (ratio > 1.4) {
    // Circuito técnico
    return (chassisEff * 0.45) + (suspensionEff * 0.25) + (gearboxEff * 0.2) + (engineEff * 0.1);
  } else {
    // Circuito equilibrado
    return (engineEff + gearboxEff + suspensionEff + chassisEff + wingsEff) / 5;
  }
};

// ---------------------------------------------------------------------------
// simulateLap — Algoritmo matemático de una vuelta individual
// ---------------------------------------------------------------------------
/**
 * Simula el resultado de una vuelta individual.
 * @returns {{ lap_time: number|null, tire_wear_pct: number, has_crashed: boolean }}
 */
const simulateLap = (pilot, bike, circuit, weather, tireType, pilotFocus, setup, accumulatedWear, lapNum, totalLaps) => {
  // 1. Tiempo base del circuito (segundos)
  const baseLapTime = (circuit.distance * 0.0215) + (circuit.curves_right + circuit.curves_left) * 0.15;

  // 2. Rendimiento combinado piloto + moto
  const bikeFactor   = calculateBikeFactor(bike, setup, circuit);
  const pilotFactor  = (pilot.talent * 0.4) + (pilot.consistency * 0.2) + (pilot.experience * 0.2) + (pilot.fitness * 0.2);
  const speedReduction = ((pilotFactor * 0.5) + (bikeFactor * 0.5)) * 0.05;

  // 3. Climatología y neumáticos
  let tirePerformanceDelta = 0;
  let wearFactor = 1.0;
  let crashChance = 0.0015; // Probabilidad base: 0.15% por vuelta

  const isRain = weather.weather_condition === 'rainy' && weather.rain_percentage > 20;

  if (isRain) {
    if (tireType === 'rain') {
      tirePerformanceDelta = 4.0;  // Más lento por agua, pero estable
      wearFactor = 0.7;
    } else {
      // Slicks en agua → peligro extremo
      tirePerformanceDelta = 13.0;
      crashChance += 0.35;
      wearFactor = 0.5;
    }
  } else {
    if (tireType === 'rain') {
      tirePerformanceDelta = 5.5;  // Muy lento
      wearFactor = 3.5;            // Desgaste brutal
    } else if (tireType === 'soft') {
      tirePerformanceDelta = -0.35; // Rápido
      wearFactor = 1.6;
    } else if (tireType === 'medium') {
      tirePerformanceDelta = 0.0;
      wearFactor = 1.0;
    } else if (tireType === 'hard') {
      tirePerformanceDelta = 0.3;  // Lento
      wearFactor = 0.65;
    }
  }

  // Temperatura del asfalto
  if (weather.temp_asphalt > 40 && tireType === 'soft') {
    wearFactor *= 1.35; // Asfalto caliente derrite el blando
  }
  if (weather.temp_asphalt < 20 && !isRain) {
    crashChance += 0.01; // Gomas frías
  }

  // 4. Enfoque del piloto
  let focusPerformanceDelta = 0;
  if (pilotFocus === 'aggressive') {
    focusPerformanceDelta = -0.25;
    wearFactor *= 1.45;
    crashChance *= 2.5;
  } else if (pilotFocus === 'conservative') {
    focusPerformanceDelta = 0.25;
    wearFactor *= 0.6;
    crashChance *= 0.2;
  }

  // 5. Desgaste de neumáticos
  let baseTireWear = 2.5;
  if (tireType === 'soft')  baseTireWear = 3.8;
  else if (tireType === 'hard') baseTireWear = 1.6;
  else if (tireType === 'rain') baseTireWear = 2.2;

  const currentLapWear = baseTireWear
    * (1 + (circuit.asphalt_wear / 150))
    * wearFactor
    * (1 + (pilot.aggressiveness - pilot.experience / 2) / 200);
  const newTireWear = Math.min(100.0, accumulatedWear + currentLapWear);

  // 6. Penalización por desgaste
  let tireHealthPenalty = 0;
  const tireHealth = 100.0 - newTireWear;
  if (tireHealth < 60.0) {
    tireHealthPenalty = (60.0 - tireHealth) * 0.05; // Hasta 3 segundos
  }

  // 7. Cansancio físico
  let fatiguePenalty = 0;
  const fatigueStartLap = totalLaps * (0.4 + (pilot.fitness / 200));
  if (lapNum > fatigueStartLap) {
    fatiguePenalty = (lapNum - fatigueStartLap) * 0.04;
    if (weather.temp_ambient > 32) {
      fatiguePenalty *= 1.35;
    }
  }

  // 8. Chequeo de caída
  if (tireHealth < 30.0) {
    crashChance += 0.025;
  }
  const hasCrashed = Math.random() < crashChance;

  const noise = Math.random() * 0.3;
  const finalLapTime = baseLapTime - speedReduction + tirePerformanceDelta + focusPerformanceDelta + tireHealthPenalty + fatiguePenalty + noise;

  return {
    lap_time:      hasCrashed ? null : parseFloat(finalLapTime.toFixed(3)),
    tire_wear_pct: parseFloat(newTireWear.toFixed(2)),
    has_crashed:   hasCrashed
  };
};

// ---------------------------------------------------------------------------
// getOptimalTime — Tiempo teórico óptimo absoluto (para feedback)
// ---------------------------------------------------------------------------
/**
 * Calcula el tiempo de vuelta teórico con setup perfecto (+10 en todos los stats).
 * @returns {number}
 */
const getOptimalTime = (pilot, bike, circuit) => {
  const perfectSetup = {
    setup_engine: 10, setup_gearbox: 10, setup_suspension: 10, setup_chassis: 10, setup_wings: 10
  };
  const baseLapTime  = (circuit.distance * 0.0215) + (circuit.curves_right + circuit.curves_left) * 0.15;
  const bikeFactor   = calculateBikeFactor(bike, perfectSetup, circuit);
  const pilotFactor  = (pilot.talent * 0.4) + (pilot.consistency * 0.2) + (pilot.experience * 0.2) + (pilot.fitness * 0.2);
  const speedReduction = ((pilotFactor * 0.5) + (bikeFactor * 0.5)) * 0.05;

  // Restamos neumático blando (-0.35) y piloto agresivo (-0.25) para el tiempo ideal
  return baseLapTime - speedReduction - 0.35 - 0.25;
};

// ---------------------------------------------------------------------------
// generateFeedback — Feedback dinámico y coherente para el piloto
// ---------------------------------------------------------------------------
/**
 * Genera un mensaje de feedback basado en el rendimiento del stint.
 * @returns {string}
 */
const generateFeedback = (bestTime, optimalTime, pilot, circuit, setup) => {
  if (bestTime === null) {
    return 'He tenido una caída. La moto se siente muy inestable o hemos empujado de más en condiciones difíciles.';
  }

  const diff = bestTime - optimalTime;
  const ratio = parseFloat(circuit.curves_rects_ratio);
  const isPrecise = (pilot.experience + pilot.talent) > 165;

  if (diff < 0.35) {
    return '¡La moto se siente espectacular! Hay un grip increíble en curva y la frenada es muy estable. No toquemos nada, estamos listos para buscar el mejor tiempo.';
  }

  if (diff <= 1.1) {
    if (isPrecise) {
      if (ratio < 1.1) {
        return 'El ritmo es decente, pero perdemos algo de velocidad punta en las rectas. Un pequeño ajuste en los alerones (wings) o relación de marchas (gearbox) nos daría esa décima extra.';
      }
      return 'Pasamos bien por curva, pero nos cuesta mantener la trazada en las zonas viradas. Ajustar un poco la suspensión (suspension) o el chasis (chassis) podría ayudar.';
    }
    return 'La moto va bien en general, pero creo que podemos arañar algunas décimas si afinamos el setup.';
  }

  // diff > 1.1 — Ritmo muy lento
  if (!isPrecise) {
    return 'El ritmo es muy lento y la moto se siente incontrolable. Falta tracción en las aceleraciones y no gira bien.';
  }

  if (ratio < 1.1) {
    if (parseInt(setup.setup_engine) < 0) {
      return 'Nos falta velocidad punta en las rectas. El motor se siente capado. Tenemos que ajustar el setup de motor (engine) hacia valores positivos.';
    }
    if (parseInt(setup.setup_wings) < 0) {
      return 'La moto tiende a levantarse en las salidas de curva y falta estabilidad a alta velocidad. Necesitamos aumentar la carga aerodinámica (wings).';
    }
    return 'La caja de cambios no está bien escalonada para esta pista de velocidad. Sugiero alargar el setup de marchas (gearbox).';
  }

  if (ratio > 1.4) {
    if (parseInt(setup.setup_chassis) < 0) {
      return 'La moto es pesadísima en los cambios de dirección enlazados. Nos cuesta meterla en curva. Hay que ajustar el setup de chasis (chassis) hacia valores positivos.';
    }
    if (parseInt(setup.setup_suspension) < 0) {
      return 'La moto rebota demasiado en los baches y perdemos tracción al inclinar. Necesitamos ajustar la suspensión (suspension).';
    }
    return 'Las marchas se quedan largas y nos falta aceleración al salir de las curvas lentas. Ajustar la caja de cambios (gearbox) para marchas más cortas.';
  }

  return 'La moto se siente descompensada en este trazado mixto. Necesitamos un setup más equilibrado en todas las áreas.';
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  // Constantes
  PRACTICE_MAX_LAPS,
  QUALIFYING_MAX_LAPS,
  RACE_LAPS,
  POINTS_TABLE,
  EARNINGS_TABLE,
  // Funciones
  generateWeather,
  calculateBikeFactor,
  simulateLap,
  getOptimalTime,
  generateFeedback,
};
