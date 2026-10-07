---
id: "20261001192624192"
title: "Chemins des artefacts de méthode configurables (`scrum:`) — la fondation"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: ready
pr:
evidence: none # refactor d'outillage, pas d'UI
created: 2026-10-01
---

# 20261001192624192 — Chemins de process configurables (`scrum:`) — la fondation

**En clair.** C'est la **première** des 5 fiches du lot V0.9 « Ranger la maison ». Elle ne déplace
rien. Elle rend **configurables** les chemins où vivent les artefacts de process (récits de sprint,
rétro, journal, preuves), via un bloc `scrum:` dans `.vectorz/config.yml` — **sur le modèle exact
du bloc `github:` déjà en place**. Le défaut reste les anciens chemins `docs/…`, donc rien ne
casse. Une fois cette fondation posée, les autres fiches branchent les skills dessus et déplacent.

**Si tu arrives frais.** vectorz outille une méthode par des skills. Certains écrivent des
artefacts de process (`docs/sessions/`, `docs/retro-notes/`, `docs/captures/`, `docs/journal/`,
`docs/pr-evidence/`). Aujourd'hui ces chemins sont **codés en dur**. On veut une **seule** source
de vérité qui dise où ils vivent, pour pouvoir les regrouper plus tard sous `scrum/`.

## Contexte / Problème

Ces chemins sont codés en dur dans **7 skills** (~39 références), sur trois mondes : prose des
`SKILL.md`, scripts bash, bins TS. Les skills étant **partagés** entre projets, on ne peut pas
changer la convention dans un seul projet sans le désynchroniser. Il faut d'abord un **résolveur**
unique, avant tout déplacement.

Le dépôt a déjà la bonne forme : `resolveGithub` (cœur pur, sans I/O) + un loader qui lit
`.vectorz/config.yml`, avec « clé absente = comportement inchangé ». On **clone ce frère**, on
n'invente rien. Décision d'archi et carte du lot : [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).

## Proposition

1. **Cœur pur** `resolveScrumPaths(raw): ScrumPaths` dans `products/mega-city/src/core/` (aucune
   I/O, 100 % testable — comme `resolveGithub`).
2. **Loader** `scrumPaths(projectRoot): ScrumPaths` dans `products/mega-city/src/loaders/`
   (réutilise `loadProjectConfig`).
3. **Sous-commande** `ezk --root <projet> paths <clé>` qui imprime le chemin relatif résolu (pour
   que le bash ne parse jamais le YAML).
4. **Doc** du bloc `scrum:` dans `.vectorz/config.example.yml`.
5. **Aucune** édition de skill, **aucun** déplacement (c'est le job des fiches sœurs 2 et 3).

Résolution (5 clés ; défaut = legacy si `scrum:` absent ou `false`) :

| clé | défaut legacy | `scrum: true` |
|---|---|---|
| `sprints` | `docs/sessions` | `scrum/sprints` |
| `journal` | `docs/journal` | `scrum/journal` |
| `evidence` | `docs/pr-evidence` | `scrum/evidence` |
| `retroNotes` | `docs/retro-notes` | `scrum/retro/notes` |
| `retroCaptures` | `docs/captures` | `scrum/retro/captures` |

`docs/adr/` et `features/` ne sont **pas** des clés (restent fixes).

**Ancrage — pattern à cloner (vérifié le 2026-10-07).** On copie exactement la paire `github:` :
- cœur : `resolveGithub(raw): GithubCapabilities` — `products/mega-city/src/core/project-config.ts:39` ;
- loader : `githubCapabilities(projectRoot)` + `loadProjectConfig(projectRoot)` — `products/mega-city/src/loaders/project-config.ts:44` et `:27`.

`resolveScrumPaths` / `scrumPaths` sont leurs frères, dans les mêmes fichiers. La sous-commande
`ezk … paths` **n'existe pas encore** → à créer (cohérent avec le périmètre de cette fiche).

## Critères d'acceptation

- [ ] `resolveScrumPaths` existe (cœur, sans I/O) avec tests unitaires couvrant les 3 cas :
      `scrum:` absent → legacy `docs/…`, `scrum: true` → `scrum/…`, objet → override par clé.
- [ ] `scrumPaths(projectRoot)` lit `.vectorz/config.yml` via `loadProjectConfig` ; config
      malformée → erreur claire avec le chemin (best-effort, jamais coupure silencieuse).
- [ ] `ezk --root <projet> paths <clé>` imprime le chemin relatif résolu pour les 5 clés.
- [ ] `.vectorz/config.example.yml` documente le bloc `scrum:` (défaut legacy expliqué).
- [ ] **Aucun** skill, script ou bin modifié par cette fiche ; **aucun** dossier déplacé.

## Comment vérifier

```bash
cd products/mega-city && pnpm build && pnpm test   # les tests unitaires de resolveScrumPaths passent
# Défaut legacy (pas de scrum: dans .vectorz/config.yml) :
pnpm --dir products/mega-city ezk --root "$(git rev-parse --show-toplevel)" paths journal   # → docs/journal
# Avec scrum: true, la même commande rend scrum/journal (testé en unitaire sur un fixture).
```

## Glossaire

- **résolveur pur** : fonction qui calcule un résultat sans lire ni écrire de fichier — testable
  sans disque (ADR-0003).
- **legacy** : la disposition actuelle `docs/…`, gardée comme défaut pour ne rien casser.

## Notes / décisions

- **Provenance.** Cette fiche était « Regrouper les artefacts de méthode hors de `docs/` ». Le
  2026-10-07, après l'avis `ezk-architect`, elle est **resscopée en fiche fondation** du lot V0.9 et
  **découpée en 5 fiches sœurs** (pas de fiche chapeau — décision PO ; les sœurs sont liées par le
  **même `milestone: rationalisation` + `version: V0.9`**). Le dossier décisionnel complet (revue PO
  2026-10-06, arbitrages, mécanisme, conséquences) vit désormais dans
  [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).
- **Fiches sœurs du lot** (liées par le milestone, chacune autonome) :
  [2 — brancher les skills](20261007154842506_brancher-skills-sur-resolveur-chemins-process.md) ·
  [3 — basculer vectorz vers scrum/](20261007154842643_basculer-vectorz-vers-dossier-scrum.md) ·
  [4 — nettoyer docs/ (archive, e2e)](20261007154842780_nettoyer-docs-archive-e2e.md) ·
  [5 — migration des consommateurs](20261007154842917_note-migration-bascule-consommateurs-scrum.md).
- **Dépendances** : cette fiche (1) ne dépend de rien ; 2 dépend de 1 ; 3 et 5 dépendent de 2 ; 4
  est parallèle.
