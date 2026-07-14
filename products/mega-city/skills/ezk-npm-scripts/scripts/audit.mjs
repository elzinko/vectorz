#!/usr/bin/env node
// ezk-npm-scripts — deterministic audit of a pnpm/npm/turbo monorepo's scripts.
//
//   node audit.mjs [repoRoot]   (default: cwd)
//
// Prints the root scripts, each package's scripts, and flags consistency gaps:
//   • child scripts not surfaced at the root (no root alias delegates to them)
//   • root aliases whose `--filter <pkg>` targets an unknown package (dead alias)
//   • standard verbs (dev/build/test/lint/typecheck/clean) missing per package
// Heuristic by design — the SKILL.md adds the judgment (naming, which gaps matter).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();
const STD_VERBS = ['dev', 'build', 'test', 'lint', 'typecheck', 'clean'];

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

const rootPkg = readJSON(join(root, 'package.json'));
if (!rootPkg) {
  console.error(`✗ no package.json at ${root}`);
  process.exit(2);
}

// ─── Discover workspace globs (root "workspaces" and/or pnpm-workspace.yaml) ──
function workspaceGlobs() {
  const globs = [];
  const ws = rootPkg.workspaces;
  if (Array.isArray(ws)) globs.push(...ws);
  else if (ws && Array.isArray(ws.packages)) globs.push(...ws.packages);
  const pnpmWs = join(root, 'pnpm-workspace.yaml');
  if (existsSync(pnpmWs)) {
    for (const line of readFileSync(pnpmWs, 'utf8').split('\n')) {
      const m = line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/);
      if (m) globs.push(m[1].trim());
    }
  }
  return [...new Set(globs)];
}

// Expand a one-level "dir/*" (or "dir/**") glob to package dirs that have a package.json.
function expandGlob(glob) {
  const base = glob.replace(/\/\*\*?$/, '');
  const dirs = [];
  const abs = join(root, base);
  if (glob.endsWith('*')) {
    let entries = [];
    try { entries = readdirSync(abs, { withFileTypes: true }); } catch { return []; }
    for (const e of entries) {
      if (e.isDirectory() && existsSync(join(abs, e.name, 'package.json'))) {
        dirs.push(join(base, e.name));
      }
    }
  } else if (existsSync(join(abs, 'package.json'))) {
    dirs.push(base);
  }
  return dirs;
}

const pkgDirs = [...new Set(workspaceGlobs().flatMap(expandGlob))];
const packages = pkgDirs
  .map((d) => ({ dir: d, pkg: readJSON(join(root, d, 'package.json')) }))
  .filter((p) => p.pkg)
  .map((p) => ({ dir: p.dir, name: p.pkg.name || p.dir, scripts: p.pkg.scripts || {} }));

const pkgNames = new Set(packages.map((p) => p.name));
const rootScripts = rootPkg.scripts || {};

// ─── Heuristics over root commands ───────────────────────────────────────────
const rootCmds = Object.entries(rootScripts).map(([name, cmd]) => {
  // pnpm filters: strip quotes; a leading `!` is an EXCLUSION, not a package ref.
  const raw = [...cmd.matchAll(/--filter[=\s]+(\S+)/g)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
  const include = raw.filter((f) => !f.startsWith('!'));
  const exclude = raw.filter((f) => f.startsWith('!')).map((f) => f.slice(1));
  const aggregate = /(^|\s)(-r|--recursive)(\s|$)/.test(cmd) || /(^|\s)turbo\s/.test(cmd);
  // task tokens: words after `run`, or turbo's first task, or bare verbs present
  const tokens = cmd.split(/\s+/);
  const taskGuess = new Set();
  const runIdx = tokens.indexOf('run');
  if (runIdx >= 0 && tokens[runIdx + 1]) taskGuess.add(tokens[runIdx + 1]);
  const turboIdx = tokens.indexOf('turbo');
  if (turboIdx >= 0 && tokens[turboIdx + 1] && !tokens[turboIdx + 1].startsWith('-')) taskGuess.add(tokens[turboIdx + 1]);
  for (const t of tokens) if (/^[a-z][\w:-]*$/.test(t) && !t.startsWith('-')) taskGuess.add(t);
  return { name, cmd, include, exclude, aggregate, tasks: taskGuess };
});

// Dead alias = an INCLUSION filter pointing at a package that doesn't exist.
const deadFilters = rootCmds.flatMap((c) =>
  c.include.filter((f) => !pkgNames.has(f)).map((f) => ({ root: c.name, filter: f })),
);

// Surfaced if some root script runs this task AND it reaches this package:
// either explicitly included, or via an aggregate (-r / turbo) that doesn't exclude it.
function isSurfaced(pkgName, scriptName) {
  return rootCmds.some(
    (c) =>
      c.tasks.has(scriptName) &&
      (c.include.includes(pkgName) || (c.aggregate && !c.exclude.includes(pkgName))),
  );
}

// ─── Report ──────────────────────────────────────────────────────────────────
const L = (s = '') => console.log(s);
// Turbo if there's a turbo.json OR any root script actually invokes `turbo`.
const usesTurbo = existsSync(join(root, 'turbo.json')) || rootCmds.some((c) => /(^|\s)turbo\s/.test(c.cmd));
L(`# Audit des scripts — ${root}`);
L(`runner: ${usesTurbo ? 'turbo' : 'pnpm/npm'} · packages: ${packages.length}`);
L();
L(`## Scripts racine (${Object.keys(rootScripts).length})`);
for (const [n, c] of Object.entries(rootScripts)) L(`  ${n} → ${c}`);

L();
L('## Par package');
const notSurfaced = [];
const missingVerbs = [];
for (const p of packages) {
  const names = Object.keys(p.scripts);
  L(`  ${p.name} (${p.dir}) — ${names.join(', ') || '(aucun script)'}`);
  for (const s of names) if (!isSurfaced(p.name, s)) notSurfaced.push({ pkg: p.name, script: s });
  const miss = STD_VERBS.filter((v) => !(v in p.scripts));
  if (miss.length) missingVerbs.push({ pkg: p.name, miss });
}

L();
L('## ⚠️ Écarts (heuristique — à confirmer par jugement)');
L(`### Cassé : alias root avec --filter vers un package inconnu (${deadFilters.length})`);
for (const d of deadFilters) L(`  ✗ "${d.root}" → --filter ${d.filter} (package introuvable)`);
deadFilters.length || L('  ✓ aucun');

L(`### Invisible : scripts enfants non exposés à la racine (${notSurfaced.length})`);
for (const n of notSurfaced) L(`  • ${n.pkg} : "${n.script}" — pas d'alias racine ? (vérifier)`);
notSurfaced.length || L('  ✓ aucun');

L('### Verbes standard manquants (pertinence à juger par package)');
for (const m of missingVerbs) L(`  • ${m.pkg} : ${m.miss.join(', ')}`);
missingVerbs.length || L('  ✓ tous présents');

L();
L('> Heuristique : la détection « exposé » repose sur le nom de script + --filter/agrégat.');
L('> Le skill ezk-npm-scripts tranche : nommage, pertinence d\'un verbe par package, doublons.');
