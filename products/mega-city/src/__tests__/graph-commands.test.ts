/**
 * Les commandes `ezk` dans le graphe compilé : un 7ᵉ type de nœud `command`, un lien `launches`
 * (commande → outil, verbe `lance`) et un lien `uses-command` (skill → commande, verbe `utilise`)
 * — fiche 20261117114544666, ADR-0089.
 *
 * En clair : chaque commande du manifeste est une brique ; elle lance l'outil que son script désigne ;
 * un skill qui la cite entre backticks l'utilise. Un script qui n'est pas un outil ne fait jamais un lien cassé.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CliCommand } from '../core/cli-commands.js';
import { compileGraph } from '../core/compiled-graph.js';
import { graphEdges, validateGraph } from '../core/graph.js';
import type { Tool } from '../core/tools.js';
import type { Skill } from '../domain/model.js';
import { type Catalog, loadCatalog } from '../loaders/catalog.js';

const index = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((x) => [x.id, x]));

const tool = (id: string): Tool => ({ id, usedBy: [], commands: [] });
const cmd = (id: string, script: string, usedBy: string[] = []): CliCommand => ({
  id,
  script,
  usedBy,
});

function catalogOf(skills: Skill[], tools: Tool[], cliCommands: CliCommand[]): Catalog {
  return {
    rules: new Map(),
    agents: new Map(),
    skills: index(skills),
    bundles: new Map(),
    profiles: new Map(),
    tools: index(tools),
    cliCommands: index(cliCommands),
  };
}

describe('nœuds `command`, liens `launches` et `uses-command`', () => {
  const catalog = catalogOf(
    [{ id: 'ezk-sprint', content: '' }],
    [tool('bin/forge.ts')],
    [
      cmd('ezk forge integrate', 'bin/forge.ts', ['ezk-sprint']),
      cmd('ezk legacy', 'bin/absent.ts'),
    ],
  );

  it('une commande lance son outil : arête commande → outil, verbe « lance »', () => {
    expect(graphEdges(catalog)).toContainEqual({
      from: 'ezk forge integrate',
      fromKind: 'command',
      link: 'launches',
      verb: 'lance',
      to: 'bin/forge.ts',
      toKind: 'tool',
    });
  });

  it('un skill qui cite la commande l’utilise : arête skill → commande, verbe « utilise »', () => {
    expect(graphEdges(catalog)).toContainEqual({
      from: 'ezk-sprint',
      fromKind: 'skill',
      link: 'uses-command',
      verb: 'utilise',
      to: 'ezk forge integrate',
      toKind: 'command',
    });
  });

  it('un script qui n’est pas un outil connu n’émet aucune arête, donc aucun lien cassé', () => {
    expect(graphEdges(catalog).some((e) => e.from === 'ezk legacy')).toBe(false);
    expect(validateGraph(catalog).broken).toEqual([]);
  });

  it('les commandes sont des nœuds, et l’une que personne ne cite est un orphelin d’information', () => {
    expect(
      compileGraph(catalog)
        .nodes.filter((n) => n.kind === 'command')
        .map((n) => n.id),
    ).toEqual(['ezk forge integrate', 'ezk legacy']);
    const report = validateGraph(catalog);
    expect(report.nodeCount.command).toBe(2);
    expect(report.orphans).toContainEqual({ kind: 'command', id: 'ezk legacy' });
  });
});

describe('les commandes du dépôt réel', () => {
  const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const real = loadCatalog(megaCity);

  it('ezk-sprint cite `ezk forge integrate` : la compétence utilise la commande', () => {
    expect(graphEdges(real)).toContainEqual({
      from: 'ezk-sprint',
      fromKind: 'skill',
      link: 'uses-command',
      verb: 'utilise',
      to: 'ezk forge integrate',
      toKind: 'command',
    });
  });

  it('`ezk graph check` lance bin/ezk-graph.ts', () => {
    expect(graphEdges(real)).toContainEqual({
      from: 'ezk graph check',
      fromKind: 'command',
      link: 'launches',
      verb: 'lance',
      to: 'bin/ezk-graph.ts',
      toKind: 'tool',
    });
  });

  it('aucun lien cassé : le graphe réel reste propre', () => {
    expect(validateGraph(real).broken).toEqual([]);
  });
});
