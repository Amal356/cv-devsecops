import { NextResponse } from "next/server";
import { configOidc, aleatoire, challengePkce, urlRealm, optionsCookie } from "@/lib/oidc";

// Redirige le navigateur vers la page de connexion Keycloak.
// state : protège contre les attaques CSRF ; code_verifier (PKCE) : protège le code d'autorisation.
export async function GET() {
  const c = configOidc();
  if (!c) return new NextResponse("Connexion OIDC non configurée sur cet environnement", { status: 503 });

  const state = aleatoire();
  const verifier = aleatoire();
  const url = new URL(`${urlRealm(c.publique, c)}/auth`);
  url.search = new URLSearchParams({
    client_id: c.clientId,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: `${c.app}/auth/callback`,
    state,
    code_challenge: challengePkce(verifier),
    code_challenge_method: "S256",
  }).toString();

  const res = NextResponse.redirect(url);
  res.cookies.set("oidc_tx", JSON.stringify({ state, verifier }), optionsCookie(600, "/auth"));
  return res;
}
