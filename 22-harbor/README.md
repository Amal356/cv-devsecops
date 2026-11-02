# Activité 5 – Partie 20 : Registre privé Harbor (étapes 90 à 95)

## Étape 90 – Installation

Harbor v2.15.4 est installé sur `ubuntu-server-26`, la VM qui fait tourner Jenkins, avec le script [`install-harbor.sh`](install-harbor.sh) :

- installeur *online* (les images Harbor viennent de Docker Hub), avec **Trivy intégré** (`--with-trivy`) ;
- HTTP sur le port **8090**, nom d'hôte `localhost` : Docker accepte un registre HTTP sur `localhost` sans configuration, donc Jenkins pousse sur `localhost:8090` ;
- le mot de passe admin est demandé à l'installation, celui de la base est généré aléatoirement : aucun secret dans Git.

```bash
free -h                                    # Harbor demande environ 2 à 4 Go de RAM
sudo bash 22-harbor/install-harbor.sh
sudo docker compose -f /opt/harbor/docker-compose.yml ps
```

Depuis Windows, une redirection de port VirtualBox suffit :

```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" controlvm "ubuntu-server-26" natpf1 "harbor,tcp,,8090,,8090"
```

L'interface est alors accessible sur `http://localhost:8090`.

![Harbor installé](screenshots/90-harbor.png)

## Étape 91 – Publication depuis le pipeline

Le stage Jenkins *Publication Harbor* pousse les deux images après les contrôles de sécurité :

| Image | Tags |
| :--- | :--- |
| `localhost:8090/devsecops/devsecops-api` | `<sha court du commit>`, `latest` |
| `localhost:8090/devsecops/devsecops-portfolio` | `<sha court du commit>`, `latest` |

Noms complets publiés lors du build *à compléter* (fichier `images-harbor.txt` archivé par Jenkins) :

```text
à compléter, par ex. localhost:8090/devsecops/devsecops-api@sha256:...
```

![Images dans Harbor](screenshots/91-images.png)

## Étape 92 – RBAC : projet, utilisateurs, robot account

| Élément | Configuration | Droits |
| :--- | :--- | :--- |
| Projet `devsecops` | Privé (pas d'accès anonyme) | — |
| Utilisateur `amal` | Membre du projet, rôle **Developer** | push et pull, pas d'administration |
| Utilisateur `lecteur` | Membre du projet, rôle **Guest** | pull uniquement |
| Robot `robot$devsecops+jenkins` | Robot account du projet, expiration 90 jours | *Repository* : Push et Pull (images, signatures Cosign et attestations), rien d'autre |

Le compte `admin` ne sert qu'à l'administration ; le pipeline utilise uniquement le robot (credential Jenkins `harbor-robot`). Un robot ne peut pas se connecter à l'interface, n'a accès qu'à un projet et peut être révoqué sans toucher aux comptes humains.

![Membres du projet](screenshots/92-membres.png)
![Robot account](screenshots/92-robot.png)

## Étape 93 – Scan automatique Harbor comparé au scan Trivy du pipeline

Projet `devsecops` → *Configuration* → **Automatically scan images on push** activé.

| Image | Trivy du pipeline (Jenkins) | Scan Harbor | Écart |
| :--- | :--- | :--- | :--- |
| devsecops-api | *à compléter* | *à compléter* | |
| devsecops-portfolio | *à compléter* | *à compléter* | |

*Analyse :* Harbor utilise lui aussi Trivy. Les résultats sont donc proches ; les écarts viennent de la version de Trivy et de la date de la base de vulnérabilités de chacun. Le scan du pipeline **bloque** une image avant sa publication. Le scan Harbor **surveille** les images déjà stockées : il peut être relancé quand de nouvelles CVE sont publiées, et la politique *Prevent vulnerable images from running* bloque le pull d'une image trop vulnérable.

![Scan Harbor](screenshots/93-scan.png)

## Étape 94 – Politique de rétention

Projet `devsecops` → *Policy* → *Tag Retention* :

| Règle | Dépôts | Conserver | Tags |
| :--- | :--- | :--- | :--- |
| 1 | `**` | les **5** artefacts poussés le plus récemment | `**` |
| 2 | `**` | toujours | `latest` |

Exécution planifiée chaque jour. Un *Dry run* montre ce qui serait supprimé sans rien supprimer. Le *Garbage Collection* (Administration) libère ensuite l'espace disque.

![Politique de rétention](screenshots/94-retention.png)

## Étape 95 – GitHub Container Registry comparé à Harbor

| Critère | GHCR (`ghcr.io/amal356/...`) | Harbor (`localhost:8090/devsecops/...`) |
| :--- | :--- | :--- |
| Hébergement | Service GitHub, rien à installer | Auto-hébergé : VM, disque, sauvegardes, mises à jour à notre charge |
| Accès | Internet ; public ou privé | Réseau privé, pas d'exposition publique |
| Authentification CI | `GITHUB_TOKEN` du workflow, sans secret à gérer | Robot account (secret stocké dans Jenkins) |
| RBAC | Droits hérités du dépôt ou de l'organisation | Projets, rôles (Guest à Project Admin), robots à périmètre limité |
| Scan de vulnérabilités | Non intégré (Trivy et Dependabot dans le pipeline) | Trivy intégré, scan à l'envoi, blocage du pull |
| Rétention | Manuelle ou via une Action | Politiques par projet, *garbage collection* |
| Signatures / SBOM | Stockés comme artefacts OCI, vérifiés par cosign / `gh attestation` | Affichés comme *accessories* ; politique « signature obligatoire » possible |
| Coût | Gratuit pour un dépôt public | Gratuit (open source), mais coût en ressources |

GHCR convient aux images publiques, construites par GitHub Actions. Harbor convient à un registre interne, quand on veut garder le contrôle des images, des droits et des politiques de sécurité.
