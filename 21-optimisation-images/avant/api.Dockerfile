# Image officielle Node.js 22 (Alpine : image légère)
FROM node:22-alpine

# OpenSSL est requis par les moteurs Prisma sur Alpine
RUN apk add --no-cache openssl

# Mode production : Express désactive les messages de débogage
ENV NODE_ENV=production

WORKDIR /app

# Dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Schéma et migrations Prisma, puis génération du client Prisma (étape 55)
COPY prisma ./prisma
RUN npx prisma generate

# Code de l'API
COPY src ./src
COPY data ./data

# Fichiers lisibles par l utilisateur node, quelles que soient les permissions d origine
RUN chmod -R a+rX /app/src /app/data /app/prisma

# L'API écoute sur le port 4000
ENV PORT=4000
EXPOSE 4000

# Exécution avec l'utilisateur non root "node" fourni par l'image
USER node

# Docker vérifie régulièrement que l'API répond sur /api/health
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

# Au démarrage : application des migrations en attente, puis lancement de l'API
CMD ["sh", "-c", "npx prisma migrate deploy && exec node src/server.js"]
