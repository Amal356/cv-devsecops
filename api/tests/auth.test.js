// Activité 9, partie 50 : routes protégées par Keycloak (OIDC).
// Un faux « Keycloak » local publie une clé publique (JWKS) ; les tests signent leurs propres jetons.
import { jest, describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import http from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";

const findMany = jest.fn(async () => [{ id: 1, name: "Test", email: "test@example.test", createdAt: new Date() }]);
jest.unstable_mockModule("../src/lib/prisma.js", () => ({ default: { contact: { findMany } } }));

const ISSUER = "http://keycloak.test/realms/portfolio";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const autreCle = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "cle-test", alg: "RS256", use: "sig" };

const serveurJwks = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ keys: [jwk] }));
});
await new Promise((ok) => serveurJwks.listen(0, "127.0.0.1", ok));
process.env.OIDC_ISSUER = ISSUER;
process.env.OIDC_AUDIENCE = "portfolio-api";
process.env.OIDC_JWKS_URL = `http://127.0.0.1:${serveurJwks.address().port}/certs`;

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");

function jeton(roles, { cle = privateKey, issuer = ISSUER, audience = "portfolio-api", expire = "5m" } = {}) {
  return new SignJWT({ preferred_username: "testeur", realm_access: { roles } })
    .setProtectedHeader({ alg: "RS256", kid: "cle-test" })
    .setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expire)
    .sign(cle);
}
const avec = (j) => ({ Authorization: `Bearer ${j}` });

afterAll(() => new Promise((ok) => serveurJwks.close(ok)));

describe("Routes protégées par OIDC", () => {
  test("sans jeton : 401", async () => {
    const res = await request(app).get("/api/espace/moi");
    expect(res.status).toBe(401);
    expect(res.headers["www-authenticate"]).toContain("Bearer");
  });

  test("jeton signé par une autre clé : 401", async () => {
    const res = await request(app).get("/api/espace/moi").set(avec(await jeton(["user"], { cle: autreCle.privateKey })));
    expect(res.status).toBe(401);
  });

  test("mauvais émetteur ou mauvaise audience : 401", async () => {
    expect((await request(app).get("/api/espace/moi").set(avec(await jeton(["user"], { issuer: "http://pirate.test" })))).status).toBe(401);
    expect((await request(app).get("/api/espace/moi").set(avec(await jeton(["user"], { audience: "autre-api" })))).status).toBe(401);
  });

  test("jeton expiré : 401", async () => {
    const res = await request(app).get("/api/espace/moi").set(avec(await jeton(["user"], { expire: Math.floor(Date.now() / 1000) - 60 })));
    expect(res.status).toBe(401);
  });

  test("rôle user : accès à /moi, refus (403) sur /developpeur et /admin", async () => {
    const j = await jeton(["user", "default-roles-portfolio"]);
    const moi = await request(app).get("/api/espace/moi").set(avec(j));
    expect(moi.status).toBe(200);
    expect(moi.body).toEqual({ utilisateur: "testeur", roles: ["user"] });
    expect((await request(app).get("/api/espace/developpeur").set(avec(j))).status).toBe(403);
    expect((await request(app).get("/api/espace/admin/messages").set(avec(j))).status).toBe(403);
  });

  test("rôle developer : accès à /developpeur, refus (403) sur /admin", async () => {
    const j = await jeton(["user", "developer"]);
    expect((await request(app).get("/api/espace/developpeur").set(avec(j))).status).toBe(200);
    expect((await request(app).get("/api/espace/admin/messages").set(avec(j))).status).toBe(403);
  });

  test("rôle admin : accès aux messages", async () => {
    const res = await request(app).get("/api/espace/admin/messages").set(avec(await jeton(["user", "developer", "admin"])));
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });
});
