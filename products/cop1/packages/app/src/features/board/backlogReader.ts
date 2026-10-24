/**
 * backlogReader — lecteur de backlog COP1-LOCAL (fiche 20261024130842122, sœur « plan réel » de
 * board-web). Produit la part « plan » des données du board — l'entonnoir, les versions, le compte
 * livré — à partir des fiches `features/*.md`. cop1 N'IMPORTE PAS mega-city (ADR-021) : on parse le
 * front-matter ici, chez cop1, comme le précédent `registry.ts` l'a fait pour les worktrees (ADR-079 §D9).
 *
 * Le CŒUR est PUR (`projectPlan`) : il prend des fiches déjà parsées + les étiquettes git, et calcule.
 * Le BORD I/O (`readBacklogFiches`) lit le disque. Ainsi le calcul se teste sans toucher aux fichiers.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

/** Le sous-ensemble de front-matter dont le plan a besoin (jamais le disque ici). */
export interface PlanFiche {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  version: string;
  milestone: string;
  done: boolean; // vient de `features/done/` (livrée)
}

/** L'entonnoir du pipeline actif (forme `Funnel` du board). */
export interface PlanFunnel {
  idea: number;
  ready: number;
  wip: number;
  unversioned: number;
  parked: number;
}

/** Une version = un lot de fiches avec son décompte par état (forme `Version` du board). */
export interface PlanVersion {
  ver: string;
  name: string;
  done: number;
  wip: number;
  ready: number;
  idea: number;
  total: number;
  date?: string;
}

export interface PlanVersions {
  current: PlanVersion | null;
  upcoming: PlanVersion[];
  past: PlanVersion[];
}

/** La part « plan » des données d'un projet pour le board (le reste — runs, live — vient du journal). */
export interface PlanData {
  funnel: PlanFunnel;
  versions: PlanVersions;
  /** Compte de fiches livrées (`metrics.done` du board). */
  done: number;
}

const TERMINAL = new Set(['shipped', 'superseded', 'merged', 'split']);
const isParked = (f: PlanFiche): boolean => f.status === 'idea' && f.milestone === 'parked';
/** Statut de fiche → état du board : in-progress → wip, shipped → done, sinon tel quel. */
const boardStatus = (f: PlanFiche): 'idea' | 'ready' | 'wip' | 'done' | 'other' => {
  if (f.done || f.status === 'shipped') return 'done';
  if (f.status === 'in-progress') return 'wip';
  if (f.status === 'ready') return 'ready';
  if (f.status === 'idea') return 'idea';
  return 'other'; // superseded / merged / split — hors entonnoir
};

/** Compare deux versions `vX.Y.Z` numériquement (ordre du train). */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map(Number);
  const pb = b.replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

const VERSION_FORMAT = /^v\d+\.\d+\.\d+$/i;

/**
 * CŒUR PUR — calcule la part « plan » du board depuis les fiches + les étiquettes git.
 * Version EN COURS = le plus bas lot non étiqueté (ADR-0070). Au-dessus = `upcoming`, étiquetées = `past`.
 */
export function projectPlan(fiches: readonly PlanFiche[], tags: ReadonlySet<string>): PlanData {
  const active = fiches.filter((f) => !f.done && !TERMINAL.has(f.status));
  const funnel: PlanFunnel = {
    idea: active.filter((f) => f.status === 'idea' && !isParked(f)).length,
    ready: active.filter((f) => f.status === 'ready').length,
    wip: active.filter((f) => f.status === 'in-progress').length,
    unversioned: active.filter((f) => f.version === '' && !isParked(f)).length,
    parked: active.filter((f) => isParked(f)).length,
  };

  // Un lot par version bien formée (parkées exclues du décompte d'état, comme le backlog).
  const byVer = new Map<string, PlanFiche[]>();
  for (const f of fiches) {
    if (!VERSION_FORMAT.test(f.version) || isParked(f)) continue;
    const list = byVer.get(f.version) ?? [];
    list.push(f);
    byVer.set(f.version, list);
  }
  const lots: PlanVersion[] = [...byVer.entries()]
    .map(([ver, list]) => ({
      ver,
      name: ver,
      done: list.filter((f) => boardStatus(f) === 'done').length,
      wip: list.filter((f) => boardStatus(f) === 'wip').length,
      ready: list.filter((f) => boardStatus(f) === 'ready').length,
      idea: list.filter((f) => boardStatus(f) === 'idea').length,
      total: list.length,
      ...(tags.has(ver) || tags.has(ver.replace(/^v/i, 'v')) ? { date: 'taguée' } : {}),
    }))
    .sort((a, b) => compareVersions(a.ver, b.ver));

  const tagged = (ver: string): boolean => tags.has(ver);
  const currentIndex = lots.findIndex((l) => !tagged(l.ver));
  const current = currentIndex >= 0 ? (lots[currentIndex] ?? null) : null;
  const upcoming = currentIndex >= 0 ? lots.slice(currentIndex + 1).filter((l) => !tagged(l.ver)) : [];
  const past = lots.filter((l) => tagged(l.ver)).reverse(); // plus récente d'abord

  return {
    funnel,
    versions: { current, upcoming, past },
    done: fiches.filter((f) => f.done || f.status === 'shipped').length,
  };
}

/** Lit la 1re section de front-matter YAML d'un `.md` (entre les deux `---`). `{}` si absente. */
function frontMatter(text: string): Record<string, unknown> {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  try {
    const parsed = parseYaml(m[1] ?? '');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

/** BORD I/O — lit `features/*.md` + `features/done/*.md` sous `root` en `PlanFiche[]`. Best-effort. */
export function readBacklogFiches(root: string): PlanFiche[] {
  const out: PlanFiche[] = [];
  for (const [dir, done] of [
    [join(root, 'features'), false],
    [join(root, 'features', 'done'), true],
  ] as const) {
    let names: string[];
    try {
      names = readdirSync(dir).filter((n) => /^\d.*\.md$/.test(n));
    } catch {
      continue; // dossier absent — non bloquant
    }
    for (const name of names) {
      let fm: Record<string, unknown>;
      try {
        fm = frontMatter(readFileSync(join(dir, name), 'utf8'));
      } catch {
        continue;
      }
      if (!fm.id) continue;
      out.push({
        id: str(fm.id),
        title: str(fm.title),
        type: str(fm.type),
        priority: str(fm.priority),
        status: str(fm.status),
        version: str(fm.version),
        milestone: str(fm.milestone),
        done,
      });
    }
  }
  return out;
}
