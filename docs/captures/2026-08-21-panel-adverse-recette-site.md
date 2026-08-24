# Panel adverse — « recette site produit » (fiche 20260821172716540)

- **Date** : 2026-08-21 · **Demandeur** : PO (« revue adverse pour valider ou avoir un avis alternatif »)
- **Cible** : la recommandation « option B » — recette = skill + bundle de règles, nouveau
  champ frontmatter skill→règles (`interactions:`), plan en 5 étapes machinerie-d'abord.
- **Dispositif** : 3 attaquants indépendants, sans mémoire de la session, read-only,
  consigne « casser, pas valider » ; synthèse de juge par la session, arbitrages au PO.

## En clair

L'ossature survit : pas de concept « recette » à inventer, recette = un skill + des règles,
et la distinction activation (profil, déterministe) / application (condition dans la règle,
jugement) est validée par les trois. **Tout le reste du plan v1 tombe** : l'ordre était
inversé (machinerie avant consommateur), le champ proposé était mal conçu, mal porté et mal
nommé, et l'exemple « côté samplerz » promettait un geste qu'aucun code ne lit.

## Verdicts

| Attaquant | Lentille | Verdict |
|---|---|---|
| ezk-architect | modèle du domaine & sémantique | GO-avec-réserves — ossature saine, maillon à reconcevoir |
| économiste YAGNI | surproduction de méta-outillage | **NO-GO sur le plan tel qu'ordonné** — noyau GO une fois réordonné |
| opérateur samplerz | praticabilité terrain | GO-avec-réserves — bloquant : la déclaration projet n'a pas de lecteur |

## Findings consolidés (dédupliqués, par gravité)

### P0 — trois défauts qui coulaient le plan v1

1. **La liste ment par conception** (architecte). Le champ figeait une liste d'ids ; une
   règle projet-locale (permise par ADR-0020 §4) ne peut pas y figurer, et le propre test
   de sabotage de la fiche (« retirer la règle du bundle ») faisait warner le vérificateur
   proposé. Correctif : penser **espace de noms** (« je lis tout `site/*` actif »), jamais
   une énumération.
2. **L'ordre viole le gate écrit du repo** (économiste). ADR-0013 exige « preuve dans ≥ 2
   repos ou ≥ 3 occurrences datées » avant d'outiller ; il y a UNE occurrence. Le précédent
   exact existe : ADR-0026, moteur de règles complet dessiné le 2026-08-09, **zéro**
   implémentation 12 jours après. Et la doctrine maison donne l'ordre juste : ADR-0026 §3
   « câblage **en prose** tant que le champ n'existe pas ». La prose n'est pas un statu quo
   à rejeter, c'est l'étape 1.
3. **Le yaml « côté samplerz » n'a aucun lecteur** (opérateur). `loadYaml` ne lit que les
   dossiers de mega-city ; les 6 profils existants sont des profils de POSTE, aucun par
   projet externe. Le vrai mécanisme (« le projet déclare ») est l'épic ancrage/installeur
   `20260813124026215` — `status: idea` — que la fiche ne référençait pas. Et ADR-0020 §4,
   invoqué comme caution, dit l'inverse : « aucun nouveau format de config ».

### P1 — à corriger dans la fiche avant tout `ready`

- **Mauvais porteur** : dans le domaine, les règles sont appliquées par des **Agents**
  (« les Juges appliquent la loi ») ; ADR-0026 met l'affinité aux règles sur l'agent, pas
  sur le skill. Porteur à retrancher au moment de construire (agent ? bundle déclarant son
  consommateur ? dérivation par namespace ?).
- **Mauvais nom** : « interaction » a un sens gravé (ADR-0002 : protocole ENTRE agents) et
  le mot porte déjà 2 sémantiques dans le repo (profil : « règles d'interaction entre
  agents » ; agent : « règles que je respecte »). En ajouter une 3e = dette. Nom à choisir
  ailleurs (`applies:` ?…) — décision différée à la construction.
- **Anti-doublon troué** : `enforcements:` existe déjà sur **14 règles** (règle→acteur,
  ex. `pr-before-after-media` → agent-check ezk-reviewer). Toute nouvelle arête règle↔acteur
  exige d'abord une mini-décision d'unification avec l'existant.
- **MUST sans dents** : `site/screenshots-live` était MUST sans `enforcements:` ni boucle
  de revue garantie côté samplerz — re-promettre ce que rien ne tient (le défaut corrigé
  deux fois cette semaine). Et la règle « compose » une fiche encore `idea`.
- **Templates ignorés** : la demande PO (« basé sur un template ») n'avait ni option ni
  critère ; contrainte dure à instruire : ADR-0027 = assets TEXTE seulement, et le bind
  par-projet matérialise un fichier plat sans assets.
- **Fabriquer ≠ servir** : DNS, noindex, bascule attente→vrai site, capture d'email —
  silence total. Périmètre à écrire noir sur blanc.
- **Contradiction interne** : « jamais de stock déclaré-non-appliqué » appliqué aux données
  (bundle avec son skill) mais pas au code (champ + checker deux étapes avant tout porteur).
- **Coût d'opportunité** : la valeur datée (page d'attente samplerz) ne dépend d'AUCUNE des
  5 étapes — livrable côté samplerz aujourd'hui (chantier `website_showcase` + PR samplerz
  #239 ouverts depuis le 2026-08-10). Aucune fiche vectorz nécessaire.

### P2 (améliorations)

`composes: [ezk-preview]` = mauvaise brique (ezk-preview EXPOSE, il ne démarre pas —
ADR-0020 option D ; les briques captures sont celles de la fiche screenshots) ·
`site/staging-first` citée mais jamais définie · 3e champ déclaratif en 24 h alors que
`composes:`/`roles:` n'ont pas encaissé un cycle d'usage réel · la gêne fondatrice du PO
(« rien sur la carte ») se corrige SANS champ neuf : la fille carte-LOI s'affiche depuis
l'existant (12 bundles, 6 profils, arêtes agents déclarées).

## Synthèse du juge (session) — le plan v2

Aucune contradiction entre attaquants ; leurs correctifs s'emboîtent :

1. **La valeur d'abord, hors mega-city** : page d'attente + noindex staging = côté samplerz.
2. **Skill MVP en prose** (doctrine ADR-0026 §3) : 3 règles DANS le playbook, options lues
   en prose. Aucun yaml neuf, aucun champ.
3. **Au 2e consommateur prouvé** (gate ADR-0013) : extraire le bundle + trancher
   l'unification `enforcements:`/`interactions:`/futur champ.
4. **Alors seulement** le champ machine — espace de noms, porteur et nom décidés en 3,
   entrant au repo AVEC son premier porteur.
5. « Le projet déclare » (le vrai) : dépend de l'épic ancrage `20260813124026215`, désormais
   référencé.

Ce que le panel a validé au passage : la fille carte-LOI est constructible dès maintenant,
et la priorité P2 de la fiche est confirmée mécaniquement (la valeur vit ailleurs).
