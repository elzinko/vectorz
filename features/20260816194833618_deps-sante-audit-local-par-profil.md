---
id: "20260816194833618"
title: "Santé des dépendances : audit local activable + sa place dans le process (gate / continu / réactif)"
type: feature
priority: P2
product: mega-city
labels: [dette, securite]
milestone:
epic:
status: idea
pr:
created: 2026-08-16
---

# 20260816194833618 — Santé des dépendances : audit local + sa place dans le process

**En clair.** Les failles de dépendances arrivent quand un CVE est publié en amont, pas quand on
ouvre une version. Il faut donc leur donner **deux places de rythmes différents** : un **garde-fou**
qui empêche de taguer une version avec un critique ouvert (côté release/scrum), et un **entretien
continu** qui transforme les montées utiles en fiches (côté dev). Un critique qui tombe entre deux
versions suit un **chemin réactif** (il n'attend pas la roadmap). Le tout **en local d'abord**
(zéro minute cloud), Dependabot restant un filet optionnel.

**Si tu arrives frais.** *Dependabot* = le robot GitHub qui ouvre des PR quand une dépendance a une
faille connue (chaque PR consomme du quota CI). *CVE* = une faille publiée. *Gate de release* =
`ezk release`, la passe qualité GO/NO-GO avant le tag d'une version.

## Contexte / Problème

**Déclencheur (2026-08-16).** Une PR Dependabot périmée (#139) a soulevé : « est-ce que Dependabot
consomme des ressources ? ». Dependabot est gratuit, mais **chacune de ses PR déclenche un run CI**
(quota GitHub Actions limité, repo privé). Ses PR groupées vieillissent, mélangent correctifs utiles
et sauts majeurs risqués, et **redescendent** parfois une version déjà montée.

**Récidive (2026-10-13).** Le push de v0.13 sur origin a fait remonter **12 vulnérabilités** (2
critiques, 4 hautes, 6 modérées). Vu à la main, hors de tout rituel : rien dans le process ne dit
**quand** on les traite ni **qui** décide. (Voisin déjà vécu : montée vitest 4 vulnérable,
`features/pr-local/20261004175528673_dependances-vulnerables-vitest-4.md`.)

**Le vrai trou.** Le besoin n'est pas qu'« un outil ». C'est **où** la sécurité des deps vit dans le
process : aujourd'hui, nulle part de façon déterministe.

## Proposition — trois maisons, un rythme chacune

1. **Garde-fou de version (release/scrum) — une passe d'`ezk release`.** Comme la passe
   « chasse aux bugs », ajouter une passe **« aucune vuln critique ouverte »** (un `pnpm audit`
   ciblé, ou la lecture de l'alerte Dependabot) qui met la version **NO-GO** tant qu'un critique
   traîne. Une soupape PO journalisée (`--release-ok "<raison>"`) reste possible, comme pour les
   autres passes.
2. **Entretien continu (dev) — le check local → fiches.** Un check **en local** (`pnpm audit` /
   `pnpm outdated`, ou `osv-scanner`), **zéro minute cloud**, dont la **sortie = des fiches backlog**
   (chaque montée utile entre dans le flux ezk). Les montées non urgentes se glissent dans le bloc
   **« 🧹 En continu »** du PLAN. Maison probable = une sous-commande d'**`ezk-ci`** (qui surveille
   déjà la conso Actions), pas un skill neuf (anti-surproduction, ADR-0013) ; à challenger si le
   périmètre grossit (`ezk-deps` dédié).
3. **Chemin réactif (incident) — un critique qui tombe entre deux versions.** Il n'attend pas la
   roadmap : une **fiche P0** tirée tout de suite, ou le skill **`ezk-bug`** si on veut un chemin
   incident dédié. Jamais le bloc « En continu » (trop lent pour un critique).

**Trier par EXPOSITION, pas par le libellé.** Un « critique » dans un devDep (tsx, vitest…) non
embarqué est moins grave qu'un critique dans une dépendance **distribuée** (plugin/méthode). La passe
de gate et le tri réactif doivent raisonner sur « la faille est-elle atteignable / embarquée ? »,
pas sur le mot « critique » brut.

**Activable par projet** via les **profils** existants (`base`, `daily`, `desktop`, `cop1-target`…)
+ `lawgiver bind` : pas un système parallèle, une entrée de plus au catalogue. **Driver-agnostique** :
le *quoi* (auditer) est au cœur ; GitHub/Dependabot n'est qu'un **adaptateur optionnel** (filet cloud
gardé, ou coupé pour tout faire en local).

## Critères d'acceptation (à groomer)

- [ ] Un check deps **en local** produit un rapport (failles + `outdated`) sans run cloud.
- [ ] Les montées utiles atterrissent en **fiches backlog** (intégration `ezk-backlog`).
- [ ] La capacité est **activable/désactivable par projet** via un profil (pas de système parallèle).
- [ ] **Gate de release** : `ezk release <v>` passe **NO-GO** s'il reste une vuln **critique
      atteignable** ouverte ; soupape PO journalisée possible. (Nouveau, 2026-10-13.)
- [ ] **Chemin réactif** documenté : un critique entre deux versions se traite **sans attendre** la
      version (fiche P0 ou `ezk-bug`), pas via le bloc « En continu ». (Nouveau, 2026-10-13.)
- [ ] Décision tranchée : **sous-commande d'`ezk-ci`** vs **skill `ezk-deps`** dédié.
- [ ] Décision : garder Dependabot (filet cloud) ou le désactiver (`dependabot.yml` / réglages repo).

## Comment vérifier

```bash
pnpm --dir products/mega-city audit            # le check local liste failles + sévérités (zéro cloud)
ezk release vX.Y --root "$(git rev-parse --show-toplevel)"   # NO-GO si un critique atteignable est ouvert
```

## Notes / cohérence

- **Réactivée le 2026-10-13** (dé-parquée) : intérêt PO après les 12 vulns du push v0.13, et besoin de
  **placer** la sécurité des deps dans le process (gate / continu / réactif) — pas seulement l'outil.
  Priorité P2 inchangée (confort/frugalité ; les alertes Dependabot couvrent déjà la veille gratuite).
- **Piège** : « lancer régulièrement » via GitHub Actions = reconsommer des minutes. Zéro-coût = à la
  demande, ou un rappel au rituel d'ouverture (`ezk-sprint:check`).
- **Voisines** : [[20260812134515706]] (`ezk-ci harden`/`apply`) · [[0177]] (capacités portables) ·
  [[0170]] / [[0087]] (extension + distribution plugin) · [[0174]] (`ezk-issues`) · les profils
  `products/mega-city/profiles/`.
