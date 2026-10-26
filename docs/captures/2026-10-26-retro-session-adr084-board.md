---
type: retro
date: 2026-10-26
theme: "Session desktop : cycle ADR-084 (surface d'émission) + builds G5 (clé de chantier) et adaptateur board"
scope: "ce qui a été vécu dans la session — panel adverse, deux builds autonomes en desktop, revues ; hors arriéré de carnet (10 notes inter-sessions, signalé pour une passe dédiée)"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "Nommer dans les skills qui délèguent le repli quand les agents de rôle ne sont pas bindés (desktop) : revue/panel → general-purpose avec le contexte ; décision → reste au PO. Plus de dégradation silencieuse."
    kind: regle
    target: skill:ezk-product-build
    by: [qualite, dev]
    status: ✅
    decision: "Écrit dans les skills (ezk-product-build, ezk-sprint, ezk-retro) ; formalisation en rules/ non retenue — le texte des skills suffit."
    date: 2026-10-26
  - proposition: "Rendre STRUCTURÉ le drapeau « réservé panel/maquette » d'une fiche (comme blocked:), pour que l'intake du builder le signale AVANT le build, pas au milieu."
    kind: feature
    by: [produit, architecture]
    status: ✅
    decision: "Fiche existante 20261015213921103 (la DoR vérifie la prémisse) enrichie du cas — anti-doublon, pas de nouvelle fiche."
    date: 2026-10-26
  - proposition: "Enrichir le board : émettre les transitions de fiche (fiche.transition) et les jetons, puis remplir LiveRun.moments/tok. Touche le contrat → son propre panel (c'est le G4 différé d'ADR-084)."
    kind: feature
    by: [architecture, produit]
    status: ✅
    decision: "Fiche créée : 20261026132118384 (idea, blocked: attend-panel — touche le contrat)."
    date: 2026-10-26
  - proposition: "Décisivité en desktop/auto : surfacer un vrai blocage UNE fois, décisivement ; ne pas re-surfacer ; dire au net si un run auto est actif. (Déjà capturé en mémoire — doublon probable avec les règles globales.)"
    kind: action
    by: [produit]
    status: ❌
    decision: "Doublon — déjà couvert par la mémoire + les règles globales de clarté ; rien créé."
    date: 2026-10-26
  - proposition: "Traiter l'arriéré de carnet (10 notes inter-sessions, 14→24 oct.) dans une passe de rétro dédiée."
    kind: action
    by: [produit]
    status: ❌
    decision: "Pas maintenant — passe de carnet dédiée à prévoir ; les 10 notes restent en place (non déplacées)."
    date: 2026-10-26
---

**En clair :** cette session a fait deux choses bien — un panel adverse qui a vraiment attrapé des erreurs de conception, et deux builds livrés verts. Deux frictions reviennent : les **agents de rôle de la méthode ne tournent pas en desktop** (tout est retombé sur des agents génériques, en silence), et les **garde-fous d'une fiche** (« ne pas construire tout de suite », « réservé au panel ») n'étaient **pas visibles à l'intake** — on les a découverts en construisant. Rien n'est rangé : à toi de cocher ce qu'on garde.

## 1 · Les faits de départ

- Le panel adverse d'ADR-084 (3 lentilles) a attrapé de vrais défauts : un catalogue de moments existait déjà (`moments.yml`), le graphe ne pouvait pas valider l'arête proposée, un type d'évènement ajouté aurait cassé le validateur. Le cycle a bien joué son rôle.
- **Les agents de rôle (`ezk-dev/qa/reviewer/pm/architect`) ne sont pas bindables en desktop** : le panel, les revues, et cette rétro même sont retombés sur des agents `general-purpose`, sans que rien ne le nomme. Le repli documenté d'ezk-product-build dit « retombe en manuel » — ce n'est pas ce qui s'est passé pour les revues.
- La fiche « runs réels » était `ready` mais portait `blocked:` **et** une note libre « réservé panel/maquette, pas d'autonomie hands-off » **et** des critères partiellement différés. L'intake ne voit que `blocked:` ; le reste n'a surfacé qu'en cours de build, en lisant le code.
- Le builder auto, lancé en desktop, est tombé deux fois sur « aucune fiche tirable alignée » : la tête du plan (une fiche recette) divergeait du fil de la conversation.
- Friction répétée : « pourquoi tu me poses des questions ? » — la cadence de surfaçage a agacé, même quand le blocage était réel.
- Le premier run de supervision a été ouvert **sans** `version`/`milestone` (avant le correctif G5) : il ne porte pas lui-même la clé — ironie corrigée depuis.

## 2 · Tour 1 — chaque lentille propose

> **Mode dégradé assumé.** Les agents de rôle n'étant pas bindés en desktop, les lentilles ont été portées par l'orchestrateur à partir du contexte complet de la session, pas par des sous-agents indépendants. C'est précisément le symptôme n°1.

- **Architecture :** le cycle ADR est sain ; le vrai trou structurel persiste — la « surface d'émission déclarée » reste en prose (le constat d'ADR-032), et les types du board (timeline process) ne collent pas aux évènements bruts du journal. → feature d'enrichissement, panel requis.
- **Qualité :** le pattern golden/contrat a tenu (test d'émission étendu, adaptateur sur fixtures). Mais la rigueur « reviewer » n'est pas garantie en desktop quand le rôle retombe sur un agent générique sans le dire. → nommer le repli.
- **Dev :** une fois cadré, le build fut net (adaptateur pur + fixtures). Le coût a été de **découvrir** le périmètre réel (mince) en lisant `data.ts`, pas de le lire sur la fiche. → surfacer les garde-fous de la fiche à l'intake.
- **Produit :** la tension décisivité ↔ honnêteté. Surfacer un blocage réel est juste ; le re-surfacer, et ne pas trancher au net le mode auto, agace. → déjà en mémoire.

## 3 · Tour 2 — confrontation et convergence

- Convergence : le symptôme « desktop » (agents de rôle absents) est **structurel** et touche trois skills → une règle qui le nomme, pas une rustine.
- Convergence : le garde-fou de fiche invisible à l'intake est structurel (note libre vs champ lu) → une **feature** (drapeau structuré), pas une discipline de plus.
- Écarté du périmètre immédiat : l'enrichissement du board (moments/jetons) — réel, mais c'est le G4 différé qui **touche le contrat** et exige son propre panel → feature au backlog, pas maintenant.
- Retiré par son auteur : une « règle de décisivité » nouvelle — redondante avec la mémoire et les règles globales (voir le juge).

## 4 · Le juge de cohérence

- **Repli desktop (règle, skill:ezk-product-build)** : *cohérente, en raffinement.* Elle précise le « repli de sûreté » existant (« retombe en manuel ») sans le contredire : pour une **revue/panel**, general-purpose + contexte est un repli admis ; pour une **décision**, ça reste au PO. Pas un doublon.
- **Drapeau structuré de fiche (feature)** : pas de règle, pas de juge requis — structural, part au backlog si retenue.
- **Enrichissement board (feature)** : idem, backlog + panel contrat.
- **Décisivité desktop/auto (action)** : **doublon.** Déjà porté par la mémoire [[decisivite-pas-de-menus-de-doute]] et les règles globales de clarté. Recommandation : **ne pas créer de règle** ; la mémoire suffit.
- **Arriéré de carnet (action)** : pas une règle — un geste de process.

## 5 · Ce qui est proposé au PO

- **Repli desktop (règle).** *Fait :* panel + revues + cette rétro ont tourné en general-purpose, en silence. *Proposition :* les skills qui délèguent nomment le repli desktop et son comportement. *Mesure :* les sections délégation des skills concernés le mentionnent.
- **Drapeau structuré de fiche (feature).** *Fait :* « réservé panel/maquette » était une note libre, invisible à l'intake. *Proposition :* un champ structuré que l'intake lit, comme `blocked:`. *Mesure :* une fiche ainsi marquée est signalée avant le build.
- **Enrichissement board (feature).** *Fait :* le board livré est mince (ni moments, ni jetons). *Proposition :* émettre `fiche.transition` + jetons, puis les afficher. *Mesure :* un run réel montre ses moments sur le board. *(Touche le contrat → panel.)*
- **Décisivité desktop/auto (action).** *Fait :* « pourquoi tu me poses des questions ». *Proposition :* déjà en mémoire. *Mesure :* déjà posée là. *(Recommandé : ne rien créer de plus.)*
- **Arriéré de carnet (action).** *Fait :* 10 notes inter-sessions jamais traitées. *Proposition :* une passe de rétro dédiée. *Mesure :* les 10 notes traitées ou écartées avec raison.

## 6 · Suivi des décisions de la rétro précédente

La rétro précédente (2026-10-24, build-milestone) laissait **5 décisions en `⏳`**, non tranchées. Non revues ici faute de leur contexte chargé — **à reprendre par le PO** en même temps que celles-ci.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| Repli desktop (règle) | ✅ écrit dans 3 skills (pas de rules/) | 2026-10-26 |
| Drapeau structuré de fiche (feature) | ✅ fiche existante 20261015213921103 enrichie | 2026-10-26 |
| Enrichissement board (feature) | ✅ fiche créée 20261026132118384 | 2026-10-26 |
| Décisivité desktop/auto (action) | ❌ doublon (déjà en mémoire) | 2026-10-26 |
| Arriéré de carnet (action) | ❌ pas maintenant (passe dédiée) | 2026-10-26 |

## 8 · Glossaire

- **Agent de rôle / bindé :** un persona de la méthode (dev, QA, reviewer, PM, architecte) déclaré dans le profil et invocable comme sous-agent. « Non bindé » = pas disponible comme tel dans ce contexte.
- **Intake :** l'étape où le builder choisit la prochaine fiche à construire.
- **`blocked:` :** champ de la fiche qui dit « ne pas construire, dépendance en attente » ; l'intake l'écarte.
- **G4 / G5 :** décisions d'ADR-084 — G5 (clé de chantier, livré), G4 (moment `fiche.transition`, différé car il étend le contrat gelé).
- **Vue mince :** le board montre le vrai mais peu (runs, chantiers, chronologie), car le journal n'émet encore ni moments de fiche, ni jetons.
