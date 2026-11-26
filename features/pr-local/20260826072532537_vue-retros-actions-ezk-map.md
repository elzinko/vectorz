> 🗎 Rendu de la fiche [features/20260826072532537_vue-retros-actions-ezk-map.md](../done/20260826072532537_vue-retros-actions-ezk-map.md)

# Vue « rétrospectives » dans `ezk:map`

## En clair

Une sous-page de `ezk:map` pour **revoir les rétros passées** : pour chacune, sa **liste
d'actions mesurables** (ce qui a été décidé, où ça a atterri, adopté ou rejeté). Le
format cible existe déjà dans l'unique rétro capturée — un **tableau « Décisions du PO »**.
Mais deux réalités à connaître : il n'y a **qu'une seule rétro capturée** aujourd'hui, et
la standardisation de ces captures **n'est pas encore faite** (c'est la fiche [[0080]]).

> **Groomé le 2026-08-26.** L'intention (afficher la liste d'actions) est claire ; le
> vrai sujet est la **matière** : rare et pas encore normée. Statut laissé en `idea` —
> le gate `ready` promeut, pas le grooming.

## Contexte / Problème

Les rétros produisent de la valeur, mais **on ne peut pas la revoir d'un coup d'œil** :

- **Une seule** capture formelle : `docs/captures/2026-07-18-retro-cinq-sprints.md`. Elle
  a la bonne structure — sections (symptômes · lentilles · convergence · juge · propositions
  · **Décisions du PO** · glossaire) et surtout un **tableau d'actions** :

      | Proposition | Décision | Date |
      | 1 · Vérifier avant de citer | ✅ Adoptée → règle proven-outbound-references | 2026-07-18 |
      | 5 · Réserve de fiches en clôture | ❌ Rejetée — … | 2026-07-18 |

- Les **autres** rétros sont **dispersées** : en prose dans les sections « Rétrospective »
  des comptes-rendus de `docs/sessions/`, ou devenues des règles/DoD (cérémonie [[0167]])
  sans page qui les rassemble.
- Le dossier `docs/captures/` mélange les genres (panels adverses, notes de lecture,
  fermetures backlog) — les rétros n'y sont pas isolées ni régulières.

**Conséquence** : sans un format de capture **normé et systématique**, la vue n'a qu'une
seule rétro fiable à lire, et rien ne garantit les suivantes.

## Valeur

Voir la **suite des rétros** et, pour chacune, ses **actions mesurables** avec leur statut
(✅ adoptée / ❌ rejetée / ⏳ en attente) et **où** elles ont atterri (règle, slot du gate,
étape de skill). C'est la condition pour **mesurer si les règles adoptées servent** — et
les retirer sinon (la valeur même de [[0080]]).

## Proposition (groomée — extraction structurée)

Même logique que la vue sprints [[20260826072532452]] : **une source normée, puis une vue
qui la lit**.

**La source (prérequis).** Les rétros sont capturées au **format standard** de [[0080]]
dans `docs/captures/*-retro-*.md`, avec leur tableau **« Décisions du PO »**. C'est
[[0080]] qui garantit le format et la systématicité — cette vue **s'appuie dessus**, elle
ne le crée pas.

**La vue.** Un onglet `pnpm ezk:map retros`, sur le **patron d'onglet existant** (cœur pur
`src/core/…-data.ts` + chargeur + `bin/regen-retros-data.ts` + test d'invariant
« régénéré ≡ disque », comme `avancement`). Elle affiche :

- la **liste des rétros** (date · thème), de la plus récente à la plus ancienne ;
- au clic, pour chaque rétro, sa **liste d'actions** = les lignes du tableau « Décisions du
  PO » (proposition · décision/où elle a atterri · statut ✅/❌/⏳ · date) ;
- un lien vers la **capture source**.

## Périmètre

**Dans le lot (visé ready)** : lire les captures `*-retro-*.md` au format [[0080]],
afficher la liste des rétros + le tableau d'actions de chacune, le test d'invariant.

**Hors lot (gated — décision après usage)** :
- **Agréger** les sections « Rétrospective » en prose des comptes-rendus de `docs/sessions/`
  (fragile — même piège que les récits de sprint non normés).
- **Suivre le devenir** d'une action (« la règle X sert-elle encore ? ») — c'est une
  analyse, pas de l'affichage ; à instruire plus tard.

## Décisions laissées à l'étape Archi (avec recommandation)

1. **Source canonique** : `docs/captures/*-retro-*.md` au format [[0080]] **(recommandé)**
   — pas d'agrégation de la prose des comptes-rendus dans ce lot.
2. **Forme extraite** : le tableau « Décisions du PO » **(recommandé)** comme liste
   d'actions ; le reste de la capture (débats, juge) reste lisible au clic, non structuré.
3. **Anciennes/absentes** : si une rétro n'a pas le tableau normé, l'afficher en **dégradé**
   (date + titre + lien), sans casser la vue.

## Dépendances

- **Interne, dure** : [[0080]] (standardise la capture de rétro + son tableau d'actions).
  Sans elle, la vue n'a **qu'une** rétro à lire et aucun format garanti. Dans le monorepo
  (skill `ezk-retro`) — **pas** une dépendance externe (le slot DoR « dépendance externe
  constatée » ne s'applique pas).
- **S'appuie sur** [[0167]] (la cérémonie qui produit les actions).
- **Symétrie** avec la vue sprints [[20260826072532452]] : vue structurée ← format normé
  (sprints ↔ `docs/sessions/` via `ezk-archive` ; rétros ↔ `docs/captures/` via [[0080]]).
- **Voisine** : fiche pouce [[20260826072532622]].

## Critères d'acceptation

- [ ] `pnpm ezk:map retros` liste les rétros capturées (date · thème), plus récente d'abord.
- [ ] Chaque rétro affiche sa **liste d'actions** = les lignes du tableau « Décisions du PO »
      (proposition · décision/atterrissage · statut ✅/❌/⏳ · date).
- [ ] Chaque entrée pointe vers sa **capture source** (`docs/captures/`).
- [ ] Les données sortent d'un **script** (`bin/regen-retros-data.ts`) ; un **test
      d'invariant** rougit si une capture change sans regen.
- [ ] Une rétro **sans** tableau normé s'affiche en **mode dégradé** sans casser la vue.
- [ ] **Zéro** donnée saisie à la main ; la vue ne fait que **lire** les captures.
- [ ] Gate locale verte + liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map retros
```

La page liste les rétros ; ouvrir `2026-07-18` → ses actions apparaissent avec leur statut,
et le lien ouvre la capture. Ajouter une capture au format [[0080]] → elle apparaît après
regen ; la modifier sans regen → le test d'invariant rougit.

## Notes

- **Séquencement (à connaître)** : cette vue **n'aura presque rien à montrer** tant que
  (a) [[0080]] n'a pas normé la capture et (b) des rétros ne sont pas tenues régulièrement.
  Sa valeur est **différée** — c'est un argument pour tirer [[0080]] **avant** elle.
- **Choix implicite** : extraction structurée (liste d'actions), conforme à la demande PO
  du 2026-08-26 (« chacune de leur liste d'actions mesurables »).
- **Briques réutilisables** (patron `avancement`) : `bin/ezk-map.ts`, `bin/regen-avancement.ts`
  + son cœur `src/core/…-data.ts`, un chargeur `src/loaders/…`.
- **Product `mega-city`**.


## 🔄 Rescope — 2026-09-30 (audit de rationalisation du backlog)

> **Fiche EVOLVE** : partiellement livrée ou cadrage périmé — à rescoper au reliquat réel avant de la tirer.
>
> **Constat de l'audit** : Vue rétros non bâtie ; bloquée par 0080 (format capture) ; séquencer.
>
> **Action** : au moment de groomer, réécrire l'« En clair » et les critères sur ce qui RESTE ;
> ne pas reconstruire ce qui est déjà livré. Note issue de la passe du 2026-09-30 (PR #263).

## Note du 2026-11-02

[L'amendement de l'ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) fait de mission control le seul écran : la page web de la méthode
(`ezk:map`) sera retirée. Cette page des rétros se construira donc dans mission control.

## Note du 2026-11-14 — sortie du parking, cible mission control

Depuis la [carte des écarts maquette ↔ code ↔ backlog](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md), écart F1.

- **Ce qui existe déjà.** `ezk retro captures --json` tourne : 41 captures lisibles, 0 problème,
  140 actions dont 57 à trancher, vérifié le 2026-11-14 sur vectorz. Chaque capture porte fichier,
  date, thème, périmètre, participants et ses actions (proposition, nature, cible, auteur, statut
  ✅/❌/⏳, décision du PO, date) : `products/mega-city/src/core/retro-capture.ts`. La lentille
  `--check --lens` publie déjà les défauts de lisibilité dans `problems[]`.
- **Ce qui manque.** Un contrat versionné (aucun dossier `contracts/retro-captures/`), les sprints
  relus en donnée structurée (aucune des 41 captures n'a de clé `sprints:` ; le gabarit de capture
  ne la définit pas), et la page.
- **Rattachement.** La fiche sort du milestone `parked` et rejoint `board` : la page se construit
  dans mission control (note du 2026-11-02), pas dans `ezk:map`, retiré par l'ADR-086.
- **Découpage proposé au grooming**, sur le modèle de la paire recettes livrée le 2026-11-04 : côté
  méthode, le contrat `contracts/retro-captures/v1` (schéma, exemple rangé, test « exemple ≡
  commande ») ; côté cop1, la page Rétros (liste, décisions avec leur statut, lien vers la capture et
  vers les sprints relus). Le champ `sprints[]` reste `[]` et la page dit « sprints non tracés » tant
  que [Une rétro relit une liste de sprints nommés](../20261114131614801_retro-relit-une-liste-de-sprints-nommes.md)
  n'est pas livrée. Les critères `pnpm ezk:map retros` et `bin/regen-retros-data.ts` ci-dessus sont
  périmés : à réécrire au grooming sur le reliquat réel.
- **Priorité** P2 confirmée : la donnée tourne déjà, il reste le contrat et la page.


## Note du 2026-11-26 — l'écran Rétros de la maquette (critères à jour)

**En clair.** Cette fiche couvre déjà le besoin : une page qui liste les rétros et leurs décisions. On
la complète avec l'écran de la maquette. Les critères `pnpm ezk:map retros` plus haut sont périmés ; ceux
de cette note les remplacent.

**Si tu arrives frais.** Une rétro est un temps où l'équipe relit des sprints et propose des
améliorations. Le PO tranche chaque proposition. Mission control affiche ce que la méthode publie
(ADR-086) ; un champ non publié s'écrit « non publié ».

### Écart constaté

Le menu n'a pas d'entrée « Rétros ». La maquette en pose une entre Sessions et Versions (captures
`19-retros-maquette.png`, dossier `comparaison/` du run). Donnée : `ezk retro captures --json`, **sans
contrat versionné** ; le champ `sprints[]` reste vide tant que la fiche
[Une rétro relit une liste de sprints nommés](../20261114131614801_retro-relit-une-liste-de-sprints-nommes.md)
n'est pas livrée.

### Écran visé

1. Entrée de menu « Rétros », entre Sessions et Versions (ajoutée quand la page existe).
2. **Liste** : une ligne par rétro, titre, date, sprints relus (S29 S30), « 3 propositions · 1 écartée
   par le PO · 2 en attente », « N décisions PO ». « Afficher plus » centré, compteur « 41 rétros » à droite.
3. **Page d'une rétro** : en-tête (date, sprints, compteurs), « En clair », Propositions avec leur état
   (écartée, en attente, adoptée), Les faits de départ, Déroulé, Sprints relus, Capture (fichier, « Afficher »).
4. « Précédente » mène à la rétro d'avant. Sans lien rétro → sprints, la page dit « sprints non tracés ».
5. Le bouton « Lancer une rétro » de la maquette ne figure que si un geste existe côté méthode.
   La fiche [Demander une rétro depuis mission control](../20261114131617010_demander-une-retro-depuis-mission-control.md) le porte.

### Critères d'acceptation (mission control)

- [x] L'entrée « Rétros » apparaît entre Sessions et Versions.
- [x] La liste montre titre, date, sprints, comptes de propositions et décisions du PO pour chaque rétro, plus
      récente d'abord.
- [x] « Afficher plus » ajoute des lignes, avec le compteur à droite.
- [x] La page d'une rétro montre ses propositions avec leur état et un lien vers la capture source.
- [x] Une rétro sans tableau normé s'affiche en mode dégradé (date, titre, lien), sans casser la page.
- [x] Un champ non publié (sprints, décisions) s'écrit « non publié » ou « sprints non tracés », jamais « 0 ».
- [x] Aucun bouton d'action sans geste existant côté méthode.

### Comment vérifier (mission control)

- Preuve avant / après (retros) : [avant, menu sans Rétros](../../docs/pr-evidence/20260826072532537/retros-before.jpg) → [après](../../docs/pr-evidence/20260826072532537/retros-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (capture mal formée gardée en mode dégradé). Les anciens critères `ezk:map` restent non cochés : la note du 2026-11-26 les remplace.

```bash
ezk retro captures --json | head
pnpm --dir products/cop1/packages/web test -- RetrosView.test.tsx
```

- vue Rétros : http://localhost:5273 → menu Rétros

### Dépend de

Un contrat versionné des captures de rétro (`contracts/retro-captures/v1`, à créer côté méthode, hors de
cette note). Tant qu'il manque, l'écran lit la sortie actuelle et le dit.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ web 352, daemon 431, build OK, gate mega-city verte |
| Revue adverse | ✅ ezk-reviewer GO après correctif (capture mal formée gardée en mode dégradé) |
| Before / after (UI) | docs/pr-evidence/20260826072532537/retros-before.jpg → docs/pr-evidence/20260826072532537/retros-after.jpg |
