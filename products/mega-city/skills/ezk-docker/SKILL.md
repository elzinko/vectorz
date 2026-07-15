---
name: ezk-docker
argument-hint: "[help|check|up|ps|logs|down|nuke]"
description: >-
  Pilot a local Docker stack for TESTING or DEV — spin up, monitor, tear down —
  directly via the Docker socket (docker compose CLI), with no bespoke code. Use
  whenever the user wants to "lance/monte une stack docker", start an app's
  services to test against, bring up a throwaway environment (db, redis, api…),
  watch container logs or status, or destroy a test stack cleanly. Enforces
  blast-radius conventions: project-prefixed stacks, mandatory teardown, never a
  global prune. NOT for CI pipelines (that is ezk-ci, act + Docker), NOT for
  building/pushing images to a registry, NOT for production orchestration.
---

# ezk-docker

Tu **pilotes une stack Docker locale de test/dev** — la monter, la surveiller, la détruire —
directement via le **socket Docker** (la CLI `docker` / `docker compose`), **sans code dédié**.
Un agent qui a un shell parle déjà au socket : ce skill n'ajoute pas d'outil, il apporte la
**procédure sûre et les conventions** pour ne pas transformer « je teste vite un truc » en
« j'ai flingué les containers d'un autre projet ».

Portable tel quel : cop1 (a `Bash`), ezk-product-builder (Claude Desktop/Code), toi en interactif.

## Frontière (lis ça avant de déclencher)

| Tu veux… | Skill |
|---|---|
| Monter une stack pour **tester** ton app, monitorer, détruire | **ezk-docker** (ici) |
| Valider une **pipeline GitHub Actions** en local (act) | `ezk-ci` |
| **Builder/pousser** une image vers un registre | ni l'un ni l'autre — CLI directe, hors skill |
| Orchestrer de la **prod** | hors-scope (jamais un skill de test) |

## Usage (sous-commandes)

`/ezk-docker [sous-commande] [args]` — ou en langage naturel (« monte la stack de test »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau — ne lance rien |
| `check` / `doctor` | Pré-requis : `docker info` répond ; un `compose.yml`/`docker-compose.yml` existe (ou on en génère un éphémère) |
| `up [service…]` | `docker compose -p <projet> up -d --wait` (attend le healthy). **Défaut** d'une demande naturelle de démarrage |
| `ps` / `status` | `docker compose -p <projet> ps` — état des services de **cette** stack |
| `logs [service]` | `docker compose -p <projet> logs -f --tail=100` |
| `down` | `docker compose -p <projet> down` — arrête et retire **cette** stack (garde les volumes) |
| `nuke` | `docker compose -p <projet> down -v` — **+ volumes de cette stack**. À confirmer, jamais implicite |

> Demande naturelle → route vers `up` (après `check`), puis rappelle le `down` à faire.
> Sous-commande non reconnue → traite en prose (le skill reste pilotable naturellement).

## Conventions de blast-radius (le cœur du skill)

Le socket Docker = **contrôle total du daemon** (root-équivalent). Ces règles bornent le rayon :

1. **Toujours scoper par projet.** `docker compose -p ezk-<contexte> …` (ex. `ezk-cop1-test`).
   Le préfixe `ezk-` rend tes stacks de test **identifiables** et **isolées** des vrais containers.
2. **Ne détruire QUE ce qu'on a monté.** Cible par nom de projet / label, **jamais** par balayage
   global. Avant un `down -v`, vérifie le projet ciblé avec `docker compose -p <projet> ps`.
3. **INTERDITS absolus** (ils tapent hors périmètre) :
   - `docker system prune` / `docker volume prune` / `docker network prune` **globaux**
   - `docker rm -f $(docker ps -aq)` et tout `$(… ps -aq)` non filtré par projet
   - suppression d'un volume/réseau **non préfixé** `ezk-`
4. **Teardown obligatoire.** Ce que tu `up`, tu le `down`. Si tu montes une stack pour un test,
   programme le `down` dans le même flux (finally/trap côté agent) — pas de stack orpheline.
5. **`compose` project-scoped > `docker run` nu** pour toute stack : le projet donne le teardown
   atomique et l'isolation réseau/volume gratuitement.

## Pré-requis

- **Docker lancé** : `docker info` doit répondre (sinon : démarrer Docker Desktop).
- **Un fichier compose** à la racine (`compose.yml` / `docker-compose.yml`). Sinon, deux options :
  générer un `compose.ezk-test.yml` **éphémère** (et le supprimer au teardown), ou `docker run`
  ponctuel scopé par `--name ezk-<contexte>-<svc>` + `--label ezk.stack=<contexte>`.

## Savoir-clé — les pièges non-évidents

### Attendre que ce soit *prêt*, pas juste *lancé*
`up -d` rend la main dès que les containers démarrent, **pas** quand l'app répond. Utilise
`--wait` (attend les healthchecks) — et si un service n'a pas de `healthcheck:`, ajoute-en un
dans le compose de test, sinon `--wait` ne garantit rien. Sans healthcheck : poll le port/endpoint.

### Collisions de ports
Une stack de test qui bind `5432`/`6379`/`3000` entre en collision avec un service déjà lancé.
Préfère des **ports éphémères** (`"0:5432"` → Docker attribue) puis lis le port réel via
`docker compose -p <projet> port <svc> 5432`, ou mappe sur des ports décalés dédiés au test.

### Nettoyage garanti même en cas d'échec
Le teardown doit tourner **même si le test plante**. Côté agent : enveloppe `up … / test / down`
de sorte que le `down` s'exécute dans tous les cas (l'équivalent d'un `finally`). Une stack laissée
debout mange RAM/ports et fausse le run suivant.

### `-p` partout, sinon compose invente un nom
Sans `-p`, `docker compose` déduit le nom de projet du **dossier courant** — deux `cwd` différents =
deux stacks « fantômes » que tu ne retrouves pas pour les `down`. **Fixe `-p ezk-<contexte>`** sur
**chaque** commande de la session (up, ps, logs, down) pour cibler la même stack.

### Isolation vs le reste de ta machine
`down` d'un projet ne touche **que** ce projet — c'est justement pourquoi on scope tout par `-p`.
Si tu te retrouves à vouloir un `prune` « pour nettoyer », c'est le signal que tu n'as **pas** scopé :
reviens aux règles ci-dessus plutôt que de balayer large.

## Monitoring rapide

```bash
docker compose -p ezk-<ctx> ps                 # état des services de la stack
docker compose -p ezk-<ctx> logs -f --tail=100 # logs live
docker compose -p ezk-<ctx> logs <svc>         # logs d'un service
docker stats $(docker compose -p ezk-<ctx> ps -q)  # CPU/RAM live de CETTE stack (scopé)
```

## Limitations honnêtes (à dire à l'utilisateur)

- **Pas un bac à sable de sécurité.** Le socket donne un contrôle root-équivalent ; ce skill borne le
  *rayon d'usage* par convention, pas par isolation forte. À réserver aux contextes de confiance.
- **Pas de garantie machine-vérifiée** que le teardown a tourné — c'est une discipline de flux, pas un
  invariant imposé par le type-système. Si tu as besoin d'une **garantie** (ex. cop1 en run nocturne
  non supervisé), ce n'est plus un skill : c'est un outil d'enforcement dédié (cf. ADR-023 de cop1).
- **Hors-scope build/push/registry et prod** — ce skill ne fait que du **test/dev éphémère local**.

## Référence / durcissement

Premier jet hand-écrit sur le gabarit `ezk-ci`. Pour le durcir (scripts paramétrables `up`/`down`
avec trap, `references/` détaillées, éval de déclenchement vs `ezk-ci`), passe-le à `skill-creator`
via `ezk-ezk`. Frontière ADR-023 (cop1) : ce skill = **capacité**, pas invariant superviseur.
