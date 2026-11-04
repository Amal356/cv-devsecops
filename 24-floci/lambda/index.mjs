// Lambda de démonstration (Activité 6, étape 112) : renvoie un message de bienvenue
export const handler = async (event) => {
  const nom = event?.nom ?? "inconnu";
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Bonjour ${nom}, depuis une Lambda Floci`, runtime: process.version }),
  };
};
