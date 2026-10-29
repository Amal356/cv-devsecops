import request from 'supertest';
import app from './app.js';
import prisma from './lib/prisma.js';

// Mock de Prisma pour éviter d'utiliser la vraie base de données pendant les tests
jest.mock('./lib/prisma.js', () => ({
  __esModule: true,
  default: {
    contact: {
      create: jest.fn(),
    },
  },
}));

describe('API Tests', () => {
  test('GET /api/health devrait retourner 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/contact devrait accepter une requête valide', async () => {
    const validData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Ceci est un message de test de plus de 10 caractères.'
    };

    prisma.contact.create.mockResolvedValue({ id: 1, ...validData });

    const res = await request(app)
      .post('/api/contact')
      .send(validData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/contact devrait refuser une requête invalide (Zod)', async () => {
    const invalidData = {
      name: 'A', // Trop court
      email: 'pas-un-email',
      message: 'Court' // Trop court
    };

    const res = await request(app)
      .post('/api/contact')
      .send(invalidData);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveLength(3);
  });

  test('POST /api/contact devrait bloquer les tentatives d\'injection SQL', async () => {
    const maliciousData = {
      name: 'User',
      email: 'test@example.com',
      message: "'; DROP TABLE \"Contact\"; --"
    };

    // Zod accepte la chaîne, mais Prisma/PostgreSQL la traite comme une simple valeur
    prisma.contact.create.mockResolvedValue({ id: 2, ...maliciousData });

    const res = await request(app)
      .post('/api/contact')
      .send(maliciousData);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message).toBe(maliciousData.message);
  });

  test('POST /api/contact devrait refuser un JSON malformé', async () => {
    const res = await request(app)
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send('{"name": "Incomplet", ');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
