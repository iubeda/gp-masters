process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';


const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');
const db = require('../config/database');

describe('Championship Endpoints', () => {
  let token;
  const userCredentials = {
    email: 'championship_test@example.com',
    username: 'champ_tester',
    password: 'password123'
  };

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Register the user
    await request(app)
      .post('/api/auth/register')
      .send(userCredentials);
      
    // Promote the test user to 'admin' to bypass creation permission checks
    await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [userCredentials.email.toLowerCase()]);
      
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.password
      });
      
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  const getFutureDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  it('should successfully create a public championship', async () => {
    const futureDate = getFutureDate(5);
    const res = await request(app)
      .post('/api/championships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Public MotoGP 2026',
        season: 2026,
        start_date: futureDate,
        is_public: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Public MotoGP 2026');
    expect(res.body).toHaveProperty('season', 2026);
  });

  it('should fail to create a championship with a past start date', async () => {
    const pastDate = '2020-01-01';
    const res = await request(app)
      .post('/api/championships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Past MotoGP',
        season: 2020,
        start_date: pastDate,
        is_public: true
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Start date must be in the future.');
  });

  it('should fail to create a private championship without a PIN', async () => {
    const futureDate = getFutureDate(5);
    const res = await request(app)
      .post('/api/championships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Private MotoGP',
        season: 2026,
        start_date: futureDate,
        is_public: false
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('A PIN is required for private championships.');
  });

  it('should successfully create a private championship with a valid PIN', async () => {
    const futureDate = getFutureDate(10);
    const res = await request(app)
      .post('/api/championships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Private MotoGP With PIN',
        season: 2026,
        start_date: futureDate,
        is_public: false,
        pin: '1234'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Private MotoGP With PIN');
  });

  it('should list all championships', async () => {
    const res = await request(app)
      .get('/api/championships')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  describe('POST /api/championships/:id/kick', () => {
    let creatorToken, anotherToken, adminToken;
    let champId, creatorTeamId, playerTeamId;

    beforeAll(async () => {
      // Register creator (manager)
      await request(app).post('/api/auth/register').send({
        email: 'creator@kick.test',
        username: 'kick_creator',
        password: 'password123'
      });
      await db.query("UPDATE users SET role = 'manager' WHERE email = 'creator@kick.test'");

      // Login creator
      const cRes = await request(app).post('/api/auth/login').send({
        email: 'creator@kick.test',
        password: 'password123'
      });
      creatorToken = cRes.body.token;

      // Register regular player
      await request(app).post('/api/auth/register').send({
        email: 'player@kick.test',
        username: 'kick_player',
        password: 'password123'
      });
      const pRes = await request(app).post('/api/auth/login').send({
        email: 'player@kick.test',
        password: 'password123'
      });
      anotherToken = pRes.body.token;

      // Register admin
      await request(app).post('/api/auth/register').send({
        email: 'admin@kick.test',
        username: 'kick_admin',
        password: 'password123'
      });
      await db.query("UPDATE users SET role = 'admin' WHERE email = 'admin@kick.test'");
      const aRes = await request(app).post('/api/auth/login').send({
        email: 'admin@kick.test',
        password: 'password123'
      });
      adminToken = aRes.body.token;

      // Creator creates a championship
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const champRes = await request(app)
        .post('/api/championships')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          name: 'Kick Test Champ',
          season: 2099,
          start_date: tomorrow.toISOString().split('T')[0],
          is_public: true
        });
      champId = champRes.body.id;

      // Creator registers their own team
      const creatorTeamRes = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'CreatorTeam', championship_id: champId });
      creatorTeamId = creatorTeamRes.body.team.id;

      // Player registers their team
      const playerTeamRes = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ name: 'PlayerTeam', championship_id: champId });
      playerTeamId = playerTeamRes.body.team.id;
    });

    it('should fail when admin tries to kick the creator of the championship', async () => {
      const res = await request(app)
        .post(`/api/championships/${champId}/kick`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          team_id: creatorTeamId,
          reason: 'Intentando expulsar al creador'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('No se puede expulsar al creador del campeonato.');
    });

    it('should fail to kick a team/user that has already disputed a race', async () => {
      // Simulate a completed race status for PlayerTeam in gp_team_status
      const circuitRes = await db.query('SELECT id FROM dictionary_circuits LIMIT 1');
      const circuitId = circuitRes.rows[0].id;
      
      // Seed a completed race weekend
      await db.query(
        "INSERT INTO race_weekends (championship_id, circuit_id, status) VALUES ($1, $2, 'completed') ON CONFLICT DO NOTHING",
        [champId, circuitId]
      );

      // Seed a finishing position for the team in gp_team_status
      await db.query(
        "INSERT INTO gp_team_status (championship_id, circuit_id, team_id, finishing_position, status) VALUES ($1, $2, $3, 1, 'finished') ON CONFLICT (championship_id, circuit_id, team_id) DO UPDATE SET finishing_position = 1, status = 'finished'",
        [champId, circuitId, playerTeamId]
      );

      // Now admin tries to kick the player who has disputed a race
      const res = await request(app)
        .post(`/api/championships/${champId}/kick`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          team_id: playerTeamId,
          reason: 'Ya corrió una carrera'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('No se puede expulsar a un usuario que ya ha disputado una carrera.');
    });

    it('should fail when creator tries to kick any user after the championship has started', async () => {
      // Creator tries to kick the player after championship has started (at least one GP completed)
      const res = await request(app)
        .post(`/api/championships/${champId}/kick`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          team_id: playerTeamId,
          reason: 'Campeonato comenzado'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('No se pueden expulsar usuarios una vez comenzadas las carreras.');
    });
  });
});
