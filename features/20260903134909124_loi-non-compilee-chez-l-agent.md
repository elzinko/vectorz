---
id: "20260903134909124"
title: La loi n'est compilée nulle part chez l'agent — le déploiement global ne porte que l'équipe, et aucun projet n'est lié (0 règle déployée sur le poste)
type: bug
priority: P1 # provisoire — trou de méthode constaté le 2026-09-03 ; rang à confirmer par le PO
product: mega-city
version:
epic:
status: todo
ready:
pr:
evidence: none # méthode, aucun écran
created: 2026-09-03
---

# 20260903134909124 — La loi n'arrive pas chez l'agent

**En clair.** La méthode range ses règles dans un catalogue, les groupe en bundles et les lie
à des profils. Mais sur le poste, rien ne compile ces règles pour les agents : le déploiement
global n'écrit que les skills et les agents, et la compilation par projet n'a jamais été
lancée sur vectorz. Une règle « MUST » n'est donc vraie que si un texte de skill ou d'agent la
répète à la main.

**Si tu arrives frais.** « LA LOI » = les règles du catalogue mega-city (`rules/`), les
bundles qui les groupent, les profils qui disent quel poste installe quoi. `lawgiver
bind-global` = déploiement dans `~/.claude` (skills + agents). `lawgiver bind <profil>
<projet>` = déploiement dans un projet, qui compile les règles dans
`<projet>/.iamthelaw/ENTRY.md`.

## Contexte / Problème

Constaté le 2026-09-03, pendant la livraison de [[20260902224608715]] (règle
`pr-before-after-media` ajoutée au bundle `base`, ADR-0045) :

- Le cap global (`products/mega-city/src/caps/claude-code-global.ts`) le dit lui-même :
  « Pas de hooks, pas de CLAUDE.md, pas de loi compilée : le global ne porte que l'équipe
  (skills + agents). » C'est un choix de conception (ADR-0006, fiche 0017), pas un oubli.
- Le cap projet (`claude-code.ts`) compile bien les règles dans `.iamthelaw/ENTRY.md` et pose
  un pointeur dans `CLAUDE.md`. Mais vectorz n'a pas de dossier `.iamthelaw/` : aucun
  `lawgiver bind` n'a été lancé sur le dépôt de la méthode elle-même. Résultat : 0 règle
  compilée sur le poste.
- Ce qui rend la règle avant/après effective aujourd'hui, c'est du texte : la procédure à
  l'étape 8 d'ezk-sprint et la lentille dans le prompt d'ezk-reviewer, ajoutées à la main
  pendant le sprint. Les autres règles à `enforcements: agent-check` (14 au 2026-09-03) n'ont
  pas eu ce traitement ; leur agent nommé ne les porte pas forcément dans son prompt (mesure à
  faire, critère ci-dessous).
- Symptôme côté PO : la fiche livrée annonçait « la règle figure dans la LOI déployée
  (`~/.claude/ENTRY.md` après `lawgiver bind-global`) ». C'était faux : ce fichier n'existe
  pas et cette commande ne compile rien. Corrigé dans la fiche le 2026-09-03.

Analogie : le code civil est imprimé et rangé à la bibliothèque, mais aucun tribunal n'en a
reçu de copie. Seuls les articles recopiés à la main dans les consignes des juges s'appliquent.

**Valeur.** Que « règle MUST » veuille dire quelque chose : ajoutée au catalogue, une règle
doit arriver chez l'agent par un chemin mécanique, mesurable, sans recopie manuelle.

## Proposition

À trancher à l'étape Archi (`ezk-architect`, ADR court). Trois voies, non exclusives :

1. **Lier vectorz comme projet** : `lawgiver bind base . claude-code` sur le dépôt de la
   méthode → `.iamthelaw/ENTRY.md` + pointeur dans `CLAUDE.md`. Question ouverte : commiter le
   fichier compilé (dérive possible) ou le générer (hook, `postinstall`) et l'ignorer.
2. **Faire porter la loi par le global** : le cap global compile aussi les règles dans un
   fichier lu par tous les projets (par exemple `~/.claude/rules/…`, ou un bloc managé de
   `~/.claude/CLAUDE.md`). Change la doctrine « le global ne porte que l'équipe ».
3. **Assumer que la loi vit dans les textes** : une règle n'est effective que si son
   `enforcements` pointe un agent dont le prompt la cite, ou un script qui la vérifie ; un test
   mécanique le garantit (pour chaque règle `agent-check`, le prompt de l'agent nommé mentionne
   l'id de la règle). C'est la doctrine « règle sans outil ni contrôle = panneau sans casques »,
   rendue vérifiable.

Défaut proposé : 3 tout de suite (le test dit la vérité sur les 14 règles), puis 1 ou 2 selon
l'ADR. Le CLI `ezk law status` ([[20260903134906920]]) affichera l'état déployé vs catalogue.

## Critères d'acceptation

- [ ] Une mesure datée dit, pour chaque règle à `enforcements: agent-check`, si le prompt de
      l'agent nommé la cite (id ou titre) ; résultat consigné dans la fiche.
- [ ] Un test mécanique échoue quand une règle `agent-check` n'est citée par aucun texte de
      l'agent nommé, ni vérifiée par un script d'`enforcements: hook`.
- [ ] La voie de compilation retenue (1 ou 2) est actée par un ADR court, et au moins un poste
      ou un projet reçoit la loi compilée de façon reproductible (`ezk law status` ou un
      équivalent le montre).
- [ ] La doc de `bind-global` et de `bind` dit clairement ce que chacun écrit et n'écrit pas.
- [ ] Gate locale verte.

## Comment vérifier

```bash
ls -la ~/.claude/skills/ezk-sprint ~/.claude/agents/ezk-reviewer.md   # liens vivants : l'équipe est déployée
ls .iamthelaw 2>&1                                                     # absent aujourd'hui : aucune loi compilée
grep -rl "enforcements" products/mega-city/rules | wc -l               # les règles qui promettent un contrôle
pnpm --filter mega-city test                                           # dont le test « règle citée par son agent », une fois construit
```

## Glossaire

- `cap` — la « capacité » de déploiement vers un hôte (Claude Code projet, Claude Code global,
  Claude Desktop) : elle transforme un profil résolu en fichiers à écrire.
- `enforcements` — dans une règle, la liste de ce qui la fait respecter : un agent qui la
  contrôle, un hook qui la vérifie, ou un simple rappel.
- `.iamthelaw/ENTRY.md` — le fichier où le cap projet compile les règles en texte, lu par les
  agents du projet.

## Notes / décisions

- Origine : question du PO sur `pnpm lawgiver bind-global global --link` le 2026-09-03 ;
  lecture du code des caps ; constat « 0 règle compilée ».
- Lien avec [[20260902224608715]] (livrée) : sa règle est effective par le texte, pas par la
  loi compilée. Lien avec [[20260816151112162]] (lawgiver déploie les slash-commands : même
  moteur, même question « qu'est-ce qui est déployé »). Doctrine « règle au catalogue ≠ règle
  déployée » (mémoire de session du 2026-09-03).
- Priorité P1 provisoire : c'est la promesse centrale de LA LOI qui est en jeu.
