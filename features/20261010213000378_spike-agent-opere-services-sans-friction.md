---
id: "20261010213000378"
title: "Spike : l'agent opère GitHub / Vercel / LemonSqueezy sans me redemander (CLI/MCP + ezk-secret)"
type: chore
priority: P2
product: vectorz
labels: [spike, secrets, dx, architecture]
status: idea
pr:
evidence: none
created: 2026-10-10
---

# 20261010213000378 — Spike : l'agent opère les services sans me redemander

## En clair

Aujourd'hui l'agent me redemande des gestes qu'il pourrait faire lui-même (changer un prix,
une variable d'env, déployer), parce qu'il ne vérifie pas d'abord ses accès, et parce que les
secrets traînent dans des `.env` non portables. Ce spike cadre une **urbanisation** : opérer par
les **CLI/MCP authentifiés**, injecter les secrets par **`ezk-secret`** (trousseau macOS, accès sur
demande), et ne me solliciter que pour **créer un secret** ou pour les **4 décisions humaines**. Il
le **prouve** sur un cas réel : piloter LemonSqueezy par son API, jeton lu au trousseau, depuis un
worktree.

## Si tu arrives frais

- **CLI/MCP authentifiés** : des outils déjà connectés au service (ex. `gh`, `vercel`) → l'agent agit sans jamais voir de secret.
- **`ezk-secret`** : la recette `secrets-trousseau` — range un secret dans le trousseau macOS, l'agent le lit au moment d'agir, jamais affiché, macOS demande ton accord (« accès sur demande », touchId possible).
- **Worktree** : copie de travail isolée du dépôt ; son `.env` n'est **pas** cloné (gitignored).
- **Les 4 décisions humaines** : action irréversible/sortante, hausse de budget, idée produit sur backlog vide, exigences contradictoires.

## Contexte / Problème

Trois symptômes vécus le 2026-10-10 (session muti, changement de prix €49→€19 + promo) :

1. **Over-prudence.** L'agent a demandé de changer des variables **Vercel**… alors qu'il avait la
   CLI `vercel` **authentifiée** (il pouvait le faire). Il n'avait pas vérifié ses accès avant de déléguer.
2. **Service sans accès.** **LemonSqueezy** n'a ni CLI ni MCP branché → chaque changement de prix ou
   de code promo repassait par le dashboard à la main. Résultat : plusieurs allers-retours, et un
   **écart affiché/facturé** passé en prod (site à €9.90, LS à €49) avant d'être rattrapé.
3. **`.env` non portable.** En worktree, `.env` n'est pas cloné → l'agent a dû **copier les `.env`**
   du checkout principal pour faire tourner la gate. Manuel et fragile.

## Proposition (investiguer → décider → prouver)

- **Cadrer l'architecture en 3 couches** :
  1. **OPÉRER** via CLI/MCP authentifiés (aucun secret ne traverse l'agent).
  2. **INJECTER** un secret via `ezk-secret` (trousseau + accès sur demande) pour les services « dashboard-only ».
  3. **GARDER LA MAIN** via l'accès-sur-demande du trousseau (touchId possible) ; option « session déverrouillée » façon `google-mcp-multi-account` **seulement si** un lot d'opérations le justifie.
- **Poser une RÈGLE de méthode** : *l'agent vérifie CLI / MCP / trousseau AVANT de déléguer un geste
  à l'humain ; il ne sollicite l'humain que pour créer un secret, ou pour une des 4 décisions humaines.*
- **Recenser l'existant (ne pas réinventer)** : `ezk-secret` (fait, éprouvé IONOS), CLI `gh`/`vercel`
  (authentifiées), MCP connectables (`vercel`/`github`/`supabase`), Keychain + touchId, pattern
  session de `google-mcp-multi-account`. Options écartées à motiver : `1Password CLI`, `sops`/`age`.
- **PROUVER (le test du spike)** : le jeton LemonSqueezy est **déjà au trousseau** —
  `LEMONSQUEEZY_API_KEY` (live) et `LEMONSQUEEZY_API_KEY_TEST` (test), au niveau compte. La **lecture
  seule est déjà prouvée** (2026-10-10 : `GET /v1/stores` → HTTP 200, boutique « muti », jeton jamais
  affiché). Reste à prouver **une écriture** (prolonger/mettre à jour un code promo par l'API), puis à
  refaire la lecture **depuis un worktree secondaire** (donc sans `.env`). Miroir de la preuve IONOS.

## Critères d'acceptation

- [ ] Une **note de décision** : les 3 couches + la règle, options tranchées (pourquoi `ezk-secret` et pas `op`/`sops` ; touchId ou pas ; MCP en complément).
- [ ] La règle « vérifier avant de demander » **rédigée** (candidate à `rules/`), mesurable.
- [ ] **Preuve éprouvée** : 1 appel API LemonSqueezy réussi (ex. HTTP 200 sur un code promo), jeton lu au trousseau, **exécuté depuis un worktree secondaire**, 0 secret affiché en chat, 0 `.env` copié.
- [ ] Le jeton LS rangé en secret **niveau compte** (`from:`), + le jeton de test, documentés au catalogue de secrets.
- [ ] Les **fiches de suite** listées (connecter les MCP ; migrer les `.env` critiques vers le trousseau ; etc.).

## Comment vérifier

```bash
# depuis un worktree secondaire (sans .env), le jeton se lit au trousseau sans s'afficher :
TOKEN=$(ezk-secret get LEMONSQUEEZY_API_KEY) && test -n "$TOKEN" && echo "jeton lu, longueur=${#TOKEN}"
# puis un appel API LS en lecture, attendu HTTP 200 :
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.api+json" https://api.lemonsqueezy.com/v1/discounts
```

## Notes / décisions

- **Entrées de Thomas (2026-10-10)** : le jeton LemonSqueezy est **unique pour toutes les apps LS**
  (+ un jeton de **test**) → ranger **sans préfixe** et référencer par `from:` (comme les creds Apple
  de la recette). Le `.env` **non cloné en worktree** est un motif **fort** : le trousseau est au
  niveau machine, donc portable à n'importe quel worktree — il peut remplacer la copie manuelle des `.env`.
- **Correction d'une fausse croyance** : les MCP `vercel`/`github`/`supabase` **existent mais ne sont
  pas authentifiés** dans une session par défaut → indisponibles ; les CLI `gh`/`vercel`, elles, le
  sont. LemonSqueezy n'a **ni** l'un **ni** l'autre → c'est le vrai manque que ce spike comble.
- **État vérifié (2026-10-10)** : le jeton est **déjà** au trousseau (`LEMONSQUEEZY_API_KEY`,
  `LEMONSQUEEZY_API_KEY_TEST`), et `GET /v1/stores` répond **HTTP 200** (boutique « muti »). La capacité
  d'opérer LS **existe donc déjà** — le manque était le réflexe « vérifier avant de demander ». En
  revanche, muti n'a **pas** de `secrets.yaml` : le manifeste déclaratif reste à créer (1er pas d'urbanisme).
- **Lié** : recette `secrets-trousseau` ; fiches [20261001104806732](20261001104806732_ezk-secret-sync-manifeste-par-projet.md) (manifeste par projet) et [20261001142603963](20261001142603963_ezk-secret-apply-scope-compte-par-app.md) (scope par app) ; ADR-0023.
- **C'est un SPIKE** : borné, il livre une **décision + une preuve**, pas une implémentation complète.
  Les suites deviennent des fiches.
