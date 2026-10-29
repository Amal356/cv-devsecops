# Partie IX – Variables d'environnement et configuration

## Étape 36 – L'URL de l'API dans `API_URL`

Le frontend ne contient pas l'adresse de l'API : il la lit dans la variable d'environnement **`API_URL`** ([`portfolio-next/lib/api.js`](../portfolio-next/lib/api.js)) :

```javascript
const base = process.env.API_URL;
if (!base) throw new Error("variable API_URL non définie");

const reponse = await fetch(`${base}${chemin}`, { cache: "no-store" });
```

**Pourquoi l'URL ne doit pas être codée en dur :** l'adresse de l'API change selon l'endroit où l'application tourne :

| Environnement | Valeur de `API_URL` |
|---|---|
| Développement sur la VM | `http://localhost:4000` |
| Docker Compose | `http://api:4000` (nom du service dans le réseau Compose) |
| Production | l'adresse du serveur de production |

Avec une adresse écrite dans le code, il faudrait modifier le code et reconstruire l'application à chaque changement d'environnement. Avec une variable, **le même code et la même image Docker** fonctionnent partout : seule la configuration change au lancement. C'est un principe des applications *Twelve-Factor* : la configuration est séparée du code.

La variable est lue **côté serveur, à chaque requête** (rendu dynamique) : on peut donc la changer au lancement du conteneur, sans reconstruire l'image. Elle n'a pas le préfixe `NEXT_PUBLIC_` : elle n'est pas envoyée au navigateur.

L'API suit le même principe pour son port : `PORT` (par défaut 4000).

Lancement avec la variable :

```bash
API_URL=http://localhost:4000 npm run dev -- -H 0.0.0.0 -p 3000
```

## Étape 37 – Fichiers `.env.example`

Un fichier `.env.example` liste les variables nécessaires, avec des valeurs d'exemple. Il est versionné sur GitHub. Les vrais fichiers (`.env`, `.env.local`) restent sur la machine : ils sont exclus par `.gitignore`, car ils peuvent contenir des secrets (mots de passe, tokens).

[`portfolio-next/.env.example`](../portfolio-next/.env.example) :

```bash
# Variables d'environnement du frontend Next.js (exemple, aucun secret)
# Copier ce fichier en .env.local pour un usage local : cp .env.example .env.local

# Adresse de l'API Express, lue par le serveur Next.js à chaque requête
#  - en local sur la VM   : http://localhost:4000
#  - dans Docker Compose  : http://api:4000 (nom du service)
API_URL=http://localhost:4000
```

[`api/.env.example`](../api/.env.example) :

```bash
# Variables d'environnement de l'API (exemple, aucun secret)
# Copier ce fichier en .env pour un usage local : cp .env.example .env
PORT=4000
HOST=0.0.0.0
```

Le `.gitignore` de Next.js excluait tous les fichiers `.env*`. Une exception a été ajoutée pour que l'exemple soit publié :

```gitignore
.env*
!.env.example
```

Utilisation en local :

```bash
cd ~/cv-devsecops/portfolio-next
cp .env.example .env.local
npm run dev -- -H 0.0.0.0 -p 3000    # Next.js lit API_URL dans .env.local
```

Les fichiers `.dockerignore` excluent aussi les `.env` : aucun fichier de configuration local n'est copié dans les images Docker.
