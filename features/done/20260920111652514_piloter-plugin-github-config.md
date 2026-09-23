---
id: "20260920111652514"
title: "Piloter le plugin github par la config — commande terminal `ezk config github on/off`"
type: feature # feature | bug | refactor | chore | epic
priority: P0 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [github-optionnel, plugin, cli]
status: shipped
ready: 2026-09-20 # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr: "#259"
evidence: none # commande de terminal, aucun écran
created: 2026-09-20
---

# 20260920111652514 — Piloter le plugin github par la config

## En clair

Aujourd'hui on peut **lire** l'état du plugin github (`ezk:config` affiche `pr`/`ci`/`codex-review`
ON/OFF), mais pas le **piloter** : pour couper GitHub, il faut éditer `.vectorz/config.yml` à la
main. On ajoute une commande de terminal qui **écrit** cette config en un geste :
`ezk config github off` / `on` / `status`. Couper ou rebrancher GitHub sur un projet devient une
commande, plus une édition YAML manuelle.

## Contexte / Problème

La fiche [[20260916225506856]] (livrée) a posé le **lecteur** : `pnpm --dir products/mega-city
ezk:config` résout et **affiche** les capacités. Mais rien ne les **écrit** : pour activer ou
couper le plugin, l'utilisateur édite `.vectorz/config.yml` à la main — sans garde-fou (une faute
YAML casse la lecture, fail-fast) et sans découvrabilité.

Le PO veut un **interrupteur** simple (Thomas, 2026-09-20). C'est le geste manquant entre « la
méthode sait lire la config » et « l'utilisateur pilote la config ».

## Proposition

**Compose, ne réimplémente pas.** Étendre le CLI `ezk:config` (856) de la **lecture** à
l'**écriture**, comme commande de **terminal** (geste déterministe, pas un skill de chat) :

- `ezk config github off` → écrit `github: false` (crée `.vectorz/config.yml` s'il manque).
- `ezk config github on` → rétablit le défaut ON (retire la coupure).
- `ezk config github status` → l'affichage actuel (le lecteur de 856).
- Granulaire : `ezk config github pr off` → `github: { pr: false }` (idem `ci`, `codex-review`).

Réutilise le résolveur/loader de 856 (`src/core/project-config.ts`, `src/loaders/project-config.ts`)
pour relire/valider après écriture. Écriture **non destructive** : préserve les autres clés du YAML.

**Nommage.** Verbe de **terminal**, futur domaine du CLI `ezk` ([[20260903134906920]]) —
`ezk config github …` (nom exact `config` vs `plugin` figé au grooming/avec le CLI). Aujourd'hui,
en attendant le CLI, exposé via `pnpm --dir products/mega-city ezk:config …`. Un `/ezk-config` de
chat reste une **surcouche mince optionnelle** plus tard (il appellerait ce script) — hors scope.

**Cette fiche est la fille « pilotage/activation » de [[20260916225506858]]** (axe 2 : activer +
options fines), sœur de [[20260916225506856]] (856 lit, celle-ci écrit).

**Périmètre (borné P0).** Pilotage de l'**activation** : `on` / `off` / `status` + granulaire
`pr`/`ci`/`codex-review`. **Hors scope** : `install` / `uninstall` (rendre le plugin *disponible*
par projet = **axe 1** de [[20260916225506858]], dépend du modèle d'install-par-projet [[0170]]/[[0087]]
et de la racine paramétrable [[20260826173221323]]) ; le skill de chat `/ezk-config`.

## Critères d'acceptation

- [ ] `ezk config github off` écrit `github: false` dans `.vectorz/config.yml` (fichier créé s'il n'existe pas).
- [ ] `ezk config github on` rétablit le défaut « tout ON » (coupure retirée).
- [ ] Le pilotage **granulaire** marche : `ezk config github pr off` produit `github: { pr: false }`.
- [ ] Après écriture, `ezk config github status` (lecteur 856) reflète immédiatement le nouvel état.
- [ ] Écriture **non destructive** : les autres clés d'un `.vectorz/config.yml` existant sont préservées ; un YAML malformé lève une erreur claire (ne l'écrase pas en silence).
- [ ] `install` / `uninstall` **restent hors périmètre** (renvoient explicitement vers l'axe 1 de [[20260916225506858]]).
- [ ] Gate mega-city verte (`pnpm test` + `typecheck` + `test:scripts`).

## Comment vérifier

Procédure rejouable **depuis la racine d'un clone frais**, dans un projet jouet (le CLI `ezk`
portable est fiché à part, [[20260903134906920]]) ; un panel adverse la rejoue et coche ci-dessus :

```bash
pnpm --dir products/mega-city ezk:config github off && pnpm --dir products/mega-city ezk:config github status  # pr/ci/codex OFF
pnpm --dir products/mega-city ezk:config github on  && pnpm --dir products/mega-city ezk:config github status   # tout ON
pnpm --dir products/mega-city ezk:config github pr off && cat .vectorz/config.yml                              # github: { pr: false }
```

Le panel vérifie en plus : un `.vectorz/config.yml` portant déjà d'autres clés garde ces clés
après écriture ; un YAML volontairement cassé fait échouer la commande avec un message nommant le fichier.

## Notes / décisions

- **Demande PO** (Thomas, 2026-09-20) : « une commande pour configurer la méthodo — `ezk config
  plugin github off/on/install/uninstall` ». Cadrage validé : commande **terminal** (pas skill
  chat) ; scope **`on`/`off`/`status`** ; `install`/`uninstall` hors-scope (axe 1 de 858).
- **Résolution du nœud d'archi** (PO, 2026-09-20, à graver au panel 858) : *une feature = une
  branche* est l'invariant ; la **PR est la projection de l'adaptateur GitHub** quand il est
  branché (pattern port/adaptateur). Pas de plugin github → pas de PR. Ça allège 858 (formaliser,
  pas trancher un nœud ouvert).
- **P0 posée par le PO** pour le prochain sprint. Née `idea` ; gate `ready` avant tirage.
- Voisines : [[20260916225506856]] (lecteur, livré) · [[20260916225506858]] (chapeau plugin) ·
  [[20260903134906920]] (CLI `ezk`, futur porteur de la commande).
