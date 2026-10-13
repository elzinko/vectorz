> 🗎 Rendu de la fiche [features/20261010114132970_reconcilier-worktree-apres-ship-local.md](../done/20261010114132970_reconcilier-worktree-apres-ship-local.md)

# 20261010114132970 — Réconcilier le worktree après un ship local

**En clair.** Quand une session vit dans un worktree et livre sur le `main` du **principal** (là où
`main` est checké-out), le worktree reste **en retard** après la livraison. Les gates y passent alors
au rouge sur des états déjà corrigés sur `main`, et recopier une fiche du worktree vers le principal
écrase ce qu'un script venait d'y écrire. On veut un geste qui remet le worktree à l'état de `main`
après un ship, et qui refuse d'écraser un champ produit par un script.

**Si tu arrives frais.** Un *worktree* est une copie de travail isolée du dépôt, sur sa propre
branche. Le *principal* est le checkout d'origine, le seul où `main` est sorti. Un *ship* range une
fiche livrée (la déplace en `done/`, régénère l'index, barre son entrée du plan).

## Contexte / Problème

- Vécu au sprint « vue process » (2026-10-10) et répété dans le carnet (≥ 6 notes sur worktree↔principal) :
  - Le merge/ship local se fait sur le `main` du principal (`git -C <principal>`, `ezk --root`). Le
    worktree de session reste **en retard** sur `main`.
  - Carnet 2026-10-08 : « tester dans un worktree en retard sur main donne de faux rouges »
    (`test-links` / `check-fiches` rouges sur des états déjà corrigés). Remède actuel manuel et
    risqué : `git reset --hard main`.
  - Carnet 2026-10-08 : « copier un fichier worktree→principal écrase ce qu'un script vient d'y
    écrire » (perte d'un `split_from`, rattrapée par `check-fiches --strict`).
- C'est **structurel** (le modèle worktree a `main` ailleurs), pas un oubli : une règle « pense à
  resynchroniser » ne l'a jamais éteint — d'où une **feature**.
- Issu de la rétro du 2026-10-10 (capture
  [2026-10-10-retro-vue-process-worktree-silences](../../docs/captures/2026-10-10-retro-vue-process-worktree-silences.md)),
  proposition 1, convergence des 3 lentilles.

## Proposition

Un geste `ezk` (ou une extension de `ship-merge --local`) qui, après un ship local :

- avance le worktree de session sur le `main` du principal **quand rien ne lui est propre**
  (`git log main..HEAD` ne contient que des commits déjà absorbés), sinon rend un **verdict explicite**
  « ce worktree est à N commits de `main`, lance X » plutôt qu'un rouge trompeur ;
- pour les écritures backlog depuis un worktree, **opère côté principal** (`git -C <principal>`) au
  lieu de recopier worktree→principal, qui traite le worktree comme source unique et écrase.

## Critères d'acceptation

- [ ] Après un ship local, lancer la gate dans le worktree donne **le même verdict que sur `main`**
      (0 faux rouge imputable à la péremption).
- [ ] Quand le worktree est en retard, un message dit **N commits de retard** et quoi lancer — jamais
      un rouge silencieux présenté comme une régression.
- [ ] Aucun champ écrit par un script (ex. `split_from`, `merged_from`) n'est perdu lors d'un report
      worktree↔principal : un test le prouve.

## Comment vérifier

```bash
# Scénario : ship local d'une fiche depuis un worktree, puis gate dans le worktree.
# Attendu : worktree réaligné sur main OU verdict « N commits de retard », jamais de faux rouge.
pnpm --dir products/mega-city test   # le test de réconciliation / verdict de retard
```

## Notes

Mesure (retrait) : sur les 5 prochains ships locaux, 0 worktree laissé en retard sur `main` et 0
champ écrit par un script perdu lors d'un report. Thème V0.9 « ranger la maison ».


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ |
| Revue | ✅ |
