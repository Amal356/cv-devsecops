// Observabilité de l'API (activité 8, étapes 222 et 228) :
//   - métriques Prometheus : requêtes, erreurs, latence (GET /metrics)
//   - correlation ID : lu dans l'en-tête x-correlation-id (envoyé par Next.js) ou généré,
//     renvoyé dans la réponse, ajouté au span OpenTelemetry et présent dans chaque ligne de log
import { randomUUID } from "node:crypto";
import client from "prom-client";
import { trace } from "@opentelemetry/api";

export const registre = new client.Registry();
client.collectDefaultMetrics({ register: registre, prefix: "devsecops_api_" });

const requetes = new client.Counter({
  name: "http_requests_total",
  help: "Nombre de requêtes HTTP reçues par l'API",
  labelNames: ["method", "route", "status_code"],
  registers: [registre],
});
const erreurs = new client.Counter({
  name: "http_request_errors_total",
  help: "Nombre de réponses en erreur (codes 5xx)",
  labelNames: ["method", "route", "status_code"],
  registers: [registre],
});
const latence = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Durée de traitement des requêtes HTTP (secondes)",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [registre],
});

const FORMAT_ID = /^[A-Za-z0-9._-]{8,64}$/; // un en-tête invalide (injection dans les logs) est remplacé

export function observabilite(req, res, next) {
  const recu = req.get("x-correlation-id");
  const correlationId = recu && FORMAT_ID.test(recu) ? recu : randomUUID();
  req.correlationId = correlationId;
  res.set("x-correlation-id", correlationId);

  const span = trace.getActiveSpan();
  span?.setAttribute("correlation.id", correlationId);
  const traceId = span?.spanContext().traceId;

  const fin = latence.startTimer();
  res.on("finish", () => {
    if (req.path === "/metrics") return;
    // route « modèle » (ex. /api/projects/:slug) : évite une série Prometheus par URL
    const route = req.route ? `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}` : "non_trouvee";
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    requetes.inc(labels);
    if (res.statusCode >= 500) erreurs.inc(labels);
    const duree = fin(labels);

    if (process.env.NODE_ENV !== "test") {
      // Une ligne JSON par requête : lisible par Loki ({…} | json), reliée à la trace par trace_id
      console.log(JSON.stringify({
        niveau: res.statusCode >= 500 ? "error" : "info",
        message: "requête traitée",
        method: req.method,
        route,
        url: req.originalUrl,
        status: res.statusCode,
        duree_ms: Math.round(duree * 1000),
        correlation_id: correlationId,
        trace_id: traceId,
      }));
    }
  });
  next();
}

export async function routeMetriques(req, res) {
  res.set("Content-Type", registre.contentType);
  res.send(await registre.metrics());
}
