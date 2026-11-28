---
id: "20261114131615719"
title: "Le verdict de revue adverse par fiche, structuré et publié"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [contrat]
status: ready
blocked:
pr:
evidence: none # un en-tête de REVIEW.md et un contrat
created: 2026-11-14
---

# 20261114131615719 — Le verdict de revue adverse par fiche, structuré et publié

**En clair.** Chaque fiche construite passe une relecture indépendante, la revue adverse, qui dit GO
ou NO-GO critère par critère. Ce verdict n'existe qu'en prose, dans un fichier par fiche que rien ne
publie : mission control ne peut pas dire si une fiche a été relue, par qui, ni avec quel résultat. La
méthode écrira le verdict sous forme structurée en tête de ce fichier et le publiera avec la fiche ;
l'écran pourra répondre à « est-ce fini ? ».

**Si tu arrives frais.** La *revue adverse* est l'étape 7 d'un sprint : un relecteur rejoue
« Comment vérifier » et juge chaque critère prouvé ou non. Son compte rendu est un *pack de revue*,
`features/reviews/<id>-<slug>/REVIEW.md`, au contrat `method-review@0.1`. Le *pouce* est autre
chose : l'avis du PO (up / down), posé par `ezk review verdict`.

## Contexte / Problème

Ce que l'écran attend. Les pages Fiche, Revue et DoD veulent, par fiche : le verdict GO ou NO-GO, le
relecteur, la date et les critères prouvés. La maquette cite « ADR-084 point G4 ». Vérifié : ce point
traite des moments « transition de fiche », pas du verdict de revue
(`docs/adr/ADR-084-surface-emission-declaree-et-moments.md:70-85`). La bonne référence est
l'ADR-0059, décision D4, et l'ADR-038.

Ce que le code fait aujourd'hui (lecture et mesures du 14 novembre) :

- Le compte rendu existe sur disque, pas en JSON : un `REVIEW.md` par fiche, au contrat
  `method-review@0.1`, avec `status` ∈ ready-for-review | changes-requested | approved. Le GO est en
  prose, dans le corps.
  `products/mega-city/src/review/contract.ts:11-20` ; exemple :
  `features/reviews/20261013073300242-commandes-lecture-root/REVIEW.md:1-17`.
- Mesure du 14 novembre, sur tout l'arbre `features/reviews/` : 75 `REVIEW.md` ; 68 `approved`,
  5 `ready-for-review`, 2 sans `status`, aucun `changes-requested`. « NO-GO » n'apparaît qu'en prose,
  dans 9 fichiers. Le cycle n'émet donc pas de pack sur un NO-GO.
- L'étape 7 du sprint garde le verdict « tel quel (un fichier) ». En `pr: on` il part en commentaire
  de PR ; en `pr: off`, par `ezk review emit`. `products/mega-city/skills/ezk-sprint/SKILL.md:271`.
- L'émetteur écrit `REVIEW.md` à un chemin fixe par fiche : une nouvelle revue écrase la précédente.
  `ezk review emit` n'a ni option verdict, ni relecteur.
  `products/mega-city/src/review/emitters/markdown-file.ts:59-64` ; `products/mega-city/bin/review-emit.ts:4-9`.
- Le seul verdict publié en JSON est le pouce du PO : `verdicts` dans `board-show` (up | down, date).
  Au 14 novembre, `verdicts` est vide : aucun pouce posé.
  `products/mega-city/contracts/board-show/v1/schema.json:408-432` (ADR-0057).
- `backlog-show` n'a aucun champ de revue (`products/mega-city/contracts/backlog-show/v1/fiche.schema.json`).
  Le manifeste connaît `review emit` et `review verdict`, pas de `review show`.
  `products/mega-city/ezk-manifest.yml:262-275`.
- Le format cible est déjà écrit, pas construit : `method-review@0.2`, en-tête YAML (verdict, coût,
  durée, constats), une entrée par relecteur et par lancement, sans écrasement, index généré.
  [Mesurer si la revue locale peut remplacer Codex](done/20260905134937885_revue-locale-vs-codex-mesure.md),
  § Suite ; ADR-0059 D4.

## Proposition

1. **`method-review@0.2`.** L'en-tête YAML de `REVIEW.md` gagne `verdict` (GO | NO-GO), `relecteur`,
   `date` et `criteres` : une ligne par critère {n, prouve, preuve}. Pas de fichier à côté : le pack
   reste la source unique (ADR-038).
2. **`ezk review emit --verdict GO|NO-GO --relecteur <id>`**, plus les critères. La commande refuse
   `approved` avec NO-GO et `changes-requested` avec GO. Un pack s'écrit aussi sur NO-GO.
3. **Sans écrasement.** Une entrée par relecteur et par lancement dans le dossier de la fiche ; `REVIEW.md`
   reste la dernière, pour les lecteurs actuels. La forme exacte des noms se fixe au grooming.
4. **Publication par la fiche.** `ezk backlog show --json` publie, par fiche, `revue` {verdict, date,
   relecteur, fichier} ou nul. Le contrat `backlog-show` reste en version 1 : champ ajouté. Un pack
   `0.1` donne `verdict: null` et son `status` : rien n'est inventé. La carte laisse ouverte l'autre
   voie, une commande `ezk review show --json` ; la fiche préfère un seul canal pour une donnée, et
   le grooming tranche.
5. **Deux champs distincts.** Le pouce du PO (`verdicts`) et le verdict du relecteur (`revue`) portent
   des noms différents dans les contrats.
6. **Décision de méthode.** L'étape 7 d'ezk-sprint passe par `ezk review emit` dans les deux modes ;
   en `pr: on`, le commentaire de PR devient une projection du pack, comme `--github` le fait déjà.
7. **Les textes suivent.** ADR-0059 D4 amendé (l'archive structurée est construite) ; la maquette
   corrige sa référence (ADR-084 G4 → ADR-0059 D4 et ADR-038).

Hors périmètre : la fenêtre de fiche côté mission control (fiche cop1 sœur) ; l'index agrégé des
verdicts ; la re-mesure de la revue locale contre Codex (ADR-0059 D5) ; le coût et la durée dans
l'en-tête, qui attendent cette re-mesure.

## Critères d'acceptation

- [ ] Un pack émis avec `--verdict` porte en en-tête `verdict`, `relecteur`, `date` et `criteres`
  (n, prouvé, preuve) ; `approved` avec NO-GO, ou `changes-requested` avec GO, est refusé et rien
  n'est écrit.
- [ ] Un NO-GO écrit un pack comme un GO ; deux lancements ou deux relecteurs sur la même fiche donnent deux
  entrées, aucune n'écrase l'autre.
- [ ] `ezk backlog show --json` publie par fiche `revue` (verdict, date, relecteur, fichier) ou nul ;
  le contrat `backlog-show` reste en version 1 et son schéma et son exemple décrivent `revue`.
- [ ] Un `REVIEW.md` au contrat `method-review@0.1` est publié avec `verdict` nul et son `status` ;
  les 75 packs existants passent ainsi, sans rien inventer.
- [ ] Le pouce du PO et le verdict du relecteur sont deux champs distincts, nommés sans ambiguïté dans
  les contrats.
- [ ] La compétence `ezk-sprint` écrit le pack par `ezk review emit` en `pr: on` comme en `pr: off`.

**Mesure de suivi** — sur les cinq sprints qui suivent la livraison : chaque fiche livrée a un pack
avec un verdict structuré, et au moins un NO-GO a laissé un pack au lieu de disparaître en prose.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
# Un pack NO-GO, dans un dossier de revues jetable
ezk --root "$ROOT" review emit --fiche 20261114131615719 --branch feat/essai --product mega-city \
  --method-name ezk-sprint --method-version essai --status changes-requested \
  --verdict NO-GO --relecteur ezk-reviewer --resume essai --matrice - --a-tester - --provisioning - \
  --reviews-root /tmp/reviews-essai
head -20 /tmp/reviews-essai/*/REVIEW.md
# L'incohérence est refusée
ezk --root "$ROOT" review emit --fiche 20261114131615719 --branch feat/essai --product mega-city \
  --method-name ezk-sprint --method-version essai --status approved --verdict NO-GO \
  --relecteur ezk-reviewer --resume essai --matrice - --a-tester - --provisioning - \
  --reviews-root /tmp/reviews-essai > /dev/null; echo "EXIT=$?"       # attendu : 1
# La publication
ezk --root "$ROOT" backlog show --json | jq '[.fiches[] | select(.revue != null) | {id, revue}] | .[:3]'
ezk --root "$ROOT" backlog show --json | jq '[.fiches[] | select(.revue == null)] | length'
pnpm --dir products/mega-city test -- src/review/__tests__ src/__tests__/review-verdict.test.ts
```

Aucun écran ne change : pas de preuve avant / après.

## Glossaire

- `revue adverse` — l'étape 7 du sprint : un relecteur distinct du constructeur rejoue « Comment vérifier » et rend GO ou NO-GO.
- `pack de revue` — le compte rendu de cette revue, `features/reviews/<id>-<slug>/REVIEW.md`, source unique ; un commentaire de PR n'en est qu'un rendu.
- `relecteur` — l'agent ou l'humain qui a rendu le verdict (`ezk-reviewer`, Codex, le PO…).
- `lancement` — un passage du sprint sur une fiche (« run » dans les ADR) ; deux lancements peuvent relire la même fiche.
- `pouce` — l'avis du PO sur une fiche (up / down), posé par `ezk review verdict` ; il ne remplace pas le verdict du relecteur.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart D4. La maquette cite [ADR-084](../docs/adr/ADR-084-surface-emission-declaree-et-moments.md)
  G4 par erreur ; la suite explicite est
  [ADR-0059](../products/mega-city/docs/adr/0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md)
  D4, sur le pack de l'[ADR-038](../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md).
- Décision de méthode préalable : l'étape 7 d'ezk-sprint émet le pack dans les deux modes (point 6).
- Choix de rédaction, à confirmer au grooming : publier par `backlog-show` plutôt que par un nouveau
  `ezk review show` ; un seul canal pour une donnée.
- Fiches livrées en amont :
  [Pack de review markdown-first](done/0183-pack-review-markdown-first.md) (le contrat 0.1, la source unique) ;
  [Le relecteur coche les critères d'acceptation, pas le constructeur](done/20261003075821760_relecteur-coche-les-criteres.md) ;
  [Le pouce de revue se pose par une commande ezk](done/20261102123552181_pouce-de-revue-par-une-commande-ezk.md) et
  [Mission control montre le pouce de revue](done/20261102151630248_mission-control-pose-le-pouce-de-revue.md)
  (le pouce, distinct, [ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)) ;
  [Montrer sur la carte ce qui est revu, en cours, ou jamais vérifié](done/20260821163346498_carte-etat-de-revue-visible.md) :
  ce besoin d'écran a déjà été fiché, puis remplacé par le pouce ; à rappeler au PO avant de rouvrir.
- Idée parkée voisine : [Rapport qualité de PR](0058-rapport-qualite-pr.md).
- Contrainte : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
  mission control n'a pas le droit de lire `REVIEW.md` ; il lit le contrat.
- Risque : le pouce du PO n'a jamais servi (0 posé) ; deux verdicts côte à côte peuvent se confondre.
  Les noms distincts et le « i » de l'écran y répondent.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Les revues ne s'écrasent pas : `REVIEW-<relecteur>-<date-heure>.md` dans le dossier de la fiche, `REVIEW.md` restant la dernière. La publication passe par `backlog show`.
