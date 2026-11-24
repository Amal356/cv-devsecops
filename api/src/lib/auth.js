import { createRemoteJWKSet, jwtVerify } from "jose";

// Activité 9, partie 50 : vérification des jetons OIDC émis par Keycloak.
// L'API ne fait confiance à un jeton que si :
//   - sa signature est valide (clés publiques du realm, téléchargées sur OIDC_JWKS_URL) ;
//   - son émetteur (iss) est exactement OIDC_ISSUER ;
//   - il est destiné à l'API (aud contient OIDC_AUDIENCE) ;
//   - il n'est pas expiré (exp).
// Les rôles sont lus dans realm_access.roles (rôles du realm Keycloak).
let jwks;
function clesPubliques() {
  jwks ??= createRemoteJWKSet(new URL(process.env.OIDC_JWKS_URL));
  return jwks;
}

export const authConfiguree = () =>
  Boolean(process.env.OIDC_ISSUER && process.env.OIDC_JWKS_URL && process.env.OIDC_AUDIENCE);

export async function verifierJeton(jeton) {
  const { payload } = await jwtVerify(jeton, clesPubliques(), {
    issuer: process.env.OIDC_ISSUER,
    audience: process.env.OIDC_AUDIENCE,
    algorithms: ["RS256"],
  });
  return payload;
}

// Middleware : 401 sans jeton valide, 403 si le rôle manque, sinon req.utilisateur est rempli.
export function exigerRole(role) {
  return async (req, res, next) => {
    if (!authConfiguree()) {
      return res.status(503).json({ erreur: "Authentification non configurée sur cet environnement" });
    }
    const [type, jeton] = (req.get("authorization") || "").split(" ");
    if (type !== "Bearer" || !jeton) {
      return res.status(401).set("WWW-Authenticate", 'Bearer realm="portfolio"').json({ erreur: "Authentification requise" });
    }
    let payload;
    try {
      payload = await verifierJeton(jeton);
    } catch {
      return res.status(401).set("WWW-Authenticate", 'Bearer error="invalid_token"').json({ erreur: "Jeton invalide ou expiré" });
    }
    const roles = payload.realm_access?.roles ?? [];
    req.utilisateur = { nom: payload.preferred_username, roles };
    if (!roles.includes(role)) {
      return res.status(403).json({ erreur: `Rôle « ${role} » requis`, utilisateur: payload.preferred_username, roles });
    }
    next();
  };
}
