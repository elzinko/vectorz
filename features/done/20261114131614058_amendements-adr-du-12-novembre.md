---
id: "20261114131614058"
title: "Amendements d'ADR du 12 novembre : vocabulaire Scrum à l'écran, lancements, module"
type: chore
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [adr, convention]
status: shipped
blocked:
pr: "local (091f290b)"
evidence: none # amendements d'ADR et deux renommages de texte
created: 2026-11-14
---

# 20261114131614058 — Amendements d'ADR du 12 novembre : vocabulaire Scrum à l'écran, lancements, module

**En clair.** Les 11 et 12 novembre, tu as fixé les mots de l'écran : sprint, but du sprint, objectif, jalon,
session, lancement, module. Ces décisions vivent dans un compte rendu de panel, enregistré dans le dépôt le 14 novembre,
et plusieurs documents de décision disent encore d'autres mots. Cette fiche écrit
ces mots dans les documents de décision, renomme les deux endroits où la méthode appelle encore le sprint
« le run », et aligne deux textes sur ce que le code fait vraiment.

**Si tu arrives frais.** Un **ADR** est un document court qui grave une décision d'architecture ; on l'amende
par une ligne datée. **Mission control** est l'écran de cop1 : il lit ce que la méthode publie par `ezk … --json`
et n'invente aucun mot. Un **lancement** est une exécution de la méthode ; le journal et la CLI disent « run ».

## Contexte / Problème

Ce que l'écran attend. La maquette (version 140, 12 novembre) parle Scrum : sprint, but du sprint, lot, incrément,
rétro, session nommée par sa branche. « Run » n'est plus un objet d'écran : il reste le mot du journal et de la
ligne de commande. « Objectif » désigne la milestone (décision PO du 11 novembre) ; « Jalon » est déjà le mot du
gate à l'écran. « Module » nomme ce qui se branche par projet (GitHub, CI, Codex) ; la méthode n'en est pas un.

Ce que les documents et le code disent aujourd'hui, vérifié le 14 novembre :

- ADR-086 §2 écrit que mission control montre « les runs, les sessions, la chronologie »
  (`docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md:77-78`). Le §3 « Un seul vocabulaire »
  (lignes 80-83) retire *Moniteur*, *cockpit*, *dashboard*, *kanban*, sans fixer « sprint », « lancement » ni « module ».
- ADR-079 D11 garde une chronologie « à 3 niveaux » (`docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md:104-106`).
  ADR-079 amende ADR-074 (ligne 6) ; ADR-074 ne renvoie pas vers lui : sa ligne « Amendé par » (ligne 4) ne cite qu'ADR-086.
- ADR-0054 § Nommage (`products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md:139-148`) pose
  « le mot Scrum là où Scrum en a un », sans définir « But du sprint », « Objectif » ni « Jalon ». « Jalon »
  désigne déjà le gate à l'écran (`products/cop1/packages/web/src/board/TimelineView.tsx:25`).
- La méthode appelle encore le sprint « Le run » à deux endroits : `products/mega-city/method/ceremonies.yml:69`
  (`nom: Le run (« sprint » maison)`) et `products/mega-city/src/core/cycle.ts:72` (`t: 'Le run'`). Le premier
  est lu par les chargeurs de la méthode et sera publié par la future `ezk process show --json`
  ([La méthode émet ses étapes fines](20261110191135802_methode-emet-ses-etapes-fines.md), prête). Le second
  alimente les vues régénérées (`src/io/derived-views.ts:72`, `ezk views regen`) ; un fixture le recopie
  (`src/__tests__/map-provenance.test.ts:68`).
- Côté loi (écart I3). ADR-0064 écrit `hooks: []` (ligne 32) et « les hooks sont hors du law-only » (ligne 101) ;
  le cap relaie pourtant les hooks (`products/mega-city/src/caps/claude-code-law.ts:33-47` et 54) et son test
  l'exige (`products/mega-city/src/__tests__/claude-code-law.test.ts:54-57`). ADR-0056 tolère « pour ce lot »
  qu'une règle du socle figure deux fois (lignes 56-57) ; à la lecture, `ezk law show` compte une règle présente
  dans les deux lois une seule fois (`products/mega-city/src/core/law-show.ts:222-223`). Sur ce poste, les dix
  règles de `.iamthelaw/ENTRY.md` sont les dix de `~/.claude/rules/iamthelaw.md` ; la session charge pourtant
  les deux fichiers. L'en-tête d'`ENTRY.md` (lignes 1-3) ne porte ni profil, ni hôte, ni commit.
- Les décisions ne vivent que dans `docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md`
  (amendement du 12 novembre, lignes 129-133). Committée sur `main` le 14 novembre au soir (`a610317d`) ;
  avant cela, non suivie par git.

## Proposition

Des gestes de texte, bon marché, plus deux renommages. Les amendements d'abord, le renommage ensuite.

1. **La capture du 11 novembre est committée** (`a610317d`, 14 novembre au soir) : c'est le dossier de preuves
   des décisions ; les amendements la citent par un lien qui résout. Constaté, plus rien à faire.
2. **Amender six ADR**, une ligne datée et un paragraphe court dans chacun :
   - ADR-086 §2 : mission control montre des sprints, des sessions et des lancements ; « run » reste un mot du journal
     et de la ligne de commande. §3 : fixer les mots d'écran (sprint, but du sprint, lot, incrément, rétro, version,
     objectif, jalon, session, lancement, module) ; dire que la méthode n'est pas un module de mission control mais ce
     qu'il lit (ADR-0039, amendement du 24 août : l'étage « branchements » s'appelle « modules ») ; dire ce qui n'est
     **pas** renommé : l'événement `run.started`, le contrat `cop1/supervisability@0.2` gelé (`products/mega-city/src/supervision/journal.ts:31`), l'alias `ezk-sprint run` (ADR-0054, ligne 137), ADR-084.
   - ADR-079 D11 : deux niveaux, objectif ou version en construction → sessions. L'écran livré par
     [Board : chronologie à 3 niveaux](20261015082118382_board-chronologie-3-niveaux-accueil-projets.md)
     change : l'amendement le nomme, cop1 le porte, pas cette fiche.
   - ADR-074 : une ligne « Amendé par ADR-079 », le lien retour qui manque.
   - ADR-0054 § Nommage : « But du sprint » = Sprint Goal, ce que `start --objective` saisit
     (`products/mega-city/skills/ezk-sprint/SKILL.md:89`, drapeau interne) ; « Objectif » = milestone (ADR-0083) ;
     « Jalon » = gate.
   - ADR-0056 : à la lecture, `law show` compte une règle présente dans les deux lois une seule fois ; la
     session lit encore les deux fichiers. L'amendement décrit la lecture, pas le coût en jetons.
   - ADR-0064 : le cap law-only relaie les hooks, texte aligné sur le code et son test. L'en-tête estampillé
     d'`ENTRY.md` a un seul porteur : [`ezk law status`](../20261114131615164_ezk-law-status-profil-et-fraicheur.md).
3. **Renommer « Le run » en « Le sprint »** dans `ceremonies.yml:69` et `cycle.ts:72`, suivre le fixture
   `map-provenance.test.ts:68`, régénérer les vues (`ezk views regen`), compilateur et tests verts.
4. **Écrire la matière d'ADR des décisions du PO du 14 novembre.** Les décisions 1 et 3 passent au panel
   adverse avant d'être gravées ; la 5 est prise. L'ADR porteur se choisit au panel (ADR-086, candidat naturel) :
   - Décision 1, à confirmer par le panel : le numéro d'un sprint est le compte continu depuis le début du projet,
     calculé depuis l'historique des sprints scellés, émis par `ezk board show --json` ; le compteur qui repart à 1
     par branche est un artefact local, jamais publié comme le numéro. Build : [Le sprint se publie avec son numéro continu](20261114131612204_sprint-publie-numero-but-branche.md).
   - Décision 3, à confirmer par le panel : les liens se déclarent dans le front-matter des objets de process ; la
     méthode les compile en un bloc typé (adjacence, étage, orphelins, provenance) ; ce bloc est le contrat publié ;
     `ezk graph check` le lit, pas un deuxième canal. Aujourd'hui `ezk graph check --json` existe (`products/mega-city/bin/ezk-graph.ts:27-36`)
     sans contrat sous `contracts/`. Build : [Le graphe de la méthode en un contrat compilé](../20261114131614982_graphe-de-la-methode-en-contrat-compile.md).
   - Décision 5, prise par le PO (hors panel) : `ezk rules show` est gardé comme vue documentée et mince de `law show` :
     un seul moteur, `rules show` = `law show` filtré ; pas de retrait, pas d'implémentation parallèle ; ADR-0062
     (ligne 88) et la rétro s'en servent. Build : [Un seul lecteur de la loi du projet](../20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md).
   - Décision 2 (nom d'un objectif et d'une version) : portée par [Trancher la coupe](20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md).

Hors périmètre : le glossaire publié ([`ezk glossaire show --json`](../20261114131616634_ezk-glossaire-show-json.md)) ;
les renommages d'écran (« Runs de cadrage », slug du sprint lu comme « objectif »), portés par
[Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md) ;
le spike [outiller l'ajout d'une règle](../20261011113632688_spike-flux-ajout-regle-fichier-bundle-bind.md), à enrichir
du cas du PO ; les verbes `ezk rules add|bind|remove`, inexistants (`products/mega-city/bin/ezk-rules.ts:28-31`), fiche à part.

## Critères d'acceptation

- [x] ADR-086 §2-3 amendé et daté : des sprints, des sessions et des lancements ; « run » reste un mot du journal
      et de la ligne de commande ; la liste de ce qui n'est pas renommé est écrite ; « module » désigne ce qui
      se branche par projet, et la méthode n'en est pas un.
- [x] ADR-079 D11 passe à deux niveaux et nomme l'écran livré à reprendre ; ADR-074 porte un lien retour vers
      ADR-079 ; ADR-0054 § Nommage définit « But du sprint », « Objectif » et « Jalon ».
- [x] ADR-0056 dit comment `law show` compte une règle commune une seule fois et que la session charge encore
      les deux fichiers ; ADR-0064 dit que le cap relaie les hooks, sans contredire le code.
- [x] Aucun libellé « Le run » ne subsiste dans `products/mega-city/method/` ni dans `products/mega-city/src/core/` ;
      les vues régénérées disent « Le sprint » ; compilateur et tests verts.
- [x] Les décisions 1 et 3 du PO sont écrites comme matière d'ADR, vérifiées par le panel adverse du 14 novembre
      (capture en lien ; libellé du grooming : « à confirmer par le panel », le panel ayant eu lieu avant le build) ;
      la décision 5 est écrite comme prise ; chacune est reliée à sa fiche de build.
- [x] Les amendements citent la capture du 11 novembre (committée sur `main` le 14 novembre) par un lien qui résout.

## Comment vérifier

```bash
R="$(git rev-parse --show-toplevel)"
grep -rn "Le run" "$R"/products/mega-city/method "$R"/products/mega-city/src/core   # attendu : rien
grep -n "ADR-079" "$R"/docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md
pnpm --dir "$R"/products/mega-city test -- src/__tests__/map-provenance.test.ts \
  src/__tests__/map-data.test.ts src/__tests__/claude-code-law.test.ts
ezk --root "$R" views regen
ezk --root "$R" law show --json | jq '.comptes'   # projet = 0 sur ce poste : la règle commune compte une fois
git -C "$R" log --oneline -1 -- docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md
ezk --root "$R" docs check-links
```

## Glossaire

- `loi` — le jeu de règles compilé qu'une session charge au démarrage (`.iamthelaw/ENTRY.md` ici).
- `cap`, `law-only` — le module qui déploie la loi dans un projet ; `law-only` n'écrit que la loi et son pointeur.
- `hook` — un script que git joue à un moment donné (avant un commit, par exemple).
- `fixture` — une donnée d'exemple figée, lue par un test.
- `front-matter` — l'en-tête de champs placé en tête d'une fiche ou d'un objet de la méthode.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts I1 et I3 ; première de l'ordre d'attaque, avec [Trancher la coupe](20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md).
- Décisions du PO du 14 novembre : 1 et 3 portées ici comme matière d'ADR à confirmer par le panel, 5 comme prise ;
  2 renvoyée à « Trancher la coupe » ; A8 (pas de numéro court stocké) notée dans
  [Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md).
  Restent ouverts depuis le 12 novembre : la confirmation de « But du sprint », et le « but de version » (ADR-0080, lignes 87-88).
- Dépendances : aucune fiche du lot. Dépendent de celle-ci : [le glossaire publié](../20261114131616634_ezk-glossaire-show-json.md),
  [le menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md) et [la cloche](20261114131612944_ezk-now-json-alertes-de-la-cloche.md).
- Voisines livrées : [Un seul vocabulaire pour les boards](20261031160441559_un-seul-vocabulaire-boards.md) ;
  [La Vue d'ensemble résume le dernier sprint](20261104090517904_vue-ensemble-dernier-sprint-et-kpi.md), origine du mot « objectif » pour le slug ;
  [Aligner le vocabulaire des commandes sur Scrum](20260903085150321_nommage-commandes-scrum-safe.md), absorbée par ADR-0054 § Nommage.
- Voisines actives : [Trier les sorties de rétro par nature](../20261002155911271_trier-sorties-retro-par-nature.md) (`blocked: panel`, touche aussi ADR-0054) ;
  [la CLI de la méthode est-elle un DSL cohérent](../20261010153046143_brainstorm-dsl-cli-methode.md), dont relève tout nouveau verbe `law` ou `rules`.
- Risques : plusieurs chargeurs lisent `ceremonies.yml`, le compilateur doit tourner après le renommage ;
  D11 à deux niveaux ne vaut rien tant que cop1 ne reprend pas l'écran.

## Journal

- 2026-11-14 — créée depuis la carte des écarts (lot de 27 fiches validé par le PO le 14 novembre).
- 2026-11-14 (soir) — groomée en autonomie (run du soir, mandat du PO jusqu'à minuit, relayé par la session
  pilote). Techniques : constater les dépendances (la capture est sur `main` ; les décisions 1, 3 et 5 du PO
  sont écrites dans la fiche ; le panel adverse de la coupe se joue ce soir et confirme ou non les
  décisions 1 et 3), rendre chaque critère testable (six critères, chacun avec sa commande dans
  « Comment vérifier »), couper au plus petit morceau utile (des amendements d'ADR et deux renommages,
  aucun code ; la décision 2 reste à « Trancher la coupe »). Lot 1 du run : avec « Trancher la coupe ».
- 2026-11-14 (soir) — passée « prête » sur tampon `ezk-pm` (mode auto, sans `--stamp-ready`) : DoR complète,
  six critères prouvables par commande, dépendances constatées. Lot 1 du run du soir.
- 2026-11-14 (soir) — story construite et intégrée dans `main` (091f290b) : amendements d'ADR-086, 079, 074, 0054, 0056,
  0064 ; « Le run » → « Le sprint » ; décisions 1, 3 et 5 du PO écrites. Revue adverse `ezk-reviewer` : NO-GO
  (les décisions 1 et 3 disaient « vérifiées par le panel » avant que sa capture soit dans le dépôt ; ADR-0088 cité
  avant d'exister ; liste 1./3./5. mal rendue), corrigé après l'intégration de « Trancher la coupe », puis GO : six
  critères prouvés, cases reportées telles quelles. Le critère 5 est reformulé : le panel a eu lieu entre le
  grooming et le build, « à confirmer » devient « vérifiées par le panel », l'intention (ne rien sur-promettre)
  est inchangée.
