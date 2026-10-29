// Tests de l'API Express (étapes 58 et 59) : Jest + Supertest.
// Prisma est remplacé par un faux objet : les tests n'ont pas besoin de PostgreSQL.
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const create = jest.fn();
jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  default: { contact: { create } },
}));

// Limite haute pour ne pas déclencher le rate limiting, sauf dans le test dédié
process.env.CONTACT_RATE_LIMIT = "1000";

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

const messageValide = {
  name: "Amal",
  email: "amal@example.com",
  message: "Bonjour, ceci est un message de test.",
};

beforeEach(() => {
  create.mockReset();
  create.mockImplementation(async ({ data }) => ({ id: 1, createdAt: new Date(), ...data }));
});

describe("Routes GET", () => {
  test("GET /api/health indique que l'API fonctionne", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test.each(["/api/profile", "/api/projects", "/api/skills"])("GET %s renvoie du JSON", async (route) => {
    const res = await request(app).get(route);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  test("une route inconnue renvoie un 404 JSON", async () => {
    const res = await request(app).get("/api/inexistante");
    expect(res.status).toBe(404);
    expect(res.body.erreur).toBeDefined();
  });
});

describe("Sécurité HTTP", () => {
  test("Helmet ajoute les en-têtes de sécurité et masque Express", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["strict-transport-security"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  test("CORS n'autorise que l'origine du portfolio", async () => {
    const autorisee = await request(app).get("/api/health").set("Origin", "http://localhost:3000");
    expect(autorisee.headers["access-control-allow-origin"]).toBe("http://localhost:3000");

    const refusee = await request(app).get("/api/health").set("Origin", "https://site-malveillant.example");
    expect(refusee.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("POST /api/contact", () => {
  test("accepte un message valide et l'enregistre (201)", async () => {
    const res = await request(app).post("/api/contact").send(messageValide);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(create).toHaveBeenCalledWith({ data: messageValide });
  });

  test("refuse des données invalides avec les erreurs Zod (400)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "A", email: "pas-un-email", message: "Court" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field).sort()).toEqual(["email", "message", "name"]);
    expect(create).not.toHaveBeenCalled();
  });

  test("refuse un corps vide (400)", async () => {
    const res = await request(app).post("/api/contact").send({});
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test("refuse un champ non prévu, ex. isAdmin (OWASP API3)", async () => {
    const res = await request(app).post("/api/contact").send({ ...messageValide, isAdmin: true });
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test("refuse un type inattendu, ex. un objet à la place du nom", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...messageValide, name: { $gt: "" } });
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  test("refuse un JSON malformé avec un 400 JSON propre", async () => {
    const res = await request(app)
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send('{"name": "Incomplet", ');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("refuse un corps trop volumineux (413)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...messageValide, message: "x".repeat(20_000) });
    expect(res.status).toBe(413);
  });

  test("une tentative d'injection SQL est stockée comme simple texte", async () => {
    const injection = { ...messageValide, message: "'; DROP TABLE \"Contact\"; --" };
    const res = await request(app).post("/api/contact").send(injection);
    expect(res.status).toBe(201);
    // Prisma reçoit la chaîne telle quelle : elle est passée en paramètre, jamais concaténée au SQL
    expect(create).toHaveBeenCalledWith({ data: injection });
  });

  test("une erreur de base de données renvoie un 500 sans détail interne", async () => {
    create.mockRejectedValueOnce(new Error("connexion PostgreSQL refusée sur db:5432"));
    const res = await request(app).post("/api/contact").send(messageValide);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Une erreur interne est survenue.");
    expect(JSON.stringify(res.body)).not.toMatch(/PostgreSQL|5432/);
  });
});
