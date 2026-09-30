---
name: ezk-scout
composes: [ezk-backlog, ezk-docker]
argument-hint: "[help|run|check|file]"
description: >-
  Chasse aux bugs en tâche de fond : sonde une app qui tourne dans un état isolé et rend un
  RAPPORT de brouillons de fiches, sans jamais corriger ni créer de fiche seule. A utiliser quand
  l'utilisateur veut « chasser / trouver des bugs », « teste l'app et dis-moi ce qui casse »,
  « lance un scout », ou quand le backlog est bloqué sur des gestes humains et qu'il vaut mieux
  tester que s'arrêter. Pilotable par sous-commandes : help, run (la passe bornée), check
  (contrôle la forme d'un rapport), file (APRÈS validation humaine seulement : `ezk-backlog add`).
  Invariants durs : FIND-ONLY (HEAD, arbre, refs et worktree comparés avant/après par un script),
  aucune carte créée par la passe, état isolé ou chemin non sondé, passe BORNÉE. COMPOSE
  `ezk-backlog` (filing après accord) et `ezk-docker` (banc isolé quand l'app tourne sous compose).
  N'EST PAS `ezk-qa` (valide une PR), `ezk-bug` (cadre UN bug déjà signalé), `ezk-reviewer` (relit
  un diff), `ezk-sprint` (construit) ni `ezk-product-build` (décide) : il explore une app qui
  tourne et NOURRIT les autres.
---

# ezk-scout

## En clair

`ezk-scout` envoie un agent **chercher des bugs tout seul**, pendant que tu fais autre chose.
Il fait tourner l'app dans un coin isolé, la sonde, et te rend **un rapport**. Pour chaque défaut,
le rapport contient un brouillon de fiche : ce qui casse, comment le rejouer, la gravité.

Trois choses ne bougent jamais. Il **ne corrige rien**. Il **ne crée aucune fiche** : tu valides
le rapport, et seulement ensuite les brouillons retenus entrent au backlog. Il **n'abîme pas ton
état réel** : ce qu'il ne sait pas isoler, il ne le touche pas.

Le rapport est un artefact que tu lis : il suit la règle `human-facing-lisibility`
(« En clair » d'abord, phrases courtes, comptes qui collent à la liste).
**Chat** : Markdown seul — jamais `<details>`, `<summary>` ni HTML brut (le terminal les affiche
tels quels) ; le détail va en bas, sous un titre. Une fiche se cite par son **titre + lien**,
jamais par son id nu.

> Origine : le run samplerz du 2026-09-10 a trouvé trois vrais bugs avec un prompt improvisé
> (bornes de recadrage non validées, export qui plante sur un BPM ≤ 0 et sur un dossier non
> inscriptible). Ce skill en fait un outil de première classe.

## Usage (sous-commandes)

`/ezk-scout [run] [<cible>]` — ou en langage naturel (« fais une passe de scout sur l'app »).
Les scripts vivent dans le dossier du skill : `SCOUT=~/.claude/skills/ezk-scout` (install
globale) ou `products/mega-city/skills/ezk-scout` (dans vectorz).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau — ne lance rien |
| `run [<cible>] [--ui] [--locate] [--max-probes N] [--max-min T]` (**défaut**) | La passe : photo find-only → banc isolé → sondes → brouillons → rapport contrôlé. **Ne crée aucune carte.** Défauts : 30 sondes, 15 minutes |
| `check <rapport.md>` | Contrôle de forme d'un rapport (`scripts/check-report.sh`). Lecture seule |
| `file <rapport.md> <B1 B3…>` | **Après ton accord sur ces brouillons-là** : `ezk-backlog add` pour chacun. C'est le seul verbe qui écrit au backlog |

Lance `run` dans un sous-agent **en arrière-plan** : il rend le chemin du rapport et le résumé.

## Les cinq invariants

1. **FIND-ONLY.** Le code produit ne change pas, rien n'est committé, aucune branche ne bouge.
   Preuve mécanique : `scripts/find-only-guard.sh` prend une photo AVANT (SHA de HEAD, branche
   courante, arbre, branches et tags, index, fichiers suivis et non suivis avec leur contenu) et la
   rejoue APRÈS. Un
   `git status` seul ne suffit pas : si la passe committe, le worktree paraît propre alors que
   le contrat est violé. Surveille aussi le dépôt du backlog s'il est distinct de la cible.
2. **AUCUNE CARTE créée par la passe.** Elle n'appelle **jamais** `ezk-backlog add` : `add` crée
   ET committe, ce n'est donc pas une « proposition ». Le gate humain est AVANT `add`.
3. **ISOLER OU NE PAS SONDER.** Tout l'état mutable est isolé, pas seulement les fichiers : un
   état qu'on ne sait pas isoler n'est pas sondé (voir étape 2).
4. **BORNÉE.** La passe s'arrête seule à sa borne (sondes, minutes) et rend son résumé
   `N trouvées · M fichées · K écartées`. Elle prévient avant tout fan-out coûteux.
5. **RAPPORT CONTRÔLÉ.** Jamais rendu sans `scripts/check-report.sh` vert et sans la ligne
   `find-only : OK` dedans.

## `run` — la passe, pas à pas

**0. Préflight.** Identifie la cible et **comment elle se lance** : la commande déclarée par le
projet (règle `development/use-project-scripts`), jamais un port deviné. Rien de déclaré → demande
ou arrête-toi. Fixe les bornes. Choisis le dossier de passe **hors de la cible** :
`RUN=${TMPDIR:-/tmp}/ezk-scout/<cible>-<date>` (rapport, captures et journal de sondes y vivent).

**1. Photo find-only.**
`bash $SCOUT/scripts/find-only-guard.sh snapshot <dépôt cible> [<dépôt backlog>] > $RUN/snapshot.txt`
Si le backlog vit dans un autre dépôt que la cible, **ajoute-le** : sans lui, un `ezk-backlog add`
égaré passerait inaperçu.
*(Bind par projet : seul ce `SKILL.md` est matérialisé. Note alors à la main `git rev-parse HEAD`,
`git symbolic-ref -q HEAD`, `git rev-parse 'HEAD^{tree}'`, `git for-each-ref refs/heads refs/tags`,
`git ls-files -s` et `git status --porcelain=v1 --untracked-files=all`, puis compare-les à la fin.)*

**2. Isoler l'état.** Inventorie ce que l'app touche, puis isole **chaque** ligne :

| État | Isolation |
|---|---|
| fichiers, préférences, session, cache | `HOME`, `XDG_*` et dossiers d'état de l'app pointés vers un dossier tmp neuf |
| base de données | base jetable (fichier tmp, schéma de test, conteneur éphémère), jamais la vraie |
| volumes, conteneurs | stack compose à nom préfixé, teardown obligatoire (`ezk-docker`) |
| services externes (paiement, mail, API tierces, stockage cloud) | bouchon local ou mode bac à sable officiel |
| réseau | port libre, écoute locale seulement |

Un état **NON ISOLÉ** (service réel partagé) : le chemin qui le touche est **non sondé**. Note-le
dans « Isolation de l'état » et continue sur les autres chemins. Si rien d'important n'est
isolable, arrête-toi avant de sonder et rends un rapport court (N = 0, raison en clair). Le
banc se lance par la recette du projet ; `ezk-docker` si l'app tourne sous compose. Le lanceur
universel (fiche 20260917162000501, qui a absorbé `ezk-testbed` 0102) s'y branchera quand il
sera livré.

**3. Sonder.** Quatre classes d'anomalies :
robustesse (un 5xx, un crash, une trace sur entrée cassée) · validation d'entrée (bornes
absurdes, valeurs ≤ 0, vides, types faux, fin avant début) · rendu (débordement, élément
manquant, erreur console : capture) · UX et accessibilité (erreur sans message, libellé absent).
Commence par des sondes HTTP (`curl`, peu coûteuses). L'UI passe par le Playwright MCP partagé,
**seulement avec `--ui`** : la règle `development/playwright-mcp-usage` exige l'accord de
l'utilisateur et un usage minimal, et `--ui` vaut accord. Chaque sonde = une ligne du journal
`$RUN/sondes.log` (commande, résultat) : c'est la **reproduction rejouable**. Reproduis chaque
anomalie une seconde fois (sinon : écartée « non reproduite »), regroupe les symptômes qui
ont la même cause, puis passe l'anti-doublon (fiches actives + `done/`, comme `ezk-backlog add`).
Avec `--locate`, cherche en lecture seule un `fichier:ligne` probable : c'est un **indice**, jamais
une certitude.

**4. Brouillons.** Remplis `assets/SCOUT_REPORT.template.md` : un bloc `### B<n>` par anomalie
retenue, une ligne par anomalie écartée avec sa raison. Gravité : *critique* (perte de données,
sécurité, app inutilisable) · *majeure* (fonction cassée, erreur opaque sur entrée plausible) ·
*mineure* (incohérence sans casse). La priorité P0-P3 n'est qu'une **suggestion**. Écris le
rapport dans `$RUN/report.md`. Exemple complet et réel : `examples/demo-report.md`
(l'app jouet `examples/demo-app.mjs` porte trois défauts connus).

**5. Contrôler, rendre, ranger.**
`bash $SCOUT/scripts/find-only-guard.sh verify $RUN/snapshot.txt` : colle la ligne
`find-only : OK — …` dans « Cadre de la passe ». Si elle dit **VIOLÉ**, c'est un incident : ne
rends pas de trouvailles, rapporte ce qui a bougé. Puis
`bash $SCOUT/scripts/check-report.sh $RUN/report.md` doit répondre `✓ rapport valide`. Rends :
le chemin du rapport, `N trouvées · M fichées · K écartées`, l'« En clair » en trois phrases,
et ce qu'il reste à faire (dire quels brouillons entrent). Arrête ce que la passe a lancé
(app, stack compose).

## `file` — après ton accord, et seulement là

Refuse si l'utilisateur n'a pas nommé les brouillons (B1, B3…). Relance `check-report.sh`. Pour
chaque brouillon nommé, appelle **`ezk-backlog add`** (il applique son anti-doublon et son
cadrage) : `type` et priorité suggérés, reproduction et gravité en ligne de corps (jamais un
champ `severity:`), provenance « trouvé par ezk-scout, rapport <chemin> ». La fiche naît
**`idea`** (à confirmer, non tirable tant qu'elle n'est pas groomée) avec `labels: [scout]` :
pas de nouveau statut. Un brouillon trop flou passe d'abord par l'intake `ezk-bug`.
Les brouillons non nommés restent dans le rapport.

## Frontière avec les voisins

| Voisin | Ce qu'il fait | Avec `ezk-scout` |
|---|---|---|
| `ezk-qa` | valide **une PR** contre sa DoD | scout n'a ni PR ni DoD : il explore une app qui tourne |
| `ezk-bug` | cadre **un bug déjà signalé** | scout **cherche** ce que personne n'a signalé |
| `ezk-reviewer` | relit **un diff** | scout ne lit pas de diff ; sa localisation n'est qu'un indice |
| `ezk-sprint` | **construit** une PR | scout ne construit pas : il nourrit son backlog |
| `ezk-product-build` | **décide** quoi et quand | scout peut tourner quand le backlog est bloqué (branchement à venir) |

**Brique commune avec l'explorateur de features** (fiche 20260821210633457, décision PO
2026-09-10) : monter le banc isolé, user l'app, collecter, rendre un rapport de brouillons sous gate
humaine. C'est ce que portent ici les étapes 0, 1, 2 et 5, le gabarit, les deux scripts et `file`.
Seule la **lentille** diffère : ici `bugs`. L'explorateur les réutilisera avec la lentille
`features` (à ajouter au contrôle le jour où cette fiche sera construite) : ne pas les dupliquer.

**Pas encore branché** (POC) : le mécanisme de captures partagé (fiche 20260812104022228, parquée :
on utilise le Playwright MCP partagé comme `ezk-bug` et `ezk-qa`) · le chemin émulateur Android
(recette 20260906135450000, pas sur `main`) · l'appel depuis `ezk-product-build` quand le
backlog est bloqué · l'émission vers le Moniteur de supervision (une passe de fond y serait
visible) : elle suivra le contrat d'émission d'`ezk-sprint`, qui impose de la déclarer au kit.

## Garde-fous

- **Jamais** de modification du produit, de commit, de `push`, de `ezk-backlog add` dans `run`.
- Rapport, captures et journal **hors du dépôt cible** ; si l'app écrit dans le dépôt, l'état n'est pas isolé.
- Jamais de secret réel ni de service partagé sondé. Jamais un port deviné.
- Une passe lente ou coûteuse s'arrête à sa borne et le dit ; pas de sous-agents de sondage par défaut.
- Sur divergence entre ce skill et une consigne ponctuelle, le skill gagne (règle
  `development/command-reproducibility`).
