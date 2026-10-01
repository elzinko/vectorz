---
id: "20260903134909124"
title: "Déployer vraiment les règles chez les agents (aujourd'hui : zéro)"
type: bug
priority: P1
product: mega-city
labels: [installation]
version: V0.3
epic:
status: idea
pr:
evidence: none # méthode, aucun écran
created: 2026-09-03
---

# 20260903134909124 — La loi n'arrive pas chez l'agent

**En clair.** La méthode range ses règles dans un catalogue, mais rien ne les envoyait chez les
agents : `bind-global` n'écrivait que les skills et les agents, et aucun dossier de loi n'existait
sur le poste. Ce lot fait quatre choses. `bind-global` compile le socle de loi dans
`~/.claude/rules/iamthelaw.md`, que Claude Code lit dans toutes les sessions, sous-agents compris.
`lawgiver doctor` dit ce qui est déclaré mais pas installé. Un test verrouille les règles « un
agent la contrôle ». Le profil `global` reçoit les deux outils oubliés (`ezk-bug`, `ezk-chef`).
Ce lot n'écrit rien dans `~/.claude` : tout est prouvé sur dossier jetable, et le PO rejoue
`bind-global` ensuite.

**Si tu arrives frais.** « LA LOI » = les règles du catalogue mega-city (`rules/`), groupées en
bundles, portées par des profils. `lawgiver bind <profil> <projet>` écrit dans un projet, loi
comprise (`.iamthelaw/ENTRY.md`). `lawgiver bind-global <profil>` écrit dans `~/.claude`.

**Dépend de** [[20260903134906920]] : le routeur `ezk`, son entrée de manifeste `law` et la
primitive « état de déploiement » (lien, copie, absent, lien mort) créée par `ezk law status`.

## Contexte / Problème

Constaté le 2026-09-03, pendant la livraison de [[20260902224608715]] :

- Le cap global (`src/caps/claude-code-global.ts`) disait : « pas de loi compilée : le global ne
  porte que l'équipe ». C'était un choix (ADR-0006, fiche 0017), pas un oubli.
- Le cap projet compile bien la loi, mais aucun `lawgiver bind` n'a été lancé sur vectorz : 0 règle
  compilée sur le poste (`~/.claude/rules/` n'existe pas, mesuré le 2026-10-01).
- Une règle n'était donc effective que si un texte d'agent la répétait à la main. Mesure du
  2026-10-01 : 27 règles `agent-check`, **7 citées** par le prompt de l'agent nommé, **20 non**
  (ezk-reviewer 13 sur 14, ezk-architect 2 sur 2, ezk-pm 2 sur 2, ezk-qa 2 sur 2, ezk-steward 1
  sur 1 ; ezk-chef 6 sur 6 citées). La liste exacte est dans `law-debt.yml`.
- Le profil `global` se dit « exhaustif » mais omettait `ezk-bug`, `ezk-chef` (skills) et
  `ezk-chef` (agent) : ils n'étaient dans aucun profil. Même famille de bug : `/ezk-pr` était resté
  introuvable parce que le lien n'existait pas dans `~/.claude` (2026-08-22).
- Relevé du `doctor` sur le poste du PO le 2026-10-01 (lecture seule) : 5 divergences. `ezk-bug`,
  `ezk-chef` (skill et agent) et `ezk-scout` ne sont pas installés, et la loi est absente.

Analogie : le code civil est imprimé et rangé à la bibliothèque, mais aucun tribunal n'en a reçu
de copie.

## Proposition (POC)

Trois voies existaient. On retient la voie 2 pour le socle, la voie 3 comme verrou, et on laisse
la voie 1 à la liaison par projet. Décision : ADR-0056.

1. **Voie 2 — le global porte le socle de loi.** Le cap global ajoute un fichier
   `rules/iamthelaw.md` (les règles du profil, même format que `ENTRY.md`). Claude Code charge
   `~/.claude/rules/*.md` dans chaque session, sans pointeur. Le fichier est possédé par lawgiver :
   un marqueur dans son en-tête permet de le remplacer, et un fichier du même nom sans marqueur
   n'est jamais écrasé. Coût : le socle `base` pèse 16 Ko, soit environ 4 k jetons par session.
2. **Voie 3 — le cliquet.** Un test échoue quand une règle `agent-check` n'est citée ni par id
   ni par titre dans le prompt de l'agent nommé, sauf si elle figure dans la dette datée. La
   liste ne peut que rétrécir. Les 20 règles non citées y sont consignées.
3. **Le doctor.** `lawgiver doctor <profil> [--target <dossier>]` (et `ezk law doctor`) compare
   le profil et la cible. Lecture seule. Code retour 1 si une divergence bloque. Il réutilise la
   primitive « état de déploiement » créée par `ezk law status`.

## Critères d'acceptation

- [x] La mesure datée (ci-dessus) est consignée dans la fiche, et le test la reproduit.
      _Preuve_ : `law-debt.yml` (les 20 règles, datées) et `law-coverage.test.ts`.
- [x] Le test cliquet échoue sur une règle `agent-check` nouvelle et non citée, et sur une entrée
      de dette devenue citée ou disparue.
      _Preuve_ : `law-coverage.test.ts` (cas simulés, puis le vrai catalogue). Il a vu une dette
      périmée pendant le travail : la règle comptée « citée » par l'en-tête `interactions`, que
      le modèle ne lit pas, a été retirée du critère.
- [x] `bind-global` écrit `rules/iamthelaw.md` avec les règles du profil, en mode copie comme en
      mode lien, sans toucher un fichier du même nom qui n'a pas le marqueur. Prouvé sur dossier
      jetable ; la cible se choisit avec `--target`, le défaut reste `~/.claude`.
      _Preuve_ : `apply-global-law.test.ts` (copie, lien, idempotence, refus d'un fichier ou d'un
      lien étranger, aucune écriture avant le refus) et `deploy-doctor.test.ts` (commande réelle,
      `HOME` factice : rien n'atterrit dans le vrai `~/.claude`).
- [x] `lawgiver doctor` signale, pour le profil donné : élément manquant, lien mort, copie
      périmée (contenu différent du plan), loi absente ou périmée, fichier de loi non géré (jamais
      touché). Copie et lien sont reconnus tous les deux. Code retour 1 si une divergence bloque.
      _Preuve_ : `deploy-doctor.test.ts` (faits simulés, puis `bind-global` suivi du doctor en lien
      et en copie, retouche à la main, lien retiré, rejeu qui répare).
- [x] Le profil `global` porte `ezk-bug`, `ezk-chef` (skill et agent) ; un test garantit que
      `global` couvre tout `ezk-*` du catalogue (c'est ce qui aurait attrapé le cas réel).
      _Preuve_ : `global-profile-covers-ezk.test.ts`, `expand.test.ts` mis à jour (22 skills,
      8 agents), tableau de `skills/README.md` corrigé.
- [x] Un ADR court acte la doctrine : le global porte l'équipe et le socle de loi ; la loi des
      bundles propres à un projet reste liée par projet.
      _Preuve_ : ADR-0056 (statut Proposé, à confirmer au merge).
- [x] La doc dit ce que `bind` et `bind-global` écrivent et n'écrivent pas.
      _Preuve_ : en-tête de `bin/lawgiver.ts`, tableau de `bin/README.md`, section de
      `profiles/README.md`.
- [x] Gate locale verte.
      _Preuve_ : voir la PR (typecheck, tests, suites bash, lint, liens, numéros d'ADR).

## Comment vérifier

```bash
T=$(mktemp -d)
pnpm ezk law doctor global --target "$T"          # cible vide : tout manque, code retour 1
pnpm ezk law bind-global global --link --target "$T"
pnpm ezk law doctor global --target "$T"          # tout vert, code retour 0
ls "$T/rules"                                     # iamthelaw.md
pnpm --dir products/mega-city exec vitest run law-coverage deploy-doctor apply-global-law
```

## Suite (hors de ce lot)

- Critères repris de la fiche absorbée `lawgiver doctor`, non livrés ici : `doctor --fix
  --copy|--link` (rejoue `bind-global`, mode obligatoire) ; orphelins gérés (liens vers un
  catalogue lawgiver, hors profil, sans jamais signaler un skill d'un autre outil) ; éléments du
  catalogue dans aucun profil, en sortie du doctor (le test de couverture du profil `global`
  garde déjà la famille `ezk-*`).
- Résorber les 20 règles en dette : les citer dans le prompt de l'agent, ou compiler par agent.
- Choisir quels bundles le global porte (aujourd'hui `base` seul, 6 règles ; `development` et
  `testing` n'arrivent que par `cop1-target`). Décision du PO, avec le coût en jetons.
- Lier vectorz lui-même (`lawgiver bind base . claude-code` : `.iamthelaw/` + pointeur dans
  `CLAUDE.md`).
- Marqueur de copie pour reconnaître les copies gérées (orphelins en mode copie).
- Retirer la loi quand un profil n'en porte plus ; `doctor` en gate avant une session.
- `bind-global` en mode copie refuse de rejouer sur des agents déjà copiés : fiche
  [[20260813095351680]]. En attendant, la réparation conseillée est `--link`.
- Rejouer `bind-global global --link` sur le poste : à faire par le PO, une fois ce lot mergé.

## Glossaire

- `cap` — la « capacité » de déploiement vers un hôte : elle transforme un profil résolu en
  fichiers à écrire.
- `enforcements` — dans une règle, ce qui la fait respecter : un agent qui la contrôle, un hook
  qui la vérifie, ou un simple rappel.
- `cliquet` — un test qui accepte l'état actuel mais interdit de l'aggraver.

## Notes / décisions

- Origine : question du PO sur `pnpm lawgiver bind-global global --link` le 2026-09-03 ; lecture
  du code des caps ; constat « 0 règle compilée ».
- Liens : [[20260902224608715]] (sa règle est effective par le texte, pas par la loi compilée) ;
  [[20260816151112162]] (lawgiver déploie les slash-commands) ; [[20260903134906920]] (`ezk law
  status` affiche l'état déployé).
- Absorbe [`20260823121712909`](done/20260823121712909_lawgiver-doctor-skill-non-materialise.md)
  (`lawgiver doctor`, tri du 2026-09-30) : lecture seule, copie et lien reconnus tous les deux ;
  le reste de ses critères est rangé dans « Suite ».
- DoR du 2026-10-01 (ezk-pm) : NO-GO d'abord (dépendance à nommer, périmètre trop large), corrigé
  ci-dessus.
- Priorité P1 : c'est la promesse centrale de LA LOI qui est en jeu.
