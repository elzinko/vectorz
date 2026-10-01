---
id: "20260904091853948"
title: "ezk-archive plus léger et plus juste (voie rapide, bon compte, survit au cloud)"
type: refactor
priority: P1
product: mega-city
version: V0.4
epic:
labels: [session]
status: shipped
pr: "#311"
created: 2026-09-04
---

# ezk-archive — recadrer en capacité + alléger

## En clair

`ezk-archive` clôt une session sans rien perdre. Il se déroule en entier même quand il n'y a rien à sauver : environ 78 000 jetons pour une session vide. Quand il délègue, il prend le modèle le plus cher pour un travail surtout mécanique.

Cette fiche ajoute une voie rapide : « rien à archiver » en une ligne, sans note ni sous-agent. Elle met un modèle léger par défaut. Elle corrige trois défauts de justesse : le compte du portier, les fiches travaillées, la passation en session jetable. Elle ajoute un inventaire de ménage (worktrees, branches), que le PO valide avant toute suppression.

> Regroomée le 2026-10-01 sur le reste réel. Les critères des quatre fiches absorbées sont intégrés ci-dessous.

## Contexte / Problème

Chaque point a son symptôme daté.

- **2026-09-04.** Une session minuscule (une fiche-idée, un push) a lancé la clôture complète. Le coût n'avait aucun rapport avec le travail. Un panel adverse a conclu : `ezk-archive` est une capacité de continuité, pas une cérémonie agile.
- **Modèle.** L'agent est épinglé sur `claude-opus-4-8`. Un seul pas demande du jugement : une branche réelle est-elle un brouillon jetable ou du travail à récupérer ? Le portier est un script. La note est un gabarit.
- **2026-09-21.** Le portier annonce `branch_absorbed=26` et n'en liste que 16. Le plafond `MAX_FACTS` coupe la liste, pas le compteur.
- **2026-08-30** (finding Codex, PR #199). Une session qui travaille une fiche sans la livrer clôt en `--shipped none`. L'agent ne reçoit aucun id et ne peut pas poser l'en-tête `fiches:`.
- **2026-08-09** (gmail-cleanerz). La note de passation vit dans `.claude/handoff.md`, ignoré par git. Une session cloud est jetable : la note ne survit pas.
- **2026-10-01.** Ce run a laissé une vingtaine de worktrees d'agents dans `.claude/worktrees/` (26 au relevé, principal compris), la plupart en tête détachée. Le ménage se fait à la main, session après session.

## Déjà livré (ne pas refaire)

- [x] [ADR-0022](../../products/mega-city/docs/adr/0022-ezk-methode-trois-bandes-naming.md) range déjà `ezk-archive` en capacité, et le SKILL le redit (« Bande (ADR-0022) »). Il reste l'addendum et le vocabulaire « rituel ».
- [x] Le portier est un script (fiche 0088) et la clôture propre se traite en direct.
- [x] Le portier classe déjà les branches absorbées (`safe_delete=1`, fiche 0076). Personne ne les propose en clair ni ne les range.

## Proposition (POC)

1. **Voie rapide.** Le portier ajoute une ligne `FASTPATH: EMPTY` quand rien n'est à sauver : verdict propre, `--shipped none`, `--worked none`, pas de `SPRINT.md` avec du contenu. Le skill demande alors une seule chose à la session : a-t-elle un fait durable à transmettre ? Non : une ligne « Rien à archiver », aucune écriture, aucun sous-agent.
2. **Modèle.** L'agent passe sur `sonnet` par défaut. Le skill délègue avec `claude-opus-4-8` seulement quand le bloc du portier contient une branche réelle à juger.
3. **Compte juste.** Quand le plafond coupe une liste, le compteur le dit : `branch_absorbed=16/26`. Sous le plafond, le compte égale la liste.
4. **Fiches travaillées.** Le portier reçoit `--worked <ids|none>` et le recopie sur sa ligne `P3_BACKLOG`. L'agent pose l'en-tête `fiches:` d'après cette ligne, pas d'après `--shipped`.
5. **Passation durable.** `handoff.sh` n'ignore plus `.claude/` en entier, seulement ses deux fichiers. Le portier ajoute `durable=0` sur une machine jetable (`CLAUDE_CODE_REMOTE` ou `EZK_EPHEMERAL`). Dans ce cas, `run` écrit aussi la note dans `docs/sessions/`, et `carry` la relit si le fichier local manque. Le skill propose le commit, il ne pousse jamais. Choix des options de la fiche absorbée : B (détection, bascule) plus A (copie versionnée distincte de la note perso). Décision notée dans l'[ADR-0021](../../products/mega-city/docs/adr/0021-cloture-portier-deterministe-ranger-rediger-juger.md).
6. **Ménage.** `check.sh --cleanup` liste, sans rien supprimer, les worktrees sûrs à retirer et les branches absorbées, avec la commande exacte de chacun. Un worktree est sûr s'il est propre, sans verrou, différent du courant, inactif depuis plus de 24 h, et si sa tête est déjà dans la base. Le skill montre la liste au PO. La suppression reste un geste validé.
7. **Recadrage.** Le skill et l'agent disent « capacité » et « clôture », plus « rituel » ni « cérémonie ». La description de l'agent dit la vraie logique : propre, traité en direct ; sale, délégué. L'ADR-0022 reçoit un addendum d'une ligne.

## Critères d'acceptation (reste réel)

- [ ] Sur un dépôt propre et poussé, `check.sh --gate --shipped none --worked none` rend `FASTPATH: EMPTY`. Le skill répond en une ligne, sans écrire, sans sous-agent.
- [ ] Chaque obstacle rend `FASTPATH: NO reason=…` : arbre sale, branche réelle, PR ouverte, fiche livrée ou travaillée, déclaration absente, `SPRINT.md` non vide. Une session sale déroule toujours la clôture complète.
- [ ] L'agent a `model: sonnet`. Le skill nomme `claude-opus-4-8` pour le seul pas de jugement des branches réelles. `catalog.test.ts` et la politique de modèles disent la même chose.
- [ ] Sous le plafond, les lignes listées égalent le compte. Au-dessus, le compteur porte `X/Y`. Un test couvre les deux cas.
- [ ] Une session qui travaille la fiche X sans la livrer produit un récit portant `fiches: X`. Une session sans fiche n'a pas d'en-tête et aucun id n'est inventé.
- [ ] `handoff.sh` n'ajoute plus `.claude/` en entier à `.gitignore`. Sur un hôte jetable, la note survit à un nouveau clone, et le mode local garde son anneau ignoré.
- [ ] `check.sh --cleanup` liste uniquement les worktrees et branches sûrs, ne modifie rien, et ignore le worktree courant, les worktrees verrouillés, sales ou récents.
- [ ] L'ADR-0022 porte l'addendum « capacité ». `grep -riE "rituel|cérémonie"` ne trouve plus ces mots comme étape de la méthode dans le skill ni l'agent.
- [ ] Gate locale verte.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
bash products/mega-city/skills/ezk-archive/scripts/test-handoff.sh
bash products/mega-city/skills/ezk-archive/scripts/test-cleanup.sh
pnpm --dir products/mega-city exec vitest run src/__tests__/catalog.test.ts
```

## Suite (hors POC)

- Suppression automatique du ménage. Elle demande un test fiable de « session vivante » (battement de la supervision). Aujourd'hui seuls l'arbre propre, le verrou et l'inactivité protègent.
- Livrer d'office les fiches mergées restées `ready` : c'est la fiche `reconcile`, non refaite ici.
- Recouvrement handoff, `SPRINT.md` et récit de session : question de fond différée.

## Notes

- Priorité P1. Direction validée par le PO le 2026-09-04.
- Le handoff reste la seule brique à vraie valeur. On allège l'enveloppe, pas lui.

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend désormais le périmètre de :

- [`20260830225021794`](20260830225021794_ezk-archive-fiches-travaillees-prompt-delegue.md) — ezk-archive — passer les fiches TRAVAILLÉES (pas seulement livrées) au prompt délégué  
  _Pourquoi_ : Même composant : ezk-archive.
- [`20260923220631498`](20260923220631498_portier-archive-compte-egale-enumeration.md) — Portier ezk-archive — le compte annoncé doit égaler l'énumération (ou dire « X/Y »)  
  _Pourquoi_ : Même composant : ezk-archive.
- [`0189`](0189-handoff-durable-session-ephemere.md) — ezk-archive — le handoff doit survivre aux sessions éphémères (cloud/conteneur jetable)  
  _Pourquoi_ : Même composant : ezk-archive.
- [`20260902224043892`](20260902224043892_ezk-nettoyage-fin-session-worktrees-branches.md) — Nettoyage de fin de session — worktrees, branches, ship, reconcile : automatiser le ménage manuel répété  
  _Pourquoi_ : La clôture de session doit faire ce ménage elle-même.

Critères intégrés au grooming du 2026-10-01.
