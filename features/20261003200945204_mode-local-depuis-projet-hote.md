---
id: "20261003200945204"
title: Le mode local de la méthode marche depuis un projet hôte, sans contournement
type: bug
priority: P0
product: mega-city
milestone:
version: V0.5
labels: [installation, github-optionnel]
status: idea
pr:
evidence: none # outillage en ligne de commande, pas d'écran
created: 2026-10-03
---

# 20261003200945204 — Le mode local marche depuis un projet hôte

**En clair.** On a fait tourner une story complète en mode local sur un projet hôte, le banc
`cop1-cobaye`. Elle est allée au bout, mais seulement grâce à quatre contournements : deux
commandes refusent le projet, un message d'erreur envoie vers le mauvais projet, le document de
PR local a ses liens cassés, et le fichier de sprint bloque le merge. Cette fiche les corrige,
pour qu'un sprint local tourne dans n'importe quel projet avec les commandes que le skill
prescrit.

**Si tu arrives frais.** Un *projet hôte* est un projet qui utilise la méthode ezk sans être
vectorz (muti, samplerz, le banc `cop1-cobaye`). Le *mode local* est le réglage `github: false`
de `.vectorz/config.yml` : pas de PR, pas de CI cloud, pas de Codex. Tout se fait sur le poste et
se committe.

## Contexte / Problème

Constat du 2026-10-03, au test du cycle local sur `cop1-cobaye` (fiche
[Recopier sur GitHub ce que la méthode écrit en local](0171-adapter-github-issues-push-only.md),
section « Gênes relevées »). La story « bouton mode sombre » a été livrée (`47c5f65`, rangée en
`68d0797`). Quatre défauts ont bloqué le chemin prévu par le skill de sprint :

1. **`ezk pr emit-local` et `ezk review emit` refusent le projet.** Ce sont les deux commandes que
   `ezk-sprint` prescrit en mode local. Avec `--root <projet>`, elles répondent « cette commande
   écrit dans le dépôt de la méthode ». Sans `--root`, elles refusent aussi. Les scripts
   sous-jacents (`bin/pr-emit-local.ts`, `bin/review-emit.ts`) savent pourtant écrire dans le
   dossier d'où on les lance.
2. **Le message d'erreur envoie vers le mauvais projet.** Lancées depuis le projet hôte,
   `ezk config`, `ezk run context`, `ezk backlog plan-head`, `ezk pr emit-local` et
   `ezk review emit` conseillent d'ajouter `--root …/vectorz`. Pour `ezk config github off`,
   suivre ce conseil coupe GitHub dans vectorz, pas dans le projet. Depuis la PR #344,
   `ezk backlog ship` et `regen` visent pourtant le dépôt du dossier courant.
3. **Le document de PR local a ses liens cassés.** `pr:emit-local` recopie la fiche telle quelle
   dans `features/pr-local/`, un dossier plus bas. Ses liens relatifs, ici trois images de preuve,
   ne mènent plus nulle part. Sa ligne de provenance reste sur `features/<fiche>` après le
   rangement de la fiche dans `done/`.
4. **`SPRINT.md` bloque le merge local.** Le fichier de sprint ne doit pas être committé. vectorz
   l'ignore dans son `.gitignore`, mais `ezk-backlog init` ne le fait pas dans un projet hôte. Le
   fichier reste « non suivi », et `ship-merge.sh --local` refuse un dépôt qu'il juge sale.

Effet : quelqu'un qui suit le skill à la lettre dans muti ou samplerz ne peut pas livrer une story
en mode local. Et la fiche 0171, la copie GitHub, attend que le local soit propre.

## Proposition

Suite des correctifs « projet hôte » déjà livrés :
[les skills trouvent mega-city](done/20261002155911257_skills-trouvent-mega-city-depuis-projet-hote.md)
(#343) et [ship et regen visent le dossier courant](done/20261003072823731_ezk-backlog-vise-le-dossier-courant.md)
(#344).

1. **Les commandes de projet visent le projet.** `ezk pr emit-local`, `ezk review emit` et
   `ezk config` travaillent sur le dépôt du dossier courant, ou sur celui de `--root`, comme
   `ship` et `regen` depuis la #344. Elles le disent : « dépôt visé : … ».
2. **Un message d'erreur ne propose jamais de viser vectorz pour une commande de projet.** Une
   commande qui ne travaille que sur la méthode le dit, sans conseiller un `--root` qui
   modifierait vectorz à la place du projet.
3. **Le document de PR local garde des liens justes.** L'émetteur recalcule chaque lien relatif
   de la fiche pour son propre dossier. La provenance pointe vers l'endroit réel de la fiche.
4. **`SPRINT.md` ne bloque plus le merge local.** Deux voies, à trancher au grooming : `init`
   ajoute `SPRINT.md` au `.gitignore` du projet (avec une migration pour les projets déjà
   initialisés), ou `ship-merge.sh --local` tolère ce seul fichier non suivi.

## Critères d'acceptation

- [ ] Depuis un projet hôte en `github: false`, `ezk pr emit-local --fiche <fiche>` écrit
      `features/pr-local/<fiche>` dans ce projet, sans `--root` et sans passer par `pnpm --dir`.
- [ ] Depuis le même projet, `ezk review emit …` écrit `features/reviews/<id>-<slug>/REVIEW.md`
      dans ce projet.
- [ ] Depuis le même projet, `ezk config github off` écrit `.vectorz/config.yml` dans ce projet,
      sans `--root`.
- [ ] Aucun message d'`ezk`, lancé depuis un projet hôte, ne conseille un `--root` vers vectorz
      pour une commande qui travaille sur le projet.
- [ ] `check-links.sh` ne trouve aucun lien cassé dans le document de PR local d'une fiche dont
      les images vivent dans `docs/pr-evidence/`.
- [ ] Un projet initialisé par `ezk-backlog init`, avec un `SPRINT.md` ouvert, passe
      `ship-merge.sh --local` sans contournement.
- [ ] Les tests existants de ces commandes restent verts ; chaque correctif a son test.

**Mesure de suivi** — le prochain sprint local dans muti ou samplerz se fait sans aucun des
quatre contournements.

## Comment vérifier

Rejouer le cycle sur le banc, depuis son état de départ :

```bash
cd ~/git/bacasable/cop1-cobaye && git reset --hard banc-vierge && git clean -fdq
ezk config show                                   # vise cop1-cobaye, sans --root
ezk pr emit-local --fiche features/<fiche>.md     # écrit features/pr-local/<fiche>.md ici
bash <vectorz>/products/mega-city/bin/check-links.sh . features   # 0 lien cassé
```

Puis les tests du dépôt :

```bash
pnpm --dir products/mega-city test -- ezk-cli project-root pr-emit
```

## Glossaire

- `ezk` — la commande qui lance les outils de la méthode, installée sur le poste.
- `--root` — option d'`ezk` qui désigne le projet sur lequel une commande travaille.
- document de PR local — `features/pr-local/<fiche>.md` : le texte qu'aurait la PR, écrit sans
  GitHub.
- `SPRINT.md` — le fichier qui suit le sprint en cours ; il ne se committe pas.

## Notes / décisions

- Priorité P0 et version V0.5 fixées par le PO le 2026-10-03.
- Hors de cette fiche, notées dans 0171 : `ezk run context` ne vise pas un projet hôte ;
  `pr-evidence.sh` suppose GitHub et Playwright ; `plan-head` plante sans `PLAN.md` ; le README
  d'`init` pointe vers un `PLAN.md` absent.
- Piège voisin, candidat à cette fiche au grooming : après `ezk backlog ship`, le déplacement de la
  fiche est en index, mais pas son nouveau contenu. Un commit qui liste ses fichiers un par un
  embarque la fiche encore `ready`.
- Les contournements du test sont décrits dans 0171, section « Gênes relevées ».
