# syntax=docker/dockerfile:1
# Frontend Next.js — build multi-stage (Activité 3 étape 38, optimisé à l'Activité 5 étape 86)
#
#   deps   : npm ci (cache npm BuildKit, hors image)
#   build  : next build -> .next/standalone (serveur minimal + dépendances réellement utilisées)
#   runner : Node.js + standalone, sans npm/yarn/corepack, utilisateur non root

# ---------- Étape 1 : dépendances ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- Étape 2 : build Next.js ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Adresse de l'API vue par le navigateur (formulaire de contact), intégrée au build.
# Ce n'est pas un secret : elle est visible par tous les visiteurs.
# nosemgrep
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Produit .next/standalone (voir output: "standalone" dans next.config.mjs)
RUN npm run build

# ---------- Étape 3 : image finale d'exécution ----------
FROM node:22-alpine AS runner

# Correctifs Alpine ; npm, npx, yarn et corepack ne servent pas à l'exécution : supprimés
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

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

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

# API_URL n'est pas fixée ici : elle est fournie au lancement du conteneur
CMD ["node", "server.js"]
