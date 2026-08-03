/**
 * fiche 0062 — agrégation portefeuille projets (lecture seule).
 * Pure : registry déclarée + runs observés → cartes affichables.
 */

export type ProjectStatus = 'waiting' | 'active' | 'idle' | 'inactive';

export interface RegistryProjectRef {
  id: string;
  path: string;
  method: string;
  /** Chemin absolu résolu côté daemon. */
  projectRoot: string;
}

export interface RunForPortfolio {
  projectRoot: string;
  state: string;
  liveness?: string;
  method?: { name: string; version?: string };
  lastAbsorbedAt?: string;
}

export interface ProjectCardModel {
  projectRoot: string;
  id?: string;
  name: string;
  location: string;
  methodName?: string;
  methodVersion?: string;
  status: ProjectStatus;
  runCount: number;
  source: 'registry' | 'observed' | 'both';
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  waiting: 'En attente',
  active: 'Actif',
  idle: 'Récent',
  inactive: 'Inactif',
};

export function projectStatusLabel(status: ProjectStatus): string {
  return STATUS_LABEL[status];
}

function basename(root: string): string {
  const parts = root.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? root;
}

function deriveStatus(runs: RunForPortfolio[]): ProjectStatus {
  if (runs.length === 0) return 'inactive';
  if (runs.some((r) => r.state === 'at_gate' || r.liveness === 'presumed_dead')) {
    return 'waiting';
  }
  if (runs.some((r) => r.state === 'running' || r.state === 'launched')) {
    return 'active';
  }
  return 'idle';
}

function pickLatestMethod(runs: RunForPortfolio[]): { name?: string; version?: string } {
  let best: RunForPortfolio | undefined;
  for (const run of runs) {
    if (!run.method) continue;
    if (!best) {
      best = run;
      continue;
    }
    const a = run.lastAbsorbedAt ?? '';
    const b = best.lastAbsorbedAt ?? '';
    if (a >= b) best = run;
  }
  return { name: best?.method?.name, version: best?.method?.version };
}

/**
 * Fusionne registre + runs. Clé = `projectRoot` absolu.
 * Sans registre : uniquement les racines observées.
 */
export function buildProjectPortfolio(
  registry: readonly RegistryProjectRef[],
  runs: readonly RunForPortfolio[],
): ProjectCardModel[] {
  const byRoot = new Map<
    string,
    { registry?: RegistryProjectRef; runs: RunForPortfolio[] }
  >();

  for (const project of registry) {
    byRoot.set(project.projectRoot, { registry: project, runs: [] });
  }

  for (const run of runs) {
    const existing = byRoot.get(run.projectRoot);
    if (existing) {
      existing.runs.push(run);
    } else {
      byRoot.set(run.projectRoot, { runs: [run] });
    }
  }

  const cards: ProjectCardModel[] = [];
  for (const [projectRoot, bucket] of byRoot) {
    const fromRegistry = bucket.registry !== undefined;
    const fromRuns = bucket.runs.length > 0;
    const methodFromRun = pickLatestMethod(bucket.runs);
    cards.push({
      projectRoot,
      id: bucket.registry?.id,
      name: bucket.registry?.id ?? basename(projectRoot),
      location: bucket.registry?.path ?? projectRoot,
      methodName: bucket.registry?.method ?? methodFromRun.name,
      methodVersion: methodFromRun.version,
      status: deriveStatus(bucket.runs),
      runCount: bucket.runs.length,
      source: fromRegistry && fromRuns ? 'both' : fromRegistry ? 'registry' : 'observed',
    });
  }

  return cards.sort((a, b) => a.name.localeCompare(b.name));
}
