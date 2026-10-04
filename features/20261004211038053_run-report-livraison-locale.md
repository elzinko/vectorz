---
id: "20261004211038053"
title: "ezk run report décrit un run livré en local, sans numéro de PR"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [product-build, mode-local]
status: idea
pr:
evidence: none # commande de terminal, pas d'écran
created: 2026-10-04
---

# 20261004211038053 — ezk run report décrit un run livré en local, sans numéro de PR

**En clair.** Le bilan de fin de run (`ezk run report`) exige un numéro de PR pour chaque fiche
mergée. En mode local, il n'y a pas de PR : le bilan est refusé, et il faut le rendre à la main. On
veut qu'il accepte une livraison locale, `local (<sha>)`, et qu'il la compare au `main` local quand
la config coupe GitHub.

**Si tu arrives frais.** `ezk run report` clôt un run d'`ezk-product-build` de plus d'un sprint : une
ligne par fiche (état, PR, gate, revue, validation), HEAD contre `origin/main`, les jetons. Il compare
ce qu'on déclare à GitHub. Le *mode local* (`github: false` dans `.vectorz/config.yml`) livre par un
squash sur le `main` local, sans PR.

## Contexte / Problème

- **2026-10-04, fin du run cockpit** (3 fiches livrées en local) :
  `ezk run report --no-github --fiche "<id>|mergée|local (43dcb587)|…"` refuse la ligne : « PR attendue,
  forme #<numéro> ». Il refuse aussi « - ». Le bilan a été rendu à la main dans le chat.
- `ezk backlog ship` accepte déjà `local (<sha>)` pour une livraison locale ; le bilan ne suit pas.

## Valeur — ce que coûte de ne rien faire

- Chaque run en mode local finit sans son bilan outillé : le pilote le réécrit à la main, sans le
  contrôle « déclaré contre réel ».

## Proposition

1. Le champ PR accepte `local (<sha>)` pour une fiche `mergée`.
2. Quand la config du projet coupe GitHub, le contrôle « déclaré contre réel » regarde le `main`
   local : le sha déclaré doit y être. L'option `--no-github` garde son contrat d'aujourd'hui.

## Critères d'acceptation

- [ ] `ezk run report --fiche "<id>|mergée|local (<sha>)|verte|GO|faite|-"` rend le bilan quand le sha
      est sur le `main` local.
- [ ] Un sha absent du `main` local sort en écart (code 1), avec le sha nommé.
- [ ] Une fiche `mergée` sans PR ni `local (<sha>)` est toujours refusée.
- [ ] En mode GitHub, le comportement d'aujourd'hui ne change pas (tests existants verts).
- [ ] Dans un dépôt en mode GitHub, `--no-github` prend toujours le déclaré tel quel, sans regarder le
      `main` local.

## Comment vérifier

```bash
cd products/mega-city && pnpm test
ezk run report --no-github --fiche "20261004192802828|mergée|local (43dcb587)|verte|GO|faite|-"
```

## Notes / décisions

- 2026-10-04 : née de la rétro légère du run cockpit de la V0.6 (capture
  `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`), proposition 2, retenue par le PO.
  Reprend la note du carnet `docs/retro-notes/traitees/20261004222239269-…`.
- P2 proposé par le pilote ; à confirmer au planning.
- Voisine : [« un seul guichet pour GitHub »](20261004083838593_guichet-unique-github-archive-reconcile.md)
  (20261004083838593), qui ne couvre pas ce bilan.
