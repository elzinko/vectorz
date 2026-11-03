> 🗎 Rendu de la fiche [features/20261102182259505_scout-lit-et-remplit-le-carnet.md](../20261102182259505_scout-lit-et-remplit-le-carnet.md)

# 20261102182259505 — ezk-scout part du carnet pour choisir quoi tester, et y note ses résultats

**En clair.** Une fois le carnet en place, le scout s'en sert. Il commence par demander ce qui n'a
jamais été testé ou a expiré, et le teste en premier. Il peut viser une seule branche de l'arbre. À
la fin de sa passe, il note chaque résultat au carnet, preuve comprise.

**Si tu arrives frais.** `ezk-scout` teste une app qui tourne, dans un état isolé, et rend un rapport
de brouillons de fiches. Le carnet note ce qui a été testé et quand la preuve expire : c'est la fiche
[20261102182259416](../done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md).

## Contexte / Problème

Aujourd'hui, chaque passe du scout repart de zéro et choisit ses sondes au jugé. Le scout est une
`SKILL.md` en prose : rien ne garantit qu'il note ses résultats quelque part. Le panel du 2026-11-02
a aussi relevé deux pièges. Une preuve doit porter le SHA réellement testé. Et le carnet doit rester
hors du dépôt, sinon la garde find-only du scout tombe
(`products/mega-city/skills/ezk-scout/scripts/find-only-guard.sh:57`).

## Proposition

```
début de passe          pendant                     fin de passe
  status --todo  ──▶  sonde d'abord ces nœuds  ──▶  record, une ligne par nœud sondé
  (ou --zone X)       (puis le reste, à la borne)    + bloc « Couverture » dans le rapport
```

- **Au départ**, la passe lit `ezk carto status --todo --json` et sonde ces nœuds en premier.
- **`--zone <nœud>`** limite la passe à une branche de l'arbre.
- **Le SHA testé** est celui que la photo find-only prend au début de la passe (étape 1 du scout).
- **À la fin** (étape 5), chaque nœud sondé produit un `ezk carto record`, valide ou en échec, avec
  sa preuve.
- **Le rapport** gagne un bloc « Couverture » : « X sur Y testés », avant et après la passe.
  `check-report.sh` le contrôle.
- **Sans carnet**, le scout tourne comme avant.

## Critères d'acceptation

- [x] Sans `--zone`, une passe commence par la liste « à tester » du carnet, et la sonde en premier.
- [x] Avec `--zone <nœud>`, la passe ne sonde que cette branche de l'arbre.
- [x] À la fin de la passe, chaque nœud sondé a une ligne au carnet, avec le SHA du début de passe et
      sa preuve.
- [x] Le rapport porte un bloc « Couverture », avec « X sur Y testés » avant et après la passe.
      `check-report.sh` refuse un rapport sans ce bloc quand le carnet est actif.
- [x] Carnet absent ou désactivé : la passe tourne comme avant, sans erreur. La garde find-only reste
      OK dans les deux cas.

## Comment vérifier

1. Sur l'app jouet du scout, avec un carnet déclaré : lancer une passe, puis lire
   `ezk carto status`. Les nœuds sondés ont une ligne.
2. Relancer avec `--zone <nœud>` : seule cette branche reçoit une ligne.
3. Les tests des scripts du scout passent :

```bash
bash products/mega-city/skills/ezk-scout/scripts/test-check-report.sh
bash products/mega-city/skills/ezk-scout/scripts/test-find-only-guard.sh
bash products/mega-city/skills/ezk-scout/scripts/test-demo-app.sh
```

## Notes / décisions

- **Née du découpage** de
  [Carte de l'app et suivi de ce qui est testé](../done/20261014113049954_cache-cartographie-app.md), le
  2026-11-02.
- **Dépend** du carnet, [20261102182259416](../done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md).
- **Estimation du panel** : environ 120 000 jetons.
- **Groom du 2026-11-03 (run autonome)** : sources vérifiées. `ezk carto status --todo --json` et
  `ezk carto record <nœud> --axis --verdict --proof [--sha]` existent ; le journal vit dans
  `<git-common-dir>/ezk/carto/`, hors du dossier de travail, donc la garde find-only du scout tient.
  Il manque le filtre de branche : `--zone <nœud>` s'ajoute à `ezk carto status` (le nœud et sa
  descendance), testé comme une commande. La part déterministe du scout passe ainsi par des commandes
  testables ; `SKILL.md` dit quand les appeler (étapes 1 et 5), et `check-report.sh` exige le bloc
  « Couverture » quand le rapport déclare un carnet actif.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO, taille limite). Coupe si le
  build déborde : `--zone` et le bloc « Couverture » ; le départ depuis `--todo` et l'écriture au
  carnet restent dans le noyau.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2261 tests 198 suites |
| Tests ciblés | ✅ test-ezk-carto.sh et test-check-report.sh |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — commande et skill sans écran |
