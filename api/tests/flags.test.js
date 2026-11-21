import { jest, describe, test, expect, afterAll } from "@jest/globals";

// Prisma remplacé par un faux objet : pas besoin de PostgreSQL
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: { contact: { count: jest.fn() } } }));

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");
const { OpenFeature, InMemoryProvider } = await import("@openfeature/server-sdk");

const flagNouveautes = (defaultVariant) => ({
  "api-nouveautes": {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant,
    // Groupe "beta" : activé même si la valeur par défaut est "off"
    contextEvaluator: (ctx) => (ctx.groupe === "beta" ? "on" : defaultVariant),
  },
});

// Activité 9, étape 248 : feature flag OpenFeature
describe("Feature flag api-nouveautes", () => {
  afterAll(async () => {
    await OpenFeature.close();
  });

  test("sans fournisseur de flags : fonctionnalité désactivée (404)", async () => {
    const res = await request(app).get("/api/nouveautes");
    expect(res.status).toBe(404);
    expect(res.body.flag).toBe("api-nouveautes");
  });

  test("flag sur off : désactivée pour le public, activée pour le groupe beta", async () => {
    await OpenFeature.setProviderAndWait(new InMemoryProvider(flagNouveautes("off")));
    expect((await request(app).get("/api/nouveautes")).status).toBe(404);
    const beta = await request(app).get("/api/nouveautes").set("x-groupe", "beta");
    expect(beta.status).toBe(200);
    expect(beta.body.nouveautes.length).toBeGreaterThan(0);
  });

  test("flag sur on : activée pour tout le monde, sans redéploiement", async () => {
    await OpenFeature.setProviderAndWait(new InMemoryProvider(flagNouveautes("on")));
    expect((await request(app).get("/api/nouveautes")).status).toBe(200);
  });
});
