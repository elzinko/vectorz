---
id: "20261117223348335"
title: "Rattacher les règles du projet aux étapes du process"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [loi, contrat, theme:mission-control]
status: ready
blocked:
pr:
evidence: before-after
created: 2026-11-17
---

# 20261117223348335 — Rattacher les règles du projet aux étapes du process

**En clair.** Quand le PO clique une étape du process, il veut voir les règles qui la gouvernent.
Aujourd'hui, la méthode ne relie aucune règle à une étape : la rubrique « Règles » est vide partout.
La méthode publiera, pour chaque étape, les règles qui s'y appliquent et d'où vient ce lien.

**Si tu arrives frais.** Une *règle* est un fichier du catalogue de la méthode (`rules/`) ou de la
couche d'un projet (`.vectorz/rules/`). Un skill déclare déjà les règles qu'il applique dans son
champ `applies:` ; un agent, dans `interactions:`. `ezk process show --json` publie les étapes de
chaque skill, avec un champ `regles` qui reste vide pour l'instant.

## Contexte / Problème

Le contrat `process-show` le dit lui-même : « Toujours vide en v1 : aucune règle n'est encore
rattachée à une étape » (`products/mega-city/src/core/process-show.ts`). La maquette choisie par le
PO le 17 novembre montre des règles dans le panneau d'une étape, mais ce sont des **exemples**.

Le lien existe déjà à un étage plus haut. Le skill `ezk-sprint` applique sept règles par son champ
`applies:`, mais on ne sait pas laquelle vaut pour « Gate » et laquelle pour « Intégration ». Et
les règles propres au projet ne portent aucun lien vers une étape.

## Proposition

**Groomé le 2026-11-19 (run autonome, avis d'architecte porté par l'orchestrateur).** Les deux
questions ouvertes sont tranchées ainsi :

- **Pas d'héritage par skill.** Le champ `applies:` d'`ezk-sprint` donnerait les mêmes sept règles
  à ses huit étapes. Le panneau en serait noyé et ne dirait rien de propre à l'étape.
- **Un rattachement direct, déclaré dans `method/etapes.yml`.** Chaque étape peut nommer les règles
  du catalogue qui la gouvernent : `regles: [clean-code/no-dead-code]`. Le compilateur refuse une
  règle absente du catalogue, comme il refuse déjà un agent inconnu.
- **Le contrat garde sa forme.** `regles` reste une liste d'ids, documentée « toujours vide en v1 » :
  elle se remplit, sans changer de type. Le contrat reste en version 1. Le niveau et le texte d'une
  règle se lisent déjà ailleurs, par `ezk law show`.
- **L'écran dit « Règles », plus « Règles du projet ».** Ces règles viennent du catalogue de la
  méthode ; les appeler « du projet » serait faux.

Rattachements de départ :

```
backlog · capturer     documentation-guidelines/human-facing-lisibility
backlog · groomer      agent-ops/preuve-mince-question-pas-veto
backlog · prete        development/acceptance-criteria-before-merge, token-economy/fiche-tient-dans-un-sprint
sprint · cadrage       development/story-dans-un-worktree-dedie
sprint · code          clean-code/no-dead-code
sprint · gate          agent-ops/pipe-garde-le-code-de-sortie, testing/sortie-machine-verifiee-par-un-tuyau
sprint · e2e           development/pr-before-after-media
sprint · revue-adverse development/acceptance-criteria-before-merge
sprint · integration   conventional-commits/format, development/one-story-one-commit-local, agent-ops/push-nomme-les-commits-d-autrui
retro · cadrer         token-economy/retro-due-choix-chiffre
retro · rangement-po   documentation-guidelines/readable-deliverable-trio
```

Hors périmètre : les règles de la couche d'un projet (`.vectorz/rules/<id>.md`). vectorz n'en a
aucune aujourd'hui. Les rattacher à une étape depuis leur propre fichier gardera le projet maître de
sa couche ; ce sera une fiche à part, quand un projet en aura besoin.

## Critères d'acceptation

- [ ] Une étape de `method/etapes.yml` peut porter `regles:` ; `ezk process show --json` publie ces
      ids dans le champ `regles` de l'étape, dans l'ordre déclaré. Le contrat reste en version 1.
- [ ] Une règle absente du catalogue, ou citée deux fois sur la même étape, fait échouer
      `ezk process show`, avec un message qui nomme l'étape et la règle. La gate rougit.
- [ ] Les rattachements de départ de la table ci-dessus sont publiés, et chaque règle citée existe.
- [ ] Le panneau d'une étape titre sa rubrique « Règles » et liste les ids ; une étape sans règle
      dit « aucune règle rattachée ».
- [ ] Le schéma et l'exemple du contrat sont régénérés ; la description de `regles` ne dit plus
      « toujours vide ».

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/process-show.test.ts
ezk --root . process show --json | jq '[.skills[] | .etapes[] | {id, regles}]'
pnpm --dir products/mega-city board:contract --write && git diff --stat products/mega-city/contracts/
npx vitest run products/cop1/packages/web/src/board/ProcessMap.test.tsx
```

Puis ouvrir mission control, page Process : un clic sur l'étape « Gate » du sprint montre ses deux
règles dans le panneau.

## Notes / décisions

- Née de la décision PO du 2026-11-17 sur l'écran Process (maquette B + panneau). L'écran est la
  fiche [L'écran Process se lit de gauche à droite](done/20261117223348250_ecran-process-en-ligne-avec-ses-boucles.md),
  qui se livre sans celle-ci.
- Voisines, sans doublon : [`ezk law show` sert chaque objet de la loi](20261114131615350_ezk-law-show-regle-paquet-profil.md)
  publie une règle seule ; [Un seul lecteur de la loi du projet](20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md)
  unifie la lecture des règles du projet. Cette fiche-ci relie une règle à une étape.
- Taille : deux surfaces, la commande publiée et le libellé du panneau. Cinq critères.

Prête le 2026-11-19 : DoR atteinte, concurrence `ezk-pm` GO (run autonome, sans `--stamp-ready`).
