# ADR-0024 — `ezk-codex` : capacité d'adressage des retours Codex sur une PR

- **Statut** : accepté
- **Date** : 2026-08-03
- **Bande (ADR-0022)** : Capacité (`ezk-codex`, alias court — pas de collision avec un rôle)
- **Voisins** : ADR-0020 (capacité partagée = brique autonome), ADR-0012 (composition inter-skills)

## Contexte

La **norme** « traiter les retours Codex avant de merger » existe déjà : `ezk-sprint`
étape 10 l'énonce (« CI verte ET revues lues et traitées — bots inclus ; Codex poste
ses findings en commentaires inline »), et une mémoire projet la double. Mais la
**boucle qui adresse** ces findings — les récupérer, les corriger un par un, décliner
les faux positifs, re-déclencher une revue, attendre le verdict — est restée **100 %
manuelle**. L'opérateur la retape à chaque PR, sur samplerz comme sur muti.

Déclencheur concret : une session « fix les retours Codex de la PR #343 samplerz » a
buté sur une **collision multi-session** (la même PR était pilotée en parallèle par une
autre session Claude, qui l'a mergée). Leçon : la capacité doit d'abord **détecter
qu'elle n'a pas la main** avant d'écrire quoi que ce soit.

## Décision

Créer **`ezk-codex`**, une **capacité** (bande ADR-0022) composable, et non une
sous-commande d'un orchestrateur — car elle sera utilisée par ≥ 2 appelants
(`ezk-sprint`, `ezk-pr`/`ezk-pr-pilot`), ce que le test ADR-0020 tranche en faveur
d'une brique autonome.

**Périmètre** (verbes maison) : `help` · `fix` (la boucle complète) · `check` (lire le
verdict courant, sans rien écrire).

**Frontière nette** (anti-scope-creep) :

- **Ne merge pas** — le merge reste à `ezk-pr ship` ou à une décision explicite du user.
- **Ne fait pas la revue initiale** — le premier `@codex review` avant-merge reste
  décrit par `ezk-sprint`. `ezk-codex` intervient **après**, pour adresser les findings.

**Composition** : `ezk-sprint` (étape 10) et `ezk-pr` (`ship`) **délèguent** à
`ezk-codex` au lieu de re-décrire le handling Codex chacun de leur côté. C'est ce qui
**tue la duplication** du pattern aujourd'hui éparpillé.

**Structure v1 (frontière LLM/déterministe, ADR-0001)** : un **seul `SKILL.md`**
auto-porté. Le **jugement** (quel finding corriger, corriger vs décliner, est-ce un faux
positif) est du LLM ; les parties **mécaniques et de sûreté** (fetch des findings,
garde stand-down, sonde de verdict bornée) sont spécifiées comme commandes `gh`/`git`
**vérifiées**, inline dans le playbook. Extraction ultérieure en `scripts/` **testés**
(façon `ezk-archive`) = polish noté, pas un prérequis v1 (« POC d'abord »).

## Garde-fous (invariants de la capacité)

1. **Stand-down avant toute écriture** : si la PR est mergée/fermée, si la branche est
   sortie dans un autre worktree, ou si de nouveaux commits d'un autre auteur/session
   sont apparus depuis le fetch → **ne rien pousser**, rapporter la collision, rendre la
   main.
2. **Anti-boucle** : cap ~2 rounds de re-review ; jamais de re-reviews en série après un
   fix conforme ; un finding **nouveau et différent** au re-review peut être traité une
   fois, un finding qui **récidive à l'identique** = stop + escalade au user.
3. **Faux positif** : décliner explicitement (réponse inline + 👎 + raison), jamais
   ignorer en silence.
4. **Sonde bornée et testée** : l'attente du verdict est bornée (essais comptés, pas de
   `sleep` infini), n'avale pas ses erreurs ; verdict = réaction 👍 **ou** review sans
   nouveau finding sur le HEAD courant.
5. **Rapport en checkpoint** : État · Qui a la main · Prochaine action.

## Conséquences

- **+** Un seul endroit pour la logique Codex ; `sprint` et `pr` maigrissent en délégant.
- **+** La collision multi-session devient un garde-fou de première classe, pas un
  accident.
- **+** Cross-repo : marche sur tout repo GitHub avec Codex branché (samplerz, muti…).
- **−** Couplage au format des commentaires Codex (`chatgpt-codex-connector[bot]`,
  badges `P0/P1/P2`) — à ré-ausculter si Codex change son gabarit.
- **−** v1 sans scripts testés : la sûreté repose sur la prose du playbook (mécanisme
  accepté dans la famille ezk) jusqu'à l'extraction `scripts/`.
