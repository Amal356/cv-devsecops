import { getStats } from "@/lib/api";

// Pied de page. Le nombre de messages vient de PostgreSQL : Next.js -> API Express -> PostgreSQL
// (activité 8, étape 230 : une trace complète à chaque affichage de page).
export default async function Footer() {
  const { data: stats } = await getStats();

  return (
    <footer>
      <p>© 2026 Amal Jemli. DevSecOps Portfolio réalisé avec Next.js.</p>
      {stats && <p>Messages reçus via le formulaire de contact : {stats.messages}</p>}
    </footer>
  );
}
