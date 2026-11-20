// Activité 8 – étapes 240 à 242 : test de charge simple de l'API avec k6.
// Lancé par Jenkins sur STAGING avant toute promotion vers PRODUCTION (étape 241).
// Si un seuil n'est pas respecté, k6 sort avec le code 99 : l'étape Jenkins échoue
// et la promotion vers PROD n'a pas lieu (étape 242).
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://staging.portfolio.local";
const ROUTES = ["/api/health", "/api/profile", "/api/projects", "/api/skills"];

export const options = {
  // Montée à 10 utilisateurs virtuels, palier, puis descente : environ 1 minute 10
  stages: [
    { duration: "20s", target: 10 },
    { duration: "40s", target: 10 },
    { duration: "10s", target: 0 },
  ],
  // Seuils de performance (étape 242)
  thresholds: {
    http_req_failed: ["rate<0.01"],                    // moins de 1 % de requêtes en échec
    http_req_duration: ["p(95)<500", "p(99)<1000"],    // 95 % sous 500 ms, 99 % sous 1 s
    checks: ["rate>0.99"],                             // plus de 99 % de réponses 200
  },
};

export default function () {
  for (const route of ROUTES) {
    const reponse = http.get(`${BASE_URL}${route}`, { tags: { route } });
    check(reponse, { "statut 200": (r) => r.status === 200 });
  }
  sleep(1);
}
