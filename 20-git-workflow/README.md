# Activité 5 – Partie 18 : Git Workflow (étapes 79 à 84)

## Étape 79 – branch → Pull Request → review → merge

Plus personne ne travaille directement sur `main` : chaque changement passe par une branche, puis une Pull Request.

```bash
git switch main && git pull
git switch -c feat/formulaire-contact        # 1. branche
# ... modifications, commits Conventional Commits ...
git push -u origin feat/formulaire-contact   # 2. Pull Request ouverte sur GitHub
# 3. review : relecture du diff, commentaires, contrôles CI au vert
# 4. merge (squash) depuis GitHub, puis suppression de la branche
```

**Convention de nommage des branches** : `<type>/<description-courte-en-kebab-case>`, avec les mêmes types que les commits.

| Préfixe | Usage | Exemple |
| :--- | :--- | :--- |
| `feat/` | nouvelle fonctionnalité | `feat/activite-5` |
| `fix/` | correction de bug | `fix/validation-email` |
| `docs/` | documentation uniquement | `docs/readme-harbor` |
| `ci/` | pipelines, workflows | `ci/scan-trivy` |
| `refactor/` | réorganisation sans changement de comportement | `refactor/dockerfile-multistage` |
| `chore/` | maintenance, dépendances | `chore/maj-next` |
| `dependabot/...` | créées automatiquement par Dependabot | `dependabot/npm_and_yarn/api/...` |

Seul développeur du projet : je ne peux pas approuver ma propre PR. La review consiste donc à relire le diff dans l'onglet *Files changed* et à commenter avant le merge. Le nombre d'approbations obligatoires est fixé à 0, mais la PR et les contrôles restent obligatoires.

## Étape 80 – Protection de la branche principale

*Settings → Rules → Rulesets → New branch ruleset*, cible `main` :

| Règle | Valeur |
| :--- | :--- |
| Restrict deletions | activée |
| Block force pushes | activée |
| Require a pull request before merging | activée (0 approbation, merge par *squash*) |
| Require status checks to pass | activée (étape 81) |
| Require branches to be up to date before merging | activée |

Résultat : un `git push` direct sur `main` est refusé.

```text
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
```

![Ruleset de la branche main](screenshots/80-ruleset.png)

![Push direct refusé](screenshots/80-push-refuse.png)

## Étape 81 – Contrôles obligatoires avant le merge

Checks requis dans le ruleset :

| Contrôle demandé | Check GitHub |
| :--- | :--- |
| tests | `tests-api`, `tests-frontend` |
| SAST | `sast` |
| secrets | `secrets` |
| dependencies | `dependencies` |
| image scan | `image-scan (api)`, `image-scan (portfolio)` |
| (bonus) messages de commit | `commits` |

Démonstration : une PR qui ajoute `lodash@4.17.4` (20 CVE dont des critiques, cf. activité 4) est bloquée par le check `dependencies`. Le bouton *Merge* reste désactivé.

![Pull Request bloquée par un contrôle en échec](screenshots/81-pr-bloquee.png)

## Étape 82 – Conventional Commits

Format : `<type>(<portée facultative>): <description>`.

```text
feat: ajout du formulaire de contact
fix: correction de la validation email
docs: mise à jour du README
ci: épinglage des actions par SHA
feat(api)!: suppression de la route /api/v1    <- « ! » = changement incompatible
```

Le job `commits` vérifie chaque commit d'une PR avec **commitlint** ([`commitlint.config.mjs`](../commitlint.config.mjs), règles `@commitlint/config-conventional`). Un message comme `Ajout formulaire` fait échouer la PR.

## Étape 83 – Semantic Versioning

Version `MAJOR.MINOR.PATCH`, calculée automatiquement à partir des commits fusionnés depuis la dernière release :

| Commits depuis la dernière release | Incrément | Exemple |
| :--- | :--- | :--- |
| `fix:`, `perf:` | PATCH | 1.0.0 → 1.0.1 |
| `feat:` | MINOR | 1.0.1 → 1.1.0 |
| `feat!:` ou `BREAKING CHANGE:` | MAJOR | 1.1.0 → 2.0.0 |
| `docs:`, `ci:`, `chore:`, `test:`... | aucune release | — |

## Étape 84 – Changelog et releases avec semantic-release

Configuration : [`.releaserc.json`](../.releaserc.json) ; outillage figé dans le [`package.json`](../package.json) racine (semantic-release 25.0.9). Le job `release` de [`ci.yml`](../.github/workflows/ci.yml) tourne sur chaque push vers `main`, une fois tous les contrôles passés :

1. analyse des commits (preset `conventionalcommits`) et calcul de la version ;
2. génération des notes de version et du `CHANGELOG.md` ;
3. création du tag `vX.Y.Z` et de la release GitHub, avec `CHANGELOG.md` en pièce jointe ;
4. transmission de la version aux jobs suivants : images taguées `X.Y.Z`, SBOM ajoutés à la release (partie 21).

Le changelog n'est pas recommité dans `main` : la branche est protégée, et la release GitHub joue ce rôle.

![Release générée automatiquement](screenshots/84-release.png)
