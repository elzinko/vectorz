---
id: 0165
title: Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B)
type: feature
priority: P1 # arbitrée 2026-07-17 (review) : P1 confirmée (jumeau MVP B de racine 0044, P1) — gated derrière 0044 (MVP A, prérequis absolu)
product: mega-city
status: todo
pr:
created: 2026-07-16
---

# 0061 — Contrat d'améliorabilité v0.1 (MVP B)

## Contexte / Problème

`journal/learnings.md` n'a aucune ligne réelle depuis le 2026-06-25 : le flywheel capture
(done/0002) existe mais n'est pas nourri. Les leçons de session meurent en markdown, les
PRs d'agents se retouchent à la main. Le PO demande un **contrat à part, orienté métier,
pas methodology-tight**, que toute méthode implémente pour être améliorable — et qui
survive au retrait de BMAD (0038/0039). Voir ADR-030 (proposé, révisé post-réfutation).

## Proposition

Livrer l'artefact contrat au catalogue, dans le **nouveau foyer canonique**
`docs/contrats/` (création actée par ADR-030 ; référence vers la spec supervisabilité en
capture cop1 §7) :

1. **Texte** `ameliorabilite-v0.1.md` : ≤8 clauses testables par replay, URI, v0.x
   additif, classes A/B, **décisions numérotées A1, A2… (D9/D12 cités comme précédents
   d'inspiration, jamais comme autorités étendues)**. Clause 1 : « la frontière humaine
   est une clause du contrat, pas une convention orale » — deny-all intégral en v0.1
   (100 % des propositions au PO), **chaque `proposal.approved` référence une preuve
   externe non-productible par un agent** (approbation GitHub via gh API ou commit signé
   PO — mécanisme tranché au panel de gel), 4 STOP d'ADR-0011 cités jamais redéfinis
   (chaîne normative — ADR-0011 est au statut « proposé » — à consolider : arbitrage PO),
   double-loop = question ouverte au PO. **Clause verdict tiers** : `verified|retired`
   est rendu par le mesureur (comparaison mécanique), la méthode le lit et le commente
   dans `improvement.reviewed`, ne le rend jamais ; écart = incident. **Budget méta en
   unités observables** : ≤1 proposition/cycle (enforcé par le script d'append), taille
   de fiche bornée, time-box — le ≤10 % tokens est différé au mode pilote (0038).
   **Cycle défini par événement observable** (clôture ezk-archive journalisée) doublé de
   bornes calendaires tenues par le mesureur. **Aucun point d'insertion ni méthode nommés
   dans les clauses.**
2. **`registre-surfaces.yml`** : allowlist default-deny (skills, prompts,
   `interactions[]`, mémoire épisodique = modifiables sous approbation) ; surfaces
   GELÉES : mesureur, ledger, **script d'append**, banc, métriques, LA LOI — **définie
   précisément dans le registre** —, 4 STOP, le contrat. **Honnêteté v0.1** : la clause
   surfaces est de conformité **classe B (honor-system)** tant que le seul détecteur est
   le miroir du mesureur (fiche MVP A) ; la garde CI de chemins gelés (fiche 0040) est
   une option d'arbitrage PO.
3. **Kit émetteur** (~15 lignes, classe B, fichier séparé) : follow-through d'abord
   (lecture et commentaire du verdict du mesureur) ; pas d'outcomes frais → pas de
   proposition ; ≤1 fiche `type: amelioration` par cycle ; application par canaux
   déterministes uniquement — **couture tranchée** : l'essai en branche modifie
   l'artefact, le **squash-merge vaut adoption**, `lawgiver capture` n'ajoute que la
   ligne de journal + le re-bind (mode journal-only = fiche backlog à valider PO). Le kit
   n'embarque que la **convention d'appel** du script d'append (le script est livré par
   la fiche MVP A, côté vectorz — contradiction de placement corrigée).
4. **Extension ezk-backlog** (livrable explicite, sur le modèle du précédent 0048) : le
   type `amelioration` et ses 5 champs de front-matter (`signal_source`, `surface`,
   `boucle`, `critere_verification`, `echeance_peremption`) n'existent pas dans la
   convention — les ajouter (type + champs + regen). Foyer des fiches :
   vectorz/products/mega-city (subtree), **id ≥0061** (les numérotations
   subtree/standalone ont forké).
5. **Greffe unique au MVP, canal unique** : la clause de moisson d'ezk-archive est une
   **rule de profil (pattern 0045) référencée par les profils — jamais un collage dans
   un SKILL.md** (incohérence corrigée : c'est ce qui rend le retrait par composition
   YAML effectif). Retirable si rien n'a payé après 3 cycles ; la clause de retrait
   embarque le **plan de démantèlement complet** (kit dé-référencé, type de fiche gelé,
   `.improvement/` archivé, registre caduc).
6. **Fermer UNE boucle réelle manuellement** : signal chiffré (ledger MVP A) → fiche
   amelioration → approbation PO explicite **prouvée** → essai en branche/PR →
   squash-merge (= adoption) → `lawgiver capture` (journal + re-bind) → **verdict rendu
   par le mesureur** à l'émission suivante, lu et commenté dans `improvement.reviewed`.

## Critères d'acceptation

- [ ] `docs/contrats/ameliorabilite-v0.1.md` + `registre-surfaces.yml` + kit émetteur existent ; le texte ne nomme aucune méthode ni point d'insertion (relecture dédiée) ; « LA LOI » est définie dans le registre ; le script d'append figure aux surfaces gelées
- [ ] La clause surfaces est explicitement marquée classe B (honor-system) avec renvoi au détecteur miroir (MVP A) — pas de fausse promesse d'enforcement
- [ ] L'extension ezk-backlog (type amelioration + 5 champs + regen) est livrée et une fiche d'exemple passe le regen
- [ ] Une boucle réelle complète est journalisée au ledger : `proposal.submitted → proposal.approved {preuve_externe} (PO) → improvement.applied {approval_ref} → improvement.verified|retired (mesureur) → improvement.reviewed (méthode)`
- [ ] La greffe ezk-archive est une rule de profil retirable par composition YAML (démonstration du retrait à blanc)
- [ ] Budget méta en unités observables inscrit dans le texte (≤1 proposition/cycle, taille bornée, time-box — seuils validés PO) ; le ≤10 % tokens y figure comme critère du mode pilote (0038)
- [ ] Gate locale verte

## Notes / décisions

- **Le gel v0.1 (panel adverse MANUEL — procédure des panels 2026-07-13/15, l'outillage 0057 étant au statut idea) et le statut Accepté d'ADR-030 viennent APRÈS cette première boucle vécue** — on fige sur du vécu, pas sur du papier.
- Critère de sortie MVP (avec MVP A), double : baseline publiée ET (≥1 amélioration adoptée atteint son critère chiffré sous 3 cycles — verdict mesureur — OU clause de moisson retirée avec leçon consignée) — les deux issues sont des succès du protocole. `journal/learnings.md` est un **indicateur diagnostique** (« le flywheel est-il branché ? »), PAS un témoin de succès (une ligne mécanique par capture = métrique d'activité, interdite comme cible par l'invariant 8 ; retrait formel du critère = arbitrage PO).
- Preuve d'agnosticité (double-émetteur) : différée — critère de sortie à ajouter à la fiche vectorz 0038 à son tirage, pas une dépendance de cette fiche. Le « test n°1 » (retrait BMAD) est reconnu trivialement vide tant que le BMAD résiduel n'implémente pas le contrat — reformulation ou greffe réelle avant E4 = choix de scope PO.
- Ne rouvre PAS le gel supervisabilité : lecture seule de `.supervision`, écriture dans `.improvement/` uniquement (deux fichiers à writer unique, ADR-030 Décision A2 — à ratifier).
- FR59, policy d'autonomie, validateur replay complet, métrologie tokens pilote : fiche parking dédiée.