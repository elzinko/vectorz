/**
 * cli-commands — les commandes `ezk` entrent dans le graphe (fiche 20261117114544666, ADR-0089).
 *
 * En clair : chaque commande du manifeste est une brique `command` ; elle lance un outil ; un skill
 * qui la cite en code (`ezk <domaine> <verbe>`) l'utilise.
 */
import { describe, expect, it } from 'vitest';
import { deriveCliCommands } from '../core/cli-commands.js';

const entries = [
  { domain: 'forge', verb: 'integrate', run: 'bin/forge.ts integrate' },
  { domain: 'forge', verb: 'ship', run: 'bin/forge.ts ship' },
  { domain: 'graph', verb: 'check', run: 'bin/ezk-graph.ts' },
  { domain: 'help', run: 'bin/ezk-help.ts' },
  { domain: 'vieux', verb: 'nom', run: 'bin/x.ts', deprecated: 'forge integrate' },
];

describe('deriveCliCommands', () => {
  it('une commande par entrée : id « ezk <domaine> <verbe> », ou « ezk <domaine> » sans verbe', () => {
    const ids = deriveCliCommands(entries, []).map((c) => c.id);
    expect(ids).toEqual(['ezk forge integrate', 'ezk forge ship', 'ezk graph check', 'ezk help']);
  });

  it('une entrée dépréciée n’est pas une brique', () => {
    expect(deriveCliCommands(entries, []).map((c) => c.id)).not.toContain('ezk vieux nom');
  });

  it('le script est le premier mot de `run`', () => {
    const c = deriveCliCommands(entries, []).find((x) => x.id === 'ezk forge ship');
    expect(c?.script).toBe('bin/forge.ts');
  });

  it('un skill qui cite la commande entre backticks l’utilise, arguments compris', () => {
    const skills = [
      {
        skill: 'ezk-sprint',
        texts: ['Lance `ezk forge integrate --dry-run <id>` puis `ezk graph check`.'],
      },
      { skill: 'ezk-pr', texts: ['Lance `ezk forge integrate`.'] },
    ];
    const cmds = deriveCliCommands(entries, skills);
    expect(cmds.find((c) => c.id === 'ezk forge integrate')?.usedBy).toEqual([
      'ezk-pr',
      'ezk-sprint',
    ]);
    expect(cmds.find((c) => c.id === 'ezk graph check')?.usedBy).toEqual(['ezk-sprint']);
    expect(cmds.find((c) => c.id === 'ezk forge ship')?.usedBy).toEqual([]);
  });

  it('une citation hors backticks, ou une commande plus longue, ne compte pas', () => {
    const skills = [
      {
        skill: 'a',
        texts: ['ezk graph check sans backticks', '`ezk graph checkout`', '`ezk forge`'],
      },
    ];
    expect(deriveCliCommands(entries, skills).every((c) => c.usedBy.length === 0)).toBe(true);
  });

  it('une commande sans verbe se cite avec ses arguments', () => {
    const skills = [{ skill: 'a', texts: ['`ezk help --json`'] }];
    expect(deriveCliCommands(entries, skills).find((c) => c.id === 'ezk help')?.usedBy).toEqual([
      'a',
    ]);
  });
});
