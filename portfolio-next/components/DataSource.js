// Indique d'où viennent les données affichées : l'API Express ou les fichiers locaux de secours
export default function DataSource({ source }) {
  return source === "api" ? (
    <p className="source source-api">Données fournies par l&apos;API Express</p>
  ) : (
    <p className="source source-local">API indisponible : données locales</p>
  );
}
