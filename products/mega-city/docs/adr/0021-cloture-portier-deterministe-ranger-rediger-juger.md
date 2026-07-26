# ADR 0021 — La clôture délègue le *jugement*, pas la *rédaction* : un portier déterministe décide

- Statut : **Accepté** — 2026-07-26 (fiche [0088](../../features/0088-ezk-archive-cout-cloture-session-disciplinee.md), arbitrage PO du 2026-07-26)
- Portée : `skills/ezk-archive/` (SKILL.md, `scripts/check.sh`, nouveau `scripts/handoff.sh`,
  nouveau `references/handoff-template.md`), `agents/ezk-archive.md`
- Liens : [ADR-0001](0001-monorepo-composable-coeur-deterministe.md) §2 (cœur déterministe),
  fiche [0076](../../features/done/0076-hygiene-branches-post-squash.md) (classification
  des branches post-squash), fiche [0026](../../features/done/0026-ezk-archive-persiste-handoff.md)
  (persistance du handoff, non régressée), `rules/token-economy/read-once.md`

## Contexte

`/ezk-archive` est invoqué **à chaque fin de session**. Mesure directe sur les transcripts
des **4 runs** disponibles : entre **210 862 et 244 688 tokens neufs** pour le seul
sous-agent (hors `cache_read`), 9 à 29 appels d'outils, 2 à 6 minutes.

La ventilation montre que le coût ne vient pas d'abord du *travail* :

- **~53 k de plancher au premier tour** — prompt système + toolbox héritée en entier
  (l'agent n'a pas de champ `tools:` restreint), payés avant toute action utile ;
- le reste s'accumule en `cache_creation` **à chaque tour** (19 tours ⇒ 141 k, 54 ⇒ 220 k) ;
- d'où un run à **9 outils qui coûte déjà 210 k**, soit 86 % d'un run à 29 outils.

**Réduire le nombre de vérifications ne suffit donc pas.** Sur une session disciplinée —
et `ezk-product-builder` ferme chaque sprint au fil de l'eau — 5 des 7 points répondent
« rien à faire » *par construction*, et le seul verdict produit le 2026-07-25 était un
**faux positif** (« `main` diverge réellement ») dont la réfutation a coûté 6 commandes de
plus. Deuxième occurrence en deux jours.

La cause est structurelle, pas accidentelle : le skill sérialisait ~60 lignes de résumé
pour un sous-agent **amnésique**, qui redérivait ensuite l'état git déjà connu et rendait
231 lignes largement reconstructibles depuis le prompt qu'on venait de lui écrire. On
payait deux fois le même savoir. La chaîne violait frontalement sa propre règle
`token-economy/read-once.md` (niveau MUST).

L'invariant en place — *« ce skill ne fait QUE déléguer »* — était posé pour une bonne
raison (figer modèle/effort indépendamment de la session), mais **à la mauvaise
granularité** : il traitait identiquement deux actes qu'ADR-0001 §2 sépare déjà.

## Décision

### 1. Le partage se dit en trois verbes, pas en « déléguer / ne pas déléguer »

| Verbe | Qui | Quoi |
|---|---|---|
| **Ranger** | le **script** | classer une branche, prouver une divergence, faire tourner le handoff, écrire un fichier |
| **Rédiger** | la **session appelante** | le récit du livré, les faits durables, les candidats — elle seule a la matière |
| **Juger** | le **sous-agent** | cette branche RÉELLE est-elle un brouillon supersédé ou du travail à récupérer ? |

L'invariant devient **« ce skill ne *juge* jamais lui-même »**.

Ce qui tranche la question de la rédaction n'est pas « c'est du gabarit » : c'est que le
sous-agent est **amnésique**. Il ne peut que *recopier* ce que l'appelant vient de lui
écrire. Déléguer la rédaction n'achète pas un meilleur rédacteur — ça achète un relais
dont on paie le prompt d'entrée **et** la sortie. Le modèle/effort figés ne valent que là
où la qualité dépend du modèle : le jugement.

### 2. `check.sh` devient un **portier** : il décide, il ne se contente plus de rapporter

Une seule collecte, deux rendus : `--gate` (bloc machine, défaut) et `--full` (humain).
Le gate rend `VERDICT: CLEAN` ou `DIRTY points=<⊂{1,2,3,4}>`, et **n'émet aucun fait pour
un point CLEAN** — ~12 lignes sur une session propre, contre 120 auparavant.

**Règle centrale : CLEAN uniquement sur preuve positive.** Tout `UNKNOWN`, toute sonde en
erreur, tout dépassement de borne ⇒ DIRTY. Un faux CLEAN ferait sauter la délégation *et*
son rattrapage : c'est le seul risque grave de cette décision.

Le verdict passe par **stdout, jamais par le code retour** (exit 0 sur CLEAN comme sur
DIRTY) : un exit ≠ 0 serait rendu comme une *erreur* par l'outil Bash et inviterait le LLM
à enquêter — précisément le gaspillage qu'on supprime.

### 3. L'appelant **déclare**, le script **vérifie** — et sans déclaration, pas de raccourci

`--shipped <ids>` porte ce que la session affirme avoir livré ; le portier le vérifie
fiche par fiche (`features/done/`, `status: shipped`, `pr:` non vide). **Absent ⇒
`P3_BACKLOG: UNKNOWN` ⇒ DIRTY.**

C'est le mécanisme de non-régression, et il est **structurel** : une session qui n'a pas
tenu ses comptes ne *peut pas* déclarer, donc elle reçoit toujours le rituel complet —
le cas où il paie. Le régime allégé n'est atteignable que par une affirmation explicite,
vérifiée.

### 4. La garde anti-faux-positif est un **deuxième appel**, pas un algorithme neuf

`classify_branch` est paramétrée en `classify_ref <base> <ref>`. La synchro `main` vs
`origin/main` réutilise donc **tel quel** l'algorithme déjà écrit et déjà testé par la
fiche 0076 (fenêtre post-fourche bornée + exigence que le commit *contienne* encore le
blob, adverses du finding Codex PR #31 compris).

- `ahead=0` ⇒ `IN_SYNC`/`BEHIND` : le mot « diverge » devient **structurellement impossible**.
- `ahead>0` ⇒ preuve de contenu : `AHEAD_ABSORBED` (resync sûr) ou `DIVERGED_UNPROVEN`.
- ref périmée, ou trop gros (>50 commits / >200 fichiers) ⇒ `UNKNOWN`, jamais `AHEAD_ABSORBED`.

Le `diffstat` two-dot est émis comme **fait étiqueté heuristique** — il ne décide de rien ;
seule la preuve blob-landed décide.

### 5. Le handoff est borné par un **anneau FIFO**, pas par une purge conditionnelle

L'ancienne purge attendait qu'une entrée soit « ENTIÈREMENT résolue » — une condition qui
dépend d'un **événement externe**. Deux branches pending depuis six jours suffisaient à la
bloquer : le fichier ne faisait que grossir (20 Ko, relu **deux fois** et réécrit à chaque
run). `handoff.sh` garde N entrées (défaut 3) et pousse les plus anciennes dans
`.claude/handoff.archive.md`. Rien n'est jamais supprimé.

Ce qui empêche de perdre un report malgré la rotation : `handoff.sh carry` remonte la
section `**Pending` de l'entrée la plus récente (bornée à 40 lignes). Le rédacteur écrit
**l'union** des pendings *non-git* (via `carry` — personne d'autre ne s'en souvient) et
des pendings *git* (via le gate — recalculés live, les recopier les périmerait).

> Le gain n'est pas la taille du fichier, c'est de **ne plus le lire**. Un fichier de
> 20 Ko qu'on ne lit jamais coûte 0.

## Conséquences

**Positives**

- Cible de clôture CLEAN : **≤ 28 000 tokens neufs et ≤ 6 appels d'outils** (contre 234 684 / 27).
- La 3ᵉ occurrence du faux positif « `main` diverge réellement » est rendue impossible,
  vérifiée par un test (`test-mainsync.sh` M3) — et avec elle, la perte de confiance dans
  le verdict, qui était le vrai coût.
- Le bruit regex de `check.sh` disparaît : il représentait **96 lignes sur 120** de sa
  sortie, et croissait avec le handoff.
- Le geste le plus cher de la chaîne (injecter le SKILL `ezk-backlog`, ~27 Ko, *dans* un
  sous-agent) n'a plus lieu que si le point 3 est réellement DIRTY.

**Négatives, assumées**

- **Deux chemins de clôture existent désormais** — c'est le risque de dérive que l'ancien
  invariant prévenait. Mitigé par une contrainte *vérifiable* plutôt qu'une consigne : le
  gabarit vit dans `references/handoff-template.md`, et `test-template-unicity.sh` échoue
  si l'un des deux chemins le recopie.
- **Le chemin inline dépense ses tokens dans le contexte de session**, potentiellement plus
  cher au token que sonnet. Le facteur ~30 le compense largement, et ces tokens sont
  dépensés dans un contexte qu'on **ferme** — sans coût aval. Soupape : `run --delegate`.
- **`check.sh` a été restructuré** (collecte → émission) : c'est le vrai risque
  d'implémentation. Mitigé par `--full` qui rend depuis les *mêmes* variables, plus les
  9 cas de `test-check-gate.sh` et les 12 assertions conservées de `test-check-branches.sh`.

**Neutres**

- Les DoD bash du repo se lancent enfin ensemble (`pnpm test:scripts`, 6 suites) — ils
  existaient mais se lançaient à la main.
- La mesure « après » n'est valide qu'**après merge sur `main`** : `~/.claude/skills/ezk-archive`
  est un symlink vers l'arbre principal.

## Précisions imposées par la revue (Codex, PR #56)

La revue a produit 6 findings P1 retenus. Deux touchent la **substance de la décision** et
sont consignés ici ; les autres sont des défauts d'implémentation corrigés dans la PR.

**1. « Preuve de contenu » signifie « au même chemin ».** `blob_landed` cherchait le blob
*n'importe où* dans un commit de la fenêtre. Suffisant pour les branches (fiche 0076, où le
verdict ne déclenche qu'une suppression de branche récupérable par reflog), mais **pas** pour
`MAINSYNC`, dont la conclusion `resync_safe=1` invite à un `reset --hard`. Un fichier local
unique dont le contenu existe en amont **sous un autre nom** était déclaré absorbé — et le
cas dégénéré est banal : **tous les fichiers vides partagent le même blob**. La preuve exige
désormais que le contenu ait atterri **au chemin attendu**. Effet de bord heureux : cela
remplace le `ls-tree | grep` qui servait à exclure le commit ayant *retiré* le blob.

**2. Le préfixe d'un id désigne un backlog, il ne décore pas un numéro.** Dans ce monorepo,
**62 numéros existent des deux côtés** (`features/0005-…` et
`products/mega-city/features/0005-…`). Jeter le préfixe et retenir le premier match global
pouvait donc prouver `CLEAN` sur la fiche voisine, exactement là où le préfixe servait à
lever l'ambiguïté. La résolution suit maintenant la convention déjà posée par
`bin/plan-head.ts` (ADR-0017 A13) — l'emplacement fait le produit, le préfixe distingue
l'id — et **refuse de conclure** quand elle est ambiguë, plutôt que de deviner.

Les deux corrections vont dans le même sens que la règle centrale de cet ADR : *CLEAN
uniquement sur preuve positive*. Elles montrent aussi que la règle ne suffit pas si les
preuves elles-mêmes sont trop lâches — c'est le contrôle adverse qui l'a révélé, pas le
raisonnement initial.

## Alternatives écartées

- **Garder la délégation systématique et n'alléger que le sous-agent.** Le plancher de
  ~53 k par invocation et l'accumulation par tour plafonnent le gain vers 3-5× ; la mesure
  du run à 9 outils (210 k) montre que le levier décisif est de *ne pas invoquer*.
- **Tronquer les vieilles entrées de handoff à leur seule section Pending.** Garde N copies
  périmées de la même liste, alors que le pending vivant est déjà ré-émis depuis le portier.
- **Faire porter le verdict par le code retour.** Rendu comme une erreur par l'outil Bash,
  il déclencherait l'enquête qu'on cherche à éviter.
