---
id: 0153
title: ezk-article — skill d'écriture d'articles techniques vulgarisés (persona + panel de relecteurs frais)
type: feature
priority: P1
product: mega-city
status: shipped
ready: 2026-07-17
pr: "#32"
created: 2026-07-13
---

## Contexte / Problème

Expérience fondatrice : l'article « contrat de supervisabilité » de cop1 (fiche cop1 0025,
PR cop1#57). La v1, écrite « pour le dossier », était fidèle mais peu accessible : sujet
difficile à situer, références obscures pour qui ne connaît pas le domaine. La v2, produite
avec un **cadrage de persona explicite** (« développeur/architecte écrivain à succès, niveau
Martin Fowler, qui vulgarise et intéresse des devs passionnés ») puis une **boucle de
relecture par panel de lecteurs frais**, a été jugée « super lisible et intéressante » par le
demandeur. Ce déroulé a marché ; il est aujourd'hui entièrement manuel et va se perdre.

Deux ingrédients ont fait la différence, et méritent d'être encodés :

1. **Le brief de persona vient du demandeur** — c'est lui qui définit la voix, le niveau et
   l'audience (« mets-toi dans la peau de X pour des lecteurs Y »). Le skill doit le demander
   au lieu de le deviner.
2. **La relecture n'est pas une passe, c'est un panel** de relecteurs indépendants SANS le
   contexte de la session, chacun avec une lentille : lecteur cible zéro-contexte (le test
   qui compte), juge « essais techniques » (Fowler/Kleppmann/Spolsky : ouverture, chutes,
   promesses payées), copy-editor clinique, **vérificateur de fidélité aux sources** (la
   vulgarisation ne doit rien déformer — il a attrapé 2 vraies dérives sur cop1 0025),
   auditeur d'accessibilité des références (chaque nom propre glosé en une demi-ligne).
   Puis application des recos et **contre-lecture finale à froid** comme gate (verdict
   « publier » exigé — elle a attrapé une contradiction que tout le panel avait manquée).

## Destination (tranchée)

**mega-city.** claude-skills est gelé depuis la migration du 2026-07-04 (fiche 0024) —
mega-city est la seule home des skills. Le skill n'a rien à voir avec la supervision
(cop1), mais mega-city héberge déjà la collection perso `ezk-*` (diagram, commits,
backlog…) : un outil d'écriture y est à sa place. Hors de question de le mettre dans cop1
(control plane runtime, pas une boîte à outils d'écriture).

## Proposition

Skill `ezk-article` (candidat), pilotable par sous-commandes (help, new, revise, panel) :

- **Entrées** : la matière (docs sources, notes vérifiées, ou article existant à réécrire),
  le brief de persona/audience/niveau (demandé explicitement au user si absent), une cible
  de longueur, la langue.
- **Règles d'écriture encodées** (le « style guide » du skill) : thèse en épigraphe ; ouvrir
  par un récit/scène concrète, zéro méta avant la scène ; vulgariser avant de formaliser ;
  chaque terme pivot défini à sa première occurrence ; chaque référence présentée en une
  demi-ligne d'identité ; une idée par section, titres qui parlent, chutes de section ;
  compléments (« pour creuser ») relégués en fin ; chute finale qui boucle sur l'ouverture
  et adresse le lecteur ; les affirmations factuelles restent adossées aux sources fournies
  (jamais d'invention pour les besoins de la simplification).
- **Boucle qualité** : draft → panel de relecteurs frais (les 5 lentilles ci-dessus, en
  parallèle si l'orchestration multi-agents est disponible, séquentiel sinon) → application
  des recommandations par l'auteur → contre-lecture finale à froid = gate de sortie.
- **Versionnage côte à côte** : en cas de réécriture, l'ancienne version est conservée en
  `<slug>-vN.md` avec bandeaux croisés (comparaison sans git), la nouvelle prend le slug
  canonique (les liens existants restent valides).
- **Composition, pas réimplémentation** : les lentilles structure/prose réutilisent
  `bmad-editorial-review-structure` / `bmad-editorial-review-prose` là où elles existent ;
  le panel ajoute les lentilles que BMAD n'a pas (lecteur cible, fidélité, références).

## Critères d'acceptation

- [ ] Le skill demande le brief persona/audience s'il n'est pas fourni (pas de valeur
      par défaut silencieuse).
- [ ] Un run `new` produit un article conforme aux règles d'écriture (vérifiable par le
      panel) ; un run `revise` produit une vN+1 avec la vN conservée et les bandeaux croisés.
- [ ] Le panel tourne avec ses 5 lentilles, chacune SANS contexte de session (agents frais),
      et la contre-lecture finale rend un verdict explicite avant de conclure.
- [ ] La lentille « fidélité » est obligatoire dès que des sources sont fournies ; le skill
      refuse de « publier » si elle relève une déformation non corrigée.
- [ ] Doc du skill : quand l'utiliser (article, README long, post de blog, doc d'archi
      grand public), quand ne pas l'utiliser (doc de référence, spec).

## Notes / décisions

- Origine : cop1 fiche 0025 (article contrat de supervisabilité), PRs cop1#57 — voir les
  deux versions côte à côte dans `cop1/docs/articles/` comme exemple canonique avant/après.
- Le panel type et les prompts de lentilles peuvent être extraits de la session cop1 du
  2026-07-13 (transcript : cadrage persona → draft → panel 5 lentilles → contre-lecture).
- À groomer : nom définitif (`ezk-article` vs `ezk-vulgarise`), et si la boucle qualité
  mérite d'être un skill séparé réutilisable (panel de relecture générique) composé par
  celui-ci.
- **Amendement 2026-07-15 (préparé par la fiche 0052 ezk-marketing, revue adverse)** :
  ajouter aux entrées un **« style-guide additionnel » optionnel**, injecté dans le
  brief (voix/leçons apprises — ex. l'artefact évolutif maintenu par ezk-marketing) ;
  les règles d'écriture du skill restent invariantes, le style-guide externe s'ajoute
  par-dessus sans les remplacer. NB : la 0052 (P1) DÉPEND de cette fiche — arbitrage
  de priorité à prendre (lot 0049→0052 ?).
- **Amendement 2026-07-16 (retour terrain : 1ᵉʳ article samplerz écrit via le déroulé
  manuel).** Cinq règles générales à encoder, remontées de l'usage réel :
  1. **VOIX à la 1ᵉʳ personne, au nom du porteur** (option de persona) : « j'ai créé »,
     « je me suis posé la question » — pas la 3ᵉ personne éditoriale ni « l'utilisateur ».
     Le brief de persona porte ce choix (1ᵉʳ pers. / éditorial / neutre).
  2. **Accessibilité à un NOVICE** : clair pour tout le monde, y compris un dev hors du
     domaine. Renforce « définir chaque terme » : quand un mot reste ardu, l'EXPLIQUER,
     ou l'illustrer par un **bout de code** ou une **image**. Zéro jargon nu.
  3. **DIAGRAMMES** : illustrer les propos structurants (surtout les flux de
     communication, machines à états, frontières) par un schéma. Composer **`ezk-diagram`**
     (prose → Mermaid + image versionnée), pas de Mermaid à la main. Un schéma seulement
     s'il éclaire (pas de décoration).
  4. **LIENS vers les OUTILS cités** (Ableton, Chataigne, OSC…) : chaque outil nommé
     gagne un lien vers sa source officielle, en plus de sa demi-ligne d'identité.
  5. **LIENS vers les SOURCES d'archi (ADR)** : ne pas écrire « l'ADR dit » sans lien —
     lier l'ADR PUBLIC. ⚠️ Dépendance : suppose une **surface publique** pour les ADR
     quand le repo code est privé (cf. samplerz `public_content_annex`) ; tant qu'elle
     n'existe pas, formuler sans référence nue ni lien mort.
