---
id: "20261024130841976"
title: "Board web : le tuyau — source injectée + endpoint local + repli gated (au lieu de BOARD_DATA)"
type: feature
priority: P1
product: cop1
milestone: board
version: "v0.24.0"
labels: [dashboard, board, data-wiring, runtime, cop1]
status: ready
pr:
evidence: before-after
created: 2026-10-24
split_from: "20261018121537582"
---

# 20261024130841976 — Board web : le tuyau de bout en bout

**En clair.** Le board web de cop1 lit un échantillon figé (`BOARD_DATA`). Cette sœur bâtit le
**tuyau** qui l'alimentera : `Board.tsx` lit une **source injectée** (pas la constante), un **endpoint
local** sert les données du board, et un **repli** retombe sur l'échantillon — affiché comme tel —
quand la source est absente ou le serveur injoignable. On prouve le tuyau **en servant d'abord
l'échantillon par le vrai chemin** : le câblage marche, les vraies données viennent dans les sœurs 2 et 3.

**Si tu arrives frais.** Le produit est **cop1**, la webapp qui observe la méthode. Son board
(`products/cop1/packages/web`, `Board.tsx`) affiche un objet `BoardData` aujourd'hui codé en dur
(`src/board/data.ts`). cop1 a déjà un **daemon HTTP local** (`packages/app/.../daemon/HttpServer.ts`)
qui sert le journal sur `127.0.0.1` ; on l'étend d'une route board.

## Contexte / Problème

C'est la 1re des 3 sœurs de [brancher le board sur les vraies données](done/20261018121537582_brancher-board-web-vraies-donnees.md)
(découpe « tuyau / plan réel / runs réels »). Faits, vérifiés dans le code :

- `Board.tsx:14` importe `BOARD_DATA` depuis `src/board/data.ts` (constante figée).
- Le daemon cop1 (`HttpServer.ts`) sert déjà `/api/supervision/*` sur `127.0.0.1`, par un routeur
  fait-main (`req.method` / `req.url`). Pas encore de route board.
- Le board neuf est un SPA vite sans backend : il faut un endpoint que vite relaie en dev.

## Proposition

- **`Board.tsx` lit une source injectée** au lieu de `BOARD_DATA` : au montage, il `fetch`
  l'endpoint ; échec / absent → repli sur l'échantillon, **signalé à l'écran** (« échantillon »,
  « données live indisponibles »), jamais un écran cassé ni un faux chiffre muet.
- **Endpoint local `/api/board/<projet>`** sur le daemon cop1, rendant `BoardData`. À cette étape il
  rend **l'échantillon** (le câblage de bout en bout, la vraie source branchée ensuite). En dev, vite
  relaie ce chemin.
- **Activation par projet** : un réglage dans `.vectorz/config.yml` allume la source live (même esprit
  que les deux portées de config d'ADR-074). Réglage absent → repli échantillon.

## Critères d'acceptation

- [ ] `Board.tsx` **ne lit plus `BOARD_DATA` en dur** : il lit une source injectée (endpoint ou repli).
- [ ] L'endpoint local `/api/board/<projet>` répond `BoardData` (l'échantillon à cette étape).
- [ ] **Activation par projet** : réglage présent → source ; réglage absent ou serveur injoignable →
      repli sur l'échantillon, **signalé à l'écran**, sans crash.
- [ ] Preuve **avant / après** en PR : board sur `BOARD_DATA` → board servi par l'endpoint (même
      échantillon, mais par le vrai chemin) + le cas repli (serveur éteint).

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web build && pnpm --dir products/cop1/packages/web test
# Lancer le daemon + le web, ouvrir le board : servi par l'endpoint ; couper le daemon : repli signalé.
```

## Notes / décisions

- Sœur de [board-web (fiche source)](done/20261018121537582_brancher-board-web-vraies-donnees.md),
  découpée au grooming (2026-10-24). Modèle et contrat :
  [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ; read-model,
  cop1-local et vue live : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md)
  (§D8/D9/D11) ; « live, jamais committé » : ADR-0043/0055 ; maquette du board validée en v0.17/v0.18.
- Runtime, pas build-time (décision de la fiche source) : un instantané figé mentirait dès qu'un run
  tourne. L'endpoint calcule à la demande, comme l'ancien board (`bin/ezk-map.ts`).
- **Prérequis des sœurs 2 et 3** : elles branchent les vraies sources (backlog, journal) dans ce tuyau.
