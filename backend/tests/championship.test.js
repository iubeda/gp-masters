process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');

describe('Championship Endpoints', () => {
  let token;
  const userCredentials = {
    email: 'championship_test@example.com',
    username: 'champ_tester',
    password: 'password123'
  };

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Register and login to retrieve a valid JWT token
    await request(app)
      .post('/api/auth/register')
      .send(userCredentials);
      
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
    expect(res.body.message).toBe('Championship created successfully.');
    expect(res.body.championship).toHaveProperty('name', 'Public MotoGP 2026');
    expect(res.body.championship).toHaveProperty('season', 2026);
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
    expect(res.body.message).toBe('Championship created successfully.');
    expect(res.body.championship).toHaveProperty('name', 'Private MotoGP With PIN');
  });

  it('should list all championships', async () => {
    const res = await request(app)
      .get('/api/championships')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
