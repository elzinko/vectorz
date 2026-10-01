import { TERMINAUX } from '../core/fiche-schema.js';
import { frontMatter, readField, readListField } from '../loaders/fiches.js';
import {
  type RepoFs,
  ShipRefusal,
  type ShipPlan,
  type ShipSeams,
  planShip,
  setFrontMatter,
} from './ship-fiche.js';

/**
 * aggregate-apply — appliquer pour de vrai une fusion ou un découpage (fiche 20260910231201744,
 * ADR-0051 : « un geste séparé applique »).
 *
 * En clair : `aggregate` PROPOSE, le PO tranche, CE geste applique. Il ne refait pas la transaction de
 * livraison : il la RÉUTILISE (`planShip` : liens recalés, `PLAN.md` barré, `git mv` vers `done/`,
 * refus avant d'écrire) avec le statut `merged` ou `split`, et y ajoute ce qui lui est propre :
 *   - la PROVENANCE dans les deux sens (le validateur en contrôle la réciprocité) ;
 *       fusion    : sources `merged_into: "<id>"`, résultante `merged_from: [...]` ;
 *       découpage : source `split_into: [...]`, enfants `split_from: "<id>"` ;
 *   - ses propres préconditions, rapportées TOUTES d'un coup (jamais une seule à la fois).
 *
 * La résultante (ou les enfants) reste active, jamais déplacée : elle doit EXISTER (créer = `add`).
 * PUR (ADR-0003) : l'état du dépôt est injecté (`RepoFs`) ; l'écriture et le retour arrière sont
 * ceux d'`applyShip`, inchangés.
 */

export type ApplyGesture =
  | { kind: 'merge'; into: string; sources: string[] }
  | { kind: 'split'; source: string; into: string[] };

export interface ApplyOptions {
  /** Barrer l'entrée de `PLAN.md` des fiches déplacées (par défaut) ; sinon le plan refuse si elle reste. */
  barPlan?: boolean;
  seams?: ShipSeams;
}

/** Même lecture d'id que le loader : le préfixe numérique du nom de fichier. */
const FICHE_PATH = /^features\/(done\/)?(\d{4,})[-_].+\.md$/;

function indexFiches(fs: RepoFs): Map<string, string> {
  const index = new Map<string, string>();
  for (const path of fs.markdownFiles()) {
    const match = FICHE_PATH.exec(path);
    if (match) index.set(match[2], path);
  }
  return index;
}

const duplicates = (ids: readonly string[]): string[] => [
  ...new Set(ids.filter((id, i) => ids.indexOf(id) !== i)),
];

const quote = (id: string): string => JSON.stringify(id);
const listOf = (ids: readonly string[]): string => `[${ids.map(quote).join(', ')}]`;

export function planAggregateApply(
  fs: RepoFs,
  gesture: ApplyGesture,
  options: ApplyOptions = {},
): ShipPlan {
  const reasons: string[] = [];
  const index = indexFiches(fs);
  const paths = new Map<string, string>(); // id → chemin, pour les fiches ACTIVES trouvées

  /** Une fiche engagée doit exister, rester sous `features/` et ne pas être livrée ou close. */
  const needActive = (id: string, role: string): void => {
    const path = index.get(id);
    if (path === undefined) {
      reasons.push(`${id} : aucune fiche trouvée (${role})`);
      return;
    }
    if (path.startsWith('features/done/')) {
      reasons.push(`${id} : déjà dans features/done/, livrée ou close (${role})`);
      return;
    }
    const status = readField(frontMatter(fs.read(path)), 'status') || 'idea';
    if (status === 'shipped' || TERMINAUX.includes(status)) {
      reasons.push(`${id} : statut « ${status} », déjà livrée ou close (${role})`);
      return;
    }
    paths.set(id, path);
  };

  if (gesture.kind === 'merge') {
    if (gesture.sources.length === 0) reasons.push('une fusion demande au moins une source');
    if (gesture.sources.includes(gesture.into)) {
      reasons.push(`la résultante ${gesture.into} figure parmi les sources`);
    }
    for (const id of duplicates(gesture.sources)) reasons.push(`source ${id} donnée deux fois`);
    needActive(gesture.into, 'résultante');
    for (const id of new Set(gesture.sources)) needActive(id, 'source');
  } else {
    if (gesture.into.length < 2) reasons.push('un découpage demande au moins 2 enfants');
    if (gesture.into.includes(gesture.source)) {
      reasons.push(`la source ${gesture.source} figure parmi les enfants`);
    }
    for (const id of duplicates(gesture.into)) reasons.push(`enfant ${id} donné deux fois`);
    needActive(gesture.source, 'source');
    for (const id of new Set(gesture.into)) needActive(id, 'enfant');
  }
  if (reasons.length > 0) throw new ShipRefusal(reasons);

  const moved = gesture.kind === 'merge' ? gesture.sources : [gesture.source];
  const shipPlan = planShip(
    fs,
    {
      files: moved.map((id) => paths.get(id) as string),
      status: gesture.kind === 'merge' ? 'merged' : 'split',
      pr:
        gesture.kind === 'merge'
          ? `merged — fusionnée dans ${gesture.into}`
          : `split — scindée en ${gesture.into.join(', ')}`,
      barPlan: options.barPlan ?? true,
    },
    options.seams,
  );

  // La provenance s'ajoute AUX écritures du ship (statut, liens, PLAN.md) : même transaction, même retour arrière.
  const writes = new Map(shipPlan.writes);
  const edit = (path: string, fields: Record<string, string>): void => {
    writes.set(path, setFrontMatter(writes.get(path) ?? fs.read(path), fields));
  };
  try {
    if (gesture.kind === 'merge') {
      for (const id of moved) edit(paths.get(id) as string, { merged_into: quote(gesture.into) });
      const intoPath = paths.get(gesture.into) as string;
      const already = readListField(frontMatter(writes.get(intoPath) ?? fs.read(intoPath)), 'merged_from');
      edit(intoPath, { merged_from: listOf([...new Set([...already, ...gesture.sources])].sort()) });
    } else {
      edit(paths.get(gesture.source) as string, { split_into: listOf(gesture.into) });
      for (const id of gesture.into) edit(paths.get(id) as string, { split_from: quote(gesture.source) });
    }
  } catch (error) {
    throw new ShipRefusal([error instanceof Error ? error.message : String(error)]);
  }
  return { ...shipPlan, writes };
}
