const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));

describe('API Tests', () => {
  it('should return 200 for health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('OK');
  });
});
