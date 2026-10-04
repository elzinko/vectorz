---
id: "20261004181110120"
title: "ezk ne croit plus un INIT_CWD laissé par un pnpm parent : le test de « ezk retro note » n'écrit plus dans le vrai dépôt"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [retro, tests, cli]
status: shipped
pr: "local (f62e0128)"
evidence: none # script de test, pas d'écran
created: 2026-10-04
---

# 20261004181110120 — ezk ne croit plus un INIT_CWD laissé par un pnpm parent

**En clair.** Chaque gate locale (`pnpm test:scripts`) dépose une note parasite « Depuis la commande
ezk » dans le vrai carnet de rétro de vectorz. Le test de `ezk retro note` se place dans un dépôt
jetable, mais `ezk` croit une variable que `pnpm` a laissée en partant, et écrit dans vectorz. On
apprend à `ezk` à ne croire cette variable que quand `pnpm` vient vraiment de le lancer.

**Si tu arrives frais.** `ezk retro note` dépose une note pour la prochaine rétro, hors de git, dans
`<git-common-dir>/ezk/retro-notes/`. Quand `pnpm` lance un script, il se place dans le dossier du
paquet et note dans `INIT_CWD` le dossier où l'utilisateur avait tapé la commande. `ezk` lit
`INIT_CWD` pour savoir sur quel projet travailler (`products/mega-city/bin/ezk.ts`, vers la ligne 136).

## Contexte / Problème

- **Reproduit le 2026-10-04 à 22 h 29.** Carnet de vectorz avant la gate : 3 notes. Après
  `pnpm --dir products/mega-city test:scripts` (36 suites vertes) : une note de plus,
  `…-depuis-la-commande-ezk.md`. Tout le run de la soirée en a laissé deux par gate, nettoyées à la main.
- **Le mécanisme.** Le cas N5 de `skills/ezk-retro/scripts/test-note.sh` se place dans un dépôt jetable
  et lance `ezk retro note`. Mais il hérite de l'`INIT_CWD` du `pnpm` qui a lancé la gate : le dossier
  de vectorz. `ezk` prend cette variable pour le dossier de l'utilisateur, et vise vectorz. Son contrôle
  ne regardait que le nom du fichier : il passait au vert.
- **Le signal qui distingue les deux cas, vérifié le 2026-10-04.** Quand `pnpm` lance un script, il pose
  aussi `npm_package_json` (le `package.json` du script) et se place dans son dossier : le dossier
  courant est alors celui de ce fichier. Dans la fuite, le test s'est placé ailleurs : le dossier
  courant n'est plus celui de `npm_package_json`, et `INIT_CWD` est périmée.
- **Les usages légitimes, vérifiés le 2026-10-04.** `pnpm ezk …` depuis la racine de vectorz ou un de
  ses sous-dossiers, et `pnpm --dir products/mega-city ezk …`, visent bien le dossier de
  l'utilisateur : dans les deux cas, le dossier courant est celui de `npm_package_json`.
- **Le risque dépasse le carnet.** Tout script lancé sous un `pnpm` parent qui appelle `ezk` depuis
  un autre dossier vise le mauvais dépôt : demain, ce pourrait être `ezk backlog ship`.

## Valeur — ce que coûte de ne rien faire

- Chaque gate pollue le carnet réel ; la rétro suivante lit ces notes comme des frictions.
- Une commande `ezk` qui écrit peut viser le mauvais dépôt depuis n'importe quel script lancé par
  `pnpm`, sans message.

## Proposition

**Option 2, retenue le 2026-10-04** (le PO délègue : « je te fais confiance mais sois-en sûr » ;
preuves ci-dessus). On corrige la cause dans `ezk`, pas seulement le test.

1. **`ezk` ne croit `INIT_CWD` que si `pnpm` vient de le lancer** : le dossier courant est celui de
   `npm_package_json`. Sinon, il prend le dossier courant, et retire la variable périmée de
   l'environnement des scripts qu'il lance.
2. **Le cas N5 vérifie où la note atterrit**, et rejoue la fuite : `INIT_CWD` pointé sur un autre dépôt
   et `npm_package_json` sur mega-city, depuis le dépôt jetable.
3. **La note parasite de vectorz est retirée.**

Option 1 écartée : corriger le seul test laissait la même fuite à tout autre script lancé sous `pnpm`.

## Critères d'acceptation

- [x] Après `pnpm --dir products/mega-city test:scripts`, `note.sh list` lancé dans vectorz rend la même
      liste qu'avant.
- [x] Une fonction pure dit si `INIT_CWD` est à croire : oui quand le dossier courant est celui de
      `npm_package_json` (liens symboliques résolus), non sinon. Testée.
- [x] Lancé avec un `INIT_CWD` périmé, `ezk retro note` écrit dans le dépôt du dossier courant, et les
      scripts lancés par `ezk` ne voient plus cette variable.
- [x] `pnpm ezk config show` depuis la racine de vectorz ou un de ses sous-dossiers, et
      `pnpm --dir products/mega-city ezk config show`, visent toujours le dépôt de l'utilisateur.
- [x] Les notes « depuis-la-commande-ezk » ne sont plus dans `vectorz/.git/ezk/retro-notes/`
      (retirées le 2026-10-04 au soir, pendant la rétro puis pendant ce grooming).

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-retro/scripts/note.sh list
pnpm --dir products/mega-city test:scripts
bash products/mega-city/skills/ezk-retro/scripts/note.sh list   # même liste qu'avant
bash products/mega-city/skills/ezk-retro/scripts/test-note.sh
cd features && pnpm ezk config show                              # « dépôt visé » : vectorz
```

## Notes / décisions

- 2026-10-04 : née de la rétro légère de fin de V0.5 (capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`), proposition 1, retenue par le PO.
- **Groomée le 2026-10-04** (technique « retourner la prémisse ») : le bug n'est pas dans le test mais
  dans la confiance d'`ezk` envers `INIT_CWD`. Fuite reproduite, signal `npm_package_json` vérifié,
  usages légitimes vérifiés. Titre élargi en conséquence ; le nom du fichier reste.
- **Prête le 2026-10-04** : le PO a délégué le choix et le tampon (« je te fais confiance mais
  sois-en sûr »), après preuve. P1 confirmé : elle passe avant la rétro du run cockpit, qui lancera la
  gate (décision PO du même soir).
- Voisine : « les tests qui lisent le vrai dépôt vérifient une invariante »
  (20261003201035080) traite la lecture ; ici, c'est une écriture.
- **Construite le 2026-10-04** : règle pure `userDirectory` (`src/core/ezk-cli.ts`), appliquée par le
  routeur `bin/ezk.ts`, qui retire la variable périmée de l'environnement des scripts. Le cas N6 de
  `test-note.sh` rejoue la fuite : il échoue sans la correction (3 cas sur 4), passe avec. Après la
  gate complète, le carnet de vectorz garde ses 3 notes.
- **Éprouvée sur cop1-cobaye le 2026-10-04** (règle `development/host-project-proof-before-ship`) :
  `ezk config show` lancé depuis le banc vise le banc, avec ou sans `INIT_CWD` périmée pointée sur muti.
- **Revue adverse du 2026-10-04 : GO.** Correctif adopté : une `INIT_CWD` périmée est remplacée par le
  vrai dossier (au lieu d'être retirée), car beaucoup de scripts la relisent eux-mêmes. Limites dites :
  un processus qui hérite d'un `pnpm` parent sans quitter le dossier du paquet est encore cru (un test
  qui lance `ezk` sans se placer dans son dépôt jetable) ; sous yarn 1 ou npm 6, qui ne posent pas
  `npm_package_json`, le dossier du paquet fait foi (même dépôt).
