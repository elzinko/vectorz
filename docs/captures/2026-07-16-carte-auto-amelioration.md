# En clair : les 2 sujets de l'auto-amélioration

> Note de cadrage lisible (session 2026-07-16). Le dossier technique dense (contrat mesuré)
> est à côté : `ADR-030` + `2026-07-16-note-concept-contrat-ameliorabilite.md`. **Tu n'as pas
> besoin de le lire** — cette carte suffit à décider.

Un retour du PO a débloqué le sujet : *« il y a 2 sujets, un où on améliore la méthode, un
autre où l'auto-amélioration naît de la méthode. »* C'est exactement ça, et ça change tout.

## Les 2 sujets

**Sujet A — on améliore la méthode** *(tu déclenches)*
Tu lances une rétro quand tu veux → les agents débattent en round-robin (2 tours) → ils
tombent d'accord sur des propositions liées à un **symptôme** et **mesurables** (une action,
une feature, un spike, ou **une règle** : lint, principe d'archi, item de DoD, outil de
contrôle, façon de communiquer). Simple, et tu gardes la main.

**Sujet B — la méthode s'auto-améliore** *(un chiffre déclenche)*
Un mesureur tiers surveille des résultats métier (une PR retouchée à la main ? un cycle trop
long ?). Quand un chiffre décroche, la méthode propose **une seule** amélioration, la prouve,
puis l'adopte ou la retire. Plus ambitieux → c'est le **contrat d'améliorabilité** (ADR-030),
pour plus tard.

## Ce qu'ils partagent (la même plomberie)

Les deux sujets finissent au même endroit :

1. **Un juge de cohérence** — « cette règle en contredit-elle une autre ? un doublon ? »
   C'est le *judgedread*. Déjà en idée : fiche [0008 chief-judge](../../products/mega-city/features/0008-chief-judge.md)
   + l'agent `ezk-steward` (gardien de LA LOI).
2. **Rangé dans mega-city** — une règle dans `rules/` (10 catégories existent déjà), un
   `bundle`, ou le DoD/DoR.
3. **Toi** — tu valides, tu peux imposer, tu peux retirer. Une règle est **réversible**.

## Le métier est-il déjà là ? Oui — presque tout est déjà codé (et testé).

Un fouilleur a remonté le pipeline historique cop1 fichier par fichier. Ton modèle mental
existe déjà **en pièces détachées, majoritairement côté cop1, codées et testées — mais ni
assemblées ni câblées** dans la boucle vivante.

| Brique de ton modèle | État aujourd'hui | Preuve (fichier) |
|---|---|---|
| Round-robin 2 tours → consensus | ✅ **codé + testé** (« 2 tours × 3 agents ») | `RoundTableEngine` (ceremony-engine), `maxRounds=2` |
| Rétro qui pond des propositions | 🟠 **codée mais orpheline** (jamais déclenchée) | `RetroCeremony` — `grep 'new RetroCeremony(' = vide` |
| Règle mesurable liée à un **symptôme** | ✅ **codé** (blocage > 30 %, coverage < 80 %…) | `AutoRuleSuggestionService`, `improvementScore` |
| Juge de cohérence (« judgedread ») | 🔴 **spécifié, pas codé** ; runtime = anti-doublon seul | fiches `0008` + `0034` ; `checkDuplicate` |
| Atterrir dans DoR/DoD / règles mega-city | ✅ DoD/DoR codés + règles en `rules/` | `DoDCheck` (ADR-020) ; 53 règles migrées (fiche 0006) |

**Donc ce qui manque n'est pas la machinerie — ce sont 3 soudures :**

1. un **déclencheur** « rétro à la demande » qui rebranche la cérémonie orpheline ;
2. le **juge de cohérence** (aujourd'hui on ne détecte que les doublons, pas les contradictions) ;
3. le **pont** rétro → `rules/` de mega-city (le retour de règle écrit encore à l'ancienne
   adresse cop1 `iamthelaw/*.yaml`).

C'est le job de la fiche [0063 ezk-retro](../../products/mega-city/features/0063-ezk-retro-ceremonie-auto-amelioration.md)
(Sujet A). Le mesureur du Sujet B = fiche vectorz 0044.

*Nuance sur ton souvenir : les 2 tours existent mais dans un ordre **déterministe** — le
tirage « aléatoire » des agents serait un petit ajout, pas un chantier.*

## La prochaine marche, concrète et simple

Le **Sujet A** (fiche `ezk-retro`) : un skill qui lance la cérémonie que tu décris, réutilise
le juge + `rules/` qui existent déjà, et te laisse la main sur la liste. Pas besoin de toucher
au gros ADR-030 pour ça.

*Premier symptôme candidat, mi-clin d'œil : « nos ADR sont illisibles » → règle mesurable
« un ADR tient en 1 page / a un résumé en 3 lignes ». La cérémonie ferait ses preuves sur son
propre outillage.*
