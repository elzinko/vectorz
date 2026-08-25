---
id: "20260825213807501"
title: Vue « Plan » dans le board — l'ordre décidé du travail + la prochaine fiche tirable (rendre PLAN.md, sans objet sprint)
type: feature
priority: P2
product: mega-city
version:
epic:
status: shipped
ready: 2026-08-25
pr: "#169"
created: 2026-08-25
---

# 20260825213807501 — Vue « Plan » dans le board

**En clair.** Aujourd'hui on voit le *stock* de features (le board d'avancement : toutes
les fiches triées par priorité, servi par `ezk:map`). On ne voit **nulle part** l'*ordre
décidé* du travail — la séquence que le PO curate à la main dans `features/PLAN.md` — ni
« quelle fiche vient ensuite ». Cette fiche ajoute un **onglet « Plan »** à la page du
board : les mêmes cartes, mais rangées **dans l'ordre du plan**, plus un **petit encart**
qui explique en clair backlog / plan / sprint et pointe la **prochaine fiche tirable**
(celle que le prochain sprint piochera). On **compile depuis `PLAN.md`** (un fichier déjà
curé) et depuis le front-matter des fiches — on n'invente **aucun** objet « sprint », on ne
dessine rien à la main.

**Si tu arrives frais.** *Board d'avancement* = la page `diagrams/avancement/board.html`,
servie par `pnpm ezk:map avancement`, qui liste les fiches en cartes. *PLAN.md* =
`features/PLAN.md`, le fichier où l'ordre de travail est décidé à la main (sections à
horizons : « NOW », « NEXT », « LATER »… et d'autres titres libres), distinct du backlog
(le stock trié par priorité). *Fiche tirable* = une fiche `todo` **et** `ready` ; la
première dans l'ordre du plan est ce que le prochain sprint prend.

## Contexte / Problème

La **carte du domaine** (PR #162) montre la *structure* de la méthode. Le **board
d'avancement** (fiche `20260823124042842`, lot 0, livré `main@7f0f12d`) montre le *stock* :
les fiches actives × priorité × statut, filtrables, cliquables. Ce qui manque, c'est
l'**ordre décidé** : la séquence que le PO curate dans `features/PLAN.md`, et le lien vers
le sprint (« la prochaine fiche à tirer, c'est celle-là »).

Pour connaître cet ordre aujourd'hui, il faut **ouvrir `PLAN.md` à la main** et le recouper
de tête avec l'état `ready` de chaque fiche. Le PO l'a demandé le 2026-08-25 : voir le plan
directement dans la page, avec un encart qui rappelle la différence entre backlog, plan et
sprint.

**Garde-fou hérité (verdict panel adverse du 2026-08-23).** Le lot 1 de `20260823124042842`
— la **frise temporelle des sprints** et le **diagramme du process scrum avec les fiches
posées dessus** — a été **gelé** pour éviter d'inventer un « 4ᵉ système de sprint » (objet
*sprint-as-data* : sprint doté d'un id, de dates, d'un lot de fiches). Cette fiche est le
**dégel scopé** que le panel attendait : elle **compile le `PLAN.md` qui existe déjà** (même
catégorie que le board lot 0, bénie par le panel), elle n'introduit **pas** d'objet sprint,
elle ne rouvre **ni** la frise **ni** le diagramme du process. Le panel a aussi pointé une
**dérive de vocabulaire** : « sprint » désigne ici autre chose que la fiche tirable — donc
le mot « sprint » n'est **pas** une étiquette de l'UI (voir garde-fous ci-dessous).

## Proposition

POC d'abord (visualiser), polish ensuite. Même principe que le board et la carte :
*compiler depuis les fichiers, ne rien dessiner à la main.*

1. **Un onglet « Plan » dans `board.html`** — une bascule « Board » (tri priorité,
   l'existant, **inchangé**) ↔ « Plan » (ordre de `PLAN.md`). Mêmes tokens/CSS, mêmes cartes
   (`carteHtml`), même page : le design est **repris**, pas refait. *Décision archi : onglet
   dans le fichier existant, pas de page `diagrams/plan/` séparée — le CSS du board est
   embarqué inline, une page séparée le dupliquerait et casserait l'encart « sur la page ».*
2. **Les entrées rangées par section réelle du plan.** Un couloir par **section de
   `PLAN.md`** (`##`/`###`), **dans l'ordre du document, quel que soit l'intitulé** — le
   fichier réel a « ▶️ NOW bis », « 🧹 Hygiène préalable », « ↪️ Après le refactoring », « ▶️
   NOW », « ⏭️ NEXT », « ⏳ LATER », « 🚦 Note » (deux sections « NOW »). On ne gate **jamais**
   sur les trois mots NOW/NEXT/LATER (ce serait un bug : « NOW bis » et « Hygiène » seraient
   oubliés). Une entrée du plan reste cliquable vers sa fiche source (comme le board).
3. **Un petit encart pédagogique** en tête de l'onglet : en clair, *backlog = tout le stock
   (priorité)*, *plan = l'ordre décidé*, *le prochain sprint tire la tête `ready` du plan*.
   L'encart affiche la **prochaine fiche tirable** (première `todo` + `ready` de l'ordre) et
   les **têtes bloquées** (les `todo` sans `ready:` qui la précèdent, à groomer) — exactement
   le signal que rend déjà `plan:head` en CLI, via `crossBacklogHead` **réutilisé tel quel**.
4. **Compilé, jamais saisi.** Un cœur pur `src/core/plan-view-data.ts` (patron
   `avancement-data.ts`) : `buildPlanViewData(planMd, fiches)` — **pur**, tout injecté, aucun
   `fs`. Il compose une **fonction sœur `parsePlanSections`** (nouvelle, dans
   `src/backlog/plan-order.ts`, qui **garde les sections**) + la jointure aux fiches
   (`loadFiches`) + `crossBacklogHead`. Un bord I/O `bin/regen-plan-view.ts` injecte le bloc
   `window.EZK_PLAN` entre des marqueurs **`ezk-plan-data:begin/end` disjoints** de ceux
   d'avancement. Un **test d'invariant** `plan-view-board.test.ts` (miroir de
   `avancement-board.test.ts`) rougit si `PLAN.md` ou une fiche change sans régénérer.

**Fondations déjà en place** (vérifiées présentes) : `parsePlanOrder` (ordre des ids, à ne
**pas** modifier — ses tests + les CLI `plan:order`/`plan:head` en dépendent) ;
`crossBacklogHead` (tête tirable + têtes bloquées + ids introuvables) ; `loadFiches` (tout
le front-matter) ; le patron de marqueurs gérés (`upsert…Block`, échappement `<`). Le
seul vrai ajout de logique : **garder les sections** de `PLAN.md` sans rien perdre.

## Garde-fous « on ne franchit pas la ligne sprint-as-data » (verdict panel 2026-08-23)

- [ ] **Aucun axe temps, aucune date, aucun numéro ni regroupement « sprint »** dans la vue.
      Les seuls libellés de couloir sont les **titres de sections de `PLAN.md`** eux-mêmes.
- [ ] **Aucune donnée persistée nouvelle, aucun champ neuf** sur les fiches. Les données ne
      vivent que dans le bloc régénéré du board, entre marqueurs — comme `avancement`.
- [ ] **Le mot « sprint » n'est pas une étiquette de l'UI** : l'onglet = « Plan » ; l'encart
      parle de « prochaine fiche tirable ». « Sprint » n'apparaît que dans la **phrase
      pédagogique** de l'encart (« le prochain sprint tire cette fiche »), jamais comme objet.

## Critères d'acceptation (MVP — visualiser)

- [ ] `pnpm ezk:map avancement` : une bascule **« Plan »** apparaît sur le board et montre
      les entrées **dans l'ordre de `PLAN.md`**, **groupées par section réelle** du document
      (titres bruts, ordre du document), pas par trois mots codés en dur.
- [ ] **Rien n'est perdu sur une ligne multi-ids.** Une entrée comme « Distribution — 0087 ·
      0050 · 0078 · 0096 · 0186 » affiche **tous** ses ids (une carte/puce jointe par id),
      pas seulement le premier. `parsePlanSections` capture **tous** les ids d'une ligne + sa
      prose ; s'il subsiste du texte non résolu, il est **montré**, pas avalé.
- [ ] **Les entrées déjà livrées sont dé-emphasées** (grisées/repliées), **pas absentes** —
      `PLAN.md` est majoritairement barré ; sans ça l'onglet NOW serait un mur de « shipped »
      où la seule carte vive se perd. Un moyen de les masquer/afficher est acceptable.
- [ ] Un **encart** explique en clair backlog / plan / sprint, affiche la **prochaine fiche
      tirable** (première `todo` + `ready` de l'ordre) et les **têtes bloquées** (`todo` sans
      `ready:` qui la précèdent).
- [ ] Chaque carte du plan cite **id + titre + statut + priorité** et **cliquer ouvre la
      fiche source** (lien servi par `ezk-map`, comme le board).
- [ ] Les **ids du plan introuvables** dans `features/` sont **signalés** dans la vue
      (issus du `found:false` de la jointure — pas seulement de `crossBacklogHead.unresolved`).
- [ ] **Une section sans aucun id parsé** (cas réel possible) est gérée explicitement :
      omise des couloirs (ou état vide clair), jamais un couloir cassé.
- [ ] Les données sont **compilées** ; le **test d'invariant** « disque ≡ régénéré » rougit
      si `PLAN.md` ou le backlog changent sans regen. `parsePlanOrder` reste **inchangé**
      (ses tests existants sont le filet de non-régression).
- [ ] **Rendu par `textContent` uniquement** (jamais `innerHTML` sur du texte de fiche/plan)
      — étendre au 2ᵉ script la vérification anti-XSS déjà faite sur le board.
- [ ] **Onglet accessible** : bascule Board↔Plan opérable au clavier, rôles ARIA d'onglet,
      contraste suffisant, **parité dark mode** avec le board (le toggle est du net-neuf).
- [ ] Le design **reprend celui du board** (mêmes variables CSS / composants).

## Hors périmètre (lots suivants — notés, pas faits ici)

- **Bonus PO — éditer depuis la page** : sélectionner des fiches pour les passer `ready`
  et **réordonner le plan** depuis le navigateur. C'est un **write-back** vers les
  fiches / `PLAN.md`. Vérifié : le serveur `ezk-map` est **GET-only** (200/403/404, aucun
  handler d'écriture), zéro dépendance. La couture propre (sans la construire ici) :
  fonctions inverses **pures** côté backlog (`setFicheReady`, `applyPlanReorder`) pilotées
  par un **bord d'écriture séparé** (jamais `ezk-map.ts`), puis regen de la vue — la page
  reste une **projection pure**, elle ne détient pas d'état édité. **Ce lot exigera un ADR**
  (il casse l'invariant « serveur GET-only / zéro-dép », ADR-0001 §2). → fiche/lot dédié.
- **Toujours gelé** (verdict panel) : la frise temporelle des **sprints réels** et le
  **diagramme du process scrum** avec fiches posées. Cette fiche ne les rouvre pas.

## Comment vérifier

```bash
# 1) noyau pur + invariants (rougit si PLAN.md/backlog changent sans regen)
pnpm --dir products/mega-city test

# 2) régénérer le bloc de données de la vue plan depuis le backlog réel
pnpm --dir products/mega-city plan-view:regen   # (nouveau bord I/O)

# 3) ouvrir la page et basculer sur l'onglet « Plan »
pnpm ezk:map avancement
```

Preuve agent attendue au sprint : capture de l'onglet « Plan » (couloirs par section réelle
+ encart avec la prochaine fiche tirable, livrées grisées), et les tests d'invariant verts.

## Glossaire

- `board d'avancement` — la vue `diagrams/avancement/board.html` (fiches en cartes), servie
  par `ezk:map`.
- `PLAN.md` — `features/PLAN.md` : l'**ordre décidé** à la main (sections à horizons),
  distinct du backlog (stock trié par priorité).
- `fiche tirable` — la première fiche `todo` **et** `ready` dans l'ordre du plan : ce que le
  prochain sprint pioche.
- `sprint-as-data` — un hypothétique **objet** « sprint » (id, dates, lot de fiches),
  délibérément **non** créé ici (verdict panel adverse 2026-08-23).

## Notes / décisions

- **Origine** : demande PO du 2026-08-25. Suite scopée de la fiche livrée
  `20260823124042842` (board lot 0), dont le lot 1 (frise/process) reste gelé.
- **Décisions d'archi actées au grooming** (agent architecte) : onglet dans `board.html`
  (pas de page séparée) ; cœur pur `plan-view-data.ts` + bord `regen-plan-view.ts` + test
  d'invariant miroir ; **`parsePlanSections` en fonction sœur** (partager le prédicat de
  détection de ligne ; ne pas muter `parsePlanOrder`, dont l'extraction 1-id-par-ligne
  diffère) ; marqueurs `ezk-plan-data:*` disjoints ; **pas d'ADR pour ce sprint** (on
  *applique* ADR-0001/0003) — l'ADR viendra pour le write-back.
- **Vocabulaire (relecture adverse)** : fiche renommée `vue-plan-ordre-travail` ; « sprint »
  retiré des étiquettes, gardé comme concept pédagogique dans l'encart.
- **Cas de bord épic (lien `0098`)** : `crossBacklogHead` **saute les épics** (jamais tête,
  jamais bloqué). Si une tête de plan est un épic, l'encart pointe « au-delà » — la vue doit
  le **dire** (ne pas le laisser lire comme un bug).
- **Liens (pas des doublons)** : `20260823121712716` (vues générées — kanban par *statut* ;
  ici couloirs par *horizon de plan* — partager la mécanique regen/invariant) ; `0098`
  (plan:head, saut d'épic) ; `0100` (« Sprint intake » — pendant métrique de l'encart, noter
  la tension de vocabulaire). `20260812100109940` (ship sync PLAN/PORTFOLIO) = **pas** lié
  (écriture, pas une vue).
- Liens code : `src/core/avancement-data.ts` (patron), `bin/regen-avancement.ts`,
  `src/__tests__/avancement-board.test.ts`, `src/backlog/plan-order.ts` + `plan-head.ts`
  (fondations), `diagrams/avancement/board.html` (cible), verdict panel
  `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`.
- **Revue adverse (ezk-reviewer) : GO** — gate rejouée indépendamment (typecheck, 496 tests,
  regen idempotent), zéro bloquant, XSS clos (textContent + href relatif + `<` échappé).
- **Limites connues de l'extraction d'ids (P2, fail-safe — un faux id remonte en
  « introuvables », jamais collé à une carte)** : (1) une **année nue** sur une puce racine
  (`- objectif 2026`) serait prise pour un id — aujourd'hui absente du vrai PLAN.md ; (2) un
  token de 4 chiffres borné (PR `#1234`, fragment de SHA) est capté quelle que soit sa nature
  — seul cas gênant : collision exacte avec un id legacy existant, très improbable (PRs à 3
  chiffres, SHA non alignés). À durcir le jour où un PR à 4 chiffres entre dans PLAN.md.
