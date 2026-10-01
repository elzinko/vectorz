# Gabarit de la capture de rétro — SOURCE UNIQUE

Ce gabarit est lu par `ezk-retro` au temps 5 de la cérémonie. Il fixe le **format** de la capture.
Il ne doit exister **qu'ici** : le recopier dans `SKILL.md` ferait diverger les deux copies.

La règle de clarté [`human-facing-lisibility`](../../../rules/documentation-guidelines/human-facing-lisibility.md)
garantit le **texte** dans ce format : ouvrir par « En clair », phrases courtes, jargon en annexe.
Le gabarit seul ne rend rien lisible.

**En clair :** chaque rétro laisse un fichier dans `docs/captures/`. Son **en-tête** liste les
décisions, pour qu'un script les relise sans deviner. Son **récit** raconte le débat, pour que le PO
le relise des mois plus tard. Le PO remplit lui-même la case de chaque décision.

---

## Le fichier

Nom : `docs/captures/AAAA-MM-JJ-retro-<slug>.md`. Le préfixe date + `-retro-` est ce qui permet à
`pnpm --dir products/mega-city retro:captures` de la retrouver.

## L'en-tête (lu par le script)

```yaml
---
type: retro
date: AAAA-MM-JJ
theme: "le sujet de la rétro, en une ligne"
scope: "ce qui a été passé en revue"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "la proposition, en mots simples"
    kind: regle
    target: global
    by: [architecture, qualite]
    status: ⏳
---
```

| Champ | Obligatoire | Valeurs |
|---|---|---|
| `type` | oui | `retro` |
| `date`, `theme`, `scope` | oui | date `AAAA-MM-JJ`, deux textes non vides |
| `participants` | non | liste de lentilles ou de rôles |
| `actions` | oui, au moins une | une entrée par proposition retenue ou écartée |
| `proposition` | oui | texte non vide, en mots simples |
| `kind` | oui | `regle`, `feature`, `action`, `spike` ou `recette` |
| `target` | oui pour une `regle` | `global`, `agent:<nom>` ou `skill:<nom>` |
| `by` | non | qui a proposé : les lentilles du tour 1 |
| `status` | oui | `⏳` en attente, `✅` retenue, `❌` écartée |
| `decision` | oui si `✅` ou `❌` | ce que le PO a décidé, et où cela atterrit |
| `date` (de l'action) | oui si `✅` ou `❌`, **interdite** si `⏳` | date de la décision |

## Le récit (lu par l'humain)

```markdown
**En clair :** <≤ 3 phrases : le symptôme vécu, ce qui a été retenu, ce que le PO doit trancher>

## 1 · Les faits de départ
Une ligne par symptôme observé, vérifiable dans l'historique.

## 2 · Tour 1 — chaque lentille propose
Qui a proposé quoi, par lentille.

## 3 · Tour 2 — confrontation et convergence
Ce qui a fusionné, ce que son auteur a retiré, ce qui a été écarté et pourquoi.

## 4 · Le juge de cohérence
Un verdict par proposition : cohérente, doublon ou contradiction.

## 5 · Ce qui est proposé au PO
Pour chaque proposition : le fait vécu, la proposition, la mesure.

## 6 · Suivi des décisions de la rétro précédente
Pour chaque décision de la rétro d'avant : a-t-elle tenu, faut-il la retirer, est-ce trop tôt ?
(Première rétro : « sans objet ».)

## 7 · Décisions du PO
| Proposition | Décision | Date |
|---|---|---|
(Reflète l'en-tête. Remplie par le PO, jamais pré-remplie.)

## 8 · Glossaire
Les termes d'équipe, traduits.
```

## Les quatre règles qui comptent

1. **La case du PO n'est jamais pré-remplie.** Une action naît `⏳`, sans décision ni date.
   Le PO tranche, puis on passe à `✅` ou `❌`, avec sa décision et la date. Le script refuse un
   `✅` ou `❌` sans décision ni date, et un `⏳` daté.
2. **L'en-tête et le tableau « Décisions du PO » disent la même chose.** L'en-tête est la source
   pour le script, le tableau est la lecture pour l'humain. Si l'un bouge, l'autre bouge.
3. **Une règle porte une cible.** Le fichier de règle entre toujours dans `rules/<catégorie>/` et
   dans un bundle : le bundle **déploie le texte**, et il vaut pour tout le profil. La **portée**
   se déclare à part. `global` : rien de plus. `agent:<nom>` : l'id de la règle s'ajoute à
   `interactions:` de l'agent. `skill:<nom>` : il s'ajoute à `applies:` du skill. Ce lien dit **qui**
   suit la règle : `graph:query applique <règle> --inverse` ne rend que la cible.
4. **Une `feature` se propose quand le symptôme est structurel** : il revient, et une règle de
   discipline ne suffit pas à l'éteindre. Elle part au backlog par `ezk-backlog add`. L'écarter se
   trace aussi : la capture dit pourquoi.

## Valider avant la PR de rangement

```bash
pnpm --dir products/mega-city retro:captures --check docs/captures/AAAA-MM-JJ-retro-<slug>.md
```

La PR de rangement **cite la capture** dans son corps : c'est la trace qui relie chaque règle au
débat qui l'a produite.
