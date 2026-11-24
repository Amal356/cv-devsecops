import { createHash, randomBytes } from "node:crypto";

// Activité 9, partie 50 : connexion OIDC à Keycloak (flux « authorization code » + PKCE),
// entièrement côté serveur Next.js. Le navigateur ne voit jamais le secret du client ni les jetons :
// ils restent dans des cookies httpOnly, illisibles par JavaScript.
//
// Deux adresses pour Keycloak :
//   KEYCLOAK_PUBLIC_URL   : celle du navigateur (page de connexion), ex. http://keycloak.local:8088
//   KEYCLOAK_INTERNAL_URL : celle du serveur Next.js dans le cluster (échange du code contre les jetons)
export function configOidc() {
  const c = {
    publique: process.env.KEYCLOAK_PUBLIC_URL,
    interne: process.env.KEYCLOAK_INTERNAL_URL,
    realm: process.env.OIDC_REALM,
    clientId: process.env.OIDC_CLIENT_ID,
    secret: process.env.OIDC_CLIENT_SECRET,
    app: process.env.APP_URL,
  };
  return Object.values(c).every(Boolean) ? c : null;
}

const base64url = (b) => Buffer.from(b).toString("base64url");
export const aleatoire = () => base64url(randomBytes(32));
export const challengePkce = (verifier) => base64url(createHash("sha256").update(verifier).digest());

export const urlRealm = (racine, c) => `${racine}/realms/${encodeURIComponent(c.realm)}/protocol/openid-connect`;

// Lecture des informations du jeton pour l'AFFICHAGE seulement : la vérification de la signature
// est faite par l'API (src/lib/auth.js), qui est la seule à décider de l'accès.
export function lireClaims(jwt) {
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export const optionsCookie = (maxAge, path = "/") => ({ httpOnly: true, sameSite: "lax", path, maxAge });
