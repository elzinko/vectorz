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

- [x] `Board.tsx` **ne lit plus `BOARD_DATA` en dur** : il lit une source injectée (`fetch /api/board`),
      repli sur l'échantillon. *(Livré côté web + testé : succès → live, échec → repli.)*
- [ ] L'endpoint local `/api/board` répond `BoardData` (l'échantillon à cette étape). *(RESTE : moitié
      daemon — route + provider dans `packages/app`, décision d'archi cop1 sur la provenance de l'échantillon.)*
- [~] **Activation par projet** + **repli signalé**. *(Repli signalé LIVRÉ + prouvé navigateur ; activation
      par config RESTE, avec la moitié daemon.)*
- [~] Preuve **avant / après** : le cas **repli** est prouvé (capture : board qui tente le live, retombe
      sur l'échantillon, badge « échantillon · live indisponible »). Le cas « servi par l'endpoint » suit la moitié daemon.

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

- **Moitié WEB livrée (2026-10-24), en autonomie.** `Board.tsx` lit une source injectée : au montage,
  `fetch('/api/board')` (best-effort, bulletproof) ; succès → remplace l'échantillon ; échec / 404 / pas
  de daemon / JSON cassé / `fetch` absent → **repli sur `BOARD_DATA`, signalé** par un badge « échantillon
  · live indisponible ». Testé (`board-source-injectee.test.tsx` : les deux bords) ; `web typecheck` +
  `web test` (93) + `web build` verts ; **prouvé navigateur** (dev server sans daemon → `/api/board` 500 →
  repli + badge visible, capture jointe). Le board ne lit plus `BOARD_DATA` en dur.
- **Moitié DAEMON à faire = archi cop1, pas mécanique.** L'endpoint `/api/board` vit dans `packages/app`
  (daemon fait-main, pattern provider). Nœud de conception non tranché : **d'où vient `BoardData` côté
  daemon ?** L'échantillon vit dans `web` (pas importable par `app`), et les vraies sources sont les
  sœurs 2 (backlog cop1-local) et 3 (adaptateur journal). « Servir l'échantillon par l'endpoint »
  suppose donc de décider la provenance (échantillon partagé ? stub ? attendre les sœurs 2/3 ?). C'est
  la part qui demande l'œil du PO sur l'archi de SON produit (board conçu par maquette) — pas construite
  à l'aveugle. Contrat choisi côté web : `GET /api/board` → `BoardData` (la map des projets), proxy vite
  `/api` déjà en place.

- **Sprint board (2026-10-24), via ezk-sprint — reportée.** La moitié **web** est construite et mergée en local : `Board.tsx` lit `/api/board`, retombe sur l'échantillon **signalé à l'écran** quand la source est injoignable, test `board-source-injectee.test.tsx`. Reste la moitié **daemon** : l'endpoint `/api/board` + la **provenance multi-projets**. C'est un **build structurel du board** → réservé au **panel/maquette** (garde-fou du jour : le structurel ne se bâtit pas en autonomie hands-off), pas tiré en l'état.
