---
id: "20260915094256241"
title: "Retirer l'épic — regrouper par thème (labels) + ordonnancer par milestones"
type: refactor
priority: P1
product: mega-city
version:
epic:
status: idea
ready:
pr:
labels: [backlog, methode, doctrine, milestone]
created: 2026-09-15
---

# Retirer l'épic — thème (labels) pour le QUOI, milestone pour le QUAND

## En clair

Décision PO (Thomas, 2026-09-15) : **on abandonne la notion d'épic.** Un épic n'était qu'un
regroupement, et GitHub n'en a pas. À la place, **deux axes séparés** :

- **le thème** (un `labels:`) dit *de quoi parle* une fiche — carte, ship, recette, contrat… ;
- **le milestone** (un jalon) dit *quand* et *dans quel ordre* on la livre.

On garde donc **deux gestes** de composition : **fusionner** (deux fiches qui se recoupent → une),
et **découper selon INVEST** quand une fiche est trop grosse. Plus de conteneur « épic » comme
troisième objet. Les fiches restent **indépendantes** ; elles se regroupent par thème et se
séquencent par milestone.

Cette décision **amende** la doctrine de composition (fiche shippée #175, qui gardait l'épic) et
l'**ADR-0017** (qui a créé `type: epic` + le champ `epic:`). L'ordre de travail est **loi d'abord,
code en dernier**.

## Contexte / Problème

Le backlog a gonflé (162 fiches actives) et un `aggregate` a reposé la question du modèle. Le PO
tranche : l'épic est un concept de trop.

- **Il ne livre rien** — la doctrine #175 (D1) dit elle-même : pas de critères, pas de PR, pas de code.
- **Il n'a pas de miroir GitHub** — l'export mappe feature→issue, sprint→milestone, version→release
  ([0171](0171-adapter-github-issues-push-only.md)). L'épic n'a aucune case.
- **Il dérive vers le spéculatif** — cas d'école [0051](0051-observabilite-qualite-produit.md) :
  7 enfants mintés d'avance, 0 construit depuis juillet, parké. Un conteneur qui gonfle le P1 sans traction.

Un panel adverse (architecte / PO-avocat / reviewer / juge) a été tenu le 2026-09-15. Il a acté
que **« tant pis si volumineux » est à rejeter** (ça viole le « S », Small, d'INVEST) — mais que la
**découpe INVEST** est à garder. Le PO retient la ligne du PO-avocat : remplacer l'épic par
**thème + milestone**, deux primitives simples et (pour le milestone) natives GitHub.

## Proposition

### A. Les deux axes
- **Thème = `labels:` contrôlés.** Une liste bornée de thèmes (carte, ship, recette, contrat,
  observabilite, dor, marketing, article, revue, cli, rationalisation…), validée par script pour
  éviter le vocabulaire non borné que l'ADR-0017 redoutait. Déjà amorcé : 54 fiches taguées le
  2026-09-15 (commit `ca16606`).
- **Milestone = le jalon.** On promeut les jalons ①→⑥ de `PLAN.md` en **champ** de fiche : **`milestone:`**
  (tranché le 2026-09-15 ; `version:` réservé aux releases). Le milestone porte l'**ordre** et le
  **regroupement de blocs** ; il donne un cumul d'avancement natif (issues closes / total).

### B. Ce qui remplace le conteneur épic
- Le regroupement thématique → un **label**.
- Le suivi « où en est ce bloc » + l'ordre → un **milestone**.
- Si un thème a besoin d'un **récit** partagé → une **fiche-chapeau ordinaire** (`status: idea`, non
  tirée), pas un `type:` à part.
- Le cumul d'avancement au board se calcule **depuis le label/milestone** (dérivé, jamais saisi — ADR-0001).

### C. Deux gestes de composition (au lieu de trois)
- **FUSION** : deux fiches se recoupent et se livrent en 1 PR indissociable → une fiche, les sujets
  deviennent des sections.
- **DÉCOUPE (INVEST)** : une fiche est trop grosse (test D3 : peut-on livrer une moitié utile seule ?)
  → plusieurs fiches indépendantes, chacune thémée et milestone-ée. **Ce test devient bloquant** au
  grooming (fini le « tant pis si volumineux »).

### D. Migration (loi d'abord)
1. **Amender la loi** : ADR-0017 (retrait de `type: epic` / champ `epic:`) + doctrine #175 (D1/D2
   réécrites sans l'épic). Décision PO + trace ADR **avant tout code**.
2. **Re-router les 9 épics actifs** : chaque épic → un label de thème + un milestone ; ses enfants
   deviennent des fiches indépendantes portant ces deux champs. [0051](0051-observabilite-qualite-produit.md)
   est clôturé (`superseded`).
3. **Puis le code** (~16 fichiers epic-aware : `loaders/fiches.ts`, `core/avancement-data.ts`
   (`deriveEpicStatus`), `backlog/aggregate.ts`, `backlog/plan-head.ts`, `core/plan-view-data.ts`,
   `bin/regen-backlog.sh`, `bin/portfolio.sh` + tests) : retirer l'épic, câbler le milestone.

## Critères d'acceptation

- [ ] ADR-0017 amendé (épic retiré) et doctrine #175 réécrite (2 gestes : fusion / découpe INVEST).
- [ ] Une **liste de thèmes bornée**, **distincte des labels libres existants** (`bmad`, `ux`, `dogfood`… restent valides — `fiches.ts` traite `labels:` en tags libres) : un thème porté par un **namespace** (ex. `theme:carte`) ou un champ séparé. Le validateur ne refuse **que** les thèmes hors-liste, jamais un label libre hérité.
- [ ] Le champ **`milestone:`** posé sur les fiches (tranché le 2026-09-15 ; `version:` réservé aux releases), avec l'ordre des jalons.
- [ ] Le board affiche un **cumul par milestone** (dérivé, pas saisi).
- [ ] Les **9 épics** re-routés (label + milestone), leurs enfants rendus indépendants ; `type: epic` disparu de l'enum.
- [ ] La **découpe INVEST/D3** est bloquante au grooming (`ready` refuse une fiche « trop grosse » divisible).
- [ ] [0051](0051-observabilite-qualite-produit.md) clôturée `superseded`.

## Comment vérifier

Après migration : `grep -rl "type: epic" features/` ne renvoie **rien** ; `regen` ne produit plus de
section « 🧭 Épics » ; un board montre chaque milestone avec « N fiches — k livrées » ; tenter de
poser un **thème inconnu** (namespace `theme:`) → le validateur bloque avec un message clair, **tandis
qu'un label libre existant** (`bmad`, `ux`) **passe**.

## Anti-doublon

- **Amende** la doctrine #175 (`done/20260825123700998`) — qui *gardait* l'épic. À réécrire, pas dupliquer.
- **Amende** l'ADR-0017 (`products/mega-city/docs/adr/0017-...`).
- **À coordonner** avec [20260912180313727](20260912180313727_repenser-backlog-plan-vs-backlog-iterations.md)
  (« repenser le backlog » : champ `iteration`/`version`, fusion PLAN→BACKLOG). Le **milestone** de
  cette fiche et le champ `version`/`iteration` de l'autre **se recouvrent** — à unifier au grooming
  (probable fusion des deux fiches sur l'axe « champ de séquencement »).
- Modèle de données des tags = fiche `0092` (`labels:` / `depends:`). On s'y adosse.

## Notes

Origine : décision PO du 2026-09-15, prise à l'issue d'un `/ezk-backlog aggregate` et d'un panel
adverse (4 voix). Le panel recommandait majoritairement de *renommer* l'épic plutôt que le retirer ;
le PO tranche pour le **retrait** au profit de thème + milestone (parité GitHub, deux axes clairs).
Le point de vigilance du panel — un label non contrôlé rejoue l'option A rejetée par l'ADR-0017 — est
adressé par la **liste de thèmes bornée + validateur** (critère ci-dessus).
