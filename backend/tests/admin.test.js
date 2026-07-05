process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';

const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');
const db = require('../config/database');

describe('Admin Endpoints', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await setupTestDatabase();

    // Register admin user
    await request(app).post('/api/auth/register').send({
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'password123'
    });
    // Set role to admin directly in DB for testing
    await db.query("UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'");
    
    // Login admin
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123'
    });
    adminToken = adminLogin.body.token;

    // Register normal user
    await request(app).post('/api/auth/register').send({
      email: 'user@example.com',
      username: 'normaluser',
      password: 'password123'
    });
    
    // Login normal user
    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'password123'
    });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  describe('Dictionaries', () => {
    it('should prevent non-admins from getting dictionaries', async () => {
      const res = await request(app)
        .get('/api/admin/dictionaries/pilots')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
    });

    it('should allow admins to get dictionary of pilots', async () => {
      const res = await request(app)
        .get('/api/admin/dictionaries/pilots')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      // Should have seed data
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid dictionary type', async () => {
      const res = await request(app)
        .get('/api/admin/dictionaries/invalid_type')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid dictionary type');
    });

    it('should allow admins to add a new pilot', async () => {
      const newPilot = {
        name: 'Test Pilot',
        talent: 90,
        consistency: 85,
        aggressiveness: 80,
        experience: 75,
        fitness: 95
      };

      const res = await request(app)
        .post('/api/admin/dictionaries/pilots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPilot);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(newPilot.name);
      expect(res.body.talent).toBe(newPilot.talent);
    });

    it('should return 400 when adding a pilot with invalid attributes', async () => {
      const invalidPilot = {
        name: 'Bad Pilot',
        talent: 105, // > 100
        consistency: 85,
        aggressiveness: 80,
        experience: 75,
        fitness: 95
      };

      const res = await request(app)
        .post('/api/admin/dictionaries/pilots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPilot);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Attributes must be between 0 and 100');
    });
  });
});
