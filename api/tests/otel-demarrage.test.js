// Régression : avec OpenTelemetry activé (comme dans Kubernetes), otel.js doit se charger sans erreur.
// Les autres tests tournent sans OTEL_EXPORTER_OTLP_ENDPOINT et ne passent donc pas par ce code.
import { spawnSync } from "node:child_process";

test("l'API démarre avec OpenTelemetry activé (import de @prisma/instrumentation)", () => {
  const r = spawnSync(process.execPath, ["--import", "./src/otel.js", "-e", "console.log('DEMARRAGE OK')"], {
    env: { ...process.env, OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" },
    encoding: "utf8",
    timeout: 20000,
  });
  expect(r.stderr).not.toMatch(/TypeError|Error:/);
  expect(r.stdout).toContain("OpenTelemetry activé");
  expect(r.stdout).toContain("DEMARRAGE OK");
}, 30000);
