// Test du rate limiting (étape 51) dans un fichier séparé : la limite est fixée à 5.
import { jest, test, expect } from "@jest/globals";

const create = jest.fn(async ({ data }) => ({ id: 1, createdAt: new Date(), ...data }));
jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: { contact: { create } },
}));

process.env.CONTACT_RATE_LIMIT = "5";

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

test("la 6e requête en 15 minutes reçoit 429 Too Many Requests", async () => {
  const message = { name: "Amal", email: "amal@example.com", message: "Message de test du rate limit." };
  for (let i = 0; i < 5; i++) {
    const res = await request(app).post("/api/contact").send(message);
    expect(res.status).toBe(201);
  }
  const res = await request(app).post("/api/contact").send(message);
  expect(res.status).toBe(429);
  expect(res.body.success).toBe(false);
});
