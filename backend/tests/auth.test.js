process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';

const request = require('supertest');
const app = require('../app');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123'
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully.');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('username', testUser.username);
  });

  it('should fail to register an existing user email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        username: 'otherusername',
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email is already registered.');
  });

  it('should fail to register an existing username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        username: testUser.username,
        password: 'password123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Username is already taken.');
  });

  it('should log in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful.');
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should fail to log in with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});
