/**
 * Le carnet de tests (fiche 20261102182259416) — cœur PUR, sans I/O.
 *
 * En clair : un projet déclare l'arbre de son app (des écrans, puis leurs actions). Chaque test
 * d'exploration ajoute une ligne au journal : le nœud, l'axe (visuel ou fonctionnel), le verdict, la
 * date, le SHA testé et la preuve. L'état se CALCULE à la lecture : jamais testé, valide, en échec,
 * ou expiré quand la preuve dépasse sa durée de validité (14 jours par défaut).
 *
 *   arbre (YAML du projet)  +  journal (une ligne JSON par résultat)  ──▶  computeStatus  ──▶  rendu
 *
 * Le bord I/O (`src/io/carto-store.ts`) lit les fichiers et git ; ce module ne fait que parser,
 * valider et calculer. Le panel du 2026-11-02 a écarté l'arbre tiré d'un routeur et l'expiration
 * par les imports : l'arbre est déclaré, l'expiration est datée.
 */
import { LineCounter, type YAMLMap, isMap, isScalar, isSeq, parseDocument } from 'yaml';

/** Numéro du format du journal et du JSON de `status` ; un changement incompatible le change. */
export const CARTO_SCHEMA_VERSION = 1;
/** Durée de validité d'une preuve, en jours (décision PO du 2026-11-02). */
export const DEFAULT_VALIDITY_DAYS = 14;

export const AXES = ['visuel', 'fonctionnel'] as const;
export type Axis = (typeof AXES)[number];
export const VERDICTS = ['valide', 'echec'] as const;
export type Verdict = (typeof VERDICTS)[number];
export type CheckState = 'jamais' | Verdict | 'expire';

/** Un nœud de l'arbre : un écran (`export`) ou une action d'écran (`export/bpm-invalide`). */
export interface CartoNode {
  id: string;
  title: string;
  axes: Axis[];
}

export interface CartoTree {
  app: string;
  nodes: CartoNode[];
}

export interface TreeError {
  line: number;
  message: string;
}

/** Un identifiant simple : il devient un segment de chemin, donc ni `/`, ni `..`. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
/** Un SHA git abrégé ou complet : la seule forme acceptée dans le journal et passée à git. */
export const SHA_PATTERN = /^[0-9a-f]{4,64}$/i;
const DAY_MS = 86_400_000;

// --- L'arbre déclaré -----------------------------------------------------------------------------

/**
 * Parse l'arbre YAML d'une app. Un arbre mal formé est refusé, chaque erreur nommant sa ligne :
 * YAML illisible, clé inconnue, id absent ou en double, titre manquant, axe inconnu.
 */
export function parseCartoTree(text: string): { tree: CartoTree } | { errors: TreeError[] } {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });
  const lineAt = (offset: number): number => lineCounter.linePos(offset).line;
  if (doc.errors.length > 0) {
    return {
      errors: doc.errors.map((e) => ({
        line: lineAt(e.pos[0]),
        message: `YAML illisible : ${e.message.split('\n')[0]}`,
      })),
    };
  }

  const errors: TreeError[] = [];
  const lineOf = (node: unknown): number => {
    const range = (node as { range?: [number, number, number] } | null)?.range;
    return range ? lineAt(range[0]) : 1;
  };
  const fail = (node: unknown, message: string): void => {
    errors.push({ line: lineOf(node), message });
  };

  const root = doc.contents;
  if (!isMap(root)) {
    fail(root, "l'arbre doit être une table avec app, screens et, au besoin, axes");
    return { errors };
  }
  checkKeys(root, ['app', 'axes', 'screens'], 'arbre', fail);

  const appNode = root.get('app', true);
  const app = scalarString(appNode);
  if (!SLUG.test(app)) {
    const given = isScalar(appNode) ? String(appNode.value) : '';
    fail(appNode ?? root, `app : un identifiant simple est attendu (minuscules, chiffres, tirets), reçu « ${given} »`);
  }

  const defaultAxes = readAxes(root.get('axes', true), [...AXES], 'arbre', fail);
  const screens = root.get('screens', true);
  const nodes: CartoNode[] = [];
  const seen = new Set<string>();

  const addNode = (map: YAMLMap, prefix: string, inherited: Axis[], kind: string): { id: string; axes: Axis[] } => {
    const idNode = map.get('id', true);
    const id = scalarString(idNode);
    const label = id ? `${kind} « ${prefix}${id} »` : kind;
    if (!SLUG.test(id)) fail(idNode ?? map, `${kind} : id manquant ou invalide (minuscules, chiffres, tirets)`);
    const titleNode = map.get('title', true);
    const title = scalarString(titleNode).trim();
    if (title === '') fail(titleNode ?? map, `${label} : title manquant`);
    const axes = readAxes(map.get('axes', true), inherited, label, fail);
    const fullId = `${prefix}${id}`;
    if (id !== '' && seen.has(fullId)) fail(idNode, `${label} : id en double`);
    seen.add(fullId);
    nodes.push({ id: fullId, title, axes });
    return { id, axes };
  };

  if (!isSeq(screens) || screens.items.length === 0) {
    fail(screens ?? root, "l'arbre doit déclarer au moins un écran sous screens");
  } else {
    for (const screen of screens.items) {
      if (!isMap(screen)) {
        fail(screen, 'chaque écran est une table : id, title, et au besoin axes et actions');
        continue;
      }
      checkKeys(screen, ['id', 'title', 'axes', 'actions'], 'écran', fail);
      const { id: screenId, axes: screenAxes } = addNode(screen, '', defaultAxes, 'écran');
      const actions = screen.get('actions', true);
      if (actions === undefined) continue;
      if (!isSeq(actions)) {
        fail(actions, `écran « ${screenId} » : actions doit être une liste`);
        continue;
      }
      for (const action of actions.items) {
        if (!isMap(action)) {
          fail(action, 'chaque action est une table : id, title, et au besoin axes');
          continue;
        }
        checkKeys(action, ['id', 'title', 'axes'], 'action', fail);
        addNode(action, `${screenId}/`, screenAxes, 'action');
      }
    }
  }

  return errors.length > 0 ? { errors } : { tree: { app, nodes } };
}

type Fail = (node: unknown, message: string) => void;

/** La valeur d'un scalaire YAML texte, ou une chaîne vide. */
function scalarString(node: unknown): string {
  return isScalar(node) && typeof node.value === 'string' ? node.value : '';
}

function checkKeys(map: { items: Array<{ key: unknown }> }, allowed: string[], where: string, fail: Fail): void {
  for (const pair of map.items) {
    const key = isScalar(pair.key) ? String(pair.key.value) : '';
    if (!allowed.includes(key)) {
      fail(pair.key, `${where} : clé inconnue « ${key} » (attendues : ${allowed.join(', ')})`);
    }
  }
}

function readAxes(node: unknown, inherited: Axis[], where: string, fail: Fail): Axis[] {
  if (node === undefined) return inherited;
  if (!isSeq(node) || node.items.length === 0) {
    fail(node, `${where} : axes doit être une liste non vide (visuel, fonctionnel)`);
    return inherited;
  }
  const axes: Axis[] = [];
  for (const item of node.items) {
    const value = isScalar(item) ? String(item.value) : '';
    if ((AXES as readonly string[]).includes(value)) axes.push(value as Axis);
    else fail(item, `${where} : axe inconnu « ${value} » (attendus : ${AXES.join(', ')})`);
  }
  return axes.length > 0 ? AXES.filter((a) => axes.includes(a)) : inherited;
}

// --- La config projet ----------------------------------------------------------------------------

export interface CartoConfig {
  /** Le fichier d'arbre de chaque app, relatif à la racine du projet. */
  trees: Record<string, string>;
  validityDays: number;
  errors: string[];
}

/** Résout la clé `carto:` de `.vectorz/config.yml`. Absente : aucun arbre, 14 jours. */
export function resolveCartoConfig(raw: unknown): CartoConfig {
  const config: CartoConfig = { trees: {}, validityDays: DEFAULT_VALIDITY_DAYS, errors: [] };
  if (raw === undefined || raw === null) return config;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    config.errors.push('carto : une table est attendue (trees, validity-days)');
    return config;
  }
  const { trees, 'validity-days': days } = raw as Record<string, unknown>;
  if (trees !== undefined) {
    if (typeof trees !== 'object' || trees === null || Array.isArray(trees)) {
      config.errors.push('carto.trees : une table « app: chemin du fichier d’arbre » est attendue');
    } else {
      for (const [app, path] of Object.entries(trees)) {
        if (!SLUG.test(app) || typeof path !== 'string' || path.trim() === '') {
          config.errors.push(`carto.trees.${app} : un nom d'app simple et un chemin de fichier sont attendus`);
        } else config.trees[app] = path;
      }
    }
  }
  if (days !== undefined) {
    if (typeof days === 'number' && Number.isInteger(days) && days > 0) config.validityDays = days;
    else {
      config.errors.push(
        `carto.validity-days : un nombre entier de jours supérieur à 0 est attendu, reçu « ${String(days)} » — durée par défaut gardée (${DEFAULT_VALIDITY_DAYS} jours)`,
      );
    }
  }
  return config;
}

// --- Le journal ------------------------------------------------------------------------------------

/** Une ligne du journal : un résultat de test sur un nœud et un axe. */
export interface CartoEntry {
  node: string;
  axis: Axis;
  verdict: Verdict;
  /** Date ISO du résultat. */
  at: string;
  /** SHA testé. */
  sha: string;
  /** Nom de la copie de la preuve dans le magasin du carnet. */
  proof: string;
}

export function serializeEntry(entry: CartoEntry): string {
  return `${JSON.stringify({ schema_version: CARTO_SCHEMA_VERSION, ...entry })}\n`;
}

/** Relit le journal. Une ligne illisible ou incomplète est comptée dans `skipped`, jamais fatale. */
export function parseJournal(text: string): { entries: CartoEntry[]; skipped: number } {
  const entries: CartoEntry[] = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const entry = toEntry(line);
    if (entry) entries.push(entry);
    else skipped += 1;
  }
  return { entries, skipped };
}

function toEntry(line: string): CartoEntry | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return undefined;
  }
  const r = raw as Record<string, unknown>;
  const strings = ['node', 'axis', 'verdict', 'at', 'sha', 'proof'].every((k) => typeof r?.[k] === 'string');
  if (!strings) return undefined;
  if (!(AXES as readonly string[]).includes(r.axis as string)) return undefined;
  if (!(VERDICTS as readonly string[]).includes(r.verdict as string)) return undefined;
  if (Number.isNaN(Date.parse(r.at as string))) return undefined;
  if (!SHA_PATTERN.test(r.sha as string)) return undefined;
  return {
    node: r.node as string,
    axis: r.axis as Axis,
    verdict: r.verdict as Verdict,
    at: r.at as string,
    sha: r.sha as string,
    proof: r.proof as string,
  };
}

// --- L'état calculé ------------------------------------------------------------------------------

/** Un contrôle = un nœud sur un axe. */
export interface CheckStatus {
  node: string;
  title: string;
  axis: Axis;
  state: CheckState;
  /** Le verdict de la dernière preuve, même expirée. */
  verdict?: Verdict;
  at?: string;
  ageDays?: number;
  sha?: string;
  proof?: string;
  /** Commits entre le SHA testé et HEAD ; `null` si git ne le connaît pas. */
  commitsSince?: number | null;
}

export interface CartoStatus {
  schema_version: number;
  app: string;
  validity_days: number;
  /** Le carnet ne compte que les passes d'exploration, pas les tests automatisés du code. */
  scope: 'exploration';
  counts: { tested: number; total: number; jamais: number; valide: number; echec: number; expire: number };
  /** Lignes du journal sur un nœud ou un axe absent de l'arbre. */
  ignored_entries: number;
  /** La branche de l'arbre à laquelle l'état est restreint (`--zone`), absente sinon. */
  zone?: string;
  checks: CheckStatus[];
}

export interface StatusOptions {
  now: Date;
  validityDays: number;
  commitsSince: (sha: string) => number | null;
}

/** Calcule l'état de chaque contrôle de l'arbre : la dernière preuve gagne, l'âge décide l'expiration. */
export function computeStatus(tree: CartoTree, entries: CartoEntry[], options: StatusOptions): CartoStatus {
  const key = (node: string, axis: string): string => `${node}\u0000${axis}`;
  const known = new Set(tree.nodes.flatMap((n) => n.axes.map((a) => key(n.id, a))));
  const latest = new Map<string, CartoEntry>();
  let ignored = 0;
  for (const entry of entries) {
    const k = key(entry.node, entry.axis);
    if (!known.has(k)) {
      ignored += 1;
      continue;
    }
    const current = latest.get(k);
    if (!current || Date.parse(entry.at) >= Date.parse(current.at)) latest.set(k, entry);
  }

  const checks: CheckStatus[] = [];
  for (const node of tree.nodes) {
    for (const axis of node.axes) {
      const entry = latest.get(key(node.id, axis));
      if (!entry) {
        checks.push({ node: node.id, title: node.title, axis, state: 'jamais' });
        continue;
      }
      const ageMs = options.now.getTime() - Date.parse(entry.at);
      const expired = ageMs > options.validityDays * DAY_MS;
      checks.push({
        node: node.id,
        title: node.title,
        axis,
        state: expired ? 'expire' : entry.verdict,
        verdict: entry.verdict,
        at: entry.at,
        ageDays: Math.max(0, Math.floor(ageMs / DAY_MS)),
        sha: entry.sha,
        proof: entry.proof,
        commitsSince: options.commitsSince(entry.sha),
      });
    }
  }

  const count = (state: CheckState): number => checks.filter((c) => c.state === state).length;
  const valide = count('valide');
  const echec = count('echec');
  return {
    schema_version: CARTO_SCHEMA_VERSION,
    app: tree.app,
    validity_days: options.validityDays,
    scope: 'exploration',
    counts: { tested: valide + echec, total: checks.length, jamais: count('jamais'), valide, echec, expire: count('expire') },
    ignored_entries: ignored,
    checks,
  };
}

/** Le nœud et sa descendance (fiche 20261102182259505) : `export` couvre `export` et `export/bpm-invalide`. */
export function inZone(node: string, zone: string): boolean {
  return node === zone || node.startsWith(`${zone}/`);
}

/** L'état restreint à une branche de l'arbre : les contrôles hors de la branche sortent, les comptes suivent. */
export function restrictToZone(status: CartoStatus, zone: string): CartoStatus {
  const checks = status.checks.filter((c) => inZone(c.node, zone));
  const count = (state: CheckState): number => checks.filter((c) => c.state === state).length;
  const valide = count('valide');
  const echec = count('echec');
  return {
    ...status,
    zone,
    counts: { tested: valide + echec, total: checks.length, jamais: count('jamais'), valide, echec, expire: count('expire') },
    checks,
  };
}

/** Ce qui reste à tester : jamais testé, ou preuve expirée. */
export function isTodo(check: CheckStatus): boolean {
  return check.state === 'jamais' || check.state === 'expire';
}

// --- Le rendu --------------------------------------------------------------------------------------

const STATE_LABEL: Record<CheckState, string> = {
  jamais: 'jamais testé',
  valide: 'valide',
  echec: 'en échec',
  expire: 'expirée',
};

/** La sortie lue par le PO : « En clair » d'abord, puis un contrôle par ligne. */
export function renderStatus(status: CartoStatus, options: { todo: boolean }): string {
  const { counts } = status;
  const lines = [
    `En clair : ${counts.tested} sur ${counts.total} testés — ${counts.jamais} jamais testé(s), ${counts.expire} expiré(s), ${counts.echec} en échec.`,
    "Le carnet ne compte que les passes d'exploration (scout, tests à la main), pas les tests automatisés du code.",
    `App ${status.app} · une preuve vaut ${status.validity_days} jours · un contrôle = une fonctionnalité sur un axe.`,
  ];
  if (status.zone !== undefined) lines.push(`Branche de l'arbre : ${status.zone} et sa descendance.`);
  if (status.ignored_entries > 0) {
    lines.push(
      `${status.ignored_entries} ligne(s) du journal portent sur un nœud ou un axe absent de l'arbre : ignorée(s).`,
    );
  }
  const shown = options.todo ? status.checks.filter(isTodo) : status.checks;
  lines.push('', options.todo ? `À tester (${shown.length}) :` : `Contrôles (${shown.length}) :`);
  if (shown.length === 0) lines.push('  Rien à tester : toutes les preuves sont à jour.');
  const width = Math.max(0, ...shown.map((c) => c.node.length));
  for (const check of shown) {
    lines.push(`  ${check.node.padEnd(width)}  ${check.axis.padEnd(11)}  ${STATE_LABEL[check.state]}${details(check)}`);
  }
  return lines.join('\n');
}

function details(check: CheckStatus): string {
  if (check.state === 'jamais' || check.verdict === undefined) return '';
  const commits =
    check.commitsSince === null || check.commitsSince === undefined
      ? 'commits depuis : inconnu'
      : `${check.commitsSince} commit${check.commitsSince > 1 ? 's' : ''} depuis`;
  const last = check.state === 'expire' ? ` (dernier verdict : ${STATE_LABEL[check.verdict]})` : '';
  return `${last} · il y a ${check.ageDays} j · ${commits} · preuve ${check.proof}`;
}
