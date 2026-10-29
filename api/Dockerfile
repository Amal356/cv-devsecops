# Image officielle Node.js 22 (Alpine : image légère)
FROM node:22-alpine

# Mode production : Express désactive les messages de débogage
ENV NODE_ENV=production

WORKDIR /app

# Dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Code de l'API
COPY src ./src
COPY data ./data

# L'API écoute sur le port 4000
ENV PORT=4000
EXPOSE 4000

# Exécution avec l'utilisateur non root "node" fourni par l'image
USER node

# Docker vérifie régulièrement que l'API répond sur /api/health
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "src/server.js"]
