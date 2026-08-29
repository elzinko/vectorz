/**
 * ci-conso (CLI) — récupère la conso GitHub Actions du mois via `gh` et l'affiche.
 * Le cœur d'agrégation PUR (et testé) vit dans src/core/ci-conso.ts ; ICI = le bord I/O.
 *
 * Usage : pnpm --dir products/mega-city ci:conso [YYYY-MM]   (défaut : mois courant, UTC)
 *
 * Fiche 20260828150801613 — l'ancien endpoint /settings/billing/actions répond 410 (migré) ;
 * on lit /settings/billing/usage (« enhanced billing platform »). Dégradation propre si l'API
 * est inaccessible (message clair, exit ≠ 0, jamais de stacktrace nue).
 */
import { execFileSync } from 'node:child_process';
import {
  type UsageItem,
  aggregateActionsUsage,
  formatConsoReport,
} from '../src/core/ci-conso.js';

function fail(msg: string): never {
  console.error(`ci-conso : ${msg}`);
  process.exit(1);
}

/** Appelle `gh api <path>` et parse le JSON. Jamais de shell interpolé (execFileSync). */
function ghApi(path: string): unknown {
  const out = execFileSync('gh', ['api', path], { encoding: 'utf8' });
  return JSON.parse(out);
}

function resolvePeriod(arg: string | undefined): { year: number; month: number; label: string } {
  if (arg) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(arg);
    if (!m) fail(`période invalide « ${arg} » — attendu YYYY-MM (ex. 2026-08)`);
    // `fail` est `never` → TS a déjà narrow `m` en non-null ici (nit de revue : plus de `!`).
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12) fail(`mois hors bornes dans « ${arg} »`);
    return { year, month, label: `${m[1]}-${String(month).padStart(2, '0')}` };
  }
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return { year, month, label: `${year}-${String(month).padStart(2, '0')}` };
}

function main(): void {
  const { year, month, label } = resolvePeriod(process.argv[2]);

  // 1) l'utilisateur authentifié (le billing est niveau compte)
  let login: string;
  try {
    login = (ghApi('user') as { login?: string }).login ?? '';
  } catch {
    fail('`gh` non authentifié — lance `gh auth login`.');
  }
  if (!login) fail('impossible de résoudre le login `gh` (réponse /user sans .login).');

  // 2) la conso du mois (endpoint migré ; l'ancien /billing/actions répond 410)
  let items: UsageItem[];
  try {
    const data = ghApi(`/users/${login}/settings/billing/usage?year=${year}&month=${month}`) as {
      usageItems?: UsageItem[];
    };
    items = data.usageItems ?? [];
  } catch {
    console.error(`ci-conso : API billing inaccessible — /users/${login}/settings/billing/usage`);
    console.error('  → le token `gh` a-t-il le scope billing ? (sinon `gh auth refresh -s read:billing`)');
    console.error('  → l\'ancien /settings/billing/actions est mort (410) : ne pas y revenir.');
    process.exit(1);
  }

  // 3) visibilité par repo (best-effort, N appels ; public = Actions gratuit)
  const repos = [
    ...new Set(
      items
        .filter((i) => i.product === 'actions' && i.unitType === 'Minutes')
        .map((i) => i.repositoryName),
    ),
  ];
  const visibility: Record<string, string> = {};
  for (const repo of repos) {
    try {
      visibility[repo] = (ghApi(`/repos/${login}/${repo}`) as { visibility?: string }).visibility ?? '?';
    } catch {
      visibility[repo] = '?'; // repo sous une org, supprimé, ou droits manquants — non bloquant
    }
  }

  // 4) agrégation déterministe (cœur pur) + rendu
  console.log(formatConsoReport(aggregateActionsUsage(items, visibility), label));
}

main();
