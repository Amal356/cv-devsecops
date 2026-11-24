import { cookies } from "next/headers";
import { configOidc, lireClaims } from "@/lib/oidc";

export const metadata = { title: "Espace connecté – Amal Jemli" };

// Activité 9, partie 50 : page protégée par Keycloak.
// Elle appelle les 3 routes protégées de l'API avec le jeton de l'utilisateur et affiche
// la réponse de chacune : accès autorisé (200) ou refusé (403) selon ses rôles.
const ROUTES = [
  { chemin: "/api/espace/moi", role: "user" },
  { chemin: "/api/espace/developpeur", role: "developer" },
  { chemin: "/api/espace/admin/messages", role: "admin" },
];

async function appeler(chemin, jeton) {
  try {
    const r = await fetch(`${process.env.API_URL}${chemin}`, {
      headers: { Authorization: `Bearer ${jeton}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return { status: r.status, corps: await r.json().catch(() => null) };
  } catch (e) {
    return { status: "erreur", corps: { erreur: e.message } };
  }
}

export default async function Espace() {
  if (!configOidc()) {
    return (
      <section className="detail">
        <h1>Espace connecté</h1>
        <p className="lead">La connexion Keycloak n&apos;est pas activée sur cet environnement.</p>
      </section>
    );
  }

  const jeton = (await cookies()).get("at")?.value;
  const claims = jeton ? lireClaims(jeton) : null;
  if (!claims) {
    return (
      <section className="detail">
        <h1>Espace connecté</h1>
        <p className="lead">Connectez-vous avec votre compte Keycloak (realm « portfolio »).</p>
        <a className="btn" href="/auth/login">Se connecter</a>
      </section>
    );
  }

  const roles = (claims.realm_access?.roles ?? []).filter((r) => ["user", "developer", "admin"].includes(r));
  const resultats = await Promise.all(ROUTES.map(async (r) => ({ ...r, ...(await appeler(r.chemin, jeton)) })));

  return (
    <section className="detail">
      <h1>Espace connecté</h1>
      <p className="lead">
        Connectée en tant que <strong>{claims.preferred_username}</strong> – rôles : {roles.join(", ") || "aucun"}
      </p>
      <table className="acces">
        <thead>
          <tr><th>Route de l&apos;API</th><th>Rôle requis</th><th>Résultat</th></tr>
        </thead>
        <tbody>
          {resultats.map((r) => (
            <tr key={r.chemin}>
              <td><code>GET {r.chemin}</code></td>
              <td>{r.role}</td>
              <td>
                <strong>{r.status === 200 ? "✅ autorisé" : r.status === 403 ? "⛔ refusé" : "⚠️"} ({r.status})</strong>
                <pre>{JSON.stringify(r.corps, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <a className="btn" href="/auth/logout">Se déconnecter</a>
    </section>
  );
}
