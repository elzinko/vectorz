---
id: "20261104085959892"
title: "`--review` d'ezk-product-build se lit « revue du code » alors qu'il arrête le run à chaque grooming"
type: bug
priority: P1 # proposée par le run du 2026-11-04 (le PO a demandé la fiche, la question de priorité n'a pas pu lui être posée) — à confirmer
product: mega-city
milestone: qualite
version:
labels: [theme:autonomie]
status: split
pr: "split — scindée en 20261104095815710, 20261104095815808"
evidence: none # sortie de commande et texte de skill, pas d'écran
created: 2026-11-04
split_into: ["20261104095815710", "20261104095815808"]
---

# 20261104085959892 — `--review` se lit « revue du code » alors qu'il arrête le run à chaque grooming

**En clair.** Le PO a lancé un run autonome avec `--review` en croyant activer la revue du code.
Ce réglage veut dire autre chose : « arrête-toi après chaque grooming, que je tamponne la fiche
prête ». Le run lui a donc rendu la main au lieu d'enchaîner. La fiche propose un nom qui dit le
geste, et un contrat de run qui annonce cet arrêt.

**Si tu arrives frais.** `ezk-product-build` enchaîne des sprints tout seul. « Tamponner prête »
veut dire passer une fiche groomée en `status: ready`, la porte qui la rend constructible. La revue
du code, elle, tourne toujours, quel que soit ce réglage.

## Contexte / Problème

Symptôme vécu le 2026-10-30. Le PO lance `/ezk-product-build run --mode auto --review --retro every`.
Il pense : « auto, avec la revue et la rétro ». Le run s'arrête deux fois, le 2026-11-01 à 10 h 25
et à 11 h 42, pour demander « je tamponne cette fiche ? ». Le PO conclut que le mode auto « n'est pas
autonome ». Diagnostic du 2026-11-04 : c'était `--review`, qui fait exactement ce que la skill décrit.

Trois défauts se cumulent :

1. **Le nom trompe.** « review » se lit « revue du code ». Or la revue adverse du code ne se règle
   pas par ce drapeau. Elle tourne toujours ; seul `review.adverse: skip` dans `.vectorz/config.yml`
   la saute. Le même mot désigne donc deux choses dans le même skill.
2. **Le contrat se tait.** `ezk run context --mode auto --review` affiche « Je m'arrête sur 4 cas ».
   L'arrêt à chaque grooming n'y figure pas, alors que c'est le seul que le PO rencontrera.
3. **L'histoire se répète.** L'ADR-0053 a déjà renommé `--check-ready` en `--review`, parce que
   l'ancien nom « fabriquait un faux modèle mental jusque chez le PO ». Le nouveau nom en fabrique
   un autre.

## Proposition

POC en trois gestes, sans changer le comportement :

1. **Un nom qui dit le geste humain.** Choix au grooming. Pistes : `--tamponne-moi`,
   `--stamp-ready`, `--ask-ready`. Le nom ne contient pas « review ».
2. **L'ancien nom reste lu.** `--review` et `--check-ready true` mappent sur le nouveau, et le
   contexte de run le dit en une ligne : « `--review` est l'ancien nom de `--X` : je m'arrête après
   chaque grooming ».
3. **Le contrat annonce l'arrêt.** Avec le réglage, la ligne des arrêts liste un 5e cas. Une ligne
   dit aussi que la revue du code tourne toujours.

## Critères d'acceptation

- [ ] Avec le réglage, `ezk run context` liste l'arrêt « après chaque grooming, tu tamponnes la
      fiche » dans sa ligne des arrêts ; sans lui, la ligne reste à 4 cas.
- [ ] Le contrat dit en une phrase que la revue du code tourne toujours, quel que soit ce réglage.
- [ ] Le réglage porte un nom sans « review » ; `--review` et `--check-ready true` restent acceptés,
      et le contexte de run signale qu'ils sont d'anciens noms.
- [ ] La skill `ezk-product-build` (texte et `argument-hint`) emploie le nouveau nom ; `--review`
      n'y apparaît plus que comme ancien nom.
- [ ] Un amendement court de l'ADR-0053 note le renommage et sa raison.
- [ ] Les tests du contexte de run couvrent les trois cas : nouveau nom, ancien nom, absent.

**Mesure de suivi** — sur les 5 prochains lancements en mode auto, 0 arrêt « je tamponne ? » que
le PO n'a pas voulu.

## Comment vérifier

```bash
ezk run context --mode auto --tokens lean --delivery per-feature            # 4 arrêts
ezk run context --mode auto --tokens lean --delivery per-feature --review   # 5 arrêts + « ancien nom »
pnpm --dir products/mega-city test -- run-context
```

## Notes / décisions

- Prédécesseurs : [ADR-0053](../../products/mega-city/docs/adr/0053-check-ready-devient-review-defaut-autonome.md)
  et la fiche [Product-builder — auto-groom vers la DoR + option --check-ready](20260813200137369_pb-auto-groom-ready-check-ready.md).
- Code : `products/mega-city/bin/run-context.ts`, qui lit `--review` ligne 57.
- Hors périmètre, vus le même jour : en `--tokens lean`, une rétro due devient une question même en
  mode auto ; et rien ne relance le run quand le modèle s'arrête de lui-même (le `/goal` de Claude
  Code le fait). Ce sont d'autres sujets.
- Priorité P1 posée par le run du 2026-11-04 : le PO a demandé cette fiche, mais la question de
  priorité n'a pas pu lui être posée. À confirmer au grooming.
