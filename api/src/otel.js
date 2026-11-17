// OpenTelemetry (activité 8, étape 226) : chargé AVANT l'application avec
//   node --import ./src/otel.js src/server.js
// Les spans (HTTP entrant/sortant, Express, Prisma/PostgreSQL, AWS SDK/Floci) sont envoyés en OTLP
// vers OTEL_EXPORTER_OTLP_ENDPOINT (Grafana Tempo). Sans cette variable : rien n'est activé.
import { register } from "node:module";

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  // Modules ESM ("type": "module") : le crochet permet d'instrumenter express, http, @prisma/client…
  register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);

  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");
  const { PrismaInstrumentation } = (await import("@prisma/instrumentation")).default; // module CommonJS

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || "devsecops-api",
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false }, // trop bavard
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingRequestHook: (req) => req.url === "/metrics" || req.url === "/api/health",
        },
      }),
      new PrismaInstrumentation(), // requêtes SQL envoyées à PostgreSQL
    ],
  });
  sdk.start();
  process.on("SIGTERM", () => sdk.shutdown().catch(() => {}));
  console.log(JSON.stringify({ niveau: "info", message: "OpenTelemetry activé", service: "devsecops-api" }));
}
