import { NextResponse } from "next/server";
import { configOidc, urlRealm, optionsCookie } from "@/lib/oidc";

// Déconnexion : supprime les cookies, puis ferme aussi la session Keycloak (single logout).
export async function GET(request) {
  const c = configOidc();
  if (!c) return new NextResponse("Connexion OIDC non configurée", { status: 503 });

  const url = new URL(`${urlRealm(c.publique, c)}/logout`);
  url.search = new URLSearchParams({
    client_id: c.clientId,
    post_logout_redirect_uri: `${c.app}/espace`,
    ...(request.cookies.get("idt")?.value ? { id_token_hint: request.cookies.get("idt").value } : {}),
  }).toString();

  const res = NextResponse.redirect(url);
  res.cookies.set("at", "", optionsCookie(0));
  res.cookies.set("idt", "", optionsCookie(0));
  return res;
}
