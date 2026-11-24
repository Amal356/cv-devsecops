import { NextResponse } from "next/server";
import { configOidc, urlRealm, optionsCookie } from "@/lib/oidc";

// Retour de Keycloak : vérifie state, échange le code contre les jetons (canal serveur à serveur,
// avec le secret du client et le code_verifier PKCE), puis les range dans des cookies httpOnly.
export async function GET(request) {
  const c = configOidc();
  if (!c) return new NextResponse("Connexion OIDC non configurée", { status: 503 });

  const params = request.nextUrl.searchParams;
  let tx = null;
  try { tx = JSON.parse(request.cookies.get("oidc_tx")?.value ?? "null"); } catch { /* cookie absent ou modifié */ }
  if (!tx || !params.get("code") || params.get("state") !== tx.state) {
    return new NextResponse("Requête de connexion invalide (state)", { status: 400 });
  }

  const reponse = await fetch(`${urlRealm(c.interne, c)}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.get("code"),
      redirect_uri: `${c.app}/auth/callback`,
      client_id: c.clientId,
      client_secret: c.secret,
      code_verifier: tx.verifier,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!reponse.ok) {
    console.error(JSON.stringify({ niveau: "erreur", message: "échange du code OIDC refusé", status: reponse.status }));
    return new NextResponse("Connexion refusée par Keycloak", { status: 502 });
  }
  const jetons = await reponse.json();

  const res = NextResponse.redirect(`${c.app}/espace`);
  res.cookies.set("oidc_tx", "", optionsCookie(0, "/auth"));
  res.cookies.set("at", jetons.access_token, optionsCookie(jetons.expires_in ?? 300));
  res.cookies.set("idt", jetons.id_token, optionsCookie(3600));
  return res;
}
