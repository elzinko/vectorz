---
id: "20260918114726706"
title: "Une seule source pour le modèle de fiche (3 copies divergent aujourd'hui)"
type: chore # feature | bug | refactor | chore | epic
priority: P2
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
version: V0.1
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [socle]
status: idea # idea | ready | in-progress | blocked | shipped
pr:
evidence: none # templates markdown, pas d'écran
created: 2026-09-18
---

# 20260918114726706 — Synchroniser les templates de fiche

**En clair.** Le modèle de fiche existe en plusieurs copies. Elles ne disent plus la même chose.
On garde **une seule source** : le gabarit du skill `ezk-backlog`. La copie locale de vectorz en
devient un double exact, surveillé par un test. La copie morte disparaît. Enfin `init` signale une
copie locale en retard et donne la commande qui la remet à niveau.

**Si tu arrives frais.** Une *fiche* est le fichier markdown d'une feature, dans `features/`. Son
*gabarit* est le squelette que `add` recopie pour en créer une. Le skill en porte la **référence**,
et `init` la copie dans chaque projet.

## Contexte / Problème

Quatre endroits portent le squelette d'une fiche. Trois divergent (état au 2026-10-01).

- `products/mega-city/skills/ezk-backlog/templates/feature-template.md` est la **référence**, celle
  que `init` copie. Le corps est à jour. Le front-matter est périmé : il garde `epic:` et `type: epic`,
  retirés par le retrait de l'épic.
- `features/feature-template.md` est le gabarit **local** de vectorz, celui d'où naissent les fiches
  d'ici. Le front-matter est à jour (`milestone:`). Il manque « En clair » et « Glossaire ».
- `products/mega-city/feature-template.md` est **orphelin**. mega-city n'a plus de `features/` et rien
  ne le lit, sauf un test qui vérifie sa ligne `status:`. C'est du code mort.
- `products/mega-city/skills/ezk-backlog/init.sh` porte un **repli** en heredoc. C'est une quatrième
  copie. Elle ne sert jamais tant que la référence existe.

`init` **préserve** un gabarit local existant. Les évolutions de la référence n'atteignent donc jamais
un projet déjà initialisé. La dette est déjà notée dans le SKILL (réponse Codex sur la PR #152).

Déjà livré par le sprint « verrou de statut » : le schéma des statuts est central
(`src/core/fiche-schema.ts`) et un test garde la ligne `status:` de chaque gabarit. Il reste la
structure du gabarit (champs, sections) et l'existence même des copies.

## Proposition

Le mécanisme retenu pour ce POC est un **test de contrat** plus une **indication de `init`**.

1. **Référence** : `epic:` devient `milestone:` (et `labels:` pour les thèmes). `version:` passe en
   champ optionnel. `type` perd `epic`. Les commentaires restent génériques, sans liste de jalons
   propre à vectorz.
2. **Local vectorz** : copie exacte de la référence.
3. **Suppression** de l'orphelin et du repli de `init.sh`. Si la référence manque, `init` échoue
   avec un message clair.
4. **`init`** ne réécrit jamais un gabarit local (il peut porter des réglages). Il dit quand le
   gabarit diffère de la référence et affiche la commande `cp` qui l'aligne.
5. **SKILL.md** : l'exemple de front-matter passe à `milestone:` et `labels:`. La note « chantier
   séparé » dit désormais comment rafraîchir.
6. **Garde** : un test de contrat, plus deux cas dans `test-layout-version.sh`.

## Critères d'acceptation

- [x] La référence porte le modèle courant : `milestone:` et plus `epic:`, id entre guillemets,
  listes `type` / `priority` / `evidence` / `status` égales aux énumérations du code, corps ADR-0029.
  Preuve : deux tests de `fiche-template-contract.test.ts`.
- [x] Le gabarit local de vectorz est identique à la référence, octet pour octet.
  Preuve : le test « copie exacte » et le `cmp` ci-dessous.
- [x] Il n'existe plus de copie orpheline ni de repli : le fichier orphelin est supprimé et
  `init.sh` ne porte plus de squelette de fiche. Preuve : deux tests du même fichier.
- [x] Un projet neuf initialisé par `init` reçoit le gabarit de référence.
  Preuve : cas D de `test-layout-version.sh`.
- [x] La dérive se voit. Le test échoue en affichant la commande `cp` à rejouer. `init` signale un
  gabarit local différent, sans l'écraser. Preuve : cas M de `test-layout-version.sh`.
- [x] L'exemple de front-matter du SKILL ne parle plus d'`epic:`.
  Preuve : un test de `fiche-template-contract.test.ts`.

## Comment vérifier

```bash
# Le contrat du gabarit (copie locale identique, orphelin absent, listes = schéma, pas d'epic)
pnpm --dir products/mega-city exec vitest run fiche-template-contract fiche-schema-contract
# init : projet neuf = référence ; gabarit périmé signalé sans être écrasé
bash products/mega-city/skills/ezk-backlog/scripts/test-layout-version.sh | tail -8
# À la main
cmp products/mega-city/skills/ezk-backlog/templates/feature-template.md features/feature-template.md && echo identiques
test ! -e products/mega-city/feature-template.md && echo "orphelin supprimé"
```

## Suite (hors POC)

- **Pousser la mise à jour aux projets déjà installés** sans geste manuel : une migration Skema 006.
  Elle exige de bumper `VERSION`, le README modèle, le SKILL et `test-layout-version.sh`. À fiche
  seulement si la commande `cp` indiquée par `init` s'avère trop manuelle.
- **Option d'écrasement** `init --refresh-template` avec sauvegarde, pour le même besoin.
- **Exemple du SKILL** : il reste une illustration, pas une copie gardée. Un test de clés le
  rapprocherait du gabarit si l'écart revient.

## Notes / décisions

- **Origine** : retour Codex sur la PR #254 (« propagate the distinction to installed project
  templates ») et décision du PO (Thomas, 2026-09-18) de ficher la dette.
- Rattaché à la dette « rafraîchir le template local » du SKILL `ezk-backlog` (réponse Codex, PR #152).
- Décisions de grooming (2026-10-01) : pas de gabarit « dérivé » généré ni de pointeur. Une copie
  exacte plus un test coûtent moins cher et se lisent d'un coup d'œil.
- Retrait de l'épic : ADR-0017, amendement A16. Point de départ : sprint « verrou de statut », PR #267.
