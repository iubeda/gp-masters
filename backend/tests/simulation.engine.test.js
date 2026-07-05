// =============================================================================
// simulation.engine.test.js — Tests unitarios del motor de simulación
// Sin dependencias externas: no requiere BD ni servidor.
// Usa globals de Vitest (--globals flag): describe, it, expect están disponibles.
// =============================================================================

const engine = require('../services/simulation.engine');

// ---------------------------------------------------------------------------
// Fixtures reutilizables
// ---------------------------------------------------------------------------

const pilot = {
  talent: 80, consistency: 75, experience: 70,
  fitness: 75, aggressiveness: 60
};

const weakPilot = {
  talent: 20, consistency: 20, experience: 20,
  fitness: 20, aggressiveness: 20
};

const bike = {
  engine: 75, gearbox: 70, suspension: 72, chassis: 68, wings: 65
};

// Circuito equilibrado (ratio entre 1.1 y 1.4)
const balancedCircuit = {
  distance: 4800, curves_right: 7, curves_left: 5,
  curves_rects_ratio: '1.25', asphalt_wear: 50
};

// Circuito de velocidad (ratio < 1.1)
const speedCircuit = {
  distance: 5400, curves_right: 4, curves_left: 3,
  curves_rects_ratio: '0.9', asphalt_wear: 35
};

// Circuito técnico (ratio > 1.4)
const technicalCircuit = {
  distance: 3600, curves_right: 10, curves_left: 8,
  curves_rects_ratio: '1.6', asphalt_wear: 70
};

const dryWeather = {
  weather_condition: 'sunny', rain_percentage: 0,
  temp_ambient: 25, temp_asphalt: 35
};

const rainyWeather = {
  weather_condition: 'rainy', rain_percentage: 60,
  temp_ambient: 16, temp_asphalt: 14
};

const neutralSetup = {
  setup_engine: 0, setup_gearbox: 0, setup_suspension: 0, setup_chassis: 0, setup_wings: 0
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

describe('Constantes del engine', () => {
  it('PRACTICE_MAX_LAPS debe ser 15', () => {
    expect(engine.PRACTICE_MAX_LAPS).toBe(15);
  });
  it('QUALIFYING_MAX_LAPS debe ser 3', () => {
    expect(engine.QUALIFYING_MAX_LAPS).toBe(3);
  });
  it('RACE_LAPS debe ser 12', () => {
    expect(engine.RACE_LAPS).toBe(12);
  });
  it('POINTS_TABLE tiene 7 entradas con primer puesto = 15', () => {
    expect(engine.POINTS_TABLE[0]).toBe(15);
    expect(engine.POINTS_TABLE).toHaveLength(7);
  });
  it('EARNINGS_TABLE tiene 10 entradas con primer puesto = 150000', () => {
    expect(engine.EARNINGS_TABLE[0]).toBe(150000);
    expect(engine.EARNINGS_TABLE).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// generateWeather
// ---------------------------------------------------------------------------

describe('generateWeather()', () => {
  it('retorna un objeto con los 4 campos esperados', () => {
    const w = engine.generateWeather();
    expect(w).toHaveProperty('weather_condition');
    expect(w).toHaveProperty('rain_percentage');
    expect(w).toHaveProperty('temp_ambient');
    expect(w).toHaveProperty('temp_asphalt');
  });

  it('weather_condition siempre es uno de los valores válidos', () => {
    for (let i = 0; i < 50; i++) {
      const w = engine.generateWeather();
      expect(['sunny', 'cloudy', 'rainy']).toContain(w.weather_condition);
    }
  });

  it('temp_ambient siempre está en el rango 12–35 ºC', () => {
    for (let i = 0; i < 50; i++) {
      const w = engine.generateWeather();
      expect(w.temp_ambient).toBeGreaterThanOrEqual(12);
      expect(w.temp_ambient).toBeLessThanOrEqual(35);
    }
  });

  it('condición lluviosa implica rain_percentage > 0', () => {
    // Ejecutar suficientes veces para capturar lluvia
    let foundRainy = false;
    for (let i = 0; i < 200; i++) {
      const w = engine.generateWeather();
      if (w.weather_condition === 'rainy') {
        expect(w.rain_percentage).toBeGreaterThan(0);
        foundRainy = true;
      }
    }
    // Al menos en 200 intentos debe aparecer lluvia (probabilidad teórica 20%)
    expect(foundRainy).toBe(true);
  });

  it('condición sunny o cloudy implica rain_percentage === 0', () => {
    for (let i = 0; i < 100; i++) {
      const w = engine.generateWeather();
      if (w.weather_condition !== 'rainy') {
        expect(w.rain_percentage).toBe(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// calculateBikeFactor
// ---------------------------------------------------------------------------

describe('calculateBikeFactor()', () => {
  const engineHeavySetup = { setup_engine: 10, setup_gearbox: 0, setup_suspension: -5, setup_chassis: -5, setup_wings: 0 };
  const chassisHeavySetup = { setup_engine: -5, setup_gearbox: 0, setup_suspension: 5, setup_chassis: 5, setup_wings: -5 };

  it('circuito de velocidad → mayor factor con setup orientado a motor', () => {
    const engineBias  = engine.calculateBikeFactor(bike, engineHeavySetup, speedCircuit);
    const chassisBias = engine.calculateBikeFactor(bike, chassisHeavySetup, speedCircuit);
    expect(engineBias).toBeGreaterThan(chassisBias);
  });

  it('circuito técnico → mayor factor con setup orientado a chasis/suspensión', () => {
    const engineBias  = engine.calculateBikeFactor(bike, engineHeavySetup, technicalCircuit);
    const chassisBias = engine.calculateBikeFactor(bike, chassisHeavySetup, technicalCircuit);
    expect(chassisBias).toBeGreaterThan(engineBias);
  });

  it('retorna un número positivo para stats y setups razonables', () => {
    const factor = engine.calculateBikeFactor(bike, neutralSetup, balancedCircuit);
    expect(factor).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// simulateLap
// ---------------------------------------------------------------------------

describe('simulateLap()', () => {
  it('retorna los campos esperados', () => {
    const result = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, 0, 1, 12);
    expect(result).toHaveProperty('lap_time');
    expect(result).toHaveProperty('tire_wear_pct');
    expect(result).toHaveProperty('has_crashed');
  });

  it('tire_wear_pct siempre está en [0, 100]', () => {
    let wear = 0;
    for (let lap = 1; lap <= 12; lap++) {
      const r = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, wear, lap, 12);
      wear = r.tire_wear_pct;
      expect(r.tire_wear_pct).toBeGreaterThanOrEqual(0);
      expect(r.tire_wear_pct).toBeLessThanOrEqual(100);
    }
  });

  it('si has_crashed === true, lap_time debe ser null', () => {
    // Ejecutar muchas veces para capturar un crash (slicks en lluvia: 35% crash chance)
    for (let i = 0; i < 100; i++) {
      const r = engine.simulateLap(pilot, bike, balancedCircuit, rainyWeather, 'soft', 'aggressive', neutralSetup, 0, 1, 12);
      if (r.has_crashed) {
        expect(r.lap_time).toBeNull();
        break;
      }
    }
  });

  it('si has_crashed === false, lap_time debe ser un número positivo', () => {
    // Con neumáticos de lluvia en lluvia (bajo riesgo) → alta probabilidad de completar
    const result = engine.simulateLap(pilot, bike, balancedCircuit, rainyWeather, 'rain', 'conservative', neutralSetup, 0, 1, 12);
    if (!result.has_crashed) {
      expect(typeof result.lap_time).toBe('number');
      expect(result.lap_time).toBeGreaterThan(0);
    }
  });

  it('neumático rain en pista seca → lap_time mayor que medium (sin caída)', () => {
    // Promediamos sobre múltiples intentos para absorber variabilidad
    let sumRain = 0, countRain = 0;
    let sumMedium = 0, countMedium = 0;

    for (let i = 0; i < 30; i++) {
      const rRain = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'rain', 'balanced', neutralSetup, 0, 1, 12);
      const rMed  = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, 0, 1, 12);
      if (!rRain.has_crashed) { sumRain   += rRain.lap_time; countRain++; }
      if (!rMed.has_crashed)  { sumMedium += rMed.lap_time;  countMedium++; }
    }

    if (countRain > 0 && countMedium > 0) {
      expect(sumRain / countRain).toBeGreaterThan(sumMedium / countMedium);
    }
  });

  it('piloto agresivo genera más desgaste que piloto conservador', () => {
    const aggressive  = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'aggressive',    neutralSetup, 0, 1, 12);
    const conservative = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'conservative', neutralSetup, 0, 1, 12);
    // El desgaste agresivo debe ser mayor en promedio; comparamos directamente
    expect(aggressive.tire_wear_pct).toBeGreaterThan(conservative.tire_wear_pct);
  });

  it('piloto con alto talent es más rápido que piloto con bajo talent (promedio)', () => {
    let sumHigh = 0, countHigh = 0;
    let sumLow  = 0, countLow  = 0;

    for (let i = 0; i < 30; i++) {
      const rHigh = engine.simulateLap(pilot,      bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, 0, 1, 12);
      const rLow  = engine.simulateLap(weakPilot,  bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, 0, 1, 12);
      if (!rHigh.has_crashed) { sumHigh += rHigh.lap_time; countHigh++; }
      if (!rLow.has_crashed)  { sumLow  += rLow.lap_time;  countLow++; }
    }

    if (countHigh > 0 && countLow > 0) {
      expect(sumHigh / countHigh).toBeLessThan(sumLow / countLow);
    }
  });
});

// ---------------------------------------------------------------------------
// getOptimalTime
// ---------------------------------------------------------------------------

describe('getOptimalTime()', () => {
  it('retorna un número positivo', () => {
    const optimal = engine.getOptimalTime(pilot, bike, balancedCircuit);
    expect(typeof optimal).toBe('number');
    expect(optimal).toBeGreaterThan(0);
  });

  it('es menor que el tiempo promedio de simulateLap con setup neutro', () => {
    const optimal = engine.getOptimalTime(pilot, bike, balancedCircuit);
    let sum = 0, count = 0;
    for (let i = 0; i < 30; i++) {
      const r = engine.simulateLap(pilot, bike, balancedCircuit, dryWeather, 'medium', 'balanced', neutralSetup, 0, 1, 12);
      if (!r.has_crashed) { sum += r.lap_time; count++; }
    }
    if (count > 0) {
      expect(optimal).toBeLessThan(sum / count);
    }
  });
});

// ---------------------------------------------------------------------------
// generateFeedback
// ---------------------------------------------------------------------------

describe('generateFeedback()', () => {
  const optimal = engine.getOptimalTime(pilot, bike, balancedCircuit);

  it('retorna siempre un string no vacío', () => {
    const fb = engine.generateFeedback(optimal + 0.5, optimal, pilot, balancedCircuit, neutralSetup);
    expect(typeof fb).toBe('string');
    expect(fb.length).toBeGreaterThan(0);
  });

  it('si bestTime === null → mensaje de caída', () => {
    const fb = engine.generateFeedback(null, optimal, pilot, balancedCircuit, neutralSetup);
    expect(fb.toLowerCase()).toContain('caída');
  });

  it('si diff < 0.35 → mensaje de setup perfecto', () => {
    const fb = engine.generateFeedback(optimal + 0.1, optimal, pilot, balancedCircuit, neutralSetup);
    expect(fb).toContain('espectacular');
  });

  it('si diff > 1.1 y piloto preciso en circuito de velocidad → sugerencia de setup específica', () => {
    const precisePilot = { ...pilot, experience: 90, talent: 80 }; // sum > 165
    const negEngineSetup = { ...neutralSetup, setup_engine: -5, setup_gearbox: 5 };
    const fb = engine.generateFeedback(optimal + 2.0, optimal, precisePilot, speedCircuit, negEngineSetup);
    expect(fb.toLowerCase()).toContain('motor');
  });

  it('si diff > 1.1 y piloto impreciso → mensaje genérico', () => {
    const fb = engine.generateFeedback(optimal + 2.0, optimal, weakPilot, balancedCircuit, neutralSetup);
    expect(fb).toContain('incontrolable');
  });
});
