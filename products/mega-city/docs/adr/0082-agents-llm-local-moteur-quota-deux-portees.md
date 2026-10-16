# 0082 — Agents de la méthode sur LLM locaux : moteur quota, deux portées, provenance hors des fichiers d'agents

- Statut : **Accepté** (2026-10-16) — principes actés, **implémentation différée**. Ratifié par **panel adverse** (5 lentilles : architecte, dev, PO coût, reviewer qualité, juge) ; arbitrage PO (moteur = quota).
- Date : 2026-10-16
- Cadrage : [spike — agents sur LLM locaux](../spikes/2026-10-16-agents-sur-llm-local-cadrage.md)
- Lié : [ADR-074](../../../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) (config à deux portées) · [ADR-0047](0047-multi-client-cursor-et-modeles-par-hote.md) / [ADR-0048](0048-contenu-mono-source-modele-en-surcouche.md) (modèles & surcouche par hôte) · [ADR-0070](0070-le-tirage-reste-dans-la-version-en-cours.md) · ADR-0013 (sur-construction sans preuve d'usage) · [fiche 0023](../../../../features/done/0023-exposer-model-tiering-config.md) (`model_tiering` vs provenance locale) · [fiche résolveur](../../../../features/20261013132218242_config-modeles-schema-et-resolveur-pur.md)

## En clair

On a décidé **si** et **comment** faire tourner certains agents de la méthode sur tes **LLM
locaux**. Le **pourquoi** retenu : **soulager le quota Max**. Une exécution locale tourne sur ta
machine, elle est **gratuite** ; le seul prix est le **temps**. Tu gardes le quota de l'abonnement
pour les rôles qui comptent. On fixe ici **cinq principes**. On **ne construit rien encore** : le
seul candidat honnête est un unique rôle, et l'implémentation attend des verrous nommés.

## Contexte

- **La contrainte est dure.** Claude Code applique le fournisseur à **toute la session**
  (`ANTHROPIC_BASE_URL`) ; le champ `model` d'un agent n'accepte que des aliases Claude. Router un
  sous-agent vers un fournisseur local **dans** la session n'existe pas en natif
  ([issue #38698](https://github.com/anthropics/claude-code/issues/38698), ouverte, sans date). Tout
  routage par fournisseur vit donc **hors-session**.
- **Le coût n'était pas le bon axe.** Première analyse : « sur Max, Haiku moins cher suffit ». Faux
  cadrage. Le local est **gratuit** ; la vraie monnaie est le **temps** (plus lent) et la
  **confiance** (modèle plus faible, qui peut répondre faux sans erreur).
- **Un vrai besoin PO** : décharger le travail de base sur du compute gratuit, pour épargner le
  quota Max — en acceptant que ce soit plus lent.
- **Un piège déjà repéré** : trois rôles « mécaniques » (qa, steward, archive) sont en réalité les
  **garde-fous** de la méthode ; archive est déjà **pin Opus** pour son jugement (fiche 0023 pose
  déjà `model_tiering` Claude ≠ provenance locale).

## Décision

### 1. Le moteur : soulager le quota (la confidentialité plus tard)

Le motif retenu **aujourd'hui** est le quota. La **confidentialité** (données qui ne sortent pas de
la machine) est un second moteur, **traité en surcouche par projet, plus tard** — pas maintenant.

### 2. Deux portées : défaut global + réglage par projet

Un **défaut global** (côté poste / outil) et un **réglage par projet** (`.vectorz/config.yml`).
C'est la mécanique **à deux portées** déjà posée par [ADR-074](../../../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md)
et le résolveur pur ; on n'invente pas un second système.

### 3. Le repli **découle du moteur**

- **Défaut (quota)** : **fail-open**. Si le local échoue, repli vers Claude **autorisé** — tu
  dépenses un peu de quota, le run continue. Tu voulais économiser, pas interdire.
- **Projet confidentiel** : **fail-closed**. Si le local échoue, on **s'arrête** ; rien ne sort.
  Jamais de repli vers un tiers.

Un seul réglage par projet décide des deux comportements. Le **repli automatique systématique vers
Claude est rejeté** comme règle unique : il contredit le moteur confidentialité.

### 4. « local » est une **provenance**, pas un modèle — hors des fichiers d'agents

L'estampille « local » **n'entre pas** dans le frontmatter committé d'un agent. Elle vit dans une
**surcouche** (env / couche par hôte, réutilise [ADR-0047](0047-multi-client-cursor-et-modeles-par-hote.md) /
[ADR-0048](0048-contenu-mono-source-modele-en-surcouche.md)). Raison : un frontmatter qui porte
« local » **ment** aux autres hôtes (Cursor le relirait comme du Claude) et casse la séparation de
la [fiche 0023](../../../../features/done/0023-exposer-model-tiering-config.md). Le **défaut
committé reste tout-Claude**.

### 5. Faiseurs seulement, jamais les contrôleurs

- **Faiseur** = produit un travail que **quelque chose vérifie ensuite**. `ezk-dev` écrit du code,
  les tests le valident → **candidat local**.
- **Contrôleur** = le filet de sécurité : `ezk-qa` (écrit la Definition of Done, pilote l'E2E),
  `ezk-reviewer` (GO / NO-GO), `ezk-archive` (jugement, note lue par l'humain), `ezk-steward`,
  `ezk-pm`, `ezk-architect` → **jamais en local**.

Candidat honnête aujourd'hui : **`ezk-dev` seul**. « local-safe » dépend aussi du **modèle local
précis** (à épingler par digest), pas seulement du rôle.

### 6. Différé derrière des verrous

On **ne construit pas** tant que ces verrous ne sont pas levés :

1. **Signal réel de pression quota** — sinon YAGNI (ADR-0013).
2. **`ezk-dev` qualifié « local-safe »** — golden-set par rôle (local vs Claude-juge), seuil de
   passage, **rejoué à chaque changement de modèle local**.
3. **Architecture tranchée en panel** — routeur **local** fail-closed (variante locale de A) ou
   sessions 100 % locales (B) ; **jamais** un proxy tiers cloud. Si [#38698](https://github.com/anthropics/claude-code/issues/38698)
   est livrée (routage natif par fournisseur), le routeur devient inutile.
4. **Observabilité** — le passage en local doit s'**inscrire dans le journal de supervision**
   existant (`run_start` / gate) ; un hop invisible = débogage aveugle.

### Doctrine

Dépendance au local = un **opt-in**, défaut tout-Claude. On construit → prouve → retire ; on ne
bâtit pas un moteur parce qu'il est élégant (ADR-0013).

## Options considérées

| Option | Verdict |
|---|---|
| **A** — Bâtir un routeur par rôle maintenant | ❌ Différé. Routeur non officiel fragile (#38698 en vol), aucune qualif qualité, hop opaque. |
| **B** — Sessions 100 % locales par lot | ⚠️ Gardée **pour la confidentialité** (fail-closed naturel), pas comme défaut : perd l'orchestrateur unique. |
| **C** — Graver les principes maintenant, implémentation différée derrière verrous | ✅ **Retenu**. Fixe l'axe (temps/confiance), le repli par moteur, la provenance hors fichiers, la règle faiseurs — sans sur-construire. |
| **D** — Ne rien faire | ❌ Le besoin (soulager le quota) est réel ; laisser le sujet flou invite au bricolage. |
| Estampille « local » dans le frontmatter committé | ❌ Rejetée (ment aux autres hôtes, casse la portabilité et la fiche 0023). |
| Repli automatique systématique vers Claude | ❌ Rejeté (casse le moteur confidentialité) → remplacé par le **repli selon le moteur**. |

## Conséquences

- ✅ Le **pourquoi** est clair : l'axe est **temps + confiance**, pas l'argent. Le local est gratuit.
- ✅ Le **repli cesse d'être un dilemme** : il découle du moteur, donc c'est un **réglage par projet**.
- ✅ **Portabilité préservée** : « local » reste hors des artefacts committés ; les autres hôtes ne
  lisent jamais un faux modèle.
- ✅ Les **contrôleurs restent sur Claude** : le filet de sécurité n'est pas aveuglé par un modèle faible.
- ⚠️ **Rien n'est bâti** : candidat honnête = `ezk-dev` seul ; l'implémentation est derrière les 4 verrous.
- ⚠️ **Qualité** : le repli n'attrape que les pannes **franches**. Une réponse locale *fausse mais
  confiante* passe quand même → la qualif par rôle (verrou 2) est obligatoire avant toute estampille.
- 🔁 **Réversible** : défaut tout-Claude ; retirer la surcouche = retour exact à l'état actuel
  (test : table de routage identique avec / sans surcouche).
- 🔁 **#38698 livrée** → le routeur devient inutile ; rouvrir l'architecture.
