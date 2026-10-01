# ADR-0059 — La revue locale est le plancher, Codex le filet ; la PR reste le défaut et devient optionnelle par la config

- Statut : **Accepté** (ratifié par le PO le 2026-10-01). Les données du run V0.1 → V0.4 sont citées, pas refaites.
- Date : 2026-10-01
- Compose / précise : [ADR-037](../../../../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md) (la PR, unité de merge), [ADR-038](../../../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) (le pack de revue), [ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) §2 (GitHub est un module), [ADR-0050](0050-couche-regles-projet-local.md) (la couche `.vectorz/`), [ADR-0052](0052-merge-local-first-github-execute-le-squash-main-se-realigne.md) (le local décide, GitHub exécute)
- Fiche : `../../../../features/20260905134937885_revue-locale-vs-codex-mesure.md`. Elle reprend `20260916225506858` (GitHub, CI et Codex en modules optionnels) : il restait la décision « PR optionnelle ».

## En clair

Peut-on se passer de Codex, et sortir la PR du chemin ? Non, pas d'un coup, et pas par défaut.

La revue locale (`ezk-reviewer`) retrouve environ la moitié de ce que Codex voit. Codex voit ce que le local rate, et le local voit ce que Codex rate. Les deux sont complémentaires, pas interchangeables.

Mais on ne peut pas non plus compter sur Codex seul. Pendant le run V0.1 → V0.4, son quota s'est épuisé. La revue locale a alors été le seul filet sur la plupart des PR.

Analogie : le local est la ceinture, Codex est l'airbag. On ne roule jamais sans ceinture. L'airbag aide, mais il n'est pas toujours là.

On décide donc deux choses, qu'on ne mélange pas :

1. **Revue.** Le local est le **plancher** : aucun merge sans son `GO`. Codex est un **filet** en plus, quand il est disponible.
2. **Merge.** La PR reste le **défaut**. Elle devient **optionnelle par la config** (c'est déjà livré), mais on ne la coupe pas par défaut tant que le local durci n'a pas été remesuré.

Ce que ça veut dire pour toi : ton flux ne change pas. Une PR s'ouvre, la revue locale rend `GO` avant le merge, Codex passe s'il le peut. Si tu veux travailler sans GitHub, c'est possible, avec un relecteur local durci et ses angles morts écrits.

## Contexte

Il y a deux « grains » de décision, et ils ne se valent pas.

- **Le grain de revue** : qui relit le code ? Aujourd'hui Codex, à l'ouverture d'une PR, puis `ezk-reviewer` en local.
- **Le grain de merge** : la PR est-elle l'unité de merge, de CI et de revert ? C'est l'invariant d'[ADR-037](../../../../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md).

Les lier est un piège. **Sans PR, il n'y a pas de Codex** : c'est une app GitHub branchée sur les PR. Sortir la PR revient donc à retirer Codex, et le local devient le seul filet. C'est pourquoi on mesure le local d'abord.

Deux inconnues bloquaient la décision. Le local seul tient-il le niveau sur les défauts qui comptent ? Et ses verdicts ne sont archivés nulle part, donc rien ne se compare dans le temps.

## Les données

Elles viennent de trois sources, citées telles quelles.

**Baseline à l'aveugle, 2026-09-05.** `ezk-reviewer` (Opus, une passe) rejoué sur le code d'origine de trois PR, comparé aux findings Codex de l'époque.

**Run V0.1 → V0.4, PR #263 à #305** (relevé du PO). Le quota Codex s'est épuisé en cours de run. Sur la majorité des PR, la revue locale a été le seul filet. Quand Codex est passé, il a trouvé des défauts réels que le local n'avait pas tous vus : #284 (`--target` sans valeur retombait sur le vrai `~/.claude`, P1) et #286 (deux P1). Une revue locale coûte 107 à 162 mille jetons par appel.

**Rétro du 2026-09-12.** Cinq findings Codex sur trois PR, plusieurs P1, après un `GO` local. Deux classes de plus : une commande citée qui n'existe pas ou a la mauvaise signature (#228), et un contrat entre skills qui se doublonne (#229, #230).

| | Revue locale seule | Codex | Local + Codex |
|---|---|---|---|
| Rappel (baseline, Codex pris pour référence) | 9 défauts sur 17, dont 6 graves sur 9 | référence, donc biaisé | non mesuré tel quel ; le run montre que Codex apporte des P1 en plus |
| Angles morts | erreurs silencieuses ; rétro-compatibilité et contrats ; commande citée qui ne résout pas ; contrats entre skills doublonnés | ce qui sort du diff : renvois croisés cassés vers un ADR ou une fiche d'agent | les deux se couvrent |
| Coût | environ 100 000 jetons par PR et par passe (baseline) ; 107 à 162 mille par appel (run) | aucun jeton côté vectorz ; 3 à 5 minutes de latence | la somme |
| Disponibilité | toujours | quota épuisé en cours de run | celle du local |
| Exposition | aucune | le code part sur GitHub, dans une PR (vectorz est public) | idem |
| Dépendance | aucune | GitHub, l'app Codex, un quota | idem |

Ce qui n'est **pas** mesuré, dit franchement : le local durci (D2 ci-dessous), les faux positifs (la baseline ne les comptait pas), et un oracle indépendant (la baseline prend Codex pour référence, donc « local + Codex » gagne par construction).

## Décision

### D1 — Revue : le local est le plancher, Codex est un filet

- **Aucun merge sans un `GO` de la revue locale** (`ezk-reviewer`), et une trace lisible. La revue précède la PR, la trace la suit : le verdict est gardé en fichier, puis posté en commentaire de la PR dès son ouverture et avant le merge. Sans PR, c'est un fichier `review:emit`.
- **Codex n'est jamais une condition de merge.** Il reste lancé à l'ouverture de la PR tant que `github.codex-review` est actif. Son silence ne bloque rien. Quand il parle, on traite ses retours.
- **Changements ordinaires** : on n'attend pas Codex et on ne le relance pas.
- **Changements sensibles** (sécurité, écriture hors du dépôt, contrats publics, chemins d'erreur) : on garde la PR et on lui laisse le temps de passer, par une attente bornée, tant que le quota le permet. Quota épuisé : on ne bloque pas, et la revue locale porte la liste des angles morts (D2).

### D2 — Durcir le local par le prompt, pas par un appel de plus

L'agent `ezk-reviewer` reçoit une section « Angles morts mesurés », avec les quatre familles que Codex a trouvées et que le local a laissé passer :

1. les erreurs silencieuses et les chemins d'erreur (valeur absente, option sans valeur, repli dangereux sur un défaut) ;
2. la rétro-compatibilité et les contrats (format de sortie, signature, comportement par défaut) ;
3. la commande citée qui ne résout pas (script, arguments, chemin) ;
4. les contrats entre skills qui se doublonnent ou se contredisent.

Pourquoi par le prompt : le coût d'un appel est surtout un contexte fixe. Un prompt plus précis ne l'augmente pas. Un second appel le double. Un test garde les quatre familles dans le fichier de l'agent.

### D3 — Merge : la PR reste le défaut, elle devient optionnelle par la config

- L'unité atomique est la **branche**. La **PR est la projection de l'adaptateur GitHub** : présente quand `github.pr` est actif, absente sinon (branche, corps de PR en fichier local `pr:emit-local`, merge local). C'est la direction du PO du 2026-09-20, et le code l'a déjà : `.vectorz/config.yml`, `ezk:config`, [ADR-0052](0052-merge-local-first-github-execute-le-squash-main-se-realigne.md) D5.
- **Le défaut ne bouge pas** : tout allumé (PR, CI, Codex). Couper la PR pour un projet demande le local durci (D2), la trace locale du verdict (D4) et une re-mesure (D5) avant d'en faire le régime normal d'un dépôt.
- **ADR-037 est précisé, pas renversé.** Son invariant « une feature = une branche = une PR = un squash-merge » se lit désormais « … = une PR **quand `github.pr` est actif** ». Ses autres décisions (lots, train de merge, une seule politique de squash) ne bougent pas.

### D4 — La trace du verdict

Le verdict local ne se perd pas : commentaire de PR (`gh pr review --comment`) posé dès l'ouverture de la PR et avant le merge, `review:emit` sans PR. L'archive **structurée** (un fichier par relecteur et par run, en-tête YAML, extension du pack d'[ADR-038](../../../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) vers `method-review@0.2`, index généré) est la **suite** : c'est le prérequis de la re-mesure, pas de cette décision.

### D5 — Le protocole de re-mesure

1. **Échantillon.** Au moins 10 PR récentes, petites et grosses, sensibles ou non, relues sur leur code d'origine (avant les corrections de revue).
2. **Quatre bras, à l'aveugle.** Local seul, local durci, Codex, local durci + Codex. Aucun relecteur ne voit les retours des autres.
3. **Oracle indépendant.** L'**union adjugée** des défauts trouvés par tous les bras, faux positifs inclus. Un adjudicateur classe chaque défaut : réel, faux positif, nit. Codex n'est jamais pris pour référence.
4. **Performance.** Pour chaque bras, contre l'oracle : le rappel (tous les défauts, puis les graves seuls) et la précision (part de faux positifs).
5. **Efficience.** Jetons par PR, temps réel jusqu'au verdict, exposition du code, dépendance à GitHub.
6. **Seuil proposé** pour qu'un projet coupe la PR : le local durci retrouve au moins 90 % des défauts graves de l'oracle, et aucun défaut manqué n'appartient à une famille nouvelle.
7. **Relance** quand l'archive structurée existe, après 20 PR mergées avec le local durci, ou tout de suite si un P1 réel passe en production malgré un `GO` local.

## Alternatives écartées

- **Remplacer Codex par le local seul, maintenant.** Écarté : 6 défauts graves sur 9 seulement, des angles morts connus, et le run montre des P1 passés malgré le `GO` local.
- **Garder Codex comme seule revue.** Écarté : le quota s'est épuisé et plus rien ne relisait ; c'est un service externe ; il impose la PR.
- **Plusieurs relecteurs locaux en parallèle par défaut.** Écarté pour l'instant : chaque appel coûte 107 à 162 mille jetons, sans preuve de gain. À mesurer seulement si la re-mesure montre un rappel insuffisant du local durci. Le levier déjà utilisé est inverse : un seul appel peut couvrir deux ou trois petits patchs.
- **Retirer la PR par défaut.** Écarté : sans PR, plus de Codex ni de CI cloud ; le local durci n'est pas remesuré ; la PR porte la trace publique de la revue.

## Conséquences

- **Plus facile.** Un projet sans GitHub, ou sans quota Codex, tourne avec un filet explicite. Le relecteur local sait quoi attaquer en priorité.
- **Plus coûteux.** Le plancher coûte 107 à 162 mille jetons par appel. On le tient par la revue groupée de petits patchs, pas en l'allégeant.
- **À entretenir.** La qualité du filet local dépend d'un prompt : la liste des angles morts doit suivre les défauts que Codex trouve et que le local rate.
- **Touché dans cette PR.** L'agent `ezk-reviewer` (section « Angles morts mesurés », description alignée), le skill `ezk-sprint` (étape Revue : plancher et trace ; invariant « une PR » précisé), une note de précision sur ADR-037, et un test qui garde les quatre familles.
- **Suite, hors de cette PR.** L'archive structurée des verdicts et son index ; le run de re-mesure ; l'axe « installer un plugin par projet » de la fiche chapeau.
