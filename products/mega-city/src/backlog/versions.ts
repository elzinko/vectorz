/**
 * versions — le niveau « version » du backlog (fiche 20260824204751403).
 *
 * En clair : le champ `version:` des fiches désigne le LOT de livraison. Ce module calcule, depuis
 * les fiches seules, l'état de chaque lot, contrôle qu'il tient debout et dit s'il peut être clos.
 * Rien n'est stocké : « livrée » = toutes les fiches livrées PLUS l'étiquette git `vX.Y`.
 *
 * PUR (ADR-0003) : aucun disque, aucun git. Les fiches, les étiquettes et le texte de `PLAN.md`
 * sont injectés par le bord I/O (`bin/backlog-version.ts`). Compteurs et contrôles viennent du
 * script, jamais d'un recomptage à la main (ADR-0001).
 */
import { TERMINAUX } from '../core/fiche-schema.js';
import type { Fiche } from '../loaders/fiches.js';
import { parsePlanSections } from './plan-sections.js';

/** Le format d'une version : semver strict `vX.Y.Z` (`v0.3.0`, `v1.0.0`) — décision 2026-10-08. */
export const VERSION_FORMAT = /^v\d+\.\d+\.\d+$/;

/** Calibrage PROVISOIRE : au-delà, un lot est signalé « trop gros » (réglable par `--max`). */
export const LOT_MAX = 15;

/** Une version citée dans un titre de section de PLAN.md (semver `vX.Y.Z`). */
const VERSION_TOKEN = /\bv\d+\.\d+\.\d+\b/g;

/** Ordre naturel : V0.2 avant V0.10, V0.3 avant V0.3.1. Réservé aux versions bien formées. */
export function compareVersions(a: string, b: string): number {
  const pa = a.slice(1).split('.').map(Number);
  const pb = b.slice(1).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Comme `compareVersions`, mais tolère une valeur illisible ou vide (rangée après les lisibles). */
function compareLoose(a: string, b: string): number {
  const okA = VERSION_FORMAT.test(a);
  const okB = VERSION_FORMAT.test(b);
  if (okA && okB) return compareVersions(a, b);
  if (okA) return -1;
  if (okB) return 1;
  return a.localeCompare(b);
}

/** L'étiquette git d'une version : `V0.3` → `v0.3`. */
export const tagOf = (version: string): string => `v${version.slice(1)}`;

/**
 * Le tag semver PROPOSÉ pour sortir une version : `vX.Y` → `vX.Y.0`, `vX.Y.Z` → `vX.Y.Z`.
 * On tague toujours en semver à trois composantes (décision 2026-10-08) ; une version à deux
 * composantes est complétée par un patch `.0`.
 */
export function proposedTagOf(version: string): string {
  const base = tagOf(version);
  return base.split('.').length >= 3 ? base : `${base}.0`;
}

/**
 * Le tag de RELEASE semver (`vA.B.C`, trois composantes, sans pré-version) qui atteste qu'une version
 * est sortie, ou `undefined`. La version doit être le PRÉFIXE numérique du tag : `V1.7` est sortie par
 * `v1.7.0` (ou `v1.7.5`…), `V0.3.1` par `v0.3.1`. Un tag nu `vX.Y` ou une pré-version `vX.Y.Z-rc.N`
 * ne compte PAS (décision 2026-10-08 : semver strict). Plusieurs patchs : on rend le plus haut.
 * `version` est supposée au `VERSION_FORMAT` ; sinon `undefined`.
 */
export function releaseTagFor(version: string, tags: ReadonlySet<string>): string | undefined {
  if (!VERSION_FORMAT.test(version)) return undefined;
  const parts = version.slice(1).split('.').map(Number);
  let best: string | undefined;
  for (const t of tags) {
    const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(t);
    if (m === null) continue;
    const tagParts = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (!parts.every((p, i) => p === tagParts[i])) continue;
    if (best === undefined || compareVersions(t, best) > 0) best = t;
  }
  return best;
}

/** Parkée = `idea` + `milestone: parked` (même règle que le board : jalon fermé par le PO). */
const isParked = (f: Fiche): boolean => f.status === 'idea' && f.milestone === 'parked';

/** Close sans livraison (`superseded`, `merged`, `split`) : sort de tout lot. */
const isClosedWithoutDelivery = (f: Fiche): boolean => TERMINAUX.includes(f.status);

const byId = (a: Fiche, b: Fiche): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// ─── L'état des lots ─────────────────────────────────────────────────────────────────────────

export type VersionState = 'en-cours' | 'a-clore' | 'livree' | 'rouverte' | 'vide';

export interface VersionLot {
  version: string;
  state: VersionState;
  /** Fiches livrées du lot. */
  shipped: Fiche[];
  /** Fiches du lot restant à livrer (hors parkées). */
  todo: Fiche[];
  /** Parmi `todo` : celles que la DoR a passées `ready`. */
  ready: Fiche[];
  /** Parmi `todo` : celles que `blocked:` retient. */
  blocked: Fiche[];
  /** Fiches parkées qui portent pourtant cette version : hors lot, mais signalées. */
  intruders: Fiche[];
  /** L'étiquette de release trouvée (`v1.7.0`), si la version est sortie — sinon `undefined`. */
  releaseTag?: string;
}

export interface VersionsReport {
  /** Un lot par version bien formée, dans l'ordre naturel. */
  lots: VersionLot[];
  /** Fiches dont `version:` est illisible : dans aucun lot, mais jamais ignorées. */
  malformed: Fiche[];
  /** Fiches ACTIVES sans version (dont les parkées). */
  unversioned: { total: number; parked: number };
  /** Closes sans livraison (superseded, merged, split) : hors de tout lot. */
  terminal: number;
  /** Livrées sans version : l'historique d'avant le champ. */
  history: number;
}

function lotOf(version: string, members: Fiche[], tags: ReadonlySet<string>): VersionLot {
  const sorted = [...members].sort(byId);
  const shipped = sorted.filter((f) => f.status === 'shipped');
  const intruders = sorted.filter((f) => f.status !== 'shipped' && isParked(f));
  const todo = sorted.filter((f) => f.status !== 'shipped' && !isParked(f));
  const releaseTag = releaseTagFor(version, tags);
  const tagged = releaseTag !== undefined;
  let state: VersionState = 'vide';
  if (todo.length > 0) state = tagged ? 'rouverte' : 'en-cours';
  else if (shipped.length > 0) state = tagged ? 'livree' : 'a-clore';
  return {
    version,
    state,
    shipped,
    todo,
    ready: todo.filter((f) => f.status === 'ready'),
    blocked: todo.filter((f) => f.blocked !== ''),
    intruders,
    releaseTag,
  };
}

/**
 * Range chaque fiche dans UNE catégorie et une seule : close sans livraison, version illisible,
 * lot d'une version, active sans version, ou historique livré. Aucune fiche ne disparaît.
 */
export function buildVersions(fiches: readonly Fiche[], tags: ReadonlySet<string>): VersionsReport {
  const byVersion = new Map<string, Fiche[]>();
  const malformed: Fiche[] = [];
  const unversioned = { total: 0, parked: 0 };
  let terminal = 0;
  let history = 0;
  for (const f of fiches) {
    if (isClosedWithoutDelivery(f)) {
      terminal += 1;
    } else if (f.version === '') {
      if (f.status === 'shipped') {
        history += 1;
      } else {
        unversioned.total += 1;
        if (isParked(f)) unversioned.parked += 1;
      }
    } else if (!VERSION_FORMAT.test(f.version)) {
      malformed.push(f);
    } else {
      byVersion.set(f.version, [...(byVersion.get(f.version) ?? []), f]);
    }
  }
  const lots = [...byVersion.keys()]
    .sort(compareVersions)
    .map((version) => lotOf(version, byVersion.get(version) ?? [], tags));
  return { lots, malformed: malformed.sort(byId), unversioned, terminal, history };
}

// ─── Le contrôle de cohérence ────────────────────────────────────────────────────────────────

export type Severity = 'error' | 'warning';

export type FindingCode =
  | 'format'
  | 'parkee'
  | 'rouverte'
  | 'bloquee'
  | 'taille'
  | 'plan-ecart'
  | 'plan-absente'
  | 'plan-ambigue';

export interface VersionFinding {
  severity: Severity;
  code: FindingCode;
  /** La version concernée (la valeur brute, pour `format`). */
  version: string;
  /**
   * Toutes les versions que le constat concerne, quand il en implique plusieurs : un écart de plan
   * touche la version de la SECTION et celle de la FICHE ; une section ambiguë, chaque version
   * citée. Sans cela, `check V0.4` ou `close V0.4` ne verrait pas une erreur qui la concerne.
   */
  versions?: readonly string[];
  ficheId?: string;
  /** Une phrase en clair, qui se suffit. */
  message: string;
}

export interface CheckOptions {
  /** Ne garder que les constats de cette version. */
  version?: string;
  /** Au-delà de ce nombre de fiches à faire, le lot est « trop gros » (défaut `LOT_MAX`). */
  max?: number;
  /** Texte de `features/PLAN.md` : active les règles `plan-*` (accord plan et fiches). */
  planMd?: string;
}

export const hasErrors = (findings: readonly VersionFinding[]): boolean =>
  findings.some((f) => f.severity === 'error');

/**
 * Accord entre `PLAN.md` et le champ `version:` — le « fail-loud » du niveau version.
 * Une section dont le titre cite UNE version décrit le lot de cette version ; une section qui en
 * cite deux est ambiguë et signalée au lieu d'être lue de travers ; une section sans version
 * (« En continu ») est hors sujet. Les entrées barrées sont de l'historique : ignorées.
 */
function planFindings(
  fiches: readonly Fiche[],
  report: VersionsReport,
  planMd: string,
): VersionFinding[] {
  const known = new Map(fiches.map((f) => [f.id, f] as const));
  const found: VersionFinding[] = [];
  const cited = new Map<string, Set<string>>(); // version → ids des entrées ouvertes de sa section
  for (const section of parsePlanSections(planMd)) {
    const tokens = [...new Set(section.label.match(VERSION_TOKEN) ?? [])].sort(compareVersions);
    if (tokens.length === 0) continue;
    if (tokens.length > 1) {
      found.push({
        severity: 'error',
        code: 'plan-ambigue',
        version: tokens[0],
        versions: tokens,
        message: `la section « ${section.label} » de PLAN.md cite plusieurs versions (${tokens.join(', ')}). Son lot est ambigu.`,
      });
      continue;
    }
    const version = tokens[0];
    const ids = cited.get(version) ?? new Set<string>();
    cited.set(version, ids);
    for (const entry of section.entries) {
      if (entry.struck || !entry.marker) continue; // curée « livrée », ou sans action annoncée
      for (const id of entry.ids) {
        ids.add(id);
        const fiche = known.get(id);
        if (!fiche || fiche.status === 'shipped' || isClosedWithoutDelivery(fiche)) continue;
        if (fiche.version !== version) {
          found.push({
            severity: 'error',
            code: 'plan-ecart',
            version,
            versions: fiche.version === '' ? [version] : [version, fiche.version],
            ficheId: id,
            message: `PLAN.md (section « ${section.label} ») la range dans ${version}, mais la fiche dit version: ${fiche.version === '' ? '(vide)' : fiche.version}.`,
          });
        }
      }
    }
  }
  for (const lot of report.lots) {
    const ids = cited.get(lot.version);
    if (!ids) continue; // le plan n'a pas de section pour cette version : rien à comparer
    for (const f of lot.todo) {
      if (ids.has(f.id)) continue;
      found.push({
        severity: 'warning',
        code: 'plan-absente',
        version: lot.version,
        ficheId: f.id,
        message: `la fiche est dans ${lot.version} mais absente de la section ${lot.version} de PLAN.md.`,
      });
    }
  }
  return found;
}

function compareFindings(a: VersionFinding, b: VersionFinding): number {
  const bySeverity = a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1;
  return (
    compareLoose(a.version, b.version) ||
    bySeverity ||
    a.code.localeCompare(b.code) ||
    (a.ficheId ?? '').localeCompare(b.ficheId ?? '')
  );
}

/** Contrôle la cohérence des lots. Les erreurs font échouer `check` et refuser `close`. */
export function checkVersions(
  fiches: readonly Fiche[],
  tags: ReadonlySet<string>,
  opts: CheckOptions = {},
): VersionFinding[] {
  const report = buildVersions(fiches, tags);
  const max = opts.max ?? LOT_MAX;
  const found: VersionFinding[] = [];

  for (const f of report.malformed) {
    found.push({
      severity: 'error',
      code: 'format',
      version: f.version,
      ficheId: f.id,
      message: `version illisible « ${f.version} » (attendu : v0.3.0). La fiche n'est dans aucun lot.`,
    });
  }
  for (const lot of report.lots) {
    for (const f of lot.intruders) {
      found.push({
        severity: 'error',
        code: 'parkee',
        version: lot.version,
        ficheId: f.id,
        message: `fiche parkée rangée dans ${lot.version}. Retire son champ version: ou sors-la du parking.`,
      });
    }
    if (lot.state === 'rouverte') {
      // `rouverte` implique `releaseTag` défini ; le `??` garde le type optionnel total, sans `!` non sûr.
      found.push({
        severity: 'error',
        code: 'rouverte',
        version: lot.version,
        message: `${lot.version} est déjà livrée (étiquette ${lot.releaseTag ?? proposedTagOf(lot.version)}) mais ${lot.todo.length} fiche(s) restent à faire : ${lot.todo.map((f) => f.id).join(', ')}`,
      });
    }
    for (const f of lot.blocked) {
      found.push({
        severity: 'warning',
        code: 'bloquee',
        version: lot.version,
        ficheId: f.id,
        message: `fiche bloquée (${f.blocked}). Elle empêche de clore ${lot.version}.`,
      });
    }
    if (lot.todo.length > max) {
      found.push({
        severity: 'warning',
        code: 'taille',
        version: lot.version,
        message: `${lot.todo.length} fiches à faire dans ${lot.version} (limite ${max}). Lot trop gros pour une version réaliste.`,
      });
    }
  }
  if (opts.planMd !== undefined) found.push(...planFindings(fiches, report, opts.planMd));

  const wanted = opts.version;
  const scoped =
    wanted === undefined
      ? found
      : found.filter((f) => f.version === wanted || (f.versions?.includes(wanted) ?? false));
  return scoped.sort(compareFindings);
}

// ─── La clôture ──────────────────────────────────────────────────────────────────────────────

export type CloseResult =
  | { ok: true; tag: string; shipped: number }
  | { ok: false; reasons: string[] };

/**
 * Une version peut être close quand toutes ses fiches sont livrées ET que son contrôle de lot est
 * vert. Le résultat dit l'étiquette à proposer ; ce module n'écrit rien (pas même une étiquette).
 */
export function closeVersion(
  fiches: readonly Fiche[],
  tags: ReadonlySet<string>,
  version: string,
  opts: CheckOptions = {},
): CloseResult {
  if (!VERSION_FORMAT.test(version)) {
    return { ok: false, reasons: [`« ${version} » n'a pas le format V<n>.<n> (exemple : V0.3)`] };
  }
  const lot = buildVersions(fiches, tags).lots.find((l) => l.version === version);
  if (!lot || (lot.shipped.length === 0 && lot.todo.length === 0)) {
    return { ok: false, reasons: [`aucune fiche livrable ne porte version: ${version}`] };
  }
  const reasons: string[] = [];
  if (lot.todo.length > 0) {
    reasons.push(`${lot.todo.length} fiche(s) restent à faire :`);
    for (const f of lot.todo) reasons.push(`  ${f.id} (${f.status}) ${f.title}`);
  }
  const errors = checkVersions(fiches, tags, { ...opts, version }).filter(
    (f) => f.severity === 'error' && f.code !== 'rouverte', // « rouverte » = les fiches à faire, déjà listées
  );
  for (const f of errors) reasons.push(`[${f.code}]${f.ficheId ? ` ${f.ficheId}` : ''} ${f.message}`);
  const tag = proposedTagOf(version);
  const released = releaseTagFor(version, tags);
  if (reasons.length === 0 && released !== undefined) {
    reasons.push(`déjà livrée : l'étiquette ${released} existe`);
  }
  return reasons.length > 0 ? { ok: false, reasons } : { ok: true, tag, shipped: lot.shipped.length };
}
