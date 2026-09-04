---
id: 0040
title: L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK)
type: chore
priority: P2
product: vectorz
epic: 0034
status: idea
pr:
created: 2026-07-16
---

# 0040 — L2 : durcir les garde-fous CI de séparabilité

## Contexte / Problème

Lot L2 de l'épic [0034](0034-mise-a-plat-post-pivot.md), requalifié **léger** par le
panel de merge (PR #10) : l'essentiel existe déjà — `tools/boundary/boundary.test.ts`
(scan d'imports bidirectionnel cop1 ⇸ mega-city, dans le `pnpm test` racine), CI avec
lint + build + test racine, couverture `@cop1/web`, steps standalone mega-city
(« host-agnosticity is proven mechanically », `ci.yml`). Restent **deux** manques réels
(ADR-025 §3 / ADR-027 §5). Actionnable **dès maintenant** (indépendant de la démo).

## Proposition

1. **Step CI nommé pour la frontière** : promouvoir `tools/boundary` en step visible du
   workflow (« boundary — cop1 ⇸ mega-city ») au lieu d'être noyé dans le test racine —
   un rouge de frontière doit se voir en un coup d'œil dans la PR.
2. **Allowlist des imports `@anthropic-ai/claude-agent-sdk`** : test qui borne la liste
   des fichiers autorisés à importer le SDK (état actuel = les adapters de session,
   ADR-026) — durcie ensuite par E1/L6 (0020) et étendue « zéro bmad » par E4
   ([0039](done/0039-e4-retrait-bmad.md) §5).
3. **NE PAS faire** (déjà là ou différé, cf. panel PR #10) : jobs `--filter` build par
   produit (mega-city n'a pas de script build ; `cop1` est le nom du package racine) ;
   check « config générée par bind committée » (différé à L9 — personne n'écrit encore
   `iamthelaw/global.yaml`).

## Critères d'acceptation

- [ ] La CI affiche un step nommé distinct pour la frontière ; il échoue isolément si un
      import croisé est introduit (test de sabotage joué puis revert)
- [ ] Test d'allowlist SDK vert ; l'ajout d'un import SDK hors liste fait échouer la CI
      (sabotage joué puis revert)
- [ ] Aucun job existant cassé ; durée CI ≈ inchangée
- [ ] Gate locale verte

## Notes / décisions

Q4 d'ADR-027 confirmée de facto : scan vitest maison (zéro devDep), pas de
dependency-cruiser. Fiche créée au checkpoint du 2026-07-16 (le lot L2 n'avait pas de
fiche porteuse — critère « chaque lot traçable » de 0034).
