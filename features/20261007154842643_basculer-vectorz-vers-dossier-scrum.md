---
id: "20261007154842643"
title: "Basculer vectorz vers scrum/ (git mv des 5 dossiers + scrum: true)"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: idea
pr:
evidence: none # refactor d'arborescence, pas d'UI
created: 2026-10-07
---

# 20261007154842643 — Basculer vectorz vers scrum/

**En clair.** Fiche 3 du lot V0.9. C'est le déménagement réel **dans vectorz** : on bouge les 5
dossiers de process sous `scrum/`, on pose `scrum: true` dans `.vectorz/config.yml`, et on met à
jour les fixtures de test qui codaient les anciens chemins. Un seul commit atomique. vectorz est le
premier banc d'essai réel du résolveur.

**Si tu arrives frais.** Fiche sœur de la [fondation `scrum:`](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md) ;
mécanisme et carte du lot dans [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).

## Contexte / Problème

Une fois les skills branchés sur le résolveur (fiche 2), vectorz peut passer à la disposition
canonique `scrum/`. Le déplacement et le `scrum: true` doivent être dans **le même commit** : avant,
config absente → legacy ; après, config présente → `scrum/`, fichiers déjà déplacés. Aucune fenêtre
de décalage.

## Proposition

1. `git mv` des 5 dossiers :
   - `docs/sessions` → `scrum/sprints`
   - `docs/retro-notes` → `scrum/retro/notes`
   - `docs/captures` → `scrum/retro/captures`
   - `docs/journal` → `scrum/journal`
   - `docs/pr-evidence` → `scrum/evidence`
2. `scrum: true` dans `.vectorz/config.yml`.
3. Mettre à jour **toutes les fixtures** qui codent les anciens chemins. Le jeu est **large**
   (~11 scripts `test-*.sh` + ~7 `__tests__` TS, vérifié le 2026-10-07), **pas trois** : on les
   trouve en lançant les suites (rouge → vert), le vrai gate étant « suites vertes ». Exemples :
   `test-handoff.sh`, `test-sprint-lifecycle.sh`, `test-archive-commit.sh`, `test-journal-add.sh`,
   `test-note.sh`, `test-pr-evidence.sh`, `test-ezk-chef-extract.sh`, et les `__tests__` de
   `retro-capture`, `runs-data`, `ezk-chef-suggest`, `pilotage-data`.
4. Recaler les liens de `docs/index.md` : il ne pointe pas les **dossiers** mais des **fichiers de
   captures** précis (`./captures/2026-…md`), qui partent sous `scrum/retro/captures/`. Coordonner
   avec la fiche 4 (qui touche aussi `index.md`).

## Critères d'acceptation

- [ ] Les 5 dossiers vivent sous `scrum/` (`sprints`, `retro/notes`, `retro/captures`, `journal`,
      `evidence`) ; `docs/` n'a plus de dossier de process.
- [ ] `.vectorz/config.yml` de vectorz porte `scrum: true`.
- [ ] `pnpm --dir products/mega-city test` et `test:scripts` sont **verts** (fixtures à jour).
- [ ] `docs/index.md` n'a plus de lien mort vers les anciens chemins.

## Comment vérifier

```bash
ls scrum/sprints scrum/retro/notes scrum/retro/captures scrum/journal scrum/evidence
ls docs/ | grep -E "sessions|retro-notes|captures|journal|pr-evidence" && echo "KO reste" || echo "OK docs/ nettoyé"
cd products/mega-city && pnpm build && pnpm test && pnpm test:scripts
bash bin/test-links-repo.sh .
```

## Notes / décisions

- **Dépend de** la fiche 2 (les skills doivent lire la config avant la bascule, sinon ils
  écriraient encore dans un `docs/` devenu vide).
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).
