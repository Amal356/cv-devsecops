/** @type {import('next').NextConfig} */
const nextConfig = {
  // Génère .next/standalone : un serveur Node.js minimal avec seulement les fichiers
  // nécessaires, utilisé par le Dockerfile pour produire une image légère
  output: "standalone",
};

export default nextConfig;
