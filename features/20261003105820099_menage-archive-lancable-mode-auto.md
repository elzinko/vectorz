---
id: "20261003105820099"
title: "Le ménage d'ezk-archive se lance en mode auto"
type: bug
priority: P3
product: mega-city
milestone:
version: v0.14.0
labels: [archive, worktree]
status: ready
pr:
evidence: none # script de ménage, pas d'écran
created: 2026-10-03
---

# 20261003105820099 — Le ménage d'ezk-archive se lance en mode auto

**En clair.** `check.sh --cleanup` ne supprime rien : il liste ce qu'on peut retirer, avec la
commande de chacun. Pourtant, le mode auto de Claude Code l'a bloqué comme « git destructif », et le
PO a dû le lancer lui-même. On veut que le pilote puisse le lancer, ou au moins qu'il sache tout de
suite le confier au PO.

**Si tu arrives frais.** Le *mode auto* de Claude Code filtre les commandes jugées risquées avant de
les lancer. Le *ménage* est le mode `--cleanup` du portier d'`ezk-archive`
(`skills/ezk-archive/scripts/check.sh`).

## Contexte / Problème

- muti, 2026-10-02 : `bash ~/.claude/skills/ezk-archive/scripts/check.sh --cleanup` refusé par le
  mode auto (« Git Destructive »). Le PO l'a lancé dans son terminal le 2026-10-03 : la sortie était
  bien en lecture seule (« rien n'a été supprimé »).
- On ne sait pas ce qui déclenche le blocage : le nom de l'option `--cleanup` ? les commandes
  `git worktree remove` et `git branch -d` que le script affiche ?

## Proposition

1. **Trouver le déclencheur**, dans une session en mode auto : le même script sous un autre nom
   d'option, puis avec les commandes de suppression affichées à part.
2. **Rendre le listage lançable** selon ce qu'on trouve : une option au nom de lecture (par exemple
   `--inventory`), ou des commandes de suppression écrites dans un fichier plutôt qu'affichées.
3. **D'ici là, une ligne d'aide** dans le `SKILL.md` d'`ezk-archive` : en mode auto, la commande peut
   être bloquée ; le pilote la confie alors à l'utilisateur. Faite dans la PR de rangement de la
   rétro.

## Critères d'acceptation

- [ ] **Spike** : le déclencheur du blocage est identifié (le nom de l'option `--cleanup`, ou les
      commandes `git worktree remove` / `git branch -d` que le script affiche), et consigné dans la fiche.
- [ ] Selon le déclencheur, le listage du ménage se lance sans blocage en mode auto : option au nom de
      lecture (ex. `--inventory`), ou commandes de suppression écrites dans un fichier au lieu d'être affichées.
- [ ] La sortie reste en lecture seule : `test-cleanup.sh` reste vert.
- [x] Le `SKILL.md` d'`ezk-archive` dit quoi faire si le mode auto bloque le ménage.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-archive/scripts/test-cleanup.sh
```

Puis, dans une session Claude Code en mode auto : demander le ménage et constater qu'il se lance.

## Notes / décisions

- 2026-10-03 : née de la rétro muti `docs/captures/2026-10-03-retro-cloture-et-menage.md`, décision
  PO ✅. Aucune règle de permission : le PO a déjà refusé ce type de règle.
- P3 / V0.6 proposés par le pilote (gêne, sans perte) ; à confirmer au planning.
- **Grooming 2026-10-13** : cadrée en **spike-correctif**. Le critère 1 identifie le déclencheur ; le
  critère 2 applique le correctif qui en découle. « Done » = déclencheur trouvé + listage lançable en auto.
- **Spike + correctif (2026-10-14, run v0.14).**
  - *Spike.* Le blocage n'a **pas pu être reproduit** dans la session de build : elle a des permissions
    Bash larges et son état n'avait rien à ranger, donc `check.sh --cleanup` y passe sans frein. Deux
    déclencheurs plausibles ressortent de la lecture du script : (a) le **nom `--cleanup`** (le mot
    « cleanup » lu comme destructif) ; (b) les **tokens git destructifs** que le mode émet dans sa
    sortie — `cmd=git worktree remove …`, `cmd=git branch -D …` — qu'un classifieur lisant le script
    prendrait pour des gestes. Le fait que le mode soit **read-only** (il n'exécute que
    `git worktree prune --dry-run` et des lectures) est invisible à un classifieur qui ne voit que des
    motifs.
  - *Correctif retenu* : option (a) de la fiche — un **nom de lecture `--inventory`**, alias de
    `--cleanup` (conservé). Le mode est intrinsèquement un inventaire : le renommer dit la vérité et
    retire le signal « cleanup ». Vérifiable : `test-cleanup.sh` (K9) prouve `--inventory` ≡ `--cleanup`,
    read-only. Le `SKILL.md` d'ezk-archive pointe désormais `--inventory`.
  - *Résiduel honnête* : si une session en mode auto **strict** bloque encore le listage (déclencheur
    (b), un classifieur qui lit les tokens du script), le suivi est d'écrire les commandes proposées
    dans un **fichier** plutôt que de les afficher (option (b) de la fiche). Non fait ici faute de pouvoir
    reproduire le blocage ; le critère 4 (le pilote confie au PO en cas de blocage) reste le filet.
- Voisines : portier d'archive et squash [[20261002155911250]] ; copies de réserve
  [[20261003011750521]].
