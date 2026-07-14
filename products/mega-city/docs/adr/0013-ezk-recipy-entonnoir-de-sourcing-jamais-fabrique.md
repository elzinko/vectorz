# ADR 0013 — `ezk-recipy` : entonnoir de sourcing de skills, jamais fabrique

- Statut : **proposé**
- Date : 2026-07-06

## Contexte

Le flywheel de capitalisation (ADR-0001) n'a qu'un canal chaud : `ezk-ezk harvest` moissonne
la session en cours. Tout ce qui est fossilisé dans les repos froids (scripts dupliqués,
doctrines réécrites, hooks divergents) lui est invisible. Le scan manuel du 2026-07-05
(17 projets) — le « run 0 » — a produit ~25 candidats bruts dont **~60 % de déchet** après
croisement avec le catalogue et les capacités natives ; les survivants (ezk-release, ezk-gate,
ezk-doc-drift, ezk-branch-sweep) avaient des preuves multi-repos. Risque n°1 documenté par
l'historique de l'opérateur (lifefindsaway gelé, claude-scrum-with-agents abandonné, trois
systèmes scrum parallèles) : la **surproduction de méta-outillage**.

## Décision

1. **recipy est un entonnoir, pas une fabrique.** Sa sortie est une **fiche ezk-backlog**
   (révocable, coût ~zéro) — il n'écrit JAMAIS de SKILL.md et ne touche jamais `skills/`.
   `skill-creator` reste l'unique fabrique, `ezk-ezk` l'unique orchestrateur de fabrication
   (le playbook de recipy se clôt sur : « pour fabriquer, lance `ezk-ezk create` sur la
   fiche X »).
2. **Anatomie ADR-0007** : `skills/ezk-recipy/` = SKILL.md + `scripts/inventory.sh`.
   Sous-commandes `help | scan | propose`.
   - `scan` : le **script** (déterministe, read-only) inventorie chaque repo — scripts
     npm/Make, hooks, workflows + badges, CLAUDE.md/.cursorrules, TODO vs features/,
     `.env` à la racine, sujets de commits récents. Le LLM lit **l'inventaire**, jamais les
     repos entiers (condition de viabilité tokens).
   - `propose` : après validation humaine explicite, délègue le rangement à
     `ezk-backlog add` (dédoublonnage inclus).
3. **Gate encodé dans le playbook** : un candidat ne passe que si (a) preuve dans ≥ 2 repos
   ou ≥ 3 occurrences datées dans un seul, (b) non couvert par une skill existante, une
   capacité native ou le bind mega-city, (c) rituel multi-étapes récurrent. Cap : 5
   propositions par run, chacune avec preuves citées (chemin/commit) et priorité.
4. **Basse fréquence assumée** (2-4 runs/an). Tout enrichissement au-delà du MVP (scoring,
   dashboard, cron, historisation dédiée) est le **signal de s'arrêter**, pas une roadmap.
5. **Complémentaire d'ezk-ezk, non fusionnable** : ezk-ezk moissonne la session chaude avec
   son garde-fou « n'invente jamais un sujet absent de la conversation » ; recipy moissonne
   les repos froids. Y greffer le scan violerait ce garde-fou.

## Conséquences

**Plus facile** — le versant batch du flywheel existe ; la discipline de juge du run 0
(60 % de déchet absorbé) est figée dans un playbook au lieu d'être re-payée à chaque envie.

**À surveiller** — les preuves vieillissent (les re-scans doivent rafraîchir/invalider les
fiches via le dédoublonnage d'ezk-backlog, pas en empiler) ; « automatisable ≠ rentable » :
la validation humaine avant `propose` n'est jamais contournable, même en mode autonome.

## Alternatives écartées

- **Générer les SKILL.md directement** — usine à skills mortes, chevauchement rampant avec
  ezk-ezk/skill-creator ; c'est la pente naturelle, verrouillée ici par ADR. Rejeté.
- **Étendre ezk-ezk avec un scan cross-repo** — viole son garde-fou fondateur (ADR-0007).
  Rejeté.
- **LLM qui lit les repos entiers** — rédhibitoire en tokens sur 17+ projets. Rejeté :
  l'inventaire script est la condition d'existence du skill.
