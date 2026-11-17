---
id: "20261115180226950"
title: "Le nom du compte rendu de sprint garde les lettres accentuées"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
blocked:
pr:
evidence: none # un nom de fichier, aucun écran
created: 2026-11-15
---

# 20261115180226950 — Le nom du compte rendu de sprint garde les lettres accentuées

**En clair.** Quand un sprint se ferme, la méthode écrit son compte rendu dans un fichier dont le nom vient
du but du sprint. Les lettres accentuées disparaissent : « Les décisions deviennent loi » donne
`les-d-cisions-deviennent-loi`. On remplace chaque lettre accentuée par sa lettre simple (é → e), et le nom
redevient lisible.

**Si tu arrives frais.** Un sprint se ferme par `close`, une sous-commande de la compétence `ezk-sprint`.
Le compte rendu vit sous `docs/sprints/<date>-sprint-<slug>.md` ; le « slug » est le nom de fichier tiré du
but du sprint.

## Contexte / Problème

- Constaté deux fois : sprint 7 (`2026-11-14-sprint-les-d-cisions-deviennent-loi.md`) et sprint 8
  (`2026-11-15-sprint-la-m-thode-publie-son-process-et-son-annuaire.md`).
- Le slug se calcule dans `products/mega-city/skills/ezk-sprint/scripts/sprint.sh`, ligne 434 : il passe en
  minuscules, puis `tr -cs 'a-z0-9' '-'` remplace tout autre caractère par un tiret. Le commentaire de la
  ligne 433 promet pourtant « accents retirés ».
- Le jalon de supervision d'un sprint (`sprint-<slug>-checkpoint`) doit porter le même slug pour que le
  compte rendu soit daté : qui le pose (ezk-product-build, ezk-sprint) doit calculer le même nom.

## Proposition

- Translittérer avant de filtrer : `iconv -f UTF-8 -t ASCII//TRANSLIT` (é → e, ç → c, œ → oe), puis la
  suite actuelle inchangée (minuscules, tirets, 48 caractères au plus, repli `n<N>`).
- Écrire la même règle là où la méthode décrit le slug du jalon (`skills/ezk-product-build/SKILL.md`,
  section « Dater le sprint »), pour qu'un orchestrateur pose le bon `gate_id`.
- Hors périmètre : renommer les comptes rendus déjà écrits (ils restent tels quels, l'historique ne bouge pas).

## Critères d'acceptation

- [ ] Un sprint dont le but est « Les décisions deviennent loi » produit `…-sprint-les-decisions-deviennent-loi.md`.
- [ ] Un but sans accent donne exactement le même slug qu'avant (aucune régression).
- [ ] Un but fait seulement de caractères non convertibles retombe sur `n<N>`, comme aujourd'hui.
- [ ] La règle du slug du jalon, dans la compétence ezk-product-build, dit la translittération.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-sprint-lifecycle.sh
pnpm --dir products/mega-city test:scripts
```

Ajouter au banc du cycle de vie un sprint au but accentué et vérifier le nom du compte rendu écrit.

## Notes / décisions

- Origine : rétros des sprints 7 et 8
  ([sprint 7](../docs/captures/2026-11-14-retro-sprint-7-les-decisions-deviennent-loi.md),
  [sprint 8](../docs/captures/2026-11-15-retro-sprint-8-la-methode-publie-son-process.md)), proposition
  retenue par le PO le 15 novembre (« 1 à 6 oui »). Priorité P3 : un défaut d'affichage, sans perte.
- Risque : `iconv` n'a pas le même comportement partout ; vérifier sur macOS (BSD) et Linux, ou faire la
  translittération en Node dans le script de compte rendu.
- 2026-11-17 : troisième et quatrième cas (« voir-tout-ce-qui-est-reli-dans-la-m-thode »). Priorité montée en P2 par délégation du PO absent (rétro du sprint 2 du 17 novembre).
