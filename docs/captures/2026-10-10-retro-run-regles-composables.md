# Rétro du run du 2026-10-10 — « les règles qui se regroupent »

## En clair

Aujourd'hui, le robot a construit tout seul **3 choses** qui vont ensemble, et ça s'est bien
passé. En les faisant, **5 petits grains de sable** sont apparus. Ce fichier les raconte en
langage simple, chacun avec « ce qui s'est passé » et « l'idée pour que ça n'arrive plus ».
**Toi seul décides** lesquels valent une suite — je n'ai rien lancé.

Le grain de sable n°5 est le plus important : **ce rapport de rétro, dans sa première version,
était incompréhensible pour toi.** C'est le comble, et c'est noté.

## Ce qui a été construit (le fond, en une phrase)

On voulait que les règles de la méthode puissent **se regrouper en paquets nommés**, pour que
le développeur et le relecteur suivent **la même liste** au lieu de la recopier chacun de son
côté (et de finir par ne pas suivre la même).

1. **Savoir citer un paquet** — avant, un agent listait ses règles une par une. Maintenant il
   peut pointer un paquet entier d'un coup.
2. **Vérifier que le problème existait pour de vrai** — on a regardé : le développeur disait
   suivre **1 règle**, le relecteur en contrôlait **5**. Ils ne travaillaient donc pas sur le
   même contrat. Le problème était réel.
3. **Faire du « c'est fini » un paquet partagé** — la définition de « fini » (la *DoD*) est
   devenue un paquet unique que le développeur **et** le relecteur citent tous les deux. Fini
   la recopie à la main.

## Les 5 grains de sable (à toi de trancher)

### 1 · Le contrôle de sécurité re-sonne pour rien
**Ce qui s'est passé.** Avant chaque sprint, un contrôle vérifie si une autre session de travail
tourne en parallèle sur ta machine (pour éviter qu'elles s'écrasent). Il y en avait une, sur un
autre sujet. Tu avais dit « OK, on continue » ce matin. Mais le contrôle n'a pas de mémoire : il
a re-posé la même question à chaque sprint. J'ai re-confirmé 3 fois la même chose inchangée.
**Image.** Un détecteur de fumée qui bipe chaque fois que tu passes, alors que tu as déjà
vérifié qu'il n'y a pas de feu.
**L'idée.** Donner une petite mémoire au contrôle : une fois que tu as dit « OK pour cette
session-là », il se tait tant que cette session ne change pas.

### 2 · « Ce qui est écrit sur la porte » ≠ « ce que fait la personne »
**Ce qui s'est passé.** Chaque agent a un en-tête qui liste « les règles que je suis ». On
croyait que cet en-tête était donné à l'agent. En fait, il est enlevé avant que l'agent reçoive
ses instructions : l'agent ne le lit jamais. C'est une étiquette pour les inventaires, pas un
changement de comportement. Deux fois, on a failli écrire « ça fait suivre la règle au dev » —
ce qui aurait été faux. Le relecteur l'a rattrapé.
**Image.** Une fiche de poste punaisée sur une porte : la mettre à jour range l'organigramme,
mais ne reforme pas la personne derrière.
**L'idée.** Chaque fois qu'on touche à ces étiquettes, dire clairement : « ça range l'inventaire,
ça ne change pas le comportement de l'agent ». Pour ne pas se raconter d'histoires.

### 3 · Le tableau du plan qu'il faut barrer à la main
**Ce qui s'est passé.** Le fichier « plan » liste ce qu'on construit, une ligne par fiche. Quand
une fiche est finie, l'outil devrait barrer sa ligne. Mais s'il y a des mots en plus après le
nom (« → à construire »…), il refuse, de peur de mélanger plusieurs fiches. J'ai barré à la
main, 3 fois.
**Image.** Une appli de tâches qui refuse de cocher « Acheter du lait (pour le gâteau) » à cause
de la parenthèse.
**L'idée.** Apprendre à l'outil que, s'il n'y a qu'un seul nom de fiche sur la ligne, il peut la
barrer même avec des mots en plus.

### 4 · L'outil de bilan ne sait pas travailler sans GitHub
**Ce qui s'est passé.** Il y a un outil pour écrire le tableau-bilan de fin de run. Il a été fait
en supposant que tout passe par GitHub (avec un numéro genre #277). Ce projet travaille **sans**
GitHub, tout en local. L'outil a refusé les identifiants locaux → j'ai écrit le bilan à la main.
**Image.** Un formulaire qui n'accepte qu'un numéro à 10 chiffres ; le tien est valide mais
écrit autrement, donc « envoyer » reste gris.
**L'idée.** Apprendre à l'outil à accepter une livraison locale (un code de commit) à la place
du numéro de PR.

### 5 · Ce rapport de rétro était illisible pour toi (le plus important)
**Ce qui s'est passé.** La première version de ce fichier était écrite dans le vocabulaire de la
machine (« portier », « interactions », « bundle », « graph:check »…). Toi, tu pilotes : tu dois
pouvoir lire un rapport et décider, sans traducteur. La règle « écrire clair pour l'humain »
existe pourtant, et elle couvre explicitement les rétros. Mais rien ne la **contrôle**
automatiquement sur une capture : ça repose sur ma discipline, et j'ai glissé dans la langue de
la machine.
**Image.** Un médecin qui te rend tes résultats en latin.
**L'idée.** Traiter la lisibilité d'une capture de rétro comme un vrai critère, pas un vœu :
la relire avec « est-ce qu'un nouveau venu comprend ? » avant de la committer. Éventuellement un
garde-fou qui refuse une capture bourrée de jargon non défini.

## Ce que tu décides

**Les 5 grains sont fichés** (décision PO du 2026-10-10, fiches « idée » à groomer plus tard) :

- [x] 1 · Mémoire du contrôle de sécurité → fiche `20261010213746514` (affiné : distinguer
      worktree vivant / abandonné)
- [x] 2 · Dire « étiquette, pas comportement » quand on touche ces en-têtes → fiche `20261010235329987`
- [x] 3 · Barrer une ligne de plan à un seul nom, même avec des mots en plus → fiche `20261010235330053`
- [x] 4 · L'outil de bilan accepte une livraison locale → fiche `20261010235330118`
- [x] 5 · La lisibilité d'une rétro devient un critère tenu (le plus important) → fiche `20261010213353647`

Les fiches naissent « idée » : le grooming et la priorité se tranchent au moment de les tirer.

---

### Annexe technique (pour mémoire, pas pour la lecture courante)

Run `ezk-product-build --mode auto --retro end`, 3 sprints livrés en local :
F1 `20261008154803440` (citer un bundle, `58357fb6`) · spike `20261008183238365` (divergence
dev↔reviewer prouvée, `476af66e`) · F2 `20261008154804532` (DoD = bundle `dod`, `c44c236f`,
ADR-0070). Frictions ↔ pistes outillage : (1) `check.sh` mémoire d'override par worktree voisin ;
(2) lentille « déclaration catalogue/graphe vs effet prompt » sur tout livrable touchant
`interactions:`/`applies:` ; (3) heuristique de barrage `ship-fiche` sur ligne `PLAN.md` à id
unique ; (4) `run report --no-github` accepte `local (<sha>)` dans le champ PR ; (5) garde-fou
lisibilité sur les captures `docs/captures/`.
