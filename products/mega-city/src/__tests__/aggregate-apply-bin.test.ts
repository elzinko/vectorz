/**
 * `backlog:apply` et `backlog:aggregate` de bout en bout (fiche 20260910231201744) : les VRAIS bins,
 * lancés sur un dépôt git jetable — vrai `git mv`, vrai `regen-backlog.sh`, vrai validateur.
 * Ce que les cœurs purs ne prouvent pas : les codes de sortie, le contrat d'écriture (rien d'écrit
 * à blanc ni sur refus ; `aggregate` ne touche jamais au dépôt), et la boucle fermée apply → `fiches:check`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ce fichier lance de vrais sous-processus (tsx, git) via spawnSync/execFileSync, BLOQUANTS.
// Sous charge, un appel grimpe jusqu'à ~30 s et dépasse le délai vitest par défaut (5 s) : la
// suite complète rougit par intermittence (fiche 20261001133500727). On élargit le délai POUR
// CE FICHIER seul — le reste de la suite garde 5 s, donc un test unitaire bloqué échoue toujours
// vite. Calibré sur le pire cas mesuré sous charge (~31 s) avec une marge ~2× ; un vrai blocage
// reste borné à 60 s avec un message clair.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..');
const tsx = createRequire(import.meta.url).resolve('tsx/cli');
const bins = {
  apply: join(megaCity, 'bin', 'backlog-apply.ts'),
  aggregate: join(megaCity, 'bin', 'backlog-aggregate.ts'),
  check: join(megaCity, 'bin', 'check-fiches.ts'),
};

const I = (n: number): string => `202601010000000${String(n).padStart(2, '0')}`;
const fm = (id: string, extra = '', status = 'ready'): string =>
  `---\nid: "${id}"\ntitle: "Fiche ${id}"\ntype: feature\npriority: P1\nstatus: ${status}\npr:\n${extra}---\n\ncorps\n`;

let root = '';
let side = ''; // dossier HORS dépôt : le fichier de propositions n'y salit pas `git status`

const git = (...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

function put(path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

function run(bin: keyof typeof bins, ...args: string[]): { code: number; out: string } {
  const r = spawnSync(process.execPath, [tsx, bins[bin], '--root', root, ...args], { encoding: 'utf8' });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

function proposals(items: unknown): string {
  const path = join(side, 'propositions.json');
  writeFileSync(path, typeof items === 'string' ? items : JSON.stringify(items));
  return path;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'aggregate-apply-'));
  side = mkdtempSync(join(tmpdir(), 'aggregate-apply-side-'));
  git('init', '--quiet');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  put('features/20260101000000001_f1.md', fm(I(1), 'labels: [bmad]\n'));
  put('features/20260101000000002_f2.md', fm(I(2), 'labels: [bmad]\n'));
  put('features/20260101000000003_f3.md', fm(I(3), '', 'idea'));
  put('features/done/20260101000000004_f4.md', fm(I(4), '', 'shipped'));
  put('features/PLAN.md', `# Plan\n\n## NOW\n\n- \`${I(2)}\` — la fiche 2 · \`build\`\n`);
  git('add', '.');
  git('commit', '--quiet', '-m', 'chore: seed');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(side, { recursive: true, force: true });
});

describe('backlog:apply — la fusion, de bout en bout', () => {
  it('à blanc : décrit ce qui changerait et n’écrit RIEN', () => {
    const r = run('apply', 'merge', '--into', I(1), I(2), '--dry-run');
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair :')).toBe(true);
    expect(r.out).toContain('À blanc');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('pour de vrai : sources merged + merged_into dans done/, résultante merged_from, PLAN barré, index régénéré', () => {
    const r = run('apply', 'merge', '--into', I(1), I(2));
    expect(r.code).toBe(0);
    expect(existsSync(join(root, `features/20260101000000002_f2.md`))).toBe(false);
    const source = read('features/done/20260101000000002_f2.md');
    expect(source).toMatch(/^status: merged$/m);
    expect(source).toContain(`merged_into: "${I(1)}"`);
    expect(read('features/20260101000000001_f1.md')).toContain(`merged_from: ["${I(2)}"]`);
    expect(read('features/PLAN.md')).toContain('~~');
    expect(existsSync(join(root, 'features/BACKLOG.md'))).toBe(true);
  });

  it('boucle fermée : après l’apply, `fiches:check --strict` est vert ; une provenance à sens unique le rend rouge', () => {
    expect(run('apply', 'merge', '--into', I(1), I(2)).code).toBe(0);
    expect(run('check', '--strict').code).toBe(0);
    // sabotage : on retire merged_from de la résultante → la source dit merged_into, la résultante ne le sait plus
    put(
      'features/20260101000000001_f1.md',
      read('features/20260101000000001_f1.md').replace(/^merged_from:.*\n/m, ''),
    );
    const bad = run('check', '--strict');
    expect(bad.code).toBe(1);
    expect(bad.out).toContain('non réciproque');
  });

  it('refuse AVANT d’écrire (code 1) : id inconnu, fiche livrée, résultante parmi les sources', () => {
    for (const args of [
      ['merge', '--into', I(1), I(99)],
      ['merge', '--into', I(1), I(4)],
      ['merge', '--into', I(1), I(1)],
    ]) {
      const r = run('apply', ...args);
      expect(r.code).toBe(1);
      expect(r.out).toContain('rien n\'a été écrit');
      expect(git('status', '--porcelain')).toBe('');
    }
  });

  it('refuse les usages invalides (code 1) sans rien écrire', () => {
    expect(run('apply').code).toBe(1);
    expect(run('apply', 'merge', I(2)).code).toBe(1); // pas de --into
    expect(run('apply', 'merge', '--into', `${I(1)},${I(3)}`, I(2)).code).toBe(1); // une seule résultante
    expect(run('apply', 'split', I(1), I(2), '--into', I(3)).code).toBe(1); // une seule source
    expect(run('apply', 'fusionner').code).toBe(1);
    expect(git('status', '--porcelain')).toBe('');
  });
});

describe('backlog:apply — le découpage, de bout en bout', () => {
  it('la source passe split dans done/ avec split_into ; chaque enfant cite la source (split_from)', () => {
    const r = run('apply', 'split', I(1), '--into', `${I(2)},${I(3)}`);
    expect(r.code).toBe(0);
    const source = read('features/done/20260101000000001_f1.md');
    expect(source).toMatch(/^status: split$/m);
    expect(source).toContain(`split_into: ["${I(2)}", "${I(3)}"]`);
    expect(read('features/20260101000000003_f3.md')).toContain(`split_from: "${I(1)}"`);
    expect(run('check', '--strict').code).toBe(0);
  });

  it('refuse un découpage à un seul enfant (code 1)', () => {
    const r = run('apply', 'split', I(1), '--into', I(2));
    expect(r.code).toBe(1);
    expect(r.out).toContain('au moins 2 enfants');
    expect(git('status', '--porcelain')).toBe('');
  });
});

describe('backlog:aggregate — le moteur llm « propose »', () => {
  it('--mode llm : le dossier à juger (fiches actives seulement) et le format de réponse', () => {
    const r = run('aggregate', '--mode', 'llm');
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair :')).toBe(true);
    expect(r.out).toContain(I(1));
    expect(r.out).toContain(I(3));
    expect(r.out).not.toContain(I(4)); // livrée : hors dossier
    expect(r.out).toContain('"kind": "merge"');
    expect(r.out).not.toContain('non implémenté');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('--mode llm --proposals : valide, nomme le geste, liste les rejets avec leur raison', () => {
    const file = proposals([
      { kind: 'merge', into: I(1), sources: [I(2)], why: 'même sujet' },
      { kind: 'merge', into: I(1), sources: [I(99)], why: 'id inventé' },
      { kind: 'split', source: I(3), into: [I(1)], why: 'un seul enfant' },
    ]);
    const r = run('aggregate', '--mode', 'llm', '--proposals', file);
    expect(r.code).toBe(0);
    expect(r.out).toContain('1 proposition(s) validée(s), 2 rejetée(s)');
    expect(r.out).toContain(`backlog:apply merge --into ${I(1)} ${I(2)}`);
    expect(r.out).toContain(`n°2 : id ${I(99)} inconnu`);
    expect(r.out).toContain('n°3 : un découpage demande au moins 2 enfants');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('toutes les propositions rejetées : les raisons sont listées ET le code de sortie est 1', () => {
    const file = proposals([{ kind: 'merge', into: I(1), sources: [I(99)], why: 'id inventé' }]);
    const r = run('aggregate', '--mode', 'llm', '--proposals', file);
    expect(r.code).toBe(1);
    expect(r.out).toContain('0 proposition(s) validée(s), 1 rejetée(s)');
    expect(r.out).toContain(`n°1 : id ${I(99)} inconnu`);
    expect(r.out).toContain('Aucune proposition valide');
    expect(git('status', '--porcelain')).toBe('');
  });

  it('--mode both : croise les clusters du script avec les propositions du llm', () => {
    const file = proposals([{ kind: 'merge', into: I(1), sources: [I(2)], why: 'même sujet' }]);
    const r = run('aggregate', '--mode', 'both', '--proposals', file);
    expect(r.code).toBe(0);
    expect(r.out).toContain('Croisement script ↔ llm');
    expect(r.out).toContain('confirmé par le llm : cluster [label] "bmad"');
  });

  it('--mode both sans propositions : le script puis le dossier à juger', () => {
    const r = run('aggregate', '--mode', 'both');
    expect(r.code).toBe(0);
    expect(r.out).toContain('Couverture');
    expect(r.out).toContain('aucune proposition fournie');
    expect(r.out).toContain('"kind": "split"');
  });

  it('un fichier illisible, absent, ou --proposals avec le moteur script : erreur franche (code 1)', () => {
    expect(run('aggregate', '--mode', 'llm', '--proposals', proposals('{pas du json')).out).toContain('illisible');
    expect(run('aggregate', '--mode', 'llm', '--proposals', proposals('{pas du json')).code).toBe(1);
    const missing = run('aggregate', '--mode', 'llm', '--proposals', join(side, 'absent.json'));
    expect(missing.code).toBe(1);
    expect(missing.out).toContain('introuvable');
    const withScript = run('aggregate', '--mode', 'script', '--proposals', proposals([]));
    expect(withScript.code).toBe(1);
    expect(withScript.out).toContain('--mode llm ou both');
  });

  it('le moteur script garde son comportement : clusters, couverture, geste nommé sans être exécuté', () => {
    const r = run('aggregate');
    expect(r.code).toBe(0);
    expect(r.out).toContain('"bmad"');
    expect(r.out).toContain('backlog:apply merge --into');
    expect(git('status', '--porcelain')).toBe('');
  });
});
