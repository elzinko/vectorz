---
type: retro
date: 2026-10-13
theme: "Run autonome ezk-product-build v0.11 — la qualité tient (flux local)"
scope: "le run du 2026-10-13 (flux local github:false, worktree) : v0.11 livrée 7/7 + taguée, 2 fiches reportées hors version"
participants: [architecture, qualite, produit, juge, po]
actions:
  - proposition: "ship/close committe les recals de liens hors features/ : sinon le principal reste dirty après un ship et le close suivant diffère son compte rendu (vécu 2×)"
    kind: feature
    by: [architecture, qualite]
    status: ✅
    decision: "Nouvelle fiche backlog 20261013013553044 (ship élargit son git add aux recals hors features/, ou close tolère ce dirty limité)"
    date: 2026-10-13
  - proposition: "Le grooming applique la règle de taille : découper une fiche de plus de 2 surfaces avant ready (la fiche ezk release en touchait 8 ; les fiches 5/8 ont dû être sorties en cours de run faute de cadrage)"
    kind: feature
    by: [produit, architecture]
    status: ✅
    decision: "Nouvelle fiche backlog 20261013013553179 (ezk dor check / gate ready signale une fiche trop grosse, propose un découpage)"
    date: 2026-10-13
  - proposition: "ezk run report doit accepter une livraison locale (local <sha>) : il exige encore un #PR pour une fiche mergée, alors qu'une fiche shippée (20261010235330118) était censée le régler — livré ≠ tourne"
    kind: feature
    by: [qualite, architecture]
    status: ✅
    decision: "Nouvelle fiche backlog 20261013014039389 (étendre PR_FORM à local (<sha>), ne pas appeler GitHub pour une réf locale) ; à réconcilier avec 20261010235330118 shippée mais absente du code"
    date: 2026-10-13
---

# Rétro — run autonome v0.11 « La qualité tient » (2026-10-13)

**En clair.** Un run `ezk-product-build` autonome a construit **7 fiches sur 7** de la version
v0.11, en local, puis l'a taguée. Deux fiches ont été **sorties de la version** faute d'être
faisables proprement en passe frugale. Trois frictions d'outillage/process sont ressorties, chacune
donnant une fiche neuve (ci-dessus).

## Ce qui s'est passé

- v0.11 livrée 7/7 (deps vitest 4, `ezk release`, commande `gate`, relecteur-prouve-critères, bug
  `regen --root`, revue rejoue les scripts bash, `ezk adr new`), puis **taguée en local** `v0.11.0`
  après un `ezk release v0.11.0` GO (gate dogfoodée).
- Démarrage retardé : la gate de `main` était **rouge** au lancement (collision ADR-039 ↔ 0039 +
  3 liens cassés d'une session pair). Corrigé en coordination (ADR renuméroté 074), pas seul.

## Ce qui a bien tenu

- **Garde-fou de version-scope (ADR-0070)** : le tirage est resté dans v0.11 ; v0.12→v0.17 écartées
  à chaque intake. Le run s'est arrêté net à la borne, et n'a repris vers v0.12 que sur go PO explicite.
- **`ezk release` dogfoodé** : la gate de version livrée ce run a justement bloqué un tag de v0.11
  incohérent (PLAN.md désalignée) jusqu'à correction — exactement son rôle.
