---
id: "20260902224608715"
title: Preuve avant/après dans les PR — outiller la règle existante (capture, dépôt, lien, contrôle), sur demande ou en auto
type: feature
priority: P1 # provisoire — demandée par le PO le 2026-09-03, à confirmer
product: mega-city
version:
epic:
status: in-progress
ready: 2026-09-03
pr:
evidence: before-after # dogfood : le diff touche diagrams/methode-mega-city/carte-interactive.html (la règle entre dans le bundle base)
created: 2026-09-03
---

# 20260902224608715 — Preuve avant/après dans les PR

**En clair.** Les PR livrées par la méthode ne montrent jamais l'écran **avant** et **après** la
correction, même quand elles changent l'interface. La règle qui l'exige existe depuis juillet,
mais rien ne la produit, rien ne l'active, rien ne la contrôle. Cette fiche donne à la méthode
le geste qui capture la paire d'images, la dépose dans la PR, et la vérifie — **sur demande**
à la création de la fiche, ou **en auto** dès que la PR touche l'interface.

**Si tu arrives frais.** « LA LOI » est le catalogue de règles de mega-city (`rules/`),
regroupées en *bundles* et activées par *profil* chez chaque agent. La règle
`development/pr-before-after-media` dit : toute PR visible par l'utilisateur porte des liens
avant/après dans sa description. Le corps d'une PR est le rendu de sa fiche (ADR-0029), suivi
d'une matrice « Validation » qui a une ligne « Before / after (UI) ».

## Contexte / Problème

**Symptôme daté.** Le PO, le 2026-09-03 : « dans les PR créées, je ne vois jamais les
screenshots avant et après pour les problématiques corrigées ».

**Mesure du 2026-09-03** (`gh pr list --state merged`, corps des PR lus par script) :

| Dépôt | PR mergées lues | Ligne « Before / after » présente | Avec liens avant **et** après |
|---|---|---|---|
| vectorz | 40 | 2 (toutes `N.A.`) | **0** |
| samplerz | 25 | 0 | **0** |
| muti | 25 | 3 (2 `N.A.`, 1 « ⏳ capture dispo sur demande ») | **0** |

Parmi ces 90 PR, beaucoup changent un écran : les cartes `ezk:map` et le board de vectorz
(#169, #170, #172, #179, #181, #182, #185, #188, #189), le site et l'éditeur samplerz
(#382, #387), le desktop et le site muti (#145, #147, #168, #173). Aucune ne porte la paire.

**Pourquoi — quatre trous, constatés sur pièce.**

1. **La règle n'est pas outillée.** Elle dit *quoi*, pas *comment*. Aucun geste ne produit
   l'état « avant » (sur `main`) et l'état « après » (sur la branche). L'emplacement qu'elle
   cite en exemple, `docs/pr-evidence/`, n'existe dans aucun dépôt. `gh` ne sait pas
   téléverser une image dans une description de PR.
2. **La règle n'est pas activée.** Elle vit dans le bundle `development`, que **aucun profil
   déployé ne lie** (`global`, `daily`, `desktop`, `base` = bundle `base` seul, deux règles).
   Elle est donc absente de la LOI compilée que lisent les agents. Elle ne survit que dans le
   texte d'`ezk-sprint` (étape 8) et dans une ligne de la matrice du template de PR.
3. **La règle n'est pas contrôlée.** Son `enforcements: agent-check → ezk-reviewer` est une
   déclaration (une arête du graphe), pas un comportement : le prompt d'`ezk-reviewer` ne
   mentionne ni la règle, ni les captures. `check-pr-body.sh` vérifie la structure du corps,
   pas la ligne « Before / after ».
4. **Les captures existantes ne remontent pas.** `ezk-qa` et `ezk-bug` prennent déjà des
   screenshots-preuve, mais en local, sans « avant », et jamais liés dans la PR.

Analogie : un panneau « casque obligatoire » sur un chantier sans casques au vestiaire et
sans chef de chantier qui vérifie. Le panneau est vrai ; il ne change rien.

**Valeur.** Le PO valide une PR d'interface **en regardant deux images**, sans lire le diff
ni relancer l'app. La revue asynchrone gagne un signal visuel. La règle MUST redevient vraie.

## Proposition

POC en quatre morceaux, qui **composent** l'existant (Playwright déjà en dépendance racine,
`ezk-qa`, `ezk-sprint`, `check-pr-body.sh`, la LOI) sans rien réimplémenter.

```
fiche (evidence: before-after | auto | none)            ← A. sur demande, ou auto
   │
   ▼
ezk-sprint étape 8 ──► pr-evidence.sh ──► docs/pr-evidence/<id>/<vue>-{before,after}.png
   │                   (main ↔ branche, même vue, même taille)
   └──► corps de PR = rendu de la fiche, « Comment vérifier » porte les 2 liens, matrice ✅
                                     │
                                     ▼
                  ezk-reviewer + check-pr-body : écran touché sans paire ⇒ NO-GO   ← D. contrôle
```

**A. Déclarer le besoin sur la fiche (sur demande).** Un champ de front-matter `evidence:` avec
trois valeurs : `before-after` (la paire est exigée), `auto` (défaut : décidé par le diff au
moment de la PR), `none: <raison>` (N.A. motivé). `ezk-backlog add` pose la question quand la
demande touche un écran ; `groom` peut la poser aussi. La fiche liste les vues à capturer dans
« Comment vérifier » (une URL ou une route par ligne, plus l'état de démo si besoin). Le
template de fiche et le validateur `fiches:check` acceptent le champ.

**B. Le geste (l'outil).** Un script `products/mega-city/bin/pr-evidence.sh <id> [--base main]
[--url …]`, même famille que `check-links.sh`. Il enchaîne :

1. lance l'app sur la branche et capture `<vue>-after.png` pour chaque vue déclarée ;
2. monte un worktree jetable sur la base, lance l'app sur un second port, capture
   `<vue>-before.png` — même URL, même taille, même état ;
3. taille fixe : mobile 390×844 d'abord (règle `testing/visual-validation`), desktop 1280×800
   en option ;
4. dépose les fichiers dans `docs/pr-evidence/<id>/` (léger : PNG ≤ 300 Ko, sinon JPEG) et
   imprime le bloc markdown prêt à coller, avec des liens absolus **par SHA de commit**, qui
   survivent à la suppression de la branche après squash.

La capture elle-même est `pnpm exec playwright screenshot` (Playwright 1.52.0 est déjà une
dépendance racine ; navigateurs via `playwright install chromium`, une fois).

**C. Le branchement dans la boucle (auto).** À l'étape 8 d'`ezk-sprint` : si la fiche dit
`before-after`, ou si elle dit `auto` et que le diff touche des chemins d'interface
(`*.vue`, `*.tsx`, `*.jsx`, `*.svelte`, `*.css`, `*.scss`, `*.html`, hors tests), le sprint
lance le geste, insère le bloc dans « Comment vérifier » de la fiche (donc dans le corps
rendu) et passe la ligne « Before / after (UI) » à ✅. Sinon la ligne devient
`N.A. — <raison>`. `ezk-qa` réutilise le même script pour sa preuve E2E : une seule brique.

**D. Le contrôle.** `ezk-reviewer` reçoit une lentille explicite : « diff d'interface sans
paire avant/après liée ⇒ finding P1, P0 si la fiche exigeait `before-after` ».
`check-pr-body.sh` refuse un corps dont la ligne « Before / after » reste `⏳` alors que le
diff touche des chemins d'interface. Et la règle entre dans la LOI déployée (option tranchée à
l'étape Archi, voir Notes).

Hors POC, dit franchement : les apps de bureau (Tauri, Electron) ne se capturent pas par URL ;
elles déclarent `evidence: none` motivé ou joignent une capture manuelle. Les vidéos et GIF
que la règle autorise restent manuels.

## Critères d'acceptation

- [ ] Une fiche peut déclarer `evidence: before-after | auto | none` ; le template et
      `pnpm --dir products/mega-city fiches:check --strict` l'acceptent ; `ezk-backlog add`
      pose la question quand la demande touche un écran.
- [ ] `pr-evidence.sh <id>` sur une branche qui modifie une carte `ezk:map` (dogfood vectorz)
      produit `docs/pr-evidence/<id>/<vue>-before.png` et `<vue>-after.png` de même taille,
      et imprime le bloc markdown avec des liens absolus par SHA.
- [ ] Une PR produite par `ezk-sprint` sur une fiche `evidence: before-after` sort avec la
      paire liée dans « Comment vérifier » et la ligne « Before / after (UI) » à ✅.
- [ ] Une fiche `evidence: auto` dont le diff ne touche aucun chemin d'interface sort avec
      `N.A. — <raison>` sur cette ligne, sans lancer de capture.
- [ ] `ezk-reviewer` rend un finding bloquant sur une PR d'interface sans paire liée : la
      lentille figure dans son prompt et un essai à blanc sur une PR d'`ezk:map` la déclenche.
- [ ] `check-pr-body.sh` refuse un corps « Before / after = ⏳ » sur un diff d'interface ; un
      test bash le prouve dans `pnpm --filter mega-city test:scripts`.
- [ ] La règle `development/pr-before-after-media` figure dans la LOI déployée
      (`~/.claude/ENTRY.md` après `lawgiver bind-global`), selon l'option tranchée en Archi.
- [ ] Mesure de sortie (rétro) : sur les 10 PR d'interface suivantes de vectorz, 10/10 portent
      la paire ou un N.A. motivé.
- [ ] Gate locale verte : `pnpm build`, `pnpm test`, `pnpm --filter mega-city test:scripts`,
      `bash products/mega-city/bin/test-links-repo.sh`.

## Comment vérifier

Depuis un clone frais, une fois la fiche construite :

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium                      # une fois par poste
pnpm --dir products/mega-city fiches:check --strict         # le champ evidence: passe
pnpm --filter mega-city test:scripts                        # dont test-pr-evidence (23 cas) et test-check-pr-body (13 cas)
# Run réel sur une carte : servir la carte de la branche (après) et celle de main (avant)
python3 -m http.server 4181 --directory . &                 # après = ce worktree
mkdir -p /tmp/avant/diagrams/methode-mega-city && git show main:diagrams/methode-mega-city/carte-interactive.html > /tmp/avant/diagrams/methode-mega-city/carte-interactive.html
python3 -m http.server 4182 --directory /tmp/avant &        # avant = main
E=products/mega-city/bin/pr-evidence.sh; U=/diagrams/methode-mega-city/carte-interactive.html
bash $E capture 20260902224608715 --view carte-methode --phase after  --url http://127.0.0.1:4181$U
bash $E capture 20260902224608715 --view carte-methode --phase before --url http://127.0.0.1:4182$U
git add docs/pr-evidence/20260902224608715/*.png && git commit -m "docs(pr-evidence): captures"
bash $E render 20260902224608715                            # → bloc markdown à coller ici, liens par SHA
git diff --name-only main...HEAD | bash $E decide --evidence auto   # → capture (carte-interactive.html est un chemin d'interface)
```

Puis ouvrir la PR : les deux images s'affichent dans « Comment vérifier », la ligne
« Before / after (UI) » est à ✅, et `ezk-reviewer` ne lève aucun finding sur ce point.

Vues à capturer (convention lue par l'étape 8 d'ezk-sprint) :

- vue carte-methode : /diagrams/methode-mega-city/carte-interactive.html (mobile 390×844)
- vue carte-methode-desktop : /diagrams/methode-mega-city/carte-interactive.html (desktop 1280×800)

**Preuve du run réel (dogfood, 2026-09-03).** Les quatre images ci-dessous sont sorties du
script lui-même, avec le vrai Chromium : avant = la carte sur `main`, après = la carte sur la
branche. La différence se lit dans l'en-tête : « 183 liens » avant, « 184 liens » après, le
lien règle → bundle `base` que cette fiche ajoute à la LOI.

**Avant / après** (règle `development/pr-before-after-media`)
| Vue | Avant | Après |
|---|---|---|
| carte-methode | ![carte-methode avant](https://github.com/elzinko/vectorz/blob/68029797e6fa3adfc8428c2fab85071b9cb26ae8/docs/pr-evidence/20260902224608715/carte-methode-before.png?raw=true) | ![carte-methode après](https://github.com/elzinko/vectorz/blob/68029797e6fa3adfc8428c2fab85071b9cb26ae8/docs/pr-evidence/20260902224608715/carte-methode-after.png?raw=true) |
| carte-methode-desktop | ![carte-methode-desktop avant](https://github.com/elzinko/vectorz/blob/68029797e6fa3adfc8428c2fab85071b9cb26ae8/docs/pr-evidence/20260902224608715/carte-methode-desktop-before.png?raw=true) | ![carte-methode-desktop après](https://github.com/elzinko/vectorz/blob/68029797e6fa3adfc8428c2fab85071b9cb26ae8/docs/pr-evidence/20260902224608715/carte-methode-desktop-after.png?raw=true) |

## Glossaire

- `LA LOI` — le catalogue de règles de mega-city (`products/mega-city/rules/`), compilé en
  `ENTRY.md` pour les agents par `lawgiver bind`.
- `bundle` / `profil` — un bundle est un lot de règles ; un profil est ce qu'un poste installe
  (règles, agents, skills).
- `matrice Validation` — le tableau en bas de chaque PR (convention ADR-0009) : CI, tests,
  E2E, Before / after, preview.
- `avant / après` — la même vue capturée sur `main` (avant) et sur la branche (après), à la
  même taille.
- `evidence:` — champ de fiche proposé ici : `before-after`, `auto` ou `none`.
- `docs/pr-evidence/` — dossier proposé pour déposer les captures, liées par SHA de commit.

## Notes / décisions

- **Origine** : demande PO du 2026-09-03 (cette session). Priorité **P1 provisoire** : le PO
  l'a demandée explicitement et la mesure donne 0 paire sur 90 PR ; à confirmer par lui.
- **Anti-doublon (2026-09-03)** — fiches voisines, toutes distinctes de celle-ci :
  - [[20260812104022228]] ezk-screenshots doc/site (`idea`, P2) : captures pour la **doc et
    le site** quand l'UI dérive. Même brique de capture, consommateur différent. **Cette fiche
    construit la brique minimale** (une vue, deux refs `main` ↔ branche) ; 228 la réutilise
    et l'étend (jeu nommé, manifeste, dépôt doc/site). Note croisée posée dans 228.
  - [[0058]] rapport qualité de PR (`idea`, P2, épic 0051) : commentaire GitHub riche qui
    **affichera** les captures ; cette fiche les **produit** et les met dans le corps, comme
    la règle le demande déjà. 0058 lira `docs/pr-evidence/`.
  - [[0178]] ezk-checks (`idea`, P2) : recette manuelle Playwright → `CHECK.md`. Un jugement,
    pas une paire ; peut composer le même script.
  - [[20260812104022231]] DoR balayage des surfaces : cadrage au grooming (DoR) ; ici c'est
    la preuve à la livraison (DoD).
  - [[20260822200213110]] règle « page vitrine = screenshots réels » : les pages, pas les PR.
- **Décisions pour l'étape Archi** (`ezk-architect`, ADR court si besoin) :
  1. *Où activer la règle* : bundle `development` entier lié au profil `global` (change la
     LOI des 7 agents), **ou** la règle seule ajoutée au bundle `base` (défaut proposé,
     réversible), **ou** hors LOI avec contrôle par reviewer + script seulement.
  2. *Maison du script* : `bin/` de mega-city composé par `ezk-sprint` et `ezk-qa` (défaut
     proposé), **ou** le skill `ezk-checks` de 0178, **ou** une sous-commande d'`ezk-qa`.
  3. *Dépôts privés* (samplerz, muti) : vérifier au POC qu'un lien `blob/<sha>?raw=true`
     s'affiche pour un membre ; sinon repli = commentaire de PR avec téléversement manuel,
     dit tel quel dans la matrice.
- **Lien par SHA après squash** : le SHA lié est celui d'un commit de branche. GitHub garde
  ces objets servis via la PR après le squash, mais ce n'est pas garanti à vie : à vérifier à la
  première PR mergée (comme l'affichage sur dépôt privé) ; sinon re-rendre sur `main`.
- **Dépendances externes** : aucune pour le POC (dogfood sur les cartes `ezk:map` de vectorz).
  samplerz et muti sont les consommateurs suivants, hors critères de cette fiche.
- **À porter en rétro** : cette règle est un cas d'école « règle MUST déclarée, jamais
  outillée ni contrôlée ». Les autres règles à `enforcements: agent-check` méritent le même
  contrôle sur pièce : le prompt de l'agent nommé les porte-t-il vraiment ?
