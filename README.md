# Étape 5 – Mini CV One Page (HTML5 / CSS3 / JavaScript)

Dépôt GitHub : https://github.com/Amal356/cv-devsecops

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page (profil, compétences, expérience, formation) |
| `style.css` | Mise en page en deux colonnes, responsive, thème clair et sombre |
| `script.js` | Bouton de bascule clair / sombre, mémorisé dans le navigateur |

## Initialisation du dépôt Git

```bash
mkdir ~/cv-devsecops && cd ~/cv-devsecops
git init -b main
git add .
git commit -m "Mini CV one page"
```

## Test depuis la machine physique

```bash
python3 -m http.server 8081
```

Puis ouverture de `http://localhost:8081` dans le navigateur de la machine physique
(redirection de port VirtualBox : hôte 8081 → VM 8081).

## Capture d'écran

![Mini CV](screenshots/01-cv.png)
