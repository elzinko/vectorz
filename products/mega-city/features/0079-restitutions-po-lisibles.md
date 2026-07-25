---
id: 0079
title: Lisibilité des artefacts humains — graver la règle (élargie des restitutions PO à tout artefact lu par un humain)
type: feature
priority: P1
epic:
depends: []
labels: [method]
status: todo
ready:
pr:
created: 2026-07-18
---

# 0079 — Restitutions PO lisibles, gravées dans la méthode

## Contexte / Problème

Rétro du 2026-07-18 (capture `docs/captures/2026-07-18-retro-cinq-sprints.md`, §6) : la
restitution de la cérémonie au PO était **illisible pour lui** — codes internes (« R1 »,
« DoR », « MUST »), sigles, densité — alors même que la rétro portait sur la clarté des
docs. Le PO a dû demander une réécriture.

La leçon a été consignée… **dans la mémoire de l'agent** (`~/.claude/projects/...`), qui
est **personnelle et hors méthode** : un autre agent, une autre machine, un autre
opérateur ne l'héritent pas. Demande explicite du PO (2026-07-18) : « créer une feature
pour que ce ne soit pas seulement consigné dans la mémoire, mais gravé dans les
skills / agents ».

## Valeur

Tout artefact lu par un humain (description de PR, fiche backlog, capture, compte rendu de
rétro, checkpoint de product-builder, résumé de clôture de sprint) est **compréhensible du
premier coup** — quel que soit l'agent qui le produit. La règle survit aux sessions, aux
machines et aux modèles.

## Proposition

Graver la consigne de restitution dans les artefacts de méthode qui la produisent :

1. **Une règle de communication** `rules/documentation-guidelines/human-facing-lisibility.md`
   (niveau MUST, contrôlée par `ezk-reviewer` comme `pr-before-after-media`), **élargie des
   seules restitutions PO à TOUT artefact lu par un humain** (description de PR, fiche,
   capture, restitution, checkpoint) :
   - ouvre par un bloc « En clair » : l'essentiel en ≤3 phrases, AVANT le détail ;
   - trame : symptôme vécu → proposition en mots simples → effet concret ;
   - codes internes et jargon inventé (R1, DoR, « verrou », « borne anti-veto »…) interdits
     hors annexe/glossaire — jamais porteurs du sens dans l'ouverture ;
   - on écrit À l'humain visé, pas entre agents ; carte courte plutôt que dossier exhaustif.
   Activation composable : ajouter la règle au `bundles/documentation-guidelines.yml`.
2. **Les skills qui parlent au PO** intègrent la consigne à leur étape de restitution :
   `ezk-retro` (temps 5, rangement), `ezk-product-builder` (checkpoints
   suggestions-à-choix), `ezk-sprint` (résumé de clôture ⛳).
3. S'articule avec la fiche 0080 (compte rendu markdown standard d'ezk-retro) — 0079
   porte la **voix**, 0080 porte le **support**.

## Critères d'acceptation

- [ ] La règle existe dans `rules/` (symptôme + critère de retrait mesurable inclus).
- [ ] Les 3 skills cités portent la consigne à leur étape de restitution (diff visible).
- [ ] Test de lisibilité : la restitution type ne contient aucun code interne non défini
      (vérifiable en revue sur les 3 prochaines restitutions réelles).
- [ ] La note de mémoire d'agent est marquée comme doublée par la méthode (la méthode
      devient la source de vérité).

## Notes

- **Priorité P1** (montée de P2 par le PO le 2026-07-25 — dérive activement ressentie).
- **Portée élargie** le 2026-07-25 : des seules restitutions PO à tout artefact lu par un
  humain (PR, fiches, captures) — cf. commentaire du PR #37 (« borne anti-veto », « verrous »)
  qui a rendu la dérive tangible.
- Origine : rétro 2026-07-18, demande directe du PO au rangement.
- Mesure de succès (retirabilité) : 0 réclamation « pas compris » du PO sur une
  restitution pendant 5 sprints consécutifs.
