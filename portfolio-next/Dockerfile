# ---------- Étape 1 : dépendances ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Étape 2 : build Next.js ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Produit .next/standalone (voir output: "standalone" dans next.config.mjs)
RUN npm run build

# ---------- Étape 3 : image finale d'exécution ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Seuls le serveur minimal, les fichiers statiques et public/ sont copiés :
# ni le code source, ni les dépendances de développement
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# Exécution avec l'utilisateur non root "node"
USER node

EXPOSE 3000

# API_URL n'est pas fixée ici : elle est fournie au lancement du conteneur
# (docker run -e API_URL=... ou docker compose)
CMD ["node", "server.js"]
