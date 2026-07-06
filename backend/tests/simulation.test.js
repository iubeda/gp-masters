// =============================================================================
// simulation.test.js — Tests de integración de los endpoints de simulación
// Requiere BD de test (motogp_test). Usa Supertest + setupTestDatabase.
// =============================================================================

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';

const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');

// ---------------------------------------------------------------------------
// Helpers de setup
// ---------------------------------------------------------------------------

let adminToken, playerToken;
let championshipId, circuitId, teamId;

const registerAndLogin = async (email, username, password, role = 'player') => {
  // Insertamos el usuario directamente para poder asignarle rol admin sin exposición en API
  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
    [email, username, hashed, role]
  );
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.headers['set-cookie'][0].split(';')[0].split('=')[1];
};

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await setupTestDatabase();

  // Crear usuarios
  adminToken  = await registerAndLogin('admin@sim.test',  'simadmin',  'AdminSim123!', 'admin');
  playerToken = await registerAndLogin('player@sim.test', 'simplayer', 'PlayerSim123!', 'player');

  // Obtener un circuito existente del seed
  const circuitRes = await db.query('SELECT id FROM dictionary_circuits LIMIT 1');
  circuitId = circuitRes.rows[0].id;

  // Crear campeonato como admin - usar fecha futura para pasar validación
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const champRes = await request(app)
    .post('/api/championships')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Sim Championship',
      season: 2099,
      start_date: tomorrow.toISOString().split('T')[0],
      is_public: true
    });
  
  if (!champRes.body.id) {
    console.error('[Test Setup] Championship creation failed:', JSON.stringify(champRes.body));
  }
  championshipId = champRes.body.id;

  // Añadir circuito al calendario (ruta raíz: POST /api/calendar)
  await request(app)
    .post('/api/calendar')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ championship_id: championshipId, circuit_id: circuitId, order: 1 });

  // Registrar equipo como jugador (ruta: POST /api/teams)
  const teamRes = await request(app)
    .post('/api/teams')
    .set('Authorization', `Bearer ${playerToken}`)
    .send({ name: 'SimTestTeam', championship_id: championshipId });
  teamId = teamRes.body.team?.id;
  // Logging for diagnostics if team registration fails
  if (!teamId) {
    console.error('[Test Setup] Team registration failed:', JSON.stringify(teamRes.body));
  }
});

afterAll(async () => {
  await cleanTestDatabase();
});

// Payload base de setup válido (suma = 0)
const validSetup = {
  setup_engine: 5, setup_gearbox: -5, setup_suspension: 0, setup_chassis: 0, setup_wings: 0,
  tire_type: 'medium', pilot_focus: 'balanced', bypassTime: true
};

// ---------------------------------------------------------------------------
// GET /api/simulation/status/:championshipId/:circuitId
// ---------------------------------------------------------------------------

describe('GET /api/simulation/status/:championshipId/:circuitId', () => {
  it('usuario con equipo → 200 con estructura completa', async () => {
    const res = await request(app)
      .get(`/api/simulation/status/${championshipId}/${circuitId}`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('weather');
    expect(res.body.weather).toHaveProperty('practice');
    expect(res.body.weather).toHaveProperty('qualifying');
    expect(res.body.weather).toHaveProperty('race');
    expect(res.body).toHaveProperty('teamStatus');
    expect(res.body).toHaveProperty('practiceLaps');
    expect(res.body).toHaveProperty('qualifyingLaps');
    expect(res.body).toHaveProperty('raceLaps');
    expect(res.body).toHaveProperty('gridStatus');
  });

  it('usuario sin equipo → 403', async () => {
    const noTeamToken = await registerAndLogin('noteam@sim.test', 'noteamuser', 'NoTeam123!', 'player');
    const res = await request(app)
      .get(`/api/simulation/status/${championshipId}/${circuitId}`)
      .set('Authorization', `Bearer ${noTeamToken}`);

    expect(res.statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/simulation/practice-stint
// ---------------------------------------------------------------------------

describe('POST /api/simulation/practice-stint', () => {
  it('stint válido → 200 con simulatedLaps, bestTime y feedback', async () => {
    const res = await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 3, ...validSetup });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('simulatedLaps');
    expect(res.body).toHaveProperty('feedback');
    expect(typeof res.body.feedback).toBe('string');
    expect(res.body.simulatedLaps.length).toBeGreaterThan(0);
  });

  it('setup con suma ≠ 0 → 400', async () => {
    const res = await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId, laps: 1,
        setup_engine: 5, setup_gearbox: 5, setup_suspension: 0, setup_chassis: 0, setup_wings: 0,
        tire_type: 'medium', pilot_focus: 'balanced', bypassTime: true
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/suma/i);
  });

  it('offset fuera de rango [-10, +10] → 400', async () => {
    const res = await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId, laps: 1,
        setup_engine: 15, setup_gearbox: -15, setup_suspension: 0, setup_chassis: 0, setup_wings: 0,
        tire_type: 'medium', pilot_focus: 'balanced', bypassTime: true
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/entre -10 y \+10/i);
  });

  it('solicitar más vueltas que las disponibles → se simula el máximo restante sin error', async () => {
    // Pedir 20 vueltas (máx = 15); ya hemos gastado 3 arriba → quedan 12 → se simularán las que queden
    const res = await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 20, ...validSetup });

    expect(res.statusCode).toBe(200);
    expect(res.body.simulatedLaps.length).toBeLessThanOrEqual(15);
  });

  it('vueltas de práctica agotadas → 400', async () => {
    // Forzar agotamiento: pedir todas las que queden y luego una más
    await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 15, ...validSetup });

    const res = await request(app)
      .post('/api/simulation/practice-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 1, ...validSetup });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/agotado/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/simulation/qualifying-stint
// ---------------------------------------------------------------------------

describe('POST /api/simulation/qualifying-stint', () => {
  it('stint válido → 200 con simulatedLaps y feedback', async () => {
    const res = await request(app)
      .post('/api/simulation/qualifying-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 2, ...validSetup });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('simulatedLaps');
    expect(res.body.simulatedLaps.length).toBeLessThanOrEqual(2);
  });

  it('tras qualifying → grid_position actualizado en gridStatus', async () => {
    const res = await request(app)
      .get(`/api/simulation/status/${championshipId}/${circuitId}`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.statusCode).toBe(200);
    const userEntry = res.body.gridStatus.find(e => e.team_name === 'SimTestTeam');
    expect(userEntry).toBeDefined();
    expect(userEntry.grid_position).toBeGreaterThanOrEqual(1);
  });

  it('setup con suma ≠ 0 → 400', async () => {
    const res = await request(app)
      .post('/api/simulation/qualifying-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId, laps: 1,
        setup_engine: 3, setup_gearbox: 3, setup_suspension: 0, setup_chassis: 0, setup_wings: 0,
        tire_type: 'soft', pilot_focus: 'aggressive', bypassTime: true
      });

    expect(res.statusCode).toBe(400);
  });

  it('vueltas de clasificación agotadas → 400', async () => {
    // Agotar las vueltas que queden (ya usamos 2+1 en tests anteriores de este describe)
    // Pedimos 3 para asegurarnos de que se llega al límite
    await request(app)
      .post('/api/simulation/qualifying-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 3, ...validSetup });

    // Ahora pedir 1 más: debe dar 400
    const res = await request(app)
      .post('/api/simulation/qualifying-stint')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championship_id: championshipId, circuit_id: circuitId, laps: 1, ...validSetup });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/agotado/i);
  });
});

// ---------------------------------------------------------------------------
// POST /api/simulation/save-strategy
// ---------------------------------------------------------------------------

describe('POST /api/simulation/save-strategy', () => {
  it('setup válido → 200 con status actualizado', async () => {
    const res = await request(app)
      .post('/api/simulation/save-strategy')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId,
        tire_type: 'hard', pilot_focus: 'conservative',
        setup_engine: 3, setup_gearbox: -3, setup_suspension: 0, setup_chassis: 0, setup_wings: 0
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/éxito/i);
    expect(res.body.status.race_tire_type).toBe('hard');
    expect(res.body.status.race_pilot_focus).toBe('conservative');
  });

  it('setup con suma ≠ 0 → 400', async () => {
    const res = await request(app)
      .post('/api/simulation/save-strategy')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId,
        tire_type: 'soft', pilot_focus: 'balanced',
        setup_engine: 5, setup_gearbox: 5, setup_suspension: 0, setup_chassis: 0, setup_wings: 0
      });

    expect(res.statusCode).toBe(400);
  });

  it('usuario sin equipo → 403', async () => {
    const noTeamToken = await registerAndLogin('noteam2@sim.test', 'noteamuser2', 'pass1234', 'player');
    const res = await request(app)
      .post('/api/simulation/save-strategy')
      .set('Authorization', `Bearer ${noTeamToken}`)
      .send({
        championship_id: championshipId, circuit_id: circuitId,
        tire_type: 'medium', pilot_focus: 'balanced',
        setup_engine: 0, setup_gearbox: 0, setup_suspension: 0, setup_chassis: 0, setup_wings: 0
      });

    expect(res.statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/simulation/race
// ---------------------------------------------------------------------------

describe('POST /api/simulation/race', () => {
  it('usuario no admin → 403', async () => {
    const res = await request(app)
      .post('/api/simulation/race')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ championshipId, circuitId, bypassTime: true });

    expect(res.statusCode).toBe(403);
  });

  it('admin con bypassTime → 200 con resultados por todos los equipos', async () => {
    const res = await request(app)
      .post('/api/simulation/race')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ championshipId, circuitId, bypassTime: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/éxito/i);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);

    // Cada resultado tiene los campos esperados
    for (const r of res.body.results) {
      expect(r).toHaveProperty('finishing_position');
      expect(r).toHaveProperty('points_earned');
      expect(r).toHaveProperty('earnings');
      expect(r).toHaveProperty('status');
    }
  });

  it('carrera ya simulada → 400 (idempotencia)', async () => {
    const res = await request(app)
      .post('/api/simulation/race')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ championshipId, circuitId, bypassTime: true });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/ya ha sido simulada/i);
  });

  it('balance de equipos actualizado tras la carrera', async () => {
    if (!teamId) return; // Guard: si el setup falló, skip
    const balanceRes = await db.query('SELECT balance FROM teams WHERE id = $1', [teamId]);
    expect(balanceRes.rows.length).toBeGreaterThan(0);
    // El balance inicial es 100000 (DEFAULT del schema); tras la carrera debe haber aumentado
    expect(parseInt(balanceRes.rows[0].balance)).toBeGreaterThan(100000);
  });
});
