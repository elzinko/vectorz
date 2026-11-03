# ADR 0087 — Un skill ou un agent lit ses règles au démarrage, par `ezk law show <objet>`

**Statut :** Accepté (run autonome du 2026-11-03, porte « prête » tranchée par ezk-pm sous délégation du PO)
**Date :** 2026-11-03
**Deciders :** ezk-pm, sous la délégation du PO (« continue sans mon intervention »)
**Fiche :** [Chaque skill et chaque agent lit ses règles au démarrage](../../../../features/20261102103553108_chaque-skill-lit-ses-regles-a-l-usage.md)
**Amende :** [ADR-0056 — La loi du socle voyage par le global](0056-loi-du-socle-par-le-global.md)

## En clair

Des skills et des agents citaient 17 règles qu'aucune loi installée ne portait : ils ne les lisaient
jamais. On ne grossit pas la loi globale, qui reste au socle. Chaque skill ou agent qui déclare des
règles ouvre son texte par une ligne qui lance `ezk law show <objet>`. La commande lui sert le texte
complet de ses règles absentes de la loi installée, au moment où il démarre.

## Contexte

- ADR-0056 compile le seul bundle `base` dans `~/.claude/rules/iamthelaw.md`, pour garder chaque
  session légère. Il laisse au PO la décision d'élargir cette loi.
- `ezk law show` comptait, le 2026-11-02, 17 règles « citées sans être installées ». Elles vivent
  dans cinq autres bundles, que seul le profil `cop1-target` déploie.
- Les ajouter à la loi globale coûterait environ 7 500 jetons de plus à chaque session, sur tous les
  projets, même hors développement.

## Décision

Une troisième voie s'ajoute aux deux d'ADR-0056 :

```
loi globale     règle du socle  → ~/.claude/rules/        → lue par toute session
loi du projet   règle du projet → .iamthelaw/ENTRY.md     → lue dans ce projet
au démarrage    règle citée     → ezk law show <objet>    → lue quand l'objet démarre
```

1. `ezk law show skill:<id>` ou `agent:<id>` affiche les règles de l'objet. Une règle déjà installée
   tient sur une ligne ; les autres sont données en texte complet. `--json` suit le contrat
   `contracts/law-object/v1/`.
2. Les 11 objets qui déclarent des règles ouvrent par « **Avant d'agir, lis tes règles :**
   `ezk law show <objet>` ». Un test fait tomber la gate si un objet qui déclare des règles n'a pas
   cette ligne avant sa première section.
3. La carte de la loi gagne une portée, `demarrage` : installée nulle part, lue au démarrage par un
   objet qui la cite. Une règle citée seulement par des objets sans la ligne reste `citee`.
   `schema_version` reste à 1 : la portée et son compte s'ajoutent, aucun champ ne disparaît.

## Coût mesuré

Mesure du 2026-11-03, avec la loi globale installée (ses 10 règles tiennent sur une ligne chacune),
au repère d'ADR-0056 (16 Ko font environ 4 000 jetons) :

| Objet | Sortie | Jetons environ |
|---|---|---|
| `agent:ezk-reviewer` (le plus lourd) | 7 705 octets | 1 900 |
| `agent:ezk-dev` | 7 700 octets | 1 900 |
| `skill:ezk-sprint` | 6 540 octets | 1 600 |
| `skill:ezk-ezk`, `skill:ezk-pr` (les plus légers) | 225 octets | 60 |

Le coût n'est payé que par une session qui lance l'objet. L'option écartée coûtait 7 500 jetons à
chaque session.

## Conséquences

- Une règle qu'un skill déclare appliquer arrive dans la session où il travaille.
- La loi globale garde ses 10 règles : rien ne change dans les bundles ni dans les profils.
- Mission control montre le nouveau compteur « lues au démarrage » dans sa vue « Loi ».
- **Réversible** : retirer les 11 lignes et le verbe `ezk law show <objet>` ramène à l'état
  d'avant. Si une mesure montre qu'une session paie plus que les 7 500 jetons de l'option écartée,
  on revient à « élargir la loi globale », décision du PO.
