# ADR 0008 — `ezk-product-builder` : couche product-owner mince au-dessus d'`ezk-sprint`

- Statut : **proposé**
- Date : 2026-06-28

## Contexte

Fiche 0023 : automatiser le déroulé produit complet (idée → backlog → build → ship, en boucle).
Risque n°1 : **recloner `ezk-sprint`** — qui fait déjà le build d'une feature (équipe scrum,
BDD/TDD/CI/PR/squash, POC-d'abord) — exactement le piège « compose, ne réinvente pas »
(ADR-0006, ezk-ezk). `ezk-sprint` **consomme** une fiche ; il ne décide **pas** quoi construire
ni n'**idée** le backlog. C'est ce trou que `ezk-product-builder` comble.

## Décision

1. **Couche PRODUCT-OWNER mince, pas un nouveau moteur.** `ezk-product-builder` **compose** :
   - `ezk-backlog` (le quoi/où),
   - `/product-brainstorming` (idéer / cadrer une fiche vague — réutilise la capacité 0022),
   - `ezk-sprint` (le comment : build d'une feature). Il n'en réimplémente **aucun**.
2. **Boucle hybride (autonomie max).** Lit le backlog → fiche claire prioritaire → `ezk-sprint` ;
   backlog vide ou fiche vague → **idée** (brainstorm) pour cadrer → `ezk-sprint`. POC d'abord, polish ensuite.
3. **Modèle d'interaction = suggestions-à-choix + problématique**, à 3 (+1) checkpoints :
   inter-sprint (« on continue ? »), **blocage**, **dérive tokens**, **idéation**. Entre les
   checkpoints il **décide seul** (archi / scope / technique) ; il peut consulter un sous-agent
   pour avis mais **tranche seul**.
4. **Vigilance tokens = mode CONFIGURABLE** (3) :
   - `lean` (**défaut**) : délégation simple, **alerte avant** un fan-out multi-agents coûteux
     ou un dépassement de seuil souple ;
   - `plafond-dur` : budget par sprint, **stop net** + demande s'il l'atteint ;
   - `pleine-puissance` : multi-agents libre (mode « ultracode »).
   Le mode est un **réglage** du skill (défaut `lean`).
5. **Vit dans `mega-city/skills/`** (ADR-0006). Place dans la famille : **au-dessus** d'ezk-sprint.

## Conséquences

**Plus facile** — un seul point d'entrée « construis-moi ce produit » ; zéro dérive vs
`ezk-sprint` (mis à jour en amont) ; **coût maîtrisé** via le mode tokens.

**À surveiller** — la frontière **product-owner / scrum-master** doit rester nette : le builder
**décide** quoi & quand, `ezk-sprint` **exécute** le comment. Ne pas réabsorber la logique de sprint.

**À revisiter quand** — l'idéation devient riche (elle pourrait déléguer à `ezk-ezk` pour
capitaliser un apprentissage en skill, ou à une future couche **stratégie** au-dessus).

## Alternatives écartées

- **Recloner ezk-sprint sous un autre nom** — duplication + dérive en amont. Rejeté (compose, ne réinvente pas).
- **Tuner ezk-sprint en place** — il vit dans `claude-skills` (gelé ADR-0006) et mélangerait
  product-owner et scrum-master dans un seul skill. Rejeté (responsabilité unique).
- **Mode tokens unique** (toujours lean, ou toujours pleine-puissance) — l'utilisateur veut le
  réglage selon l'enjeu. Rejeté.
