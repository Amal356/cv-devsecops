# syntax=docker/dockerfile:1
# API Express — build multi-stage (Activité 5, étape 86)
#
#   deps    : installe les dépendances de production, génère le client Prisma, prépare le code
#   runtime : image finale = Node.js + /app, sans npm, sans cache npm ni cache Prisma
#
# BuildKit (étape 88) : les caches npm et Prisma sont des « cache mounts » réutilisés d'un build
# à l'autre, mais jamais écrits dans une couche de l'image.

# ---------- Étape 1 : dépendances et code ----------
FROM node:23-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
ENV CHECKPOINT_DISABLE=1 PRISMA_HIDE_UPDATE_MESSAGE=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache/prisma \
    npm ci --omit=dev && npx prisma generate

COPY src ./src
COPY data ./data
# Lisible par tous quelles que soient les permissions d'origine (dossiers en 700 sur la VM, activité 4)
RUN chmod -R a+rX /app

# ---------- Étape 2 : image d'exécution ----------
FROM node:23-alpine AS runtime

# Correctifs de sécurité Alpine + OpenSSL (moteurs Prisma) ; suppression de npm, npx, yarn et corepack :
# inutiles à l'exécution, ils apportent une bonne partie des vulnérabilités signalées par Trivy
RUN apk upgrade --no-cache && apk add --no-cache openssl \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

ENV NODE_ENV=production \
    PORT=4000 \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
WORKDIR /app

# Fichiers appartenant à root, en lecture seule pour l'utilisateur node : l'API ne peut pas modifier son code
COPY --from=deps /app /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

# Migrations Prisma en attente, puis démarrage de l'API (npx n'existe plus : appel direct du CLI Prisma)
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node src/server.js"]
