---
id: "20261117155515200"
title: "`ezk pr emit-local` garde chaque `--validation`, au lieu de la dernière"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [pr, outillage]
status: shipped
blocked:
pr: "local (604e5a50)"
evidence: none # une commande qui écrit un fichier, aucun écran modifié
created: 2026-11-17
---

# 20261117155515200 — `ezk pr emit-local` garde chaque `--validation`, au lieu de la dernière

**En clair.** Le 17 novembre, quatre corps de PR locaux ont perdu leurs lignes « tests » et « revue ».
La commande `ezk pr emit-local` reçoit l'option `--validation` plusieurs fois, et elle ne garde que la
dernière valeur, sans rien dire. On garde chaque valeur passée ; le corps de PR dit alors tout ce qui a
été validé.

**Si tu arrives frais.** En flux local (`github: false`), `ezk pr emit-local` écrit le corps de PR dans
`features/pr-local/<id>_<slug>.md` : c'est le livrable durable d'une story. Sa matrice « Validation »
vient de `--validation "Modalité=Statut,Modalité=Statut"` (`products/mega-city/bin/pr-emit-local.ts`).

## Contexte / Problème

- Appel du 17 novembre : `--validation "Gate mega-city=✅ …" --validation "Revue ezk-reviewer=✅ …"
  --validation "Before / after (UI)=N.A. — …"`. Le fichier écrit n'a gardé que la ligne « Before / after ».
- Les quatre corps touchés ont été réparés à la main (a2cf6571).
- La forme à virgules marche, mais une virgule dans un statut le coupe en deux (vu le même jour).

## Proposition

`--validation` répété ajoute ses paires à la matrice, dans l'ordre. Une virgule à l'intérieur d'un
statut ne coupe plus la paire quand l'option est répétée.

## Critères d'acceptation

- [x] Deux `--validation` donnent les lignes des deux, dans l'ordre de la commande.
- [x] La forme à virgules d'un seul `--validation` marche comme avant.

## Comment vérifier

```bash
# un test neuf du lecteur d'options de bin/pr-emit-local.ts (aucun n'existe le 17 novembre)
ezk pr emit-local --fiche <fiche> --validation "A=✅" --validation "B=✅"   # la matrice a les lignes A et B
```

## Notes / décisions

- Livrée le 2026-11-17, écrite par l'orchestrateur. Critères prouvés par ezk-reviewer (GO) : deux `--validation` donnent deux lignes dans l'ordre, une virgule dans un statut ne le coupe plus ; la forme à virgules d'une seule option marche comme avant. Lecteur pur dans `src/pr-body/validation-args.ts`.

- Origine : [rétro de fin de run du 17 novembre](../../docs/captures/2026-11-17-retro-fin-de-run-coupe-de-version.md), proposition P1.
- Priorité P1 tranchée par ezk-pm le 17 novembre, par délégation du PO.
- Mesure (retirabilité) : 0 corps de PR sans ligne de revue sur les 5 prochains.
