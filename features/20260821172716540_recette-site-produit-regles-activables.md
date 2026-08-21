---
id: "20260821172716540"
title: Recette « site produit » — un skill + des règles activables (cas samplerz)
type: feature
priority: P2 # posée par défaut — PO à confirmer (P1 si construction dès la prochaine session)
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-21
---

# Fabriquer un site produit par recette — sans inventer de nouveau concept

> **Révisée le 2026-08-21 après panel adverse** (3 attaquants indépendants — modèle,
> économie, terrain ; 2× GO-avec-réserves, 1× NO-GO sur l'ordre du plan v1). Le détail :
> [capture du panel](../docs/captures/2026-08-21-panel-adverse-recette-site.md). La v1
> mettait la machinerie avant le consommateur et montrait un geste (« le projet
> déclare ») qu'aucun code ne lit. Voici la v2.

## En clair

Le besoin : une façon répétable de créer le site d'un produit — page d'attente publique
tant que le produit n'est pas prêt, vrai site en staging, et des règles ajoutables comme
« toute image du produit est une capture de l'application démarrée ». Verdict, confirmé
par panel : **aucun concept « recette » à inventer** — recette = un skill + des règles.
Mais l'ordre compte : **la valeur d'abord (côté samplerz), la prose ensuite, la
machinerie seulement quand un deuxième produit la réclame.**

## Contexte / Problème

Demande PO du 2026-08-21, cas concret **samplerz** : page d'attente (façon byhere.fr) sur
le domaine public ; vrai site sur `dev.samplerz.fr` (staging, non indexé) ; règle
screenshots ; besoin récurrent pressenti. Et une gêne : le concept de composition existe
mais la carte ne le montre pas — voir la fiche sœur
[la carte ne montre pas LA LOI](20260821172716537_carte-ne-montre-pas-la-loi.md).

⚠️ **La valeur immédiate ne dépend PAS de cette fiche** : la page d'attente + le noindex
du staging se livrent **dans le repo samplerz** (chantier `website_showcase` + PR
samplerz #239, ouverts depuis le 2026-08-10), sans rien attendre de mega-city.

## Ce qui existe déjà (anti-doublon — complété par le panel)

| Le besoin exprimé | La pièce existante |
|---|---|
| « des règles que je peux ajouter » | `rules/` — un fichier markdown par règle, niveau MAY/SHOULD/MUST |
| « des options activables » | `bundles/` + `profiles/` — mais ⚠️ les profils actuels sont des profils de POSTE, aucun par projet externe |
| « le projet ajoute SES règles » | l'épic ancrage/installeur [20260813124026215](20260813124026215_deploiement-methode-llm-native.md) (`idea`) — **la dépendance réelle** du « le projet déclare » |
| relier une règle à qui la vérifie | **`enforcements:`** — déjà présent sur 14 règles (ex. [pr-before-after-media](../products/mega-city/rules/development/pr-before-after-media.md) → agent-check `ezk-reviewer`) — tout nouveau lien règle↔acteur doit d'abord s'unifier avec lui |
| le patron « moteur de règles par domaine » | [ADR-0026](../products/mega-city/docs/adr/0026-capacite-ux-agent-plus-skill-mince.md) — dessiné, jamais construit ; sa **doctrine §3 donne l'ordre** : « câblage en prose tant que le champ n'existe pas » |
| « captures de l'app démarrée » | fiche [screenshots produit](20260812104022228_ezk-screenshots-doc-produit.md) (`idea` — dépendance non construite, à dire) + la règle MUST `pr-before-after-media` qui couvre déjà les livrables visibles |
| le gate anti-machinerie | [ADR-0013](../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md) : « preuve dans ≥ 2 repos ou ≥ 3 occurrences datées » — aujourd'hui : **1** occurrence |

⚠️ **Nommage** : « recipy » est pris (ADR-0013, un entonnoir de sourcing — autre chose).
Et le mot « interactions » porte déjà DEUX sens dans le repo (profil : règles entre
agents ; agent : règles que je respecte) — **ne pas** lui en donner un troisième.

## La décision (issue du panel)

**Option retenue : skill + règles, par extraction progressive.** Pas de concept neuf, pas
de champ machine aujourd'hui, pas de bundle aujourd'hui. La cible long-terme (option B :
bundle + champ vérifié + carte) reste la bonne — on l'atteint **sur preuve**, jamais
d'avance. Les trois P0 du panel qui ont tué le plan v1 :

1. une **liste d'ids figée ment par conception** (une règle projet-locale ne peut pas y
   figurer) — si champ un jour, il déclare un **espace de noms** (« je lis `site/*` actif ») ;
2. **machinerie avant consommateur** = le vice documenté du repo (ADR-0013, précédent
   ADR-0026 : dessiné le 2026-08-09, zéro usage depuis) ;
3. l'exemple « le projet déclare » n'avait **aucun lecteur** dans le code — le vrai
   mécanisme est l'épic ancrage, maintenant référencé.

**Les deux moments** (validés par le panel, à garder en tête à chaque étape) :
- *Activation* — « cette règle compte-t-elle pour ce projet ? » → mécanique (aujourd'hui :
  la section options du playbook + la déclaration du projet dans son propre repo).
- *Application* — « s'applique-t-elle ici ? » → la condition vit DANS la règle, jugement.

## Le plan v2 (ordre du panel)

1. **Côté samplerz, sans attendre** : page d'attente statique + `noindex` staging —
   ticket dans le backlog **samplerz**, zéro dépendance mega-city.
2. **Skill MVP** (nom tranché à la création du fichier) : les 3 règles **en prose dans
   son playbook** (doctrine ADR-0026 §3), options activables = section options lue en
   prose, déclaration côté projet dans le repo du projet. Le dérouler sur samplerz.
   - périmètre écrit : la recette **fabrique** ; servir (DNS, bascule attente→site,
     capture d'email) passe par l'outillage de déploiement existant, nommé dans le playbook ;
   - templates : trancher où ils vivent — contrainte dure : ADR-0027 = assets **texte**
     seulement, et le bind par-projet matérialise un fichier plat sans assets ;
   - captures : composer les briques de la fiche screenshots (`ezk-qa`/Playwright + run)
     — **pas** `ezk-preview` (il expose, il ne démarre pas — ADR-0020 option D) ;
   - la règle screenshots ne devient MUST **que** dotée d'un `enforcements:` réel (qui
     vérifie, sur quelle PR) — sinon SHOULD assumé.
3. **Au 2e produit consommateur prouvé** (gate ADR-0013) : extraire `bundles/site.yml`
   + mini-décision d'**unification** `enforcements:` / `interactions:` / futur champ.
4. **Alors seulement, le champ machine** : espace de noms (jamais une liste), porteur et
   nom décidés en 3, entrant au repo **avec** son premier porteur — même clause que les
   données. La carte l'affiche (la fille carte-LOI, elle, se construit dès maintenant).
5. **« Le projet déclare » (le vrai)** : quand l'épic ancrage `20260813124026215` livre
   le point d'ancrage projet.

## Critères d'acceptation

- [ ] La page d'attente samplerz est livrée **côté samplerz** (préalable de valeur, hors repo).
- [ ] Le skill MVP existe, règles en prose, déroulé une fois sur samplerz de bout en bout.
- [ ] Le périmètre fabriquer/servir et la décision templates sont écrits dans le playbook.
- [ ] Aucune règle MUST sans `enforcements:` réel.
- [ ] Bundle et champ machine n'existent **que** s'il y a un 2e consommateur prouvé — et le
      champ décrit un espace de noms, avec un nom qui n'est pas « interactions ».
- [ ] L'unification avec `enforcements:` est tranchée avant tout nouveau lien règle↔acteur.

## Comment vérifier

Aujourd'hui : lire la [capture du panel](../docs/captures/2026-08-21-panel-adverse-recette-site.md)
et vérifier que chaque P0 a son antidote dans le plan v2. Après l'étape 2 : dérouler le
skill sur samplerz — la page d'attente sort, les options se lisent. Après l'étape 4,
sabotage double : retirer une règle du bundle (l'activation cesse) ET soumettre un site
fait de maquettes (l'application doit être refusée par l'enforcement — pas seulement par
la bonne volonté).

## Notes

- Panel adverse du 2026-08-21 : 3 attaquants, verdicts 2× GO-avec-réserves + 1× NO-GO sur
  l'ordre — v1 corrigée en conséquence. La priorité **P2 est confirmée par le panel** (la
  valeur immédiate vit côté samplerz).
- Épic « fidélité de la carte » : lié par la fiche sœur ; ce chantier-ci est de la méthode.
