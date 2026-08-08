---
id: 0183
title: Pack de review markdown-first — artefact de restitution dans le code (SoT) ; GitHub PR = un rendu parmi d'autres
type: feature
priority: P1
product: mega-city
status: idea
ready:
pr:
created: 2026-08-08
---

# 0183 — Pack de review markdown-first

## Contexte / Problème

Quand la méthode tourne seule, la restitution de ce qu'elle a **livré** se dilue dans
les descriptions de PR GitHub (ou disparaît si on ne pousse pas de PR). Or :

1. une fiche de review par feature branch est **inévitable** pour la méthode (humain ou
   autre agent doit pouvoir revoir sans contexte) ;
2. GitHub n'est qu'**une** option de restitution parmi d'autres (GitLab, fichier seul,
   webapp de reporting) ;
3. si l'artefact vit **dans le code**, on gagne traçabilité, portabilité VCS, et la
   possibilité de *générer* un body de PR **sans** créer de PR.

Distinct du **Moniteur** (monitoring live d'un run — vivacité, gates, silence). Ici =
**reporting post-hoc** de la méthode (« qu'a-t-elle livré / testé / laissé à tester »).

## Proposition

**Source de vérité** = un *pack de review* markdown versionné dans la branche feature :

```
features/reviews/<id>-slug/
  REVIEW.md
  assets/            # screenshots avant/après, diffs, gif démo
```

Contrat proposé `method-review@0.1` (à graver en ADR au build — panel adverse avant
gravure, comme ADR-030/031/033) :

**Front-matter** : `schema`, `fiche`, `branch`, `product`, `method` `{name, version}`,
`status` (`ready-for-review` | `changes-requested` | `approved`), `created`,
`run_id?`, `pr?` (projection, **jamais** SoT).

**Sections obligatoires** (agrègent **par référence**, jamais par copie) :

| Section | Contenu | Compose |
|---|---|---|
| Résumé | ce qui a été fait / pourquoi | méthode |
| Rendus | liens `assets/*`, URL preview, commande démo | ezk-preview |
| Matrice de validation | CI / tests / E2E / before-after / preview / N.A. | `docs/PR_VALIDATION.md` |
| À tester | checklist rejouable + signaux pass/fail | `features/checks/` (0178) |
| Qualité | métriques **lues** (jamais écrites ici) | `.quality/` (0052/0058) |
| Provisioning / preview | commandes littérales local + mode démo | ezk-preview / testbed |
| Trouvailles | bug / trou → `ezk-backlog add` proposé | 0169 |

**Cœur hexagonal agnostique** : ports `ReviewSource` / `ReviewEmitter`. GitHub,
GitLab, markdown-seul, webapp = **émetteurs opt-in**, zéro couplage VCS dans le cœur
(doctrine ADR-0016/0017 étendue à l'artefact de review ; même posture push-only que
0171/0172).

**MVP** : contrat `REVIEW.md` + émetteur markdown-only (lisible en diff) + au moins
un 2ᵉ rendu (commentaire GitHub **ou** webapp 0184). Reclasser **0058** comme
adaptateur du pack (pas SoT).

**Ne pas fusionner** avec `features/checks/` (0178) : checks = recette de test ;
review = manifeste agrégateur (SRP). Ne pas rouvrir 0093 (BacklogStore hexagonal).

## Critères d'acceptation

- [ ] Contrat du pack documenté (`method-review@0.1` : chemins + FM + sections),
      référencé depuis ezk-sprint / ezk-pr-pilot / `docs/PR_VALIDATION.md`
- [ ] Un sprint réel produit un `features/reviews/<id>/REVIEW.md` committé sur la
      branche feature (dogfood possible sur cobaye 0041, sans attendre 0038)
- [ ] Le pack porte : livré / matrice validation / rendus / à-tester (lien 0178) /
      provisioning — qualité lue depuis `.quality/` si présent
- [ ] Agnosticisme prouvé par **≥2 rendus** : markdown seul (diff) **+** un 2ᵉ
      (commentaire GitHub **ou** webapp 0184)
- [ ] Aucun rendu n'est SoT ; aucun compte externe **obligatoire** pour lire le pack
- [ ] 0058 reclassé « adaptateur » (note dans la fiche + cross-link)
- [ ] Gate locale verte (typecheck/lint/tests)

## Notes / décisions

- **2026-08-08** — Initiative « reporting méthode » (PO). Arbitrage
  ezk-pm + ezk-architect (session 2026-08-08) : **2 fiches sans épic**
  (0183 keystone + 0184 webapp) ; promouvoir en épic au 2ᵉ émetteur VCS (YAGNI).
  Chemin `features/reviews/` (pas fusion avec `features/checks/`).
- **Sous-fiches futures** (notes, pas créées) : (3) boutons provisioning/démo UI,
  (4) émetteur GitHub (absorbe 0058), (5) émetteur GitLab (prouve le 2ᵉ port).
- **Voisins** : 0178 (compose), 0058 (adaptateur), 0102 (preview local, gated),
  0050 (mode démo), 0169 (trouvailles), 0041 (banc dogfood), 0104 shipped
  (`supervision:analyze` = autre rapport, session ≠ review feature).
- **Non-goals** : pas de nouveau monitoring ; webapp n'écrit aucun artefact ;
  pas d'auto-merge ; pas gated sur 0038.
- ADR candidat **ADR-036** (reporting vs monitoring + contrat artefacts) — à
  graver au build de cette fiche, pas avant.
