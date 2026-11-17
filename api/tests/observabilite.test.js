import { jest, describe, test, expect } from "@jest/globals";

// Prisma remplacé par un faux objet : pas besoin de PostgreSQL
const count = jest.fn(async () => 3);
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: { contact: { count } } }));

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

// Activité 8, étapes 222 et 228 : métriques Prometheus et correlation ID
describe("Observabilité", () => {
  test("GET /metrics expose les requêtes, les erreurs et la latence", async () => {
    await request(app).get("/api/health");
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total{method="GET",route="/api/health",status_code="200"}');
    expect(res.text).toContain("http_request_duration_seconds_bucket");
    expect(res.text).toContain("http_request_errors_total");
  });

  test("GET /api/stats renvoie le nombre de messages (lu dans PostgreSQL)", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ messages: 3 });
  });

  test("le correlation ID reçu est renvoyé dans la réponse", async () => {
    const res = await request(app).get("/api/health").set("x-correlation-id", "test-correlation-1234");
    expect(res.headers["x-correlation-id"]).toBe("test-correlation-1234");
  });

  test("un correlation ID invalide est remplacé par un UUID", async () => {
    const res = await request(app).get("/api/health").set("x-correlation-id", "<script>");
    expect(res.headers["x-correlation-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
