// OpenTelemetry du frontend Next.js (activité 8, étape 227).
// Next.js appelle register() au démarrage du serveur. Les spans (requête de page, rendu, fetch vers l'API)
// partent en OTLP vers OTEL_EXPORTER_OTLP_ENDPOINT (Grafana Tempo) ; l'en-tête W3C « traceparent »
// est ajouté aux appels vers l'API : la trace continue dans Express.
import { registerOTel } from "@vercel/otel";

export function register() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return; // pas de collecteur : rien n'est activé
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || "devsecops-portfolio",
    instrumentationConfig: {
      fetch: { propagateContextUrls: [/.*/] }, // l'API est appelée par son nom de Service interne
    },
  });
}
