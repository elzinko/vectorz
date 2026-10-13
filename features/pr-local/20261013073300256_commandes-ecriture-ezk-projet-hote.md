> 🗎 Rendu de la fiche [features/20261013073300256_commandes-ecriture-ezk-projet-hote.md](../done/20261013073300256_commandes-ecriture-ezk-projet-hote.md)

# 20261013073300256 — Les commandes ezk qui écrivent visent le bon dépôt hôte

**En clair.** Depuis un projet hôte, les commandes `ezk` qui **écrivent** (agréger, appliquer, émettre une preuve, rendre un rapport) refusent l'hôte ou visent vectorz. On veut qu'elles acceptent `--root <hôte>`, écrivent dans **ce** dépôt, et ne touchent jamais vectorz en silence — c'est la moitié à **risque d'écriture**.

**Si tu arrives frais.** `--root` dit à une commande quel dépôt viser. Une commande d'écriture qui se trompe de dépôt modifie le mauvais projet — d'où la garde.

## Contexte / Problème

Découpée de la fiche 20261004083344960, **côté écriture** (le risque signalé au run v0.11). Vécu à samplerz :

- `ezk backlog aggregate`, `ezk backlog apply`, `ezk pr emit-local`, `ezk evidence`, `ezk sprint report` refusent un projet hôte (« n'est pas le dépôt de la méthode »), ou visent vectorz.
- `aggregate` a dû être fait à la main côté samplerz, faute d'outil (2026-10-09).
- Effets : 2 scripts Playwright jetables pour les preuves avant/après, un script jetable pour rendre le corps de PR, relancés à chaque PR.

## Critères d'acceptation

- [ ] `ezk backlog aggregate`, `ezk backlog apply`, `ezk pr emit-local`, `ezk evidence`, `ezk sprint report` acceptent `--root <projet hôte>` et écrivent/visent **ce** dépôt.
- [ ] Un refus nomme la racine du **projet hôte**, pas celle de vectorz.
- [ ] **Garde d'écriture** : sans `--root`, une commande d'écriture vise le dépôt du dossier courant, jamais vectorz en silence ; elle affiche le chemin du fichier modifié.
- [ ] Mesure : au prochain sprint samplerz, 0 script jetable pour les preuves/rapports.

## Comment vérifier

```bash
cd <projet-hote>
ezk backlog aggregate --root "$(git rev-parse --show-toplevel)"   # ne refuse plus l'hôte, agrège SES fiches
ezk pr emit-local --root "$(git rev-parse --show-toplevel)" …     # écrit dans l'hôte, affiche le chemin
```

## Notes / décisions

- Découpée de la fiche `20261004083344960` le 2026-10-13 (côté **écriture**). Le côté **lecture** est la fiche sœur [Les commandes ezk de lecture visent le projet hôte](../done/20261013073300242_commandes-lecture-ezk-projet-hote.md). Même version v0.12.0.
- `ezk sprint report` dépend de la supervision ; l'absence de journal sur un hôte relève de la fiche sœur [Le rapport de sprint retrouve sa trace de supervision](../done/20261002230039863_sprint-report-trace-supervision.md) — ici on ne traite que le `--root`.
- Dépendance **samplerz** (projet hôte de validation) — accès constaté le 2026-10-03 (`~/git/samplerz`, `main`). Le build vit dans mega-city, autonome (testable sur un dossier jetable) ; samplerz ne sert qu'à la mesure.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ |
| Revue | ✅ |
| Before/after (UI) | N.A. (terminal) |
