> 🗎 Rendu de la fiche [features/20261101175006022_sprint-cite-la-regle-du-worktree.md](../20261101175006022_sprint-cite-la-regle-du-worktree.md)

## En clair

La règle « une story se construit dans un worktree dédié » existe, mais aucune session ne lit son
texte. Le skill de sprint cite seulement son nom dans son en-tête. Cette fiche écrit la consigne à
l'endroit où le skill crée la branche de story. Elle dit comment savoir où l'on est, et comment
reprendre la story dans une autre session.

## Contexte

- La rétro du 2026-11-01 a posé la règle
  [Une story se construit dans un worktree dédié](../../products/mega-city/rules/development/story-dans-un-worktree-dedie.md).
- Son texte vit dans le bundle `development`. Seul le profil `cop1-target` déploie ce bundle. La
  session de tous les jours ne charge que le socle.
- Le skill `ezk-sprint` liste l'id de la règle dans son en-tête `applies:`. Son corps n'en dit rien.
  Or l'agent lit le corps, pas l'en-tête.
- Le skill installé est un lien vers le dépôt principal : `~/.claude/skills/ezk-sprint`. Une
  consigne écrite dans son corps arrive donc dans toutes les sessions, depuis n'importe quel
  worktree.
- Le PO, le 2026-11-01 : la consigne doit marcher avec des worktrees et tenir d'une session à
  l'autre, sinon elle ne sert à rien.

## Proposition

À l'étape où le skill crée la branche de story, trois consignes courtes :

1. **Savoir où l'on est.** `git rev-parse --path-format=absolute --git-dir --git-common-dir` donne
   deux chemins. S'ils diffèrent, la session a déjà son worktree : la story s'y construit, sur une
   branche partie de `main`. S'ils sont égaux, c'est le dossier principal partagé : on ouvre un
   worktree dédié depuis sa racine. Le dossier `.claude/` doit être ignoré par git.
2. **Ne rien embarquer d'autrui.** Jamais de `git switch` dans le dossier principal. Avant chaque
   commit, `git status` ne liste que des fichiers de la story.
3. **Reprendre dans une autre session.** La branche garde les commits. Le journal du sprint vit
   dans `<git-common-dir>/ezk/sprints/<branche>.md`. Les deux survivent au worktree. On regarde
   d'abord `git worktree list` : si la branche y est encore ouverte, on travaille dans ce dossier.
   Sinon, on rattache un worktree à la branche existante, sans `-b`. Ce qui n'est pas commité ne vit
   que dans le dossier du worktree : on committe avant de quitter la session.

Un test de contrat garde ces consignes, comme les autres consignes du skill.

## Critères d'acceptation

- [ ] Le corps du skill cite la règle par un lien, à l'étape où la branche de story se crée.
- [ ] Il donne le test « suis-je dans un worktree ? » et le geste pour chacun des deux cas.
- [ ] Il dit comment reprendre la story dans une autre session, et ce qui survit au worktree.
- [ ] Un test de contrat échoue si l'une de ces consignes disparaît.
- [ ] Le texte de la règle n'est pas recopié : le skill la résume et renvoie vers elle.

## Comment vérifier

```bash
grep -n "story-dans-un-worktree-dedie" products/mega-city/skills/ezk-sprint/SKILL.md
pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-sprint-lifecycle-contract.test.ts
```

Signal observable : la première commande trouve la règle dans le corps du skill, plus seulement
dans l'en-tête. La seconde passe.

## Notes

- La règle prévoit son propre retrait : quand l'outillage du sprint ouvrira lui-même le worktree.
  Ce geste outillé est hors de cette fiche.
- Priorité P2 choisie par l'agent : le PO lui a laissé le choix le 2026-11-01.
- La revue adverse a relevé deux trous dans la reprise, corrigés avant fusion. Une branche encore
  ouverte dans un worktree ne se rattache pas à un second (`git worktree add` refuse). Une branche
  créée sans base, dans un worktree recyclé, embarquerait la story précédente.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale (typecheck + 2336 tests + scripts) | ✅ |
| Revue adverse ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — texte de skill et test de contrat sans écran |
