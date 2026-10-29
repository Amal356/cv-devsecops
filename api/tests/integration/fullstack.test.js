// Test d'intégration (étape 60) : Frontend Next.js -> API Express -> PostgreSQL.
// Il s'exécute contre la stack réelle lancée avec Docker Compose :
//   docker compose -f docker-compose.fullstack.yml up -d --build
//   cd api && npm run test:integration
// Variables (valeurs par défaut adaptées à la VM) :
//   FRONTEND_URL=http://localhost:3000  API_URL=http://localhost:4000
//   DATABASE_URL=postgresql://amal:password@localhost:5432/portfolio_db?schema=public
import { describe, test, expect, afterAll } from "@jest/globals";
import { PrismaClient } from "@prisma/client";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:4000";
process.env.DATABASE_URL ||= "postgresql://amal:password@localhost:5432/portfolio_db?schema=public";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

describe("Chaîne complète Frontend -> API -> PostgreSQL", () => {
  test("l'API et la base sont disponibles", async () => {
    const res = await fetch(`${API_URL}/api/health`);
    expect(res.status).toBe(200);
    await expect(prisma.$queryRaw`SELECT 1 AS ok`).resolves.toEqual([{ ok: 1 }]);
  });

  test("le frontend affiche les projets fournis par l'API (réseau Compose)", async () => {
    const projets = await (await fetch(`${API_URL}/api/projects`)).json();
    const html = await (await fetch(`${FRONTEND_URL}/projects`)).text();

    // Le badge "source-api" prouve que Next.js a joint l'API via http://api:4000
    expect(html).toContain("source-api");
    expect(html).not.toContain("source-local");
    expect(html).toContain(projets[0].slug);
  });

  test("un message envoyé comme par le formulaire est enregistré dans PostgreSQL", async () => {
    const marqueur = `integration-${Date.now()}`;
    const res = await fetch(`${API_URL}/api/contact`, {
      method: "POST",
      // Même origine que le navigateur qui affiche le portfolio
      headers: { "Content-Type": "application/json", Origin: FRONTEND_URL },
      body: JSON.stringify({
        name: "Test intégration",
        email: "integration@example.com",
        message: `Message automatique ${marqueur}`,
      }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("access-control-allow-origin")).toBe(FRONTEND_URL);

    const { data } = await res.json();
    const ligne = await prisma.contact.findUnique({ where: { id: data.id } });
    expect(ligne.message).toContain(marqueur);
  });

  test("des données invalides n'arrivent jamais en base", async () => {
    const avant = await prisma.contact.count();
    const res = await fetch(`${API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", email: "invalide", message: "court" }),
    });
    expect(res.status).toBe(400);
    expect(await prisma.contact.count()).toBe(avant);
  });
});
