---
id: agent-ops/preuve-mince-question-pas-veto
kind: disposition
level: SHOULD
title: Une preuve mince est une question à instruire, pas un veto
---

- Quand une fiche, une recette ou un build n'a qu'**un seul cas** pour preuve, ce n'est pas un motif
  de refus. Le nombre de cas (« preuve dans ≥ 2 repos », « règle de trois ») est une **question à
  instruire** — « pourquoi pas maintenant ? » —, dont la réponse se **journalise dans la fiche**
  (ADR-0013, amendement du 2026-08-24). Motif PO : « je suis en mesure de savoir ce qui va me servir
  en avance ».
- Au **grooming** comme en **panel adverse**, la minceur de preuve se **signale** et se discute ; elle
  ne **bloque** jamais toute seule. Le PO tranche ; sa décision d'agir sur un seul cas est valable dès
  qu'elle est journalisée. Ne re-pose pas le veto à chaque session : l'amendement a déjà retiré l'interdit.
- **Déclarer n'est pas extraire.** Déclarer un artefact — une recette, un contrat — est bon marché, et
  c'est ce qui rend la découverte possible : on déclare tout de suite. Le gate du 2e cas ne vise que
  l'**extraction d'un moteur générique** (le méta-outillage qu'encadre l'ADR-0013), jamais la simple
  déclaration.
- Origine : panel recettes du 2026-10-27 — un panel a re-bloqué une fiche sur « attends un 2e cas », en
  ignorant que l'amendement ADR-0013 (décision PO du 2026-08-22) avait déjà retiré ce veto. La règle
  dormait dans l'ADR, invisible au point d'usage ; elle vit désormais dans la loi.
- Mesure (removability) : sur les 5 prochains panels ou groomings qui rencontrent une preuve mince,
  0 cas où elle est posée comme un refus sans que le PO ait tranché ; et 0 fiche de simple déclaration
  bloquée au nom du gate du 2e cas.
