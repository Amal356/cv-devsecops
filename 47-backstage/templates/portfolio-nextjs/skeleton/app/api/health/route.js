// Vérification de santé utilisée par le pipeline après chaque déploiement
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "portfolio-nextjs",
    version: process.env.APP_VERSION || "dev",
  });
}
