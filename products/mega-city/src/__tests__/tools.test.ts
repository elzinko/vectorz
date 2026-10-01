/**
 * tools — les OUTILS de la méthode (scripts de `bin/` et de `skills/<skill>/scripts/`), reliés aux
 * skills qui les citent (fiche 20260917123943914, ADR-0058).
 *
 * Le lien est CALCULÉ : un skill utilise un outil quand sa doc en cite le chemin. Chaque règle de
 * ce calcul a son test, parce qu'un lien faux sur la carte est pire qu'un lien absent.
 */
import { describe, expect, it } from 'vitest';
import { type RoutedTools, type SkillTexts, deriveTools, isToolFile } from '../core/tools.js';

const NO_ROUTING: RoutedTools = { commands: new Map(), internal: new Map() };

const skill = (id: string, ...texts: string[]): SkillTexts => ({ skill: id, texts });

/** Les skills qui citent `tool`, d'après un texte unique du skill `owner`. */
function usedBy(tool: string, text: string, owner = 'ezk-x', others: SkillTexts[] = []): string[] {
  const derived = deriveTools([tool], [skill(owner, text), ...others], NO_ROUTING);
  return derived[0]?.usedBy ?? [];
}

describe('isToolFile — ce qui est un outil', () => {
  it.each(['regen-backlog.sh', 'ezk-map.ts', 'ezk.mjs', 'audit.js'])('%s est un outil', (name) => {
    expect(isToolFile(name, false)).toBe(true);
  });

  it.each([
    ['test-regen-backlog.sh', 'un test, pas un outil'],
    ['regen.test.ts', 'un test, pas un outil'],
    ['regen.spec.mjs', 'un test, pas un outil'],
    ['README.md', 'de la doc'],
    ['.DS_Store', 'un fichier caché'],
    ['fixture.json', 'des données'],
    ['notes', 'un fichier sans extension ni droit d’exécution'],
  ])('%s n’est pas un outil (%s)', (name) => {
    expect(isToolFile(name, false)).toBe(false);
  });

  it('un fichier sans extension qui se lance (exécutable ou #!) est un outil (le hook commit-msg)', () => {
    expect(isToolFile('commit-msg', true)).toBe(true);
  });
});

describe('deriveTools — qui utilise quel outil', () => {
  it('le chemin complet depuis la racine du produit relie l’outil au skill', () => {
    expect(usedBy('bin/regen-backlog.sh', 'Lance `bash bin/regen-backlog.sh .` puis commite.')).toEqual([
      'ezk-x',
    ]);
  });

  it('le chemin depuis la racine du dépôt (products/mega-city/…) compte aussi', () => {
    expect(usedBy('bin/regen-backlog.sh', 'bash products/mega-city/bin/regen-backlog.sh .')).toEqual([
      'ezk-x',
    ]);
  });

  it('une mention dans un bloc de code compte : c’est là que les skills citent leurs outils', () => {
    const text = 'Lance :\n\n```bash\nbash products/mega-city/bin/regen-backlog.sh .\n```\n';
    expect(usedBy('bin/regen-backlog.sh', text)).toEqual(['ezk-x']);
  });

  it('`scripts/x` désigne un script du skill qui le cite, et de lui seul', () => {
    const tool = 'skills/ezk-archive/scripts/check.sh';
    expect(usedBy(tool, 'Joue `scripts/check.sh`.', 'ezk-archive')).toEqual(['ezk-archive']);
    // Un autre skill qui écrit « scripts/check.sh » parle de SON dossier, pas de celui-là.
    expect(usedBy(tool, 'Joue `scripts/check.sh`.', 'ezk-pr')).toEqual([]);
  });

  it('`<skill>/scripts/x` et le chemin complet relient un skill au script d’un autre skill', () => {
    const tool = 'skills/ezk-archive/scripts/check.sh';
    expect(usedBy(tool, 'voir ezk-archive/scripts/check.sh', 'ezk-pr')).toEqual(['ezk-pr']);
    expect(usedBy(tool, 'voir skills/ezk-archive/scripts/check.sh', 'ezk-pr')).toEqual(['ezk-pr']);
    expect(usedBy(tool, 'voir ~/.claude/skills/ezk-archive/scripts/check.sh', 'ezk-pr')).toEqual([
      'ezk-pr',
    ]);
  });

  it('un `scripts/x` cité par le chemin d’un AUTRE skill ne relie pas le skill propriétaire du même nom', () => {
    // ezk-pr a son propre scripts/check.sh ; il cite ici celui d'ezk-archive, par son chemin.
    const own = 'skills/ezk-pr/scripts/check.sh';
    expect(usedBy(own, 'voir skills/ezk-archive/scripts/check.sh', 'ezk-pr')).toEqual([]);
  });

  it('`./scripts/x` est la même chose que `scripts/x`', () => {
    expect(usedBy('skills/ezk-pr/scripts/ship.sh', 'bash ./scripts/ship.sh', 'ezk-pr')).toEqual([
      'ezk-pr',
    ]);
  });

  it.each([
    ['un gabarit <skill>', 'bash <skill>/scripts/ship.sh .'],
    ['un gabarit français', 'bash <chemin-du-skill>/scripts/ship.sh --gate'],
    ['un gabarit sous skills/', 'bash skills/<skill>/scripts/ship.sh .'],
    ['le dossier installé, avec un gabarit', 'bash ~/.claude/skills/<skill>/scripts/ship.sh .'],
    ['une variable $VAR', 'bash $SKILL/scripts/ship.sh snapshot'],
    ['une variable ${VAR}', 'bash ${SKILL}/scripts/ship.sh snapshot'],
    ['un lien relatif depuis un sous-dossier', '[le helper](../scripts/ship.sh)'],
  ])('un script du skill noté par %s est relié à ce skill', (_cas, text) => {
    expect(usedBy('skills/ezk-pr/scripts/ship.sh', text, 'ezk-pr')).toEqual(['ezk-pr']);
  });

  it('un gabarit désigne le dossier du skill qui écrit, jamais celui d’un autre skill', () => {
    // Le skill ezk-pr écrit <skill>/scripts/check.sh : c'est SON check.sh, pas celui d'ezk-archive.
    expect(usedBy('skills/ezk-archive/scripts/check.sh', 'bash <skill>/scripts/check.sh', 'ezk-pr')).toEqual([]);
  });

  it('un `scripts/x` dans le dossier d’un autre chemin n’est pas un script du skill', () => {
    expect(usedBy('skills/ezk-pr/scripts/ship.sh', 'voir ../../x/scripts/ship.sh', 'ezk-pr')).toEqual([]);
  });

  it('un nom nu ne compte pas : `check.sh` est ambigu', () => {
    expect(usedBy('skills/ezk-archive/scripts/check.sh', 'Lance check.sh.', 'ezk-archive')).toEqual([]);
  });

  it('un autre outil au nom voisin ne compte pas (test-…, suffixe, préfixe)', () => {
    const tool = 'bin/regen-backlog.sh';
    expect(usedBy(tool, 'bash bin/test-regen-backlog.sh')).toEqual([]);
    expect(usedBy(tool, 'bin/regen-backlog.sh.bak')).toEqual([]);
    expect(usedBy(tool, 'bin/regen-backlog.shx')).toEqual([]);
    expect(usedBy(tool, 'mybin/regen-backlog.sh')).toEqual([]);
    expect(usedBy(tool, 'pre-bin/regen-backlog.sh')).toEqual([]);
  });

  it('une phrase qui finit par le chemin compte : le point final n’est pas une extension', () => {
    expect(usedBy('bin/regen-backlog.sh', 'Le script est bin/regen-backlog.sh. Il régénère.')).toEqual([
      'ezk-x',
    ]);
  });

  it('plusieurs textes d’un skill (SKILL.md et ses fichiers) : un seul lien ; plusieurs skills : triés', () => {
    const derived = deriveTools(
      ['bin/a.sh'],
      [
        skill('zeta', 'bin/a.sh', 'bin/a.sh encore'),
        skill('alpha', 'rien', 'voir bin/a.sh'),
        skill('mu', 'rien du tout'),
      ],
      NO_ROUTING,
    );
    expect(derived).toEqual([{ id: 'bin/a.sh', usedBy: ['alpha', 'zeta'], commands: [] }]);
  });

  it('les outils sont rendus triés par id, même si les fichiers arrivent en désordre', () => {
    const derived = deriveTools(['bin/z.sh', 'bin/a.sh', 'bin/m.ts'], [], NO_ROUTING);
    expect(derived.map((t) => t.id)).toEqual(['bin/a.sh', 'bin/m.ts', 'bin/z.sh']);
  });

  it('reprend du manifeste ses commandes et sa raison « internal »', () => {
    const routing: RoutedTools = {
      commands: new Map([['bin/ezk-map.ts', ['ezk dashboard']]]),
      internal: new Map([['bin/ezk.ts', 'le routeur lui-même']]),
    };
    const derived = deriveTools(['bin/ezk-map.ts', 'bin/ezk.ts', 'bin/autre.ts'], [], routing);
    expect(derived).toEqual([
      { id: 'bin/autre.ts', usedBy: [], commands: [] },
      { id: 'bin/ezk-map.ts', usedBy: [], commands: ['ezk dashboard'] },
      { id: 'bin/ezk.ts', usedBy: [], commands: [], internal: 'le routeur lui-même' },
    ]);
  });
});
