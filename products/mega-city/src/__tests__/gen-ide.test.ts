import { describe, expect, it } from 'vitest';
import { type CommandSpec, GEN_MARKER, genIdeFiles } from '../core/gen-ide.js';

const cmds: CommandSpec[] = [
  { slug: 'now', invocation: 'ezk now', summary: 'Boussole de session' },
  { slug: 'backlog-check', invocation: 'ezk backlog check', summary: 'Vérifie les fiches' },
];

const paths = (cs: CommandSpec[]) => genIdeFiles(cs).map((f) => f.path);
const byPath = (cs: CommandSpec[], p: string) => genIdeFiles(cs).find((f) => f.path === p);

describe('genIdeFiles — générateur multi-IDE (fiche 20261007151859470, ADR-0073)', () => {
  it('une source unique génère .claude/, .cursor/ et AGENTS.md (AC1)', () => {
    const ps = paths(cmds);
    expect(ps).toContain('.claude/commands/now.md');
    expect(ps).toContain('.cursor/commands/now.md');
    expect(ps).toContain('.claude/commands/backlog-check.md');
    expect(ps).toContain('.cursor/commands/backlog-check.md');
    expect(ps).toContain('AGENTS.md');
  });

  it('entre deux IDE, seule la syntaxe d’invocation diffère (AC2 : diff minimal)', () => {
    const claude = byPath(cmds, '.claude/commands/now.md')?.content ?? '';
    const cursor = byPath(cmds, '.cursor/commands/now.md')?.content ?? '';
    expect(claude).not.toBe(cursor);
    // La seule ligne qui diffère est l'invocation (placeholder d'arguments).
    const diff = claude
      .split('\n')
      .map((l, i) => [l, cursor.split('\n')[i]] as const)
      .filter(([a, b]) => a !== b);
    expect(diff).toEqual([['ezk now $ARGUMENTS', 'ezk now {{args}}']]);
  });

  it('les fichiers par IDE ne portent aucune logique : ils appellent `ezk …` (AC4)', () => {
    const claude = byPath(cmds, '.claude/commands/backlog-check.md')?.content ?? '';
    expect(claude).toContain('ezk backlog check');
    expect(claude).toContain('description: Vérifie les fiches');
  });

  it('chaque fichier porte le marqueur anti-dérive (support du --check)', () => {
    for (const f of genIdeFiles(cmds)) expect(f.content).toContain(GEN_MARKER);
  });

  it('AGENTS.md liste chaque commande avec son invocation et son résumé', () => {
    const agents = byPath(cmds, 'AGENTS.md')?.content ?? '';
    expect(agents).toContain('`ezk now` — Boussole de session');
    expect(agents).toContain('`ezk backlog check` — Vérifie les fiches');
  });

  it('déterministe : trié par chemin, byte-for-byte reproductible', () => {
    const a = genIdeFiles(cmds);
    const b = genIdeFiles(cmds);
    expect(a).toEqual(b);
    expect(a.map((f) => f.path)).toEqual([...a.map((f) => f.path)].sort());
  });
});
