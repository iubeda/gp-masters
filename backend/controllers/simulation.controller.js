const simulationModel = require('../models/simulation.model');
const championshipModel = require('../models/championship.model');
const teamModel = require('../models/team.model');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');

// Helper para validar restricciones horarias
const validateSessionTime = async (championshipId, circuitId, sessionType, bypassTime = false) => {
  if (bypassTime) return;

  const championship = await championshipModel.findById(championshipId);
  if (!championship) {
    throw new Error('Championship not found.');
  }

  const calendar = await championshipModel.findCalendarCircuits(championshipId, championship.start_date);
  const circuitSession = calendar.find(c => c.id === parseInt(circuitId));
  if (!circuitSession) {
    throw new Error('Circuit not found in the championship calendar.');
  }

  const now = new Date();
  
  // Convertimos a hora local del servidor (España/Madrid o local)
  const pad = (n) => n.toString().padStart(2, '0');
  const localDateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const currentHour = now.getHours();

  let targetDateStr = '';
  if (sessionType === 'practice') {
    targetDateStr = circuitSession.practice_date;
  } else if (sessionType === 'qualifying') {
    targetDateStr = circuitSession.qualifying_date;
  } else if (sessionType === 'race') {
    targetDateStr = circuitSession.race_date;
  }

  if (localDateStr !== targetDateStr) {
    throw new Error(`Esta sesión está programada para la fecha: ${targetDateStr}. Hoy es: ${localDateStr}.`);
  }

  if (sessionType === 'practice' || sessionType === 'qualifying') {
    if (currentHour < 12 || currentHour >= 15) {
      throw new Error(`La sesión de ${sessionType === 'practice' ? 'Entrenamientos' : 'Clasificación'} sólo está abierta de 12:00h a 15:00h.`);
    }
  } else if (sessionType === 'race') {
    if (currentHour < 14) {
      throw new Error(`La Carrera sólo se puede simular a partir de las 14:00h.`);
    }
  }
};

// Algoritmo matemático para simular una vuelta individual
const simulateLap = (pilot, bike, circuit, weather, tireType, pilotFocus, setup, accumulatedWear, lapNum, totalLaps) => {
  // 1. Tiempo base del circuito (segundos)
  const baseLapTime = (circuit.distance * 0.0215) + (circuit.curves_right + circuit.curves_left) * 0.15;
  
  // 2. Offsets de setup
  const engineEff = bike.engine + setup.setup_engine;
  const gearboxEff = bike.gearbox + setup.setup_gearbox;
  const suspensionEff = bike.suspension + setup.setup_suspension;
  const chassisEff = bike.chassis + setup.setup_chassis;
  const wingsEff = bike.wings + setup.setup_wings;

  // 3. Rendimiento de la moto según el circuito
  const ratio = parseFloat(circuit.curves_rects_ratio);
  let bikeFactor = 0;
  if (ratio < 1.1) { // Circuito de velocidad
    bikeFactor = (engineEff * 0.45) + (gearboxEff * 0.25) + (wingsEff * 0.2) + (chassisEff * 0.1);
  } else if (ratio > 1.4) { // Circuito técnico
    bikeFactor = (chassisEff * 0.45) + (suspensionEff * 0.25) + (gearboxEff * 0.2) + (engineEff * 0.1);
  } else { // Circuito equilibrado
    bikeFactor = (engineEff + gearboxEff + suspensionEff + chassisEff + wingsEff) / 5;
  }

  // 4. Rendimiento del piloto
  const pilotFactor = (pilot.talent * 0.4) + (pilot.consistency * 0.2) + (pilot.experience * 0.2) + (pilot.fitness * 0.2);

  // Reducción de tiempo por habilidad y moto (un setup perfecto reduce hasta 5 segundos)
  const speedReduction = ((pilotFactor * 0.5) + (bikeFactor * 0.5)) * 0.05;

  // 5. Climatología y neumáticos
  let tirePerformanceDelta = 0;
  let wearFactor = 1.0;
  let crashChance = 0.0015; // Probabilidad base: 0.15% por vuelta

  const isRain = weather.weather_condition === 'rainy' && weather.rain_percentage > 20;

  if (isRain) {
    if (tireType === 'rain') {
      tirePerformanceDelta = 4.0; // Más lento por agua, pero estable
      wearFactor = 0.7;
    } else {
      // Slicks en agua (peligro extremo)
      tirePerformanceDelta = 13.0;
      crashChance += 0.35;
      wearFactor = 0.5;
    }
  } else {
    // Trazado Seco
    if (tireType === 'rain') {
      tirePerformanceDelta = 5.5; // Muy lento
      wearFactor = 3.5; // Desgaste brutal
    } else if (tireType === 'soft') {
      tirePerformanceDelta = -0.35; // Rápido
      wearFactor = 1.6;
    } else if (tireType === 'medium') {
      tirePerformanceDelta = 0.0;
      wearFactor = 1.0;
    } else if (tireType === 'hard') {
      tirePerformanceDelta = 0.3; // Lento
      wearFactor = 0.65;
    }
  }

  // Climatología - Temperatura del asfalto
  if (weather.temp_asphalt > 40 && tireType === 'soft') {
    wearFactor *= 1.35; // Asfalto caliente derrite el blando
  }
  if (weather.temp_asphalt < 20 && !isRain) {
    crashChance += 0.01; // Gomas frías
  }

  // Enfoque del piloto
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

  // Cálculo del desgaste en esta vuelta
  let baseTireWear = 2.5;
  if (tireType === 'soft') baseTireWear = 3.8;
  else if (tireType === 'hard') baseTireWear = 1.6;
  else if (tireType === 'rain') baseTireWear = 2.2;

  const currentLapWear = baseTireWear * (1 + (circuit.asphalt_wear / 150)) * wearFactor * (1 + (pilot.aggressiveness - pilot.experience / 2) / 200);
  const newTireWear = Math.min(100.0, accumulatedWear + currentLapWear);

  // Penalización de tiempo por desgaste
  let tireHealthPenalty = 0;
  const tireHealth = 100.0 - newTireWear;
  if (tireHealth < 60.0) {
    tireHealthPenalty = (60.0 - tireHealth) * 0.05; // Hasta 3 segundos
  }

  // Cansancio físico
  let fatiguePenalty = 0;
  const fatigueStartLap = totalLaps * (0.4 + (pilot.fitness / 200));
  if (lapNum > fatigueStartLap) {
    fatiguePenalty = (lapNum - fatigueStartLap) * 0.04;
    if (weather.temp_ambient > 32) {
      fatiguePenalty *= 1.35;
    }
  }

  // Chequeo de caída
  let hasCrashed = false;
  if (tireHealth < 30.0) {
    crashChance += 0.025; // Sin gomas patinas
  }
  if (Math.random() < crashChance) {
    hasCrashed = true;
  }

  const noise = Math.random() * 0.3; // Variabilidad
  const finalLapTime = baseLapTime - speedReduction + tirePerformanceDelta + focusPerformanceDelta + tireHealthPenalty + fatiguePenalty + noise;

  return {
    lap_time: hasCrashed ? null : parseFloat(finalLapTime.toFixed(3)),
    tire_wear_pct: parseFloat(newTireWear.toFixed(2)),
    has_crashed: hasCrashed
  };
};

// Calcular el tiempo teórico óptimo absoluto (para feedback)
const getOptimalTime = (pilot, bike, circuit) => {
  const baseLapTime = (circuit.distance * 0.0215) + (circuit.curves_right + circuit.curves_left) * 0.15;
  
  // Suponemos setup perfecto (+10 en stats clave de la moto)
  const engineEff = bike.engine + 10;
  const gearboxEff = bike.gearbox + 10;
  const suspensionEff = bike.suspension + 10;
  const chassisEff = bike.chassis + 10;
  const wingsEff = bike.wings + 10;

  const ratio = parseFloat(circuit.curves_rects_ratio);
  let bikeFactor = 0;
  if (ratio < 1.1) {
    bikeFactor = (engineEff * 0.45) + (gearboxEff * 0.25) + (wingsEff * 0.2) + (chassisEff * 0.1);
  } else if (ratio > 1.4) {
    bikeFactor = (chassisEff * 0.45) + (suspensionEff * 0.25) + (gearboxEff * 0.2) + (engineEff * 0.1);
  } else {
    bikeFactor = (engineEff + gearboxEff + suspensionEff + chassisEff + wingsEff) / 5;
  }

  const pilotFactor = (pilot.talent * 0.4) + (pilot.consistency * 0.2) + (pilot.experience * 0.2) + (pilot.fitness * 0.2);
  const speedReduction = ((pilotFactor * 0.5) + (bikeFactor * 0.5)) * 0.05;

  return baseLapTime - speedReduction - 0.35 - 0.25; // Restando neumático blando y piloto agresivo
};

// Generar el feedback dinámico y coherente
const generateFeedback = (bestTime, optimalTime, pilot, circuit, setup) => {
  if (bestTime === null) {
    return "He tenido una caída. La moto se siente muy inestable o hemos empujado de más en condiciones difíciles.";
  }

  const diff = bestTime - optimalTime;
  const ratio = parseFloat(circuit.curves_rects_ratio);
  const isPrecise = (pilot.experience + pilot.talent) > 165;

  if (diff < 0.35) {
    return "¡La moto se siente espectacular! Hay un grip increíble en curva y la frenada es muy estable. No toquemos nada, estamos listos para buscar el mejor tiempo.";
  } else if (diff <= 1.1) {
    if (isPrecise) {
      if (ratio < 1.1) {
        return "El ritmo es decente, pero perdemos algo de velocidad punta en las rectas. Un pequeño ajuste en los alerones (wings) o relación de marchas (gearbox) nos daría esa décima extra.";
      } else {
        return "Pasamos bien por curva, pero nos cuesta mantener la trazada en las zonas viradas. Ajustar un poco la suspensión (suspension) o el chasis (chassis) podría ayudar.";
      }
    } else {
      return "La moto va bien en general, pero creo que podemos arañar algunas décimas si afinamos el setup.";
    }
  } else {
    if (isPrecise) {
      if (ratio < 1.1) {
        if (parseInt(setup.setup_engine) < 0) {
          return "Nos falta velocidad punta en las rectas. El motor se siente capado. Tenemos que ajustar el setup de motor (engine) hacia valores positivos.";
        } else if (parseInt(setup.setup_wings) < 0) {
          return "La moto tiende a levantarse en las salidas de curva y falta estabilidad a alta velocidad. Necesitamos aumentar la carga aerodinámica (wings).";
        } else {
          return "La caja de cambios no está bien escalonada para esta pista de velocidad. Sugiero alargar el setup de marchas (gearbox).";
        }
      } else if (ratio > 1.4) {
        if (parseInt(setup.setup_chassis) < 0) {
          return "La moto es pesadísima en los cambios de dirección enlazados. Nos cuesta meterla en curva. Hay que ajustar el setup de chasis (chassis) hacia valores positivos.";
        } else if (parseInt(setup.setup_suspension) < 0) {
          return "La moto rebota demasiado en los baches y perdemos tracción al inclinar. Necesitamos ajustar la suspensión (suspension).";
        } else {
          return "Las marchas se quedan largas y nos falta aceleración al salir de las curvas lentas. Ajustar la caja de cambios (gearbox) para marchas más cortas.";
        }
      } else {
        return "La moto se siente descompensada en este trazado mixto. Necesitamos un setup más equilibrado en todas las áreas.";
      }
    } else {
      return "El ritmo es muy lento y la moto se siente incontrolable. Falta tracción en las aceleraciones y no gira bien.";
    }
  }
};

// Endpoints Controllers

// 1. Obtener estado general del fin de semana para el circuito
const getGPStatus = asyncHandler(async (req, res) => {
  const { championshipId, circuitId } = req.params;
  const userEmail = req.user.email;

  // Buscar equipo del usuario para saber su teamId
  const teamRes = await db.query(
    'SELECT id FROM teams WHERE user_email = $1 AND championship_id = $2',
    [userEmail, championshipId]
  );

  if (teamRes.rows.length === 0) {
    return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
  }
  const teamId = teamRes.rows[0].id;

  // Obtener/Crear clima para cada sesión de forma independiente
  const practiceWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'practice');
  const qualifyingWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'qualifying');
  const raceWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'race');

  // Obtener/Crear estado del equipo en este GP
  const teamStatus = await simulationModel.getOrCreateTeamStatus(championshipId, circuitId, teamId);

  // Historial de vueltas para este equipo
  const practiceLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'practice');
  const qualifyingLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'qualifying');
  const raceLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'race');

  // Clasificación de todos los equipos del GP
  const gridStatus = await simulationModel.getGPStatusForAllTeams(championshipId, circuitId);

  res.json({
    weather: {
      practice: practiceWeather,
      qualifying: qualifyingWeather,
      race: raceWeather
    },
    teamStatus,
    practiceLaps,
    qualifyingLaps,
    raceLaps,
    gridStatus,
    teamId
  });
});

// 2. Simular Tanda de Entrenamientos Libres (Máx 15 vueltas total)
const runPracticeStint = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, laps, tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings, bypassTime } = req.body;
  const userEmail = req.user.email;

  // Validaciones de Setup
  const sum = parseInt(setup_engine) + parseInt(setup_gearbox) + parseInt(setup_suspension) + parseInt(setup_chassis) + parseInt(setup_wings);
  if (sum !== 0) {
    return res.status(400).json({ error: 'La suma de los offsets del setup debe ser exactamente 0.' });
  }
  const offsets = [setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings];
  if (offsets.some(v => v < -10 || v > 10)) {
    return res.status(400).json({ error: 'Los valores de setup deben estar entre -10 y +10.' });
  }

  // Horario de sesión
  try {
    await validateSessionTime(championship_id, circuit_id, 'practice', bypassTime === true || bypassTime === 'true');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Obtener equipo del usuario
  const teams = await simulationModel.getGPTeamsDetails(championship_id);
  const team = teams.find(t => t.user_email.toLowerCase() === userEmail.toLowerCase());
  if (!team) {
    return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
  }

  // Chequeo de límites de vueltas
  const teamStatus = await simulationModel.getOrCreateTeamStatus(championship_id, circuit_id, team.team_id);
  const remainingLaps = 15 - teamStatus.practice_laps_used;
  if (remainingLaps <= 0) {
    return res.status(400).json({ error: 'Ya has agotado tus 15 vueltas de entrenamientos libres.' });
  }
  const lapsToSimulate = Math.min(laps, remainingLaps);

  // Detalles del circuito y clima de la sesión de entrenamientos
  const circuitRes = await db.query('SELECT * FROM circuits WHERE id = $1', [circuit_id]);
  const circuit = circuitRes.rows[0];
  const weather = await simulationModel.getOrCreateWeekend(championship_id, circuit_id, 'practice');

  // Obtener número del stint actual
  const stintRes = await db.query(
    'SELECT COALESCE(MAX(stint_number), 0) + 1 AS next_stint FROM gp_lap_history WHERE team_id = $1 AND circuit_id = $2 AND session_type = $3',
    [team.team_id, circuit_id, 'practice']
  );
  const stintNumber = stintRes.rows[0].next_stint;

  let accumulatedWear = 0.0;
  let bestTime = null;
  const simulatedLaps = [];

  const pilot = {
    talent: team.talent,
    consistency: team.consistency,
    experience: team.experience,
    fitness: team.fitness,
    aggressiveness: team.aggressiveness
  };

  const bike = {
    engine: team.engine,
    gearbox: team.gearbox,
    suspension: team.suspension,
    chassis: team.chassis,
    wings: team.wings
  };

  const setup = {
    setup_engine,
    setup_gearbox,
    setup_suspension,
    setup_chassis,
    setup_wings
  };

  // Simular vuelta a vuelta
  for (let i = 1; i <= lapsToSimulate; i++) {
    const lapNum = teamStatus.practice_laps_used + i;
    const result = simulateLap(pilot, bike, circuit, weather, tire_type, pilot_focus, setup, accumulatedWear, lapNum, 15);
    accumulatedWear = result.tire_wear_pct;

    if (result.has_crashed) {
      simulatedLaps.push({
        lap_number: lapNum,
        lap_time: null,
        tire_wear_pct: result.tire_wear_pct,
        has_crashed: true
      });
      // Guardar caída en historial y detener stint
      await simulationModel.insertLapHistory({
        championship_id,
        circuit_id,
        team_id: team.team_id,
        session_type: 'practice',
        stint_number: stintNumber,
        lap_number: lapNum,
        lap_time: null,
        tire_wear_pct: result.tire_wear_pct,
        has_crashed: true,
        feedback_received: "Caída en pista.",
        tire_type,
        pilot_focus,
        ...setup
      });
      break;
    }

    simulatedLaps.push({
      lap_number: lapNum,
      lap_time: result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: false
    });

    if (bestTime === null || result.lap_time < bestTime) {
      bestTime = result.lap_time;
    }

    // Insertar en historial
    await simulationModel.insertLapHistory({
      championship_id,
      circuit_id,
      team_id: team.team_id,
      session_type: 'practice',
      stint_number: stintNumber,
      lap_number: lapNum,
      lap_time: result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: false,
      feedback_received: null,
      tire_type,
      pilot_focus,
      ...setup
    });
  }

  // Generar feedback en base a la mejor vuelta de este stint
  const optimalTime = getOptimalTime(pilot, bike, circuit);
  const feedback = generateFeedback(bestTime, optimalTime, pilot, circuit, setup);

  // Actualizar el feedback en la base de datos para la mejor vuelta o el stint
  await db.query(
    'UPDATE gp_lap_history SET feedback_received = $1 WHERE team_id = $2 AND circuit_id = $3 AND stint_number = $4 AND session_type = $5',
    [feedback, team.team_id, circuit_id, stintNumber, 'practice']
  );

  // Actualizar estado general
  const updatedStatus = await simulationModel.updatePracticeStatus(championship_id, circuit_id, team.team_id, lapsToSimulate, bestTime);

  res.json({
    stint_number: stintNumber,
    simulatedLaps,
    bestTime,
    feedback,
    updatedStatus
  });
});

// 3. Simular Tanda de Clasificación (Máx 3 vueltas total)
const runQualifyingStint = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, laps, tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings, bypassTime } = req.body;
  const userEmail = req.user.email;

  // Validaciones de Setup
  const sum = parseInt(setup_engine) + parseInt(setup_gearbox) + parseInt(setup_suspension) + parseInt(setup_chassis) + parseInt(setup_wings);
  if (sum !== 0) {
    return res.status(400).json({ error: 'La suma de los offsets del setup debe ser exactamente 0.' });
  }
  const offsets = [setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings];
  if (offsets.some(v => v < -10 || v > 10)) {
    return res.status(400).json({ error: 'Los valores de setup deben estar entre -10 y +10.' });
  }

  // Horario de sesión
  try {
    await validateSessionTime(championship_id, circuit_id, 'qualifying', bypassTime === true || bypassTime === 'true');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Obtener equipo del usuario
  const teams = await simulationModel.getGPTeamsDetails(championship_id);
  const team = teams.find(t => t.user_email.toLowerCase() === userEmail.toLowerCase());
  if (!team) {
    return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
  }

  // Chequeo de límites de vueltas
  const teamStatus = await simulationModel.getOrCreateTeamStatus(championship_id, circuit_id, team.team_id);
  const remainingLaps = 3 - teamStatus.qualifying_laps_used;
  if (remainingLaps <= 0) {
    return res.status(400).json({ error: 'Ya has agotado tus 3 vueltas de clasificación.' });
  }
  const lapsToSimulate = Math.min(laps, remainingLaps);

  // Detalles del circuito y clima de la sesión de clasificación
  const circuitRes = await db.query('SELECT * FROM circuits WHERE id = $1', [circuit_id]);
  const circuit = circuitRes.rows[0];
  const weather = await simulationModel.getOrCreateWeekend(championship_id, circuit_id, 'qualifying');


  // Obtener número del stint
  const stintRes = await db.query(
    'SELECT COALESCE(MAX(stint_number), 0) + 1 AS next_stint FROM gp_lap_history WHERE team_id = $1 AND circuit_id = $2 AND session_type = $3',
    [team.team_id, circuit_id, 'qualifying']
  );
  const stintNumber = stintRes.rows[0].next_stint;

  let accumulatedWear = 0.0;
  let bestTime = null;
  const simulatedLaps = [];

  const pilot = {
    talent: team.talent,
    consistency: team.consistency,
    experience: team.experience,
    fitness: team.fitness,
    aggressiveness: team.aggressiveness
  };

  const bike = {
    engine: team.engine,
    gearbox: team.gearbox,
    suspension: team.suspension,
    chassis: team.chassis,
    wings: team.wings
  };

  const setup = {
    setup_engine,
    setup_gearbox,
    setup_suspension,
    setup_chassis,
    setup_wings
  };

  for (let i = 1; i <= lapsToSimulate; i++) {
    const lapNum = teamStatus.qualifying_laps_used + i;
    const result = simulateLap(pilot, bike, circuit, weather, tire_type, pilot_focus, setup, accumulatedWear, lapNum, 3);
    accumulatedWear = result.tire_wear_pct;

    if (result.has_crashed) {
      simulatedLaps.push({
        lap_number: lapNum,
        lap_time: null,
        tire_wear_pct: result.tire_wear_pct,
        has_crashed: true
      });
      await simulationModel.insertLapHistory({
        championship_id,
        circuit_id,
        team_id: team.team_id,
        session_type: 'qualifying',
        stint_number: stintNumber,
        lap_number: lapNum,
        lap_time: null,
        tire_wear_pct: result.tire_wear_pct,
        has_crashed: true,
        feedback_received: "Caída en clasificación.",
        tire_type,
        pilot_focus,
        ...setup
      });
      break;
    }

    simulatedLaps.push({
      lap_number: lapNum,
      lap_time: result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: false
    });

    if (bestTime === null || result.lap_time < bestTime) {
      bestTime = result.lap_time;
    }

    await simulationModel.insertLapHistory({
      championship_id,
      circuit_id,
      team_id: team.team_id,
      session_type: 'qualifying',
      stint_number: stintNumber,
      lap_number: lapNum,
      lap_time: result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: false,
      feedback_received: null,
      tire_type,
      pilot_focus,
      ...setup
    });
  }

  // Generar feedback
  const optimalTime = getOptimalTime(pilot, bike, circuit);
  const feedback = generateFeedback(bestTime, optimalTime, pilot, circuit, setup);

  await db.query(
    'UPDATE gp_lap_history SET feedback_received = $1 WHERE team_id = $2 AND circuit_id = $3 AND stint_number = $4 AND session_type = $5',
    [feedback, team.team_id, circuit_id, stintNumber, 'qualifying']
  );

  const updatedStatus = await simulationModel.updateQualifyingStatus(championship_id, circuit_id, team.team_id, lapsToSimulate, bestTime);

  // Actualizar parrilla de salida general
  const allStatuses = await simulationModel.getGPStatusForAllTeams(championship_id, circuit_id);
  // Ordenamos por mejor tiempo
  const sortedGrid = [...allStatuses].sort((a, b) => {
    if (a.best_qualifying_time === null) return 1;
    if (b.best_qualifying_time === null) return -1;
    return parseFloat(a.best_qualifying_time) - parseFloat(b.best_qualifying_time);
  });

  for (let idx = 0; idx < sortedGrid.length; idx++) {
    const tStat = sortedGrid[idx];
    await db.query(
      'UPDATE gp_team_status SET grid_position = $1 WHERE team_id = $2 AND circuit_id = $3',
      [idx + 1, tStat.team_id, circuit_id]
    );
  }

  res.json({
    stint_number: stintNumber,
    simulatedLaps,
    bestTime,
    feedback,
    updatedStatus
  });
});

// 4. Guardar Estrategia de Carrera definitiva
const saveRaceStrategy = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings } = req.body;
  const userEmail = req.user.email;

  // Validaciones de Setup
  const sum = parseInt(setup_engine) + parseInt(setup_gearbox) + parseInt(setup_suspension) + parseInt(setup_chassis) + parseInt(setup_wings);
  if (sum !== 0) {
    return res.status(400).json({ error: 'La suma de los offsets del setup debe ser exactamente 0.' });
  }

  const teams = await simulationModel.getGPTeamsDetails(championship_id);
  const team = teams.find(t => t.user_email.toLowerCase() === userEmail.toLowerCase());
  if (!team) {
    return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
  }

  const updated = await simulationModel.saveRaceSetup(championship_id, circuit_id, team.team_id, {
    tire_type,
    pilot_focus,
    setup_engine,
    setup_gearbox,
    setup_suspension,
    setup_chassis,
    setup_wings
  });

  res.json({ message: 'Estrategia de carrera guardada con éxito.', status: updated });
});

// 5. Simular Carrera Completa (12 Vueltas) - Función interna reutilizable
const runRaceSimulationInternal = async (championshipId, circuitId) => {
  // 1. Obtener todos los equipos e inicializar / verificar si ya se simuló la carrera
  const checkRaceSimulated = await db.query(
    'SELECT COUNT(*)::int FROM gp_team_status WHERE championship_id = $1 AND circuit_id = $2 AND finishing_position IS NOT NULL',
    [championshipId, circuitId]
  );
  if (checkRaceSimulated.rows[0].count > 0) {
    throw new Error('La carrera para este Gran Premio ya ha sido simulada.');
  }

  const teams = await simulationModel.getGPTeamsDetails(championshipId);
  if (teams.length === 0) {
    throw new Error('No hay equipos inscritos en este campeonato.');
  }

  const circuitRes = await db.query('SELECT * FROM circuits WHERE id = $1', [circuitId]);
  const circuit = circuitRes.rows[0];
  if (!circuit) {
    throw new Error('Circuito no encontrado.');
  }

  const weekend = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'race');

  // 2. Cargar estados y ordenar la parrilla
  const pilotStates = [];
  for (const team of teams) {
    const status = await simulationModel.getOrCreateTeamStatus(championshipId, circuitId, team.team_id);
    pilotStates.push({
      team,
      status,
      tire_wear_pct: 0.0,
      total_race_time: 0.0,
      best_lap: 999.9,
      has_crashed: false,
      grid_position: status.grid_position || 10, // Si no clasificó, sale al final
      laps_history: []
    });
  }

  // Ordenar la parrilla de salida
  pilotStates.sort((a, b) => a.grid_position - b.grid_position);

  // Ajustar grid_position por si faltaban clasificaciones
  pilotStates.forEach((state, index) => {
    state.grid_position = index + 1;
  });

  const totalLaps = 12;

  // 3. Simular vuelta a vuelta (Loop Laps)
  for (let lap = 1; lap <= totalLaps; lap++) {
    // A) Simular vuelta individual de cada piloto
    for (const state of pilotStates) {
      if (state.has_crashed) continue;

      const pilot = {
        talent: state.team.talent,
        consistency: state.team.consistency,
        experience: state.team.experience,
        fitness: state.team.fitness,
        aggressiveness: state.team.aggressiveness
      };

      const bike = {
        engine: state.team.engine,
        gearbox: state.team.gearbox,
        suspension: state.team.suspension,
        chassis: state.team.chassis,
        wings: state.team.wings
      };

      const tireType = state.status.race_tire_type || 'medium';
      const pilotFocus = state.status.race_pilot_focus || 'balanced';

      const setup = {
        setup_engine: state.status.race_setup_engine || 0,
        setup_gearbox: state.status.race_setup_gearbox || 0,
        setup_suspension: state.status.race_setup_suspension || 0,
        setup_chassis: state.status.race_setup_chassis || 0,
        setup_wings: state.status.race_setup_wings || 0
      };

      const result = simulateLap(pilot, bike, circuit, weekend, tireType, pilotFocus, setup, state.tire_wear_pct, lap, totalLaps);
      state.tire_wear_pct = result.tire_wear_pct;

      if (result.has_crashed) {
        state.has_crashed = true;
        state.laps_history.push({
          lap_number: lap,
          lap_time: null,
          tire_wear_pct: result.tire_wear_pct,
          has_crashed: true
        });

        // Insertar en telemetría
        await simulationModel.insertLapHistory({
          championship_id: championshipId,
          circuit_id: circuitId,
          team_id: state.team.team_id,
          session_type: 'race',
          stint_number: 1,
          lap_number: lap,
          lap_time: null,
          tire_wear_pct: result.tire_wear_pct,
          has_crashed: true,
          feedback_received: "Caída en carrera. DNF.",
          tire_type: tireType,
          pilot_focus: pilotFocus,
          ...setup
        });
      } else {
        state.total_race_time += result.lap_time;
        if (result.lap_time < state.best_lap) {
          state.best_lap = result.lap_time;
        }

        state.laps_history.push({
          lap_number: lap,
          lap_time: result.lap_time,
          tire_wear_pct: result.tire_wear_pct,
          has_crashed: false
        });

        // Insertar en telemetría
        await simulationModel.insertLapHistory({
          championship_id: championshipId,
          circuit_id: circuitId,
          team_id: state.team.team_id,
          session_type: 'race',
          stint_number: 1,
          lap_number: lap,
          lap_time: result.lap_time,
          tire_wear_pct: result.tire_wear_pct,
          has_crashed: false,
          feedback_received: null,
          tire_type: tireType,
          pilot_focus: pilotFocus,
          ...setup
        });
      }
    }

    // B) Lógica de Adelantamientos en Carrera
    // Filtramos los que siguen en pista
    const runningStates = pilotStates.filter(s => !s.has_crashed);
    // Los ordenamos por tiempo acumulado
    runningStates.sort((a, b) => a.total_race_time - b.total_race_time);

    // Comparar pilotos adyacentes
    for (let idx = 1; idx < runningStates.length; idx++) {
      const riderAhead = runningStates[idx - 1];
      const riderBehind = runningStates[idx];

      const gap = riderBehind.total_race_time - riderAhead.total_race_time;
      if (gap < 0.4) {
        // Posibilidad de adelantamiento
        const pilotA = riderBehind.team; // El de atrás intenta
        const pilotB = riderAhead.team;  // El de adelante defiende

        const setupA = {
          engine: riderBehind.status.race_setup_engine || 0
        };
        const setupB = {
          engine: riderAhead.status.race_setup_engine || 0
        };

        const focusA = riderBehind.status.race_pilot_focus || 'balanced';

        let pOvertake = 0.35 + 
                        (pilotA.talent - pilotB.talent) * 0.003 + 
                        (pilotA.aggressiveness - pilotB.consistency) * 0.004 + 
                        (pilotA.experience - pilotB.experience) * 0.003 +
                        (setupA.engine - setupB.engine) * 0.002;

        if (focusA === 'aggressive') {
          pOvertake += 0.15;
        }

        if (Math.random() < pOvertake) {
          // ¡Adelantamiento exitoso! Intercambiamos tiempos ligeramente
          // El que adelanta (riderBehind) baja su tiempo, el adelantado (riderAhead) sube por perder trazada
          riderBehind.total_race_time -= 0.1;
          riderAhead.total_race_time += 0.3;
          riderBehind.tire_wear_pct = Math.min(100, riderBehind.tire_wear_pct + 1.5); // Gasta más goma

          // Guardar evento de adelantamiento en las notas de la vuelta
          await db.query(
            'UPDATE gp_lap_history SET feedback_received = $1 WHERE team_id = $2 AND circuit_id = $3 AND lap_number = $4 AND session_type = $5',
            [`Adelantó a ${pilotB.pilot_name} de forma espectacular en esta vuelta.`, pilotA.team_id, circuitId, lap, 'race']
          );
        }
      }
    }
  }

  // 4. Clasificación final
  // Ordenar a todos: Primero los que terminaron por tiempo, luego los DNF por número de vueltas completadas
  pilotStates.sort((a, b) => {
    if (a.has_crashed && b.has_crashed) {
      return b.laps_history.length - a.laps_history.length; // El que dio más vueltas queda antes
    }
    if (a.has_crashed) return 1;
    if (b.has_crashed) return -1;
    return a.total_race_time - b.total_race_time;
  });

  // Reparto de Puntos y Dinero
  const pointsTable = [15, 12, 10, 8, 7, 6, 5, 0, 0, 0];
  const earningsTable = [150000, 120000, 100000, 80000, 70000, 60000, 50000, 40000, 30000, 20000];

  const resultsSummary = [];

  for (let idx = 0; idx < pilotStates.length; idx++) {
    const state = pilotStates[idx];
    const finishingPos = idx + 1;

    let points = 0;
    let earnings = 10000; // Mínimo DNF

    if (!state.has_crashed) {
      points = finishingPos <= 7 ? pointsTable[finishingPos - 1] : 0;
      earnings = finishingPos <= 10 ? earningsTable[finishingPos - 1] : 10000;
    }

    const resultObj = {
      grid_position: state.grid_position,
      finishing_position: finishingPos,
      race_time: state.has_crashed ? null : parseFloat(state.total_race_time.toFixed(3)),
      status: state.has_crashed ? 'DNF_crash' : 'finished',
      earnings,
      points_earned: points
    };

    // Guardar en la base de datos
    await simulationModel.saveRaceResults(championshipId, circuitId, state.team.team_id, resultObj);

    resultsSummary.push({
      team_id: state.team.team_id,
      team_name: state.team.team_name,
      pilot_name: state.team.pilot_name,
      grid_position: state.grid_position,
      finishing_position: finishingPos,
      race_time: resultObj.race_time,
      status: resultObj.status,
      earnings,
      points_earned: points,
      best_lap: state.best_lap === 999.9 ? null : parseFloat(state.best_lap.toFixed(3))
    });
  }

  // Actualizar tabla race_weekends a 'completed' para la sesión de carrera
  await db.query(
    'UPDATE race_weekends SET status = $1 WHERE championship_id = $2 AND circuit_id = $3 AND session_type = $4',
    ['completed', championshipId, circuitId, 'race']
  );

  return resultsSummary;
};

// 5. Simular Carrera Completa (12 Vueltas) - Endpoint HTTP
const runRaceSimulation = asyncHandler(async (req, res) => {
  const { championshipId, circuitId, bypassTime } = req.body;
  const userRole = req.user.role || 'player';

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Sólo los administradores de la plataforma pueden simular manualmente las carreras.' });
  }

  // Horario de sesión
  try {
    await validateSessionTime(championshipId, circuitId, 'race', bypassTime === true || bypassTime === 'true');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const results = await runRaceSimulationInternal(championshipId, circuitId);

  res.json({
    message: 'Carrera simulada con éxito.',
    results
  });
});

module.exports = {
  getGPStatus,
  runPracticeStint,
  runQualifyingStint,
  saveRaceStrategy,
  runRaceSimulation,
  runRaceSimulationInternal
};
