# Activité 4 – Partie XIII : Base de données PostgreSQL (étapes 53 à 56)

## Étape 53 – Service PostgreSQL dans Docker Compose

Extrait de [`docker-compose.fullstack.yml`](../docker-compose.fullstack.yml) :

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-amal}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?définir POSTGRES_PASSWORD dans le fichier .env}
    POSTGRES_DB: ${POSTGRES_DB:-portfolio_db}
  volumes:
    - db-data:/var/lib/postgresql/data
  ports:
    - "127.0.0.1:5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
```

- **Mot de passe** : lu dans le fichier `.env`, qui n'est pas versionné. Sans `.env`, Compose refuse de démarrer avec un message clair.
- **Volume `db-data`** : les messages survivent à `docker compose down`.
- **`127.0.0.1:5432`** : la base est joignable depuis la VM (psql, tests), mais pas depuis le réseau.
- **`healthcheck`** : l'API (`depends_on: condition: service_healthy`) ne démarre que lorsque PostgreSQL accepte les connexions.

```bash
cp .env.example .env        # puis remplacer CHANGE_ME par un mot de passe
docker compose -f docker-compose.fullstack.yml up -d --build
docker compose -f docker-compose.fullstack.yml ps
```

![docker compose ps avec le service db](screenshots/53-compose-ps-db.png)

## Étape 54 – Enregistrement des messages

Dans [`contact.js`](../api/src/routes/contact.js), après la validation Zod :

```javascript
const contact = await prisma.contact.create({ data: { name, email, message } });
```

Message envoyé depuis le formulaire du portfolio, puis lecture dans la base :

```bash
docker exec -it devsecops-db psql -U amal -d portfolio_db \
  -c 'SELECT id, name, email, left(message, 40) AS message, "createdAt" FROM "Contact";'
```

![Messages enregistrés dans la table Contact](screenshots/54-select-contact.png)

## Étape 55 – Migrations avec Prisma

Schéma : [`api/prisma/schema.prisma`](../api/prisma/schema.prisma)

```prisma
model Contact {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}
```

Création de la migration (une fois, en développement, base démarrée) :

```bash
cd api
npx prisma migrate dev --name init
```

Prisma écrit le SQL dans [`prisma/migrations/20261029000000_init/migration.sql`](../api/prisma/migrations/20261029000000_init/migration.sql), versionné dans Git :

```sql
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
```

En production, le conteneur de l'API applique les migrations en attente à chaque démarrage (`CMD` du [Dockerfile](../api/Dockerfile)) :

```dockerfile
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && exec node src/server.js"]
```

```bash
docker logs devsecops-api | head
```

![Migration appliquée au démarrage de l'API](screenshots/55-migrate-deploy.png)

Intérêt : la structure de la base évolue avec le code, de façon versionnée et rejouable. Une nouvelle VM (étape 45) obtient automatiquement la bonne table.

## Étape 56 – Variables de connexion dans .env.example

Deux fichiers d'exemple, sans aucun secret réel :

[`.env.example`](../.env.example) (lu par Docker Compose) :

```dotenv
POSTGRES_USER=amal
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=portfolio_db
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

[`api/.env.example`](../api/.env.example) (API lancée hors Docker) :

```dotenv
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://amal:CHANGE_ME@localhost:5432/portfolio_db?schema=public
CONTACT_RATE_LIMIT=5
CONTACT_RATE_WINDOW_MS=900000
```

Les vrais fichiers `.env` sont exclus de Git (`.gitignore`) et des images Docker (`.dockerignore`). Gitleaks vérifie dans le pipeline qu'aucun secret n'a été commité (étape 64).
