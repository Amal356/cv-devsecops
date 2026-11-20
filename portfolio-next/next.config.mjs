/** @type {import('next').NextConfig} */

// En-têtes de sécurité HTTP (activité 8, étape 239) : corrigent les alertes OWASP ZAP
// 10020 (anti-clickjacking), 10021 (X-Content-Type-Options) et 10063 (Permissions-Policy)
const enTetesSecurite = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig = {
  // Génère .next/standalone : un serveur Node.js minimal avec seulement les fichiers
  // nécessaires, utilisé par le Dockerfile pour produire une image légère
  output: "standalone",
  // Ne plus annoncer « X-Powered-By: Next.js » (alerte ZAP 10037)
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: enTetesSecurite }];
  },
};

export default nextConfig;
