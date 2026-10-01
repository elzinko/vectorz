---
id: "20260905134937885"
title: "Mesurer si la revue locale peut remplacer Codex (et sortir la PR du chemin)"
type: feature
priority: P2
product: mega-city
version: V0.4
epic:
labels: [revue]
status: shipped
pr: "#308"
created: 2026-09-05
---

## En clair

La question : peut-on se passer de Codex, et sortir la PR du chemin ? La mesure répond : pas d'un coup. La revue locale (`ezk-reviewer`) retrouve environ la moitié de ce que Codex voit, et les deux ont des angles morts différents. Mais ce run a montré l'autre face. Quand le quota Codex s'est épuisé, la revue locale a tenu seule sur la plupart des PR.

Décision proposée, en deux volets qu'on ne mélange pas :

1. **Grain de revue.** La revue locale devient le **plancher** obligatoire. Codex reste un **filet** quand il est disponible.
2. **Grain de merge.** La PR reste le défaut. Elle devient **optionnelle par configuration** (c'est déjà possible), pas par défaut.

Pour toi : tu lis l'ADR et tu le ratifies ou le corriges. Le durcissement du relecteur local suit tout de suite. La mesure chiffrée complète, avec archivage des verdicts, est la suite.

## Contexte / problème

La revue de référence sur les PR vectorz est **Codex**, lancée à l'ouverture d'une PR. Elle est bonne, mais elle impose une PR GitHub, une latence de 3 à 5 minutes, un quota et un service externe.

Retirer **Codex** touche le grain de *revue*. Retirer la **PR** touche le grain de *merge* ([ADR-037](../../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md) : une feature = une branche = une PR = un squash-merge ; [ADR-0052](../../products/mega-city/docs/adr/0052-merge-local-first-github-execute-le-squash-main-se-realigne.md) : le local décide, GitHub exécute). Ce sont deux décisions distinctes. Sans PR, il n'y a pas de Codex : la revue locale devient alors le seul filet.

Deux inconnues bloquaient la décision. Le local seul tient-il le niveau sur les défauts qui comptent ? Et ses verdicts ne sont archivés nulle part, donc rien ne se compare dans le temps.

## Les données (citées, pas refaites)

**Baseline à l'aveugle, 2026-09-05.** `ezk-reviewer` (Opus, une passe) rejoué sur le code d'origine de trois PR, comparé aux findings Codex de l'époque.

- Il retrouve **9 des 17** défauts Codex, dont **6 des 9 graves**.
- Il priorise parfois mieux (un bug de fuseau horaire monté en P0). Il trouve ce que Codex rate : des renvois croisés cassés, hors du diff.
- Il manque 3 défauts graves : une erreur masquée en « zéro PR », une invocation ambiguë, une borne de sprint qui ne borne pas. Deux familles : **erreurs silencieuses** et **rétro-compatibilité / contrats**.
- Coût : environ **100 000 jetons par PR et par passe**.
- Biais connu : Codex sert de référence ici. Un protocole honnête bâtit un oracle indépendant (voir plus bas).

**Run V0.1 → V0.4, PR #263 à #305** (relevé du PO).

- Le quota Codex s'est **épuisé en cours de run**. Sur la majorité des PR, la revue locale a été le seul filet.
- Quand Codex est passé, il a trouvé des défauts **réels** que le local n'avait pas tous vus : #284 (`--target` sans valeur retombait sur le vrai `~/.claude`, P1) et #286 (deux P1).
- La revue locale coûte **107 à 162 mille jetons par appel**.

**Observation du 2026-09-12** (rétro d'auto-amélioration). Cinq findings Codex sur trois PR, plusieurs P1, **après** un GO local. Deux classes de plus : une commande citée qui n'existe pas ou a la mauvaise signature (#228), et un contrat entre skills qui se doublonne (#229, #230).

## Proposition (arbitrages du grooming)

1. **Un ADR de décision**, statut *Proposé* (la ratification est au PO). Il sépare les deux grains, cite les données ci-dessus, compare les options sur performance **et** efficience, écarte les alternatives et acte une recommandation de workflow.
2. **Durcir le local par le prompt, pas par un appel de plus.** L'agent `ezk-reviewer` reçoit la liste des angles morts mesurés : erreurs silencieuses et chemins d'erreur ; rétro-compatibilité et contrats ; commande citée qui ne résout pas (script, arguments) ; contrats entre skills qui se doublonnent. Le coût d'un appel est surtout un contexte fixe : un prompt plus précis ne l'augmente pas.
3. **Workflow recommandé.** Revue locale `GO` avant tout merge, avec une trace. Codex en filet quand il est disponible, sans l'attendre ni le relancer. Sur les changements sensibles (sécurité, écriture hors du dépôt, contrats publics, chemins d'erreur), on garde la PR et on attend Codex tant que le quota le permet.
4. **Protocole de re-mesure** écrit, avec un oracle indépendant : l'**union adjugée** des défauts des deux relecteurs, faux positifs inclus. On mesure le rappel de chacun contre cet oracle, pas contre Codex.
5. **PR optionnelle** (reprend [`20260916225506858`](20260916225506858_github-modules-optionnels-config.md)). La capacité existe : `github.pr`, `github.ci` et `github.codex-review` se règlent dans `.vectorz/config.yml`. L'ADR tranche le défaut : tout reste allumé, et couper la PR demande la revue locale durcie et une re-mesure.

## Critères d'acceptation

- [x] Un ADR de décision (*Proposé*) est livré. Il traite « remplacer Codex » (grain de revue) à part de « PR optionnelle » (grain de merge). Preuve : [ADR-0059](../../products/mega-city/docs/adr/0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md), D1 et D3.
- [x] Un tableau comparatif chiffre ce qui l'est (rappel, coût, disponibilité, exposition) pour local seul, Codex et local + Codex. « Local durci » y est marqué non mesuré, avec son protocole. Preuve : ADR-0059, section « Les données ».
- [x] Une recommandation de workflow est actée : quand PR + Codex, quand local seul. Preuve : ADR-0059, D1 et D3.
- [x] Le relecteur local est durci : `ezk-reviewer` porte la liste des angles morts, et le skill `ezk-sprint` dit que la revue locale est le plancher. Preuve : `review-floor-contract.test.ts`.
- [x] Un protocole de re-mesure reproductible est écrit : échantillon, revue à l'aveugle, oracle indépendant, métriques de performance et d'efficience, conditions de relance. Preuve : ADR-0059, D5.
- [x] Les données du run sont citées avec leur source, sans être refaites.

## Comment vérifier

1. Lire l'ADR : deux décisions séparées, chiffres sourcés, workflow, alternatives écartées, déclencheurs de révision.
2. `bash products/mega-city/bin/check-adr-ids.sh .` : aucune collision de numéro. `bash products/mega-city/bin/check-links.sh . features docs/adr docs/captures` : liens valides.
3. `grep -n "Angles morts" products/mega-city/agents/ezk-reviewer.md` : la section existe. Un test garde ses quatre familles.
4. Rejouer le protocole sur un échantillon de PR est la **suite** : il demande l'archivage ci-dessous.

## Suite (hors POC)

- **Archiver chaque verdict local.** Format retenu : un fichier markdown par revue, en-tête YAML (verdict, coût, durée, findings : fichier, ligne, sévérité, catégorie) et corps lisible. Il **étend le pack** de l'[ADR-038](../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) (`features/reviews/`, contrat `method-review@0.1` vers `0.2`), au lieu d'ouvrir un second store. Une entrée par couple relecteur × run, sans écrasement. Aujourd'hui l'émetteur écrit au chemin de la fiche et écrase la revue précédente. Un index agrégé généré balaie les en-têtes (doctrine [ADR-0001](../../products/mega-city/docs/adr/0001-monorepo-composable-coeur-deterministe.md)).
- **Trace en attendant.** Le verdict est posté en commentaire de la PR : les verdicts de ce run restent lisibles sur GitHub.
- **Rejouer la mesure** avec l'oracle indépendant et le local durci.
- **N relecteurs en parallèle** : à mesurer seulement si la re-mesure montre un rappel insuffisant. Le coût est en jetons.
- **Axe 1 de la fiche chapeau** (installer un plugin par projet) et l'inventaire des skills qui parlent GitHub « en dur » : hors de cette fiche.

## Notes

- Voisines, à relier sans dupliquer : [[0161]] (panel de challenge, outil des passes multiples), [[0058]] et [[0051]] (qualité du logiciel, pas de la revue), [[20260830110131158]] (revue adverse skippable par flag), [[0165]] et [[0046]] (contrat d'améliorabilité).
- Tension à garder : sans PR GitHub, pas de Codex. vectorz est public, donc l'argument « confidentialité » vaut surtout pour les repos privés.
- Les diffs d'origine et les findings Codex de la baseline étaient en scratch éphémère. Le résumé chiffré ci-dessus est la trace durable.
- Retours Codex sur cette fiche (PR #213, 2026-09-05) intégrés : oracle indépendant, séparer revue et merge, réutiliser le pack.

## ⤓ Absorbe (tri du 2026-09-30)

- [`20260916225506858`](20260916225506858_github-modules-optionnels-config.md) : GitHub, CI et Codex en modules optionnels. Les crans utiles sont livrés (config `.vectorz/`, fichier de PR local). Il restait la décision « PR optionnelle » : elle est tranchée dans l'ADR (point 5).
