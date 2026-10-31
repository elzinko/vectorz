/**
 * Preuve de l'enquête du 2026-10-30 (les deux boards) : pour chaque projet du registre, compare ce que
 * mission control calcule (la copie cop1) et ce que la méthode calcule (l'original), puis explique
 * chaque écart fiche par fiche. Les projets réels bougent d'un jour à l'autre (branches, nouvelles
 * fiches) : la preuve STABLE est la fixture de la fin, un faux projet où chaque cause a son cas et son
 * résultat attendu. Rien n'est écrit hors d'un dossier temporaire, effacé à la fin.
 *
 *   cd products/mega-city && pnpm exec tsx ../../docs/captures/2026-10-30-enquete-boards/mesure-ecarts.ts
 *
 * C'est une pièce à conviction, pas du code de production. Elle deviendra le test de parité du plan de
 * validation (voir le dossier voisin), puis sera retirée.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPlan, readBacklogFiches } from '../../../products/cop1/packages/app/src/features/board/backlogReader.js';
import { TERMINAUX } from '../../../products/mega-city/src/core/fiche-schema.js';
import { buildVersions } from '../../../products/mega-city/src/backlog/versions.js';
import { versionScope } from '../../../products/mega-city/src/backlog/version-scope.js';
import { collectInProgressIds } from '../../../products/mega-city/src/io/sessions-collect.js';
import { loadFiches } from '../../../products/mega-city/src/loaders/fiches.js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Les projets du registre de la supervision (id + chemin), lus sans dépendance. */
function registry(): Array<{ id: string; root: string }> {
  const text = readFileSync(join(REPO, 'supervision.registry.yaml'), 'utf8');
  return [...text.matchAll(/- id:\s*(\S+)\s*\n\s*path:\s*(\S+)/g)].map(([, id, path]) => ({
    id,
    root: isAbsolute(path) ? path : resolve(REPO, path),
  }));
}

function gitTags(root: string, pattern?: string): Set<string> {
  try {
    const args = ['-C', root, 'tag', '--list', ...(pattern ? [pattern] : [])];
    return new Set(execFileSync('git', args, { encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

for (const { id, root } of registry()) {
  // Mission control : exactement ce que fait boardProvider.ts (readTags lit `v*`).
  const mcFiches = readBacklogFiches(root);
  const mc = projectPlan(mcFiches, gitTags(root, 'v*'));

  // La méthode : ses lecteurs et ses règles officielles.
  const fiches = loadFiches(root);
  const report = buildVersions(fiches, gitTags(root));
  const enCours = collectInProgressIds(root);
  const active = fiches.filter((f) => !f.done && f.status !== 'shipped' && !TERMINAUX.includes(f.status));
  const parked = (f: (typeof fiches)[number]): boolean => f.status === 'idea' && f.milestone === 'parked';
  const m = {
    idea: active.filter((f) => f.status === 'idea' && !parked(f)).length,
    ready: active.filter((f) => f.status === 'ready').length,
    enCours: active.filter((f) => enCours.has(f.id)).length,
    unversioned: report.unversioned.total - report.unversioned.parked,
    parked: active.filter(parked).length,
    shipped: fiches.filter((f) => f.done || f.status === 'shipped').length,
    current: versionScope(report).current ?? '—',
  };

  console.log(`\n=== ${id}  (${fiches.length} fiches)`);
  const row = (k: string, a: unknown, b: unknown): void =>
    console.log(`${a === b ? '  ' : '≠ '}${k.padEnd(20)} méthode=${String(a).padEnd(8)} mission control=${String(b)}`);
  row('idées', m.idea, mc.funnel.idea);
  row('prêtes', m.ready, mc.funnel.ready);
  row('en cours', m.enCours, mc.funnel.wip);
  row('sans version', m.unversioned, mc.funnel.unversioned);
  row('parkées', m.parked, mc.funnel.parked);
  row('livrées', m.shipped, mc.done);
  row('version en cours', m.current, mc.versions.current?.ver ?? '—');

  // Les causes, fiche par fiche.
  const mcById = new Map(mcFiches.map((f) => [f.id, f]));
  for (const f of fiches) {
    const c = mcById.get(f.id);
    const lost = c && c.status === '' && f.status !== '';
    if (lost) console.log(`  front-matter illisible pour mission control (statut, version… perdus) : ${f.file}`);
  }
  const blocked = active.filter((f) => f.blocked !== '').length;
  if (blocked) console.log(`  bloquées, invisibles dans mission control : ${blocked}`);
  // Le format que mission control accepte (backlogReader.ts:82, insensible à la casse).
  const closedVersioned = fiches.filter((f) => TERMINAUX.includes(f.status) && /^v\d+\.\d+\.\d+$/i.test(f.version));
  if (closedVersioned.length)
    console.log(`  closes sans livraison mais comptées dans le total d'une version par mission control : ${closedVersioned.length}`);
  const bad = fiches.filter((f) => f.version !== '' && !/^v\d+\.\d+\.\d+$/.test(f.version));
  if (bad.length)
    console.log(`  versions illisibles (${[...new Set(bad.map((f) => f.version))].join(', ')}) : signalées par la méthode, ignorées en silence par mission control : ${bad.length}`);
}

// ── La fixture : un faux projet, une fiche par cause, un résultat attendu chacune ─────────────────
const FIX = mkdtempSync(join(tmpdir(), 'enquete-boards-'));
try {
  const fiche = (file: string, fm: string): void => {
    mkdirSync(dirname(join(FIX, file)), { recursive: true });
    writeFileSync(join(FIX, file), `---\n${fm}\n---\n\n## En clair\n\nFiche de fixture.\n`);
  };
  fiche('features/20990101000000001_en-cours.md', 'id: "20990101000000001"\ntitle: En cours\nstatus: ready\nversion: v1.0.0');
  fiche('features/20990101000000002_deux-points.md', 'id: "20990101000000002"\ntitle: Tour Driver.js : tracking\nstatus: idea\nversion: v2.0.0');
  fiche('features/20990101000000003_bloquee.md', 'id: "20990101000000003"\ntitle: Bloquée\nstatus: ready\nblocked: panel\nversion: v1.0.0');
  fiche('features/done/20990101000000004_remplacee.md', 'id: "20990101000000004"\ntitle: Remplacée\nstatus: superseded\nversion: v1.0.0');
  fiche('features/20990101000000005_version-mal-ecrite.md', 'id: "20990101000000005"\ntitle: Version mal écrite\nstatus: idea\nversion: V1.1');
  fiche('features/done/20990101000000006_livree.md', 'id: "20990101000000006"\ntitle: Livrée\nstatus: shipped\nversion: v1.0.0');
  const git = (...args: string[]): void => {
    execFileSync('git', ['-C', FIX, '-c', 'user.email=f@x', '-c', 'user.name=fixture', ...args], { stdio: 'ignore' });
  };
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  // Une branche de travail avec un commit que main n'a pas : la fiche 1 est « en cours » (ADR-0077).
  git('checkout', '-qb', 'feat/20990101000000001-en-cours');
  writeFileSync(join(FIX, 'travail.txt'), 'en cours\n');
  git('add', '-A');
  git('commit', '-qm', 'travail');
  git('checkout', '-q', 'main');

  const mcFiches = readBacklogFiches(FIX);
  const mc = projectPlan(mcFiches, new Set());
  const fiches = loadFiches(FIX);
  const report = buildVersions(fiches, new Set());
  const enCours = collectInProgressIds(FIX);
  const mcLot = (v: string): number =>
    [mc.versions.current, ...mc.versions.upcoming, ...mc.versions.past].find((l) => l?.ver === v)?.total ?? 0;
  const lot = (v: string): number => {
    const l = report.lots.find((x) => x.version === v);
    return l ? l.shipped.length + l.todo.length : 0;
  };
  const f2 = mcFiches.find((f) => f.id === '20990101000000002');
  const checks: Array<[string, boolean]> = [
    ['1. en cours : la méthode voit 1 fiche, mission control 0', enCours.size === 1 && mc.funnel.wip === 0],
    ['2. titre avec « : » : la méthode lit le statut, mission control le perd', fiches.find((f) => f.id === '20990101000000002')?.status === 'idea' && f2?.status === ''],
    ['3. bloquée : la méthode la voit, mission control n\'a pas le champ', fiches.filter((f) => f.blocked !== '').length === 1 && !('blocked' in (mcFiches[0] ?? {}))],
    ['4. v1.0.0 : la méthode compte 3 fiches, mission control 4 (avec la remplacée)', lot('v1.0.0') === 3 && mcLot('v1.0.0') === 4],
    ['5. V1.1 : la méthode la signale illisible, mission control la fait disparaître', report.malformed.length === 1 && mcLot('V1.1') === 0],
  ];
  console.log('\n=== fixture (résultat stable, rejouable)');
  for (const [label, ok] of checks) console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
} finally {
  rmSync(FIX, { recursive: true, force: true });
}
