---
id: "20260828150801613"
title: "ezk-ci conso — script déterministe + réparer l'endpoint billing migré (410 → /usage)"
type: feature
priority: P0
product: mega-city
version:
epic:
depends: []
labels: [ezk-ci, ci, outillage, billing]
status: shipped
ready: 2026-08-29
pr: "#186"
created: 2026-08-28
---

## En clair

`ezk-ci conso` doit dire, **à chaque fois pareil**, combien de minutes GitHub Actions chaque
repo brûle — sans que le LLM ne réinvente les appels `gh` + `jq`. Aujourd'hui deux choses
clochent. L'API que la commande interroge a **déménagé** (elle répond 410). Et le calcul n'est
**pas figé dans un script**, donc il est refait à la main à chaque fois, sans garantie du même
résultat. Cette fiche fige la récupération dans un **script déterministe** et répare l'endpoint.

## Si tu arrives frais

- **`ezk-ci conso`** = la sous-commande qui restitue la consommation GitHub Actions (minutes du
  mois, top repos). Livrée par la fiche [0159](0159-ezk-ci-conso-gha.md).
- **GitHub Actions** = les serveurs cloud qui exécutent la CI. **Gratuit et illimité sur un repo
  public** ; sur un repo **privé**, ça consomme un quota (2000 min/mois en plan Free).
- **Endpoint billing** = l'URL de l'API GitHub qui rend les chiffres de consommation.

## Contexte / Problème (constaté le 2026-08-28)

1. **L'endpoint est mort.** `GET /users/<u>/settings/billing/actions` répond **HTTP 410 « This
   endpoint has been moved »**. GitHub a migré vers la « enhanced billing platform » :
   `GET /users/<u>/settings/billing/usage?year=YYYY&month=M` (renvoie `usageItems` : par repo ×
   SKU × minutes × `netAmount`). Le chiffre « minutes du mois » de `conso` est donc cassé.
2. **Le calcul n'est pas capitalisé.** Le croisement (minutes par repo, public/privé, part
   facturée) a été refait **à la main** par le LLM en session (`gh api … | jq …`). Non
   reproductible, coûteux, et contraire à l'ADR-0001 (« le cœur déterministe compte, le LLM
   juge »). Le même besoin reviendra à chaque revue de conso.

## Valeur (pourquoi ça compte)

- **`conso` est CASSÉ aujourd'hui** (410) : on ne peut plus lire la conso depuis la commande.
  Ce n'est pas du polissage, c'est la **réparation** d'un outil qui sert à décider quoi rendre
  frugal (les repos privés qui pèsent sur le quota).
- **Une commande → un chiffre reproductible.** Chaque revue de conso (récurrente) devient un
  `run`, pas une reconstruction `gh` + `jq` à la main : moins de tokens, zéro divergence entre
  deux mesures (ADR-0001).
- **Rend le chiffre actionnable.** Sans la colonne visibilité, on croit qu'un repo **public**
  (vectorz, 879 min) « coûte » alors qu'il est gratuit — et on rate le vrai poste (les privés).

## Dépendances externes

- **API billing GitHub** (`/users/<u>/settings/billing/usage`) — service externe, hors monorepo.
  **Accès constaté le 2026-08-28** : `gh api /users/elzinko/settings/billing/usage?year=2026&month=8`
  a renvoyé un `usageItems` non vide (le token `gh` courant a le scope nécessaire).
- **`gh` CLI authentifié** — présent et utilisé en session ; repli prévu si le scope billing
  venait à manquer (cf. critère « dégradation propre »).

## Proposition

- **Un script déterministe** (ex. `products/mega-city/bin/ci-conso.sh`, ou le cœur de
  `ezk-ci conso`) qui sort, en une commande, une table stable : par repo → minutes du mois,
  **public/privé**, part facturée (`netAmount`), total. Le LLM se contente de **lire et
  commenter** la sortie — il ne recompte jamais.
- **Réparer l'endpoint** : lire `/settings/billing/usage` (params `year`/`month`), avec
  dégradation propre si le token n'a pas le scope billing.
- **Distinguer public/privé** : `gh api /repos/<owner>/<repo> --jq .visibility`. Seuls les
  privés pèsent sur le quota Free ; l'afficher évite le contresens « vectorz brûle 879 min »
  (vrai, mais gratuit car public).

## Décisions d'archi à trancher (au sprint)

- **Où vit le script ?** `products/mega-city/bin/ci-conso.sh` (dispo en tournant dans le
  monorepo) VS logique **inline dans `SKILL.md`** (portable en install *copy-mode*, où seul
  `SKILL.md` est déployé — cf. piège `add`/mint-id). La conso lit du billing **niveau compte**
  (repo-agnostique), donc elle peut tourner depuis n'importe où avec `gh` ; un script testé
  reste plus robuste qu'un inline. À trancher à l'étape archi.
- **Granularité.** `/usage` ne rend que des **agrégats MENSUELS** (date = 1er du mois). Le
  « minutes du mois » marche ; mais « depuis le 25 » (fin) exige l'**API runs**
  (`/repos/<o>/<r>/actions/runs?created=>=DATE` + timing). Scope par défaut = **mensuel par
  repo** ; le détail par runs = **option** (ne pas sur-scoper le 1ᵉʳ incrément).
- **Coût public/privé.** Une visibilité par repo = **N appels** `gh api /repos/…` ; OK pour
  quelques repos, à limiter/cacher si la liste grossit.

## Critères d'acceptation

- [x] `ezk-ci conso` **ne tape plus** `/settings/billing/actions` ; il lit
      `/settings/billing/usage` et rend un chiffre non vide pour le mois courant.
- [x] Sortie **déterministe** : minutes par repo, colonne **public/privé**, part facturée,
      total — la même commande rejouée donne la même table (aucun `jq` ad hoc côté LLM).
- [x] **Dégradation propre** si l'API billing est inaccessible (message clair, pas de crash).
- [x] Un **test** (fixture d'un `usageItems` d'exemple) verrouille le parsing/agrégation.
- [x] La doc d'`ezk-ci` (SKILL) cite l'endpoint courant et le repli.

## Comment vérifier

```bash
# La commande sort un chiffre non vide (mois courant), pas un 410 :
bash products/mega-city/bin/ci-conso.sh    # (ou : ezk-ci conso)
# Contrôle brut de l'API cible :
gh api '/users/elzinko/settings/billing/usage?year=2026&month=8' --jq '.usageItems | length'
```

Attendu : une table de conso par repo (mois courant), colonne public/privé, et **zéro** appel
à l'ancien endpoint 410.

## Notes

- Suite de [0159](0159-ezk-ci-conso-gha.md) (qui a créé `conso`) : ici on **répare** (l'API
  a bougé sous la commande) et on **capitalise** (script déterministe, ADR-0001).
- Découvert en marge d'une revue de conso le 2026-08-28. Au passage : **vectorz est public** →
  Actions gratuit ; le quota Free ne pèse que sur les privés (muti / samplerz / city-guided).
- Priorité **P0 posée par le PO** (2026-08-28).
- **Groomée le 2026-08-29** — DoR complète : problème · valeur · critères vérifiables ·
  dépendance externe **constatée**. `ready:` **non posé** : c'est le gate `ready <id>` qui le
  pose. Reste au sprint : trancher les 3 décisions d'archi ci-dessus (étape archi).
