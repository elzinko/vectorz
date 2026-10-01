/**
 * Contexte de run (fiche 20260906122942607) : le bloc que l'on lit AVANT qu'un run auto démarre.
 *
 * En clair : le bloc dit où le run part (base fraîche ou non), où il travaille (worktree), qui écrit
 * les fichiers, et ce qu'il fera seul (le contrat en trois lignes). Il reflète les réglages réels :
 * jamais un texte figé.
 */
import { describe, expect, it } from 'vitest';
import { buildRunContext, type RunFacts, type RunSettings } from '../run-context.js';

const settings = (over: Partial<RunSettings> = {}): RunSettings => ({
  mode: 'auto',
  delivery: 'per-feature',
  tokens: 'lean',
  ...over,
});

const facts = (over: Partial<RunFacts> = {}): RunFacts => ({
  remote: 'ok',
  originMain: { sha: '3133cd5', subject: 'docs(features): ship V0.4 lot 6 (#306)' },
  behind: 0,
  ahead: 0,
  clean: true,
  fastForwardable: true,
  worktree: { kind: 'secondary', path: '/w/agent-a1', branch: 'feat/x' },
  ...over,
});

const text = (s: RunSettings, f: RunFacts): string => buildRunContext(s, f).lines.join('\n');

describe('buildRunContext — la base', () => {
  it("dit que la base est à jour quand HEAD ne retarde pas sur origin/main", () => {
    const out = text(settings(), facts());
    expect(out).toContain('origin/main = 3133cd5');
    expect(out).toContain('docs(features): ship V0.4 lot 6 (#306)');
    expect(out).toMatch(/à jour/);
  });

  it('un retard avec arbre propre et fast-forward strict : réalignement sûr', () => {
    const out = text(settings(), facts({ behind: 3 }));
    expect(out).toMatch(/en retard de 3 commits/);
    expect(out).toMatch(/fast-forward/);
  });

  it('un retard avec arbre sale ou divergent : avertissement seul, jamais de geste', () => {
    const dirty = text(settings(), facts({ behind: 2, clean: false, fastForwardable: false }));
    expect(dirty).toMatch(/en retard de 2 commits/);
    expect(dirty).toMatch(/avertissement seul/);
    expect(dirty).toMatch(/rebase|stop|go/);
  });

  it('dit la base réellement comparée quand --base la change', () => {
    const out = text(settings(), facts({ baseRef: 'origin/release' }));
    expect(out).toContain('origin/release = 3133cd5');
    expect(out).not.toContain('origin/main');
  });

  it('sans remote joignable : avertit sans bloquer', () => {
    const { lines } = buildRunContext(settings(), facts({ remote: 'none', originMain: undefined }));
    expect(lines.join('\n')).toMatch(/pas de remote joignable.*avertissement, pas un blocage/);
  });
});

describe('buildRunContext — le worktree et qui écrit', () => {
  it('worktree secondaire : écriture inline, parce qu’un sous-agent écrirait chez lui', () => {
    const out = text(settings(), facts());
    expect(out).toMatch(/secondaire/);
    expect(out).toContain('/w/agent-a1');
    expect(out).toContain('feat/x');
    expect(out).toMatch(/inline/);
    expect(out).toMatch(/sous-agent/);
  });

  it('worktree principal : un sous-agent peut écrire', () => {
    const out = text(settings(), facts({ worktree: { kind: 'primary', path: '/repo', branch: 'main' } }));
    expect(out).toMatch(/principal/);
    expect(out).toMatch(/sous-agent.*possible|délégation.*possible/i);
  });
});

describe('buildRunContext — le contrat en trois lignes reflète les réglages réels', () => {
  const contract = (s: RunSettings): string[] =>
    buildRunContext(s, facts()).lines.filter((l) => /^\s*[123]\. /.test(l));

  it('auto + per-feature : je merge les fiches vertes, 4 STOP, plafond lean', () => {
    const c = contract(settings());
    expect(c).toHaveLength(3);
    expect(c[0]).toMatch(/merge/i);
    expect(c[0]).toMatch(/gate verte/);
    expect(c[1]).toMatch(/4/);
    for (const stop of ['irréversible', 'budget', 'idée produit', 'contradictoires']) expect(c[1], stop).toContain(stop);
    expect(c[2]).toContain('lean');
  });

  it('auto + per-epic : les PR du lot restent ouvertes, rien n’est mergé au fil de l’eau', () => {
    const c = contract(settings({ delivery: 'per-epic' }));
    expect(c[0]).toMatch(/ouvertes/);
    expect(c[0]).not.toMatch(/je merge les fiches vertes/i);
  });

  it('manuel : rien ne se décide seul', () => {
    const c = contract(settings({ mode: 'manuel' }));
    expect(c[0]).toMatch(/checkpoint/);
    expect(c[0]).not.toMatch(/je merge/i);
  });

  it('cap et full disent leur plafond', () => {
    expect(contract(settings({ tokens: 'cap' }))[2]).toMatch(/cap.*point sûr/);
    expect(contract(settings({ tokens: 'full' }))[2]).toMatch(/full.*aucun plafond/);
  });
});

describe('buildRunContext — le briefing reste court', () => {
  it('rappelle les réglages et la fiche visée, en une dizaine de lignes au plus', () => {
    const { lines } = buildRunContext(settings({ fiche: '0080', maxSprints: 2, review: false }), facts());
    const out = lines.join('\n');
    expect(out).toContain('--mode auto');
    expect(out).toContain('--tokens lean');
    expect(out).toContain('--delivery per-feature');
    expect(out).toMatch(/--max-sprints 2/);
    expect(out).toContain('0080');
    expect(lines.length).toBeLessThanOrEqual(12);
  });

  it('ouvre par le titre « Contexte de run »', () => {
    expect(buildRunContext(settings(), facts()).lines[0]).toBe('Contexte de run');
  });
});
