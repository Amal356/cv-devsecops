import { OpenFeature } from "@openfeature/server-sdk";
import { OFREPProvider } from "@openfeature/ofrep-provider";

// Activité 9, étape 248 : feature flags avec OpenFeature (API standard, fournisseur interchangeable).
// Le fournisseur est flagd, interrogé en HTTP avec le protocole OFREP.
// Sans OFREP_ENDPOINT (tests, docker compose, environnements sans flagd) : aucun fournisseur,
// OpenFeature renvoie alors la valeur par défaut du code => la fonctionnalité reste désactivée.
if (process.env.OFREP_ENDPOINT) {
  OpenFeature.setProvider(
    new OFREPProvider({ baseUrl: process.env.OFREP_ENDPOINT, timeoutMs: 1000 }),
  );
}

export const flags = OpenFeature.getClient("devsecops-api");
