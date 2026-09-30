---
id: "20260930123438875"
title: "ezk-sprint start/close au niveau lot + rétro-compat par verbe (cycle de vie)"
type: feature
priority: P0
product: mega-city
milestone:
labels: [ezk-sprint, cycle-de-vie, methode, nommage]
depends: ["20260930194219046"]
status: idea
ready:
pr:
evidence: none # méthode / skills / doc, pas d'écran
created: 2026-09-30
---

# 20260930123438875 — ezk-sprint start/close au niveau lot + rétro-compat par verbe

> **Fiche 2/3 du re-scope du 2026-09-30** (panel adverse, Option A). Fondation =
> [fiche 1 : le lot dans ezk-backlog](20260930194219046_ezk-backlog-lot.md) (construite **avant** celle-ci).
> Suite = [fiche 3 : ezk-product-build orchestrateur de session](20260930194219068_ezk-product-build-orchestrateur-session.md).
> Cette fiche est scopée aux **verbes `ezk-sprint`** ; le lot vient de la fiche 1, le repositionnement product-build part en fiche 3.

## En clair

On sépare trois étages qui étaient collés : **la story**, **le sprint**, **la session**.
Le sprint devient une vraie unité Scrum — un **lot** de user stories qui produit un **incrément**.
Il s'ouvre et se ferme : `ezk-sprint start` / `ezk-sprint close`. La **session** (le fait de
s'asseoir puis de se lever, au sens Claude Code) garde `ezk-archive` pour ne rien perdre. Les
**cérémonies** (planning, retro) restent **hors** du sprint et le bouclent par le backlog.

Résultat visé : dans une même session, on peut enchaîner `start → stories → close` (un incrément),
puis une retro, puis un planning, puis relancer un sprint — autant de fois qu'on veut.

## Contexte / Problème

Aujourd'hui la méthode colle deux niveaux et il manque celui du milieu :

- `ezk-sprint run` construit **une** feature = **une** PR. Un « sprint » ≈ une feature.
- `ezk-sprint check` (ex-`ezk-start`) ouvre, `ezk-archive` clôt — au niveau **session**.

Il n'existe pas d'étage « sprint = lot de stories → incrément ». Or en Scrum un Sprint contient
1..N user stories et aboutit à un **Incrément** ; une session de travail peut enchaîner plusieurs
sprints. L'asymétrie ressentie (ouverture *dans* `ezk-sprint`, clôture *dehors* dans `ezk-archive`)
est le symptôme de cet étage manquant.

Un mini-panel (architecte + scrum master) tenu le 2026-09-30 a d'abord rejeté `ezk-sprint close`
par argument de cadence — « close = 1×/session, sprint = 1×/feature ». Cet argument **tombe** dès
qu'on rétablit le niveau sprint : une session contient N sprints, donc `close` tourne **1× par
sprint**, à la bonne cadence. La prémisse était trop étroite ; cette fiche la corrige.

## Proposition

Trois étages emboîtés — `story ⊂ sprint ⊂ session` :

- **Story** — l'unité de travail. Reste **1 story = 1 PR** (inchangé).
- **Sprint** — un **lot** de stories → un **Incrément**. Verbes dans le namespace `ezk-sprint`
  (même scope + même cadence) : `ezk-sprint start` (ouvre + intake ; remplace `check` comme verbe
  par défaut, le dry-run read-only reste en option) et `ezk-sprint close` (scelle l'incrément et
  rend la main à la session).
- **Session** — frontière de **persistance** (concern d'outillage Claude Code, pas de Scrum).
  `ezk-archive` **inchangé** (le nom porte la capacité durable : snapshot `docs/sessions/` +
  anneau de handoff). Ouverture de session **implicite** : reprise du handoff au premier `start`.

Cérémonies **hors sprint** : le **planning** (groomer/choisir le lot) et la **retro**
(`ezk-retro`) encadrent le sprint sans y entrer. La retro n'agit pas directement : elle **produit
des fiches** groomées au planning du sprint suivant. Boucle : `retro → fiches → backlog → planning
→ sprint`.

Nommage écarté : `stop` pour la clôture normale (en Scrum « stop/cancel a sprint » = fin
**anormale**) ; on termine avec `close`. `ezk-sprint retrospective` écarté (ferait entrer une
cérémonie dans le sprint, contre la doctrine « le sprint n'est pas une cérémonie »).

Décision consignée en [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md)
(statut *proposé*, à ratifier au build) : « Clôture de sprint vs archive de session ; cérémonies
hors sprint ». Étend la doctrine ADR-0039 §2 (« la PR est un mécanisme, pas une cérémonie ») aux
bornes de cycle de vie.

## Critères d'acceptation

- [ ] `ezk-sprint start` **consomme le lot** figé par `ezk-backlog` (fiche 1) et exécute l'intake. Rétro-compat **par verbe** (pas un alias commun) : `check` → `start --dry-run` (**reste read-only**) ; `run` → cycle complet `start → stories → close` (**build 0→10 inchangé**).
- [ ] `ezk-sprint close` clôt le sprint, scelle l'**incrément** (fiches `shipped` du lot), et **rend la main à la session**.
- [ ] `ezk-archive` **inchangé**, dédié à la clôture de **session** ; ouverture de session implicite au 1er `start`.
- [ ] La retro reste hors sprint (`ezk-retro`) ; **aucune** sous-commande `ezk-sprint retrospective`.
- [ ] **ADR-0054 ratifié** ; `SKILL.md` **`ezk-sprint`** et **`ezk-archive`** + `SPRINT.md` (suit le lot) à jour ; tests verts. *(Le repositionnement `ezk-product-build` est en [fiche 3](20260930194219068_ezk-product-build-orchestrateur-session.md).)*
- [x] **Panel adverse** (architecte + PO/juge) tenu le 2026-09-30 → Option A + découpage en 3 fiches (voir Notes).

## Comment vérifier

```bash
# 1) les verbes de cycle de vie existent au bon niveau
grep -nE "ezk-sprint (start|close)" products/mega-city/skills/ezk-sprint/SKILL.md
grep -nE "session|handoff" products/mega-city/skills/ezk-archive/SKILL.md

# 2) la gate mécanique de mega-city reste verte
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts

# 3) revue narrative : une session enchaîne bien
#    start → stories(1 PR chacune) → close(incrément) → ezk-retro → planning → start …
```

## Notes / décisions

- Matière de conception (2026-09-30, brainstorm), **committée avec la fiche** :
  [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) (proposé) et le
  [schéma des 3 étages](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.svg).
- Verdicts du mini-panel : architecte **GO-avec-amendements** (garder 3 corps séparés, façade par
  pointeurs) ; scrum master a signalé que le vrai conteneur Scrum = la session (retenu). Le terme
  du livrable de sprint = **Incrément**.
- Décision produit (PO) : niveau **session** nommé « session » (terme réel Claude Code) ; priorité
  **P0**, à groomer pour le **prochain sprint**.
- Doctrine réutilisée : bornes de cycle de vie = **mécanisme/hygiène**, pas cérémonie (ADR-0039 §2).
- **Grooming panel 2026-09-30** (architecte + PO/juge) : fiche jugée trop grosse → **scindée en 3**
  (1 = lot `ezk-backlog` · 2 = verbes `ezk-sprint` (celle-ci) · 3 = `ezk-product-build`). Contradiction
  `run` ↔ product-build tranchée par le PO = **Option A** : `ezk-sprint` possède la boucle du lot,
  `ezk-product-build` enchaîne les **sprints** (lots). Questions ADR (a) [pas d'objet sprint] et
  (b) [le lot vit dans `ezk-backlog`] résolues.
