/**
 * graph-check — le bord qui assemble le contrat de `ezk graph check --json` (fiche 20261117114544666,
 * ADR-0089). `bin/ezk-graph.ts` et le générateur d'exemples passent tous deux par ici.
 */
import { type GraphCheck, buildGraphCheck } from '../core/graph-check.js';
import { graphEdges } from '../core/graph.js';
import { checkPathRefs } from '../core/structural-refs.js';
import { type Catalog, catalogSources, loadCatalog } from '../loaders/catalog.js';
import { scanPathRefs } from '../loaders/path-refs.js';

/** Le graphe réel de la méthode, lu depuis sa racine (`products/mega-city`). */
export function graphCheckData(megaCityRoot: string): GraphCheck {
  const catalog = loadCatalog(megaCityRoot);
  const pathRefs = checkPathRefs(scanPathRefs(megaCityRoot), graphEdges(catalog));
  return buildGraphCheck(catalog, pathRefs, catalogSources(megaCityRoot));
}

/**
 * L'exemple rangé : un petit graphe écrit ici, pas le vrai. L'exemple ne doit pas changer à chaque
 * brique ajoutée à la méthode. Il montre une compétence qui applique une règle et cite une commande,
 * la commande qui lance un outil, et une commande orpheline.
 */
export function graphCheckExample(): GraphCheck {
  const catalog: Catalog = {
    rules: new Map([
      [
        'clean-code/no-dead-code',
        { id: 'clean-code/no-dead-code', kind: 'disposition', level: 'MUST', content: '' },
      ],
    ]),
    agents: new Map(),
    skills: new Map([
      ['ezk-sprint', { id: 'ezk-sprint', content: '', applies: ['clean-code/no-dead-code'] }],
    ]),
    bundles: new Map(),
    profiles: new Map(),
    tools: new Map([
      [
        'bin/forge-integrate.ts',
        { id: 'bin/forge-integrate.ts', usedBy: [], commands: ['ezk forge integrate'] },
      ],
    ]),
    cliCommands: new Map([
      [
        'ezk forge integrate',
        { id: 'ezk forge integrate', script: 'bin/forge-integrate.ts', usedBy: ['ezk-sprint'] },
      ],
      ['ezk help', { id: 'ezk help', script: 'bin/ezk-help.ts', usedBy: [] }],
    ]),
  };
  const sources = new Map([
    ['rule:clean-code/no-dead-code', 'rules/clean-code/no-dead-code.md'],
    ['skill:ezk-sprint', 'skills/ezk-sprint/SKILL.md'],
    ['tool:bin/forge-integrate.ts', 'bin/forge-integrate.ts'],
    ['command:ezk forge integrate', 'ezk-manifest.yml'],
    ['command:ezk help', 'ezk-manifest.yml'],
  ]);
  return buildGraphCheck(catalog, { undeclared: [], unsupported: [] }, sources);
}
