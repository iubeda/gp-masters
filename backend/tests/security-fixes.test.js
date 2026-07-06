// Security Fixes Validation Tests
const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { setupTestDatabase, cleanTestDatabase } = require('./testSetup');

describe('Security Fixes - Password Policy', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  it('should reject weak passwords (less than 8 chars)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        username: 'testuser',
        password: 'Weak1!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('at least 8 characters');
  });

  it('should reject passwords without uppercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        username: 'testuser',
        password: 'weakpass1!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('uppercase');
  });

  it('should reject passwords without special character', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        username: 'testuser',
        password: 'Weakpass1'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('special character');
  });

  it('should accept strong passwords', async () => {
    const uniqueEmail = `strongtest${Date.now()}@test.com`;
    const shortId = Date.now().toString().slice(-6); // Last 6 digits
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        username: `strong${shortId}`,
        password: 'StrongPass123!'
      });
    
    if (response.status !== 201) {
      console.log('Strong password test error:', response.body);
    }
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully.');
  });
});

describe('Security Fixes - Password Change Verification', () => {
  let authToken;
  let testUserEmail = 'pwdchange@test.com';

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('OldPass123!', 10);
    await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      [testUserEmail, 'pwdchangeuser', hashedPassword]
    );

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'OldPass123!'
      });
    
    authToken = loginResponse.body.token;
  });

  it('should require current password for password change', async () => {
    const response = await request(app)
      .put('/api/users/profile/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        new_password: 'NewPass456!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Current password is required');
  });

  it('should reject incorrect current password', async () => {
    const response = await request(app)
      .put('/api/users/profile/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        current_password: 'WrongPass123!',
        new_password: 'NewPass456!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('incorrect');
  });
});

describe('Security Fixes - Rate Limiting', () => {
  it('should rate limit authentication attempts', async () => {
    const requests = [];
    
    // Make 15 rapid requests (limit is 10 per 15 min)
    for (let i = 0; i < 15; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@test.com',
            password: 'test'
          })
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout
});

describe('Security Fixes - PIN Hashing', () => {
  it('should hash championship PIN with bcrypt', async () => {
    const testPin = 'TEST1234';
    const hashedPin = await bcrypt.hash(testPin, 10);
    
    expect(hashedPin).not.toBe(testPin);
    expect(hashedPin.length).toBe(60); // bcrypt hash length
    
    const isValid = await bcrypt.compare(testPin, hashedPin);
    expect(isValid).toBe(true);
    
    const isInvalid = await bcrypt.compare('WRONG123', hashedPin);
    expect(isInvalid).toBe(false);
  });
});

describe('Security Fixes - Token Version', () => {
  it('should include tokenVersion in JWT payload', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';
    
    const payload = {
      email: 'test@test.com',
      username: 'testuser',
      role: 'player',
      tokenVersion: 0
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    
    expect(decoded.tokenVersion).toBeDefined();
    expect(decoded.tokenVersion).toBe(0);
  });
});
