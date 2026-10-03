/**
 * `ezk` — le routeur mince (fiche 20260903134906920, ADR-0046). Cœur PUR : on lit un manifeste,
 * on décide quel script lancer avec quels arguments. Aucun processus lancé ici.
 */
import { describe, expect, it } from 'vitest';
import {
  MANIFEST_RELPATH,
  childEnv,
  delegationTarget,
  findCheckoutRoot,
  parseManifest,
  renderDomainHelp,
  renderHelp,
  route,
  splitRouterFlags,
  uncoveredScripts,
} from '../core/ezk-cli.js';

const MANIFEST = parseManifest(`
commands:
  - domain: law
    verb: bind
    run: bin/lawgiver.ts bind
    summary: Déploie un profil dans un projet.
    root: none
  - domain: law
    verb: capture
    run: bin/lawgiver.ts capture
    summary: Range une règle, un skill ou un agent au catalogue.
  - domain: views
    verb: regen
    run: bin/views-regen.ts
    summary: Régénère toutes les vues générées.
  - domain: dashboard
    run: bin/ezk-map.ts
    summary: Ouvre le tableau de bord de la méthode.
  - domain: map
    run: bin/ezk-map.ts
    summary: Ancien nom du tableau de bord.
    deprecated: dashboard
  - domain: docs
    verb: check
    run: bin/check.sh {root} features "docs/mon dossier"
    summary: Vérifie les documents du dépôt.
internal:
  - script: bin/ezk.ts
    reason: le routeur lui-même
`);

const OWN = '/repo/vectorz';
const inside = { ownRoot: OWN, checkoutRoot: OWN };

describe('parseManifest', () => {
  it('lit les entrées et pose la règle de racine « fixed » par défaut', () => {
    expect(MANIFEST.commands).toHaveLength(6);
    expect(MANIFEST.commands[0]).toMatchObject({ domain: 'law', verb: 'bind', root: 'none' });
    expect(MANIFEST.commands[1]?.root).toBe('fixed');
    expect(MANIFEST.internal).toEqual([{ script: 'bin/ezk.ts', reason: 'le routeur lui-même' }]);
  });

  const bad = (entry: string, message: RegExp) =>
    expect(() => parseManifest(`commands:\n${entry}`)).toThrow(message);

  it('refuse une entrée sans résumé', () => {
    bad('  - domain: a\n    verb: b\n    run: bin/x.ts\n', /résumé|summary/);
  });
  it('refuse une entrée sans script à lancer', () => {
    bad('  - domain: a\n    summary: s\n', /run/);
  });
  it('refuse une règle de racine inconnue', () => {
    bad('  - domain: a\n    summary: s\n    run: bin/x.ts\n    root: partout\n', /root/);
  });
  it('refuse deux entrées au même domaine et verbe', () => {
    bad(
      '  - domain: a\n    verb: b\n    summary: s\n    run: bin/x.ts\n' +
        '  - domain: a\n    verb: b\n    summary: t\n    run: bin/y.ts\n',
      /doublon/i,
    );
  });
  it('refuse de mêler, dans un domaine, une entrée sans verbe et des verbes', () => {
    bad(
      '  - domain: a\n    summary: s\n    run: bin/x.ts\n' +
        '  - domain: a\n    verb: b\n    summary: t\n    run: bin/y.ts\n',
      /verbe/i,
    );
  });
  it('refuse un résumé sur plusieurs lignes (une ligne par commande dans l’aide)', () => {
    bad('  - domain: a\n    summary: "un\\ndeux"\n    run: bin/x.ts\n', /ligne/i);
  });
});

describe('route', () => {
  it('passe les arguments tels quels au script, après les arguments fixes du manifeste', () => {
    const r = route(MANIFEST, ['law', 'bind', 'global', './p', '--force'], inside);
    expect(r).toMatchObject({
      kind: 'run',
      step: { script: 'bin/lawgiver.ts', args: ['bind', 'global', './p', '--force'] },
    });
  });

  it('remplace {root} par la racine du dépôt, garde un argument entre guillemets entier, puis ajoute ceux de l’utilisateur', () => {
    const r = route(MANIFEST, ['docs', 'check', '--next', '{root}'], inside);
    expect(r).toMatchObject({
      kind: 'run',
      // {root} est remplacé dans les arguments FIXES du manifeste, jamais dans ceux de l'utilisateur
      step: { script: 'bin/check.sh', args: [OWN, 'features', 'docs/mon dossier', '--next', '{root}'] },
    });
  });

  it('une entrée sans verbe reçoit tous les arguments', () => {
    expect(route(MANIFEST, ['dashboard', '--list'], inside)).toMatchObject({
      kind: 'run',
      step: { script: 'bin/ezk-map.ts', args: ['--list'] },
    });
  });

  it('un ancien nom marche encore et prévient', () => {
    const r = route(MANIFEST, ['map', '--list'], inside);
    expect(r.kind).toBe('run');
    if (r.kind !== 'run') return;
    expect(r.notices.join(' ')).toMatch(/dashboard/);
    expect(r.step).toEqual({ script: 'bin/ezk-map.ts', args: ['--list'] });
  });

  it('domaine inconnu : message qui renvoie vers « ezk help »', () => {
    const r = route(MANIFEST, ['inconnu'], inside);
    expect(r).toMatchObject({ kind: 'error', exitCode: 2 });
    if (r.kind === 'error') expect(r.message).toMatch(/ezk help/);
  });

  it('verbe inconnu ou absent : le message liste les verbes du domaine', () => {
    for (const args of [['law', 'zzz'], ['law']]) {
      const r = route(MANIFEST, args, inside);
      expect(r.kind).toBe('error');
      if (r.kind === 'error') expect(r.message).toMatch(/bind.*capture|capture.*bind/);
    }
  });

  it('sans argument, ou avec help / --help / -h : renvoie l’aide', () => {
    expect(route(MANIFEST, [], inside)).toEqual({ kind: 'help' });
    expect(route(MANIFEST, ['help'], inside)).toEqual({ kind: 'help' });
    expect(route(MANIFEST, ['--help'], inside)).toEqual({ kind: 'help' });
    expect(route(MANIFEST, ['-h'], inside)).toEqual({ kind: 'help' });
    expect(route(MANIFEST, ['help', 'law'], inside)).toEqual({ kind: 'help', topic: 'law' });
  });
});

describe('route — la racine (ce qui empêche de modifier le mauvais dépôt)', () => {
  it('commande fixe depuis un autre dépôt ou un dossier hors dépôt : refusée avec la marche à suivre', () => {
    for (const checkoutRoot of [undefined, '/autre/projet']) {
      const r = route(MANIFEST, ['views', 'regen'], { ownRoot: OWN, checkoutRoot });
      expect(r.kind).toBe('error');
      if (r.kind !== 'error') continue;
      expect(r.message).toContain(OWN);
      expect(r.message).toMatch(/--root/);
      expect(r.message).toMatch(/dépôt de la méthode/);
    }
  });

  it('commande fixe avec --root vers le dépôt de la méthode : passe, même depuis ailleurs', () => {
    const r = route(MANIFEST, ['views', 'regen'], { ownRoot: OWN, rootFlag: OWN });
    expect(r.kind).toBe('run');
  });

  it('commande fixe avec --root vers un autre dépôt : refusée, car elle écrit dans la méthode', () => {
    const r = route(MANIFEST, ['views', 'regen'], { ownRoot: OWN, rootFlag: '/autre/projet' });
    expect(r.kind).toBe('error');
    if (r.kind !== 'error') return;
    expect(r.message).toMatch(/écrit dans le dépôt de la méthode/);
    expect(r.message).toMatch(/travaillent sur un projet désigné/); // dit où --root est accepté
    expect(r.message).not.toMatch(/pas encore possible/);
    expect(r.message).not.toMatch(/\d{10,}/); // pas de numéro de fiche dans un message d'erreur
  });

  it('commande « none » (law bind) : marche de n’importe où', () => {
    const r = route(MANIFEST, ['law', 'bind', 'global', '.'], { ownRoot: OWN });
    expect(r.kind).toBe('run');
  });
});

// Fiche 20260826173221323 : une commande qui SEULEMENT lit les fiches peut viser le projet désigné.
const PROJECT_MANIFEST = parseManifest(`
commands:
  - domain: board
    verb: show
    run: bin/avancement.ts
    summary: Affiche le board.
    project: true
  - domain: dashboard
    run: bin/ezk-map.ts
    summary: Ouvre le tableau de bord.
    root: none
    project: true
  - domain: views
    verb: regen
    run: bin/views-regen.ts
    summary: Régénère les vues.
  - domain: docs
    verb: check
    run: bin/check.sh {root} features
    summary: Vérifie les documents.
    project: true
  - domain: backlog
    verb: ship
    run: bin/ship-fiche.ts --root {root}
    summary: Livre une fiche.
    project: true
    writes: true
`);

describe('manifeste — la marque « project »', () => {
  it('se lit, et vaut faux par défaut', () => {
    expect(PROJECT_MANIFEST.commands[0]).toMatchObject({ domain: 'board', project: true });
    expect(PROJECT_MANIFEST.commands[2]?.project).toBeUndefined();
  });

  it('refuse autre chose qu’un booléen', () => {
    const entry = '  - domain: a\n    run: bin/a.ts\n    summary: x\n    project: oui';
    expect(() => parseManifest(`commands:\n${entry}`)).toThrow(/project/);
  });
});

describe('route — projet désigné (project: true)', () => {
  it('--root vers un autre projet : la commande passe, et rend le projet visé', () => {
    const r = route(PROJECT_MANIFEST, ['board', 'show'], { ownRoot: OWN, checkoutRoot: OWN, rootFlag: '/muti' });
    expect(r).toMatchObject({ kind: 'run', projectRoot: '/muti' });
  });

  it('même depuis un dossier hors de tout dépôt de la méthode', () => {
    const r = route(PROJECT_MANIFEST, ['board', 'show'], { ownRoot: OWN, rootFlag: '/muti' });
    expect(r).toMatchObject({ kind: 'run', projectRoot: '/muti' });
  });

  it('la variable EZK_ROOT désigne le projet quand l’option manque', () => {
    const r = route(PROJECT_MANIFEST, ['board', 'show'], { ownRoot: OWN, envRoot: '/samplerz' });
    expect(r).toMatchObject({ kind: 'run', projectRoot: '/samplerz' });
  });

  it('l’option prime sur la variable', () => {
    const r = route(PROJECT_MANIFEST, ['dashboard'], { ownRoot: OWN, rootFlag: '/muti', envRoot: '/samplerz' });
    expect(r).toMatchObject({ kind: 'run', projectRoot: '/muti' });
  });

  it('sans désignation : comme avant — refus hors dépôt pour une commande fixe, aucun projet visé', () => {
    expect(route(PROJECT_MANIFEST, ['board', 'show'], { ownRoot: OWN }).kind).toBe('error');
    const r = route(PROJECT_MANIFEST, ['board', 'show'], inside);
    expect(r.kind).toBe('run');
    expect(r).not.toHaveProperty('projectRoot');
  });

  it('une commande « none » marquée project passe sans désignation, depuis n’importe où', () => {
    const r = route(PROJECT_MANIFEST, ['dashboard'], { ownRoot: OWN });
    expect(r.kind).toBe('run');
    expect(r).not.toHaveProperty('projectRoot');
  });

  it('une commande qui écrit dans la méthode ignore la variable, et refuse toujours --root vers un autre dépôt', () => {
    const viaEnv = route(PROJECT_MANIFEST, ['views', 'regen'], { ownRoot: OWN, checkoutRoot: OWN, envRoot: '/muti' });
    expect(viaEnv.kind).toBe('run');
    expect(viaEnv).not.toHaveProperty('projectRoot');
    expect(route(PROJECT_MANIFEST, ['views', 'regen'], { ownRoot: OWN, envRoot: '/muti' }).kind).toBe('error');
    expect(route(PROJECT_MANIFEST, ['views', 'regen'], { ownRoot: OWN, rootFlag: '/muti' }).kind).toBe('error');
  });

  it('{root} devient le projet désigné pour une commande project, la méthode sinon', () => {
    const own = route(PROJECT_MANIFEST, ['docs', 'check'], inside);
    const other = route(PROJECT_MANIFEST, ['docs', 'check'], { ownRoot: OWN, rootFlag: '/muti' });
    expect(own).toMatchObject({ kind: 'run', step: { args: [OWN, 'features'] } });
    expect(other).toMatchObject({ kind: 'run', step: { args: ['/muti', 'features'] } });
  });
});

describe('splitRouterFlags — options du routeur, avant la commande seulement', () => {
  it('lit --root et --dry-run placés avant le domaine', () => {
    expect(splitRouterFlags(['--root', '/x', '--dry-run', 'views', 'regen'])).toEqual({
      rootFlag: '/x',
      dryRun: true,
      rest: ['views', 'regen'],
    });
  });

  it('ne touche pas aux options placées après la commande : elles sont pour le script', () => {
    expect(splitRouterFlags(['law', 'bind', '--root', '/x', '--dry-run'])).toEqual({
      dryRun: false,
      rest: ['law', 'bind', '--root', '/x', '--dry-run'],
    });
  });

  it('--root sans valeur : erreur claire', () => {
    expect(splitRouterFlags(['--root'])).toMatchObject({ error: expect.stringMatching(/--root/) });
  });
});

describe('help', () => {
  const chat = [
    { name: 'ezk-sprint', argHint: '[help|run]', summary: 'Orchestre un sprint.' },
    { name: 'ezk-backlog', argHint: '', summary: 'Suit le backlog.' },
  ];
  const help = renderHelp(MANIFEST, chat);
  const lines = help.split('\n');

  it('ouvre sur « En clair. » et nomme les deux familles', () => {
    expect(help.startsWith('En clair.')).toBe(true);
    expect(help).toMatch(/terminal/);
    expect(help).toMatch(/chat/);
  });

  it('met chaque commande de terminal sur une seule ligne, résumé compris', () => {
    for (const e of MANIFEST.commands.filter((c) => !c.deprecated)) {
      const hits = lines.filter((l) => l.includes(e.summary));
      expect(hits, e.summary).toHaveLength(1);
      expect(hits[0]).toContain(`${e.domain}${e.verb ? ` ${e.verb}` : ''}`);
    }
  });

  it('ne liste pas les anciens noms : ils marchent, mais on ne les apprend plus', () => {
    expect(help).not.toContain('Ancien nom du tableau de bord.');
  });

  it('met chaque commande de chat sur une seule ligne', () => {
    for (const c of chat) {
      const hits = lines.filter((l) => l.includes(`/${c.name}`));
      expect(hits, c.name).toHaveLength(1);
      expect(hits[0]).toContain(c.summary);
    }
  });

  it('donne le détail d’un domaine, ou rien s’il n’existe pas', () => {
    const detail = renderDomainHelp(MANIFEST, 'law');
    expect(detail).toContain('bind');
    expect(detail).toContain('capture');
    expect(detail).toContain('lance : bin/lawgiver.ts bind');
    expect(renderDomainHelp(MANIFEST, 'zzz')).toBeUndefined();
  });
});

describe('uncoveredScripts — un script exposé en pnpm que le manifeste oublie se voit', () => {
  it("rend le script oublié, et ignore le routé, l'interne et les tests", () => {
    const pnpm = {
      oublie: 'tsx bin/oublie.ts',
      route: 'tsx bin/lawgiver.ts',
      interne: 'tsx bin/ezk.ts',
      tests: 'bash bin/test-foo.sh',
      compose: 'tsx bin/views-regen.ts && vitest run',
      autre: 'vitest run',
    };
    expect(uncoveredScripts(MANIFEST, pnpm)).toEqual(['bin/oublie.ts']);
  });
});

describe('findCheckoutRoot — quel checkout de la méthode contient le dossier courant', () => {
  const markers = new Set([`/a/b/${MANIFEST_RELPATH}`]);
  const exists = (p: string) => markers.has(p);

  it('remonte jusqu’au premier dossier qui porte le manifeste', () => {
    expect(findCheckoutRoot('/a/b/c/d', exists)).toBe('/a/b');
    expect(findCheckoutRoot('/a/b', exists)).toBe('/a/b');
  });

  it('rend undefined hors de tout checkout', () => {
    expect(findCheckoutRoot('/x/y', exists)).toBeUndefined();
    expect(findCheckoutRoot('/', exists)).toBeUndefined();
  });

  it('un worktree imbriqué gagne sur le checkout principal qui le contient', () => {
    const both = new Set([`/a/${MANIFEST_RELPATH}`, `/a/.claude/worktrees/w/${MANIFEST_RELPATH}`]);
    expect(findCheckoutRoot('/a/.claude/worktrees/w/products', (p) => both.has(p))).toBe(
      '/a/.claude/worktrees/w',
    );
  });
});

describe('manifeste — la marque « writes » (le projet désigné reçoit des écritures)', () => {
  it('se lit avec project, et vaut faux par défaut', () => {
    const ship = PROJECT_MANIFEST.commands.find((e) => e.verb === 'ship');
    expect(ship).toMatchObject({ project: true, writes: true });
    expect(PROJECT_MANIFEST.commands[0]?.writes).toBeUndefined();
  });

  it('refuse autre chose qu’un booléen, et refuse writes sans project', () => {
    const base = '  - domain: a\n    run: bin/a.ts\n    summary: x\n';
    expect(() => parseManifest(`commands:\n${base}    project: true\n    writes: oui`)).toThrow(/writes/);
    expect(() => parseManifest(`commands:\n${base}    writes: true`)).toThrow(/project/);
  });
});

describe('route — une commande qui ÉCRIT dans le projet désigné (writes: true)', () => {
  it('--root désigne le projet : {root} devient ce projet, d’où qu’on parte', () => {
    const r = route(PROJECT_MANIFEST, ['backlog', 'ship', '--pr', '#1', 'features/x.md'], { ownRoot: OWN, rootFlag: '/muti' });
    expect(r).toMatchObject({
      kind: 'run',
      projectRoot: '/muti',
      step: { args: ['--root', '/muti', '--pr', '#1', 'features/x.md'] },
    });
  });

  it('sans --root, dans le dépôt de la méthode : {root} reste la méthode, comme avant', () => {
    const r = route(PROJECT_MANIFEST, ['backlog', 'ship'], inside);
    expect(r).toMatchObject({ kind: 'run', step: { args: ['--root', OWN] } });
    expect(r).not.toHaveProperty('projectRoot');
  });

  it('une variable EZK_ROOT restée dans le shell ne désigne JAMAIS le projet d’une écriture', () => {
    const fromMethod = route(PROJECT_MANIFEST, ['backlog', 'ship'], { ...inside, envRoot: '/muti' });
    expect(fromMethod).toMatchObject({ kind: 'run', step: { args: ['--root', OWN] } });
    expect(fromMethod).not.toHaveProperty('projectRoot');
    // hors du dépôt de la méthode, la variable ne suffit pas : refus avec la marche à suivre
    const fromElsewhere = route(PROJECT_MANIFEST, ['backlog', 'ship'], { ownRoot: OWN, envRoot: '/muti' });
    expect(fromElsewhere).toMatchObject({ kind: 'error', exitCode: 2 });
  });
});

describe('childEnv — la variable EZK_ROOT que reçoit le script', () => {
  const ship = PROJECT_MANIFEST.commands.find((e) => e.verb === 'ship');
  const board = PROJECT_MANIFEST.commands[0];
  if (!ship || !board) throw new Error('fixture incomplète');

  it('le projet désigné voyage par EZK_ROOT', () => {
    expect(childEnv(board, '/muti', { PATH: '/bin' })).toEqual({ PATH: '/bin', EZK_ROOT: '/muti' });
  });

  it('sans projet désigné, une écriture ne voit pas une EZK_ROOT restée dans le shell', () => {
    expect(childEnv(ship, undefined, { PATH: '/bin', EZK_ROOT: '/vieux' })).toEqual({ PATH: '/bin' });
  });

  it('sans projet désigné, une lecture garde l’environnement tel quel', () => {
    const env = { PATH: '/bin', EZK_ROOT: '/samplerz' };
    expect(childEnv(board, undefined, env)).toBe(env);
  });
});

describe('delegationTarget — un autre checkout de la méthode lance son propre ezk', () => {
  it('depuis un worktree de la méthode : la main passe à ce worktree', () => {
    expect(delegationTarget({ ownRoot: OWN, checkoutRoot: '/repo/vectorz/.claude/worktrees/w', delegated: false })).toBe(
      '/repo/vectorz/.claude/worktrees/w',
    );
  });

  it('dans son propre checkout, hors de tout checkout, ou déjà délégué : on garde la main', () => {
    expect(delegationTarget({ ownRoot: OWN, checkoutRoot: OWN, delegated: false })).toBeUndefined();
    expect(delegationTarget({ ownRoot: OWN, delegated: false })).toBeUndefined();
    expect(delegationTarget({ ownRoot: OWN, checkoutRoot: '/autre', delegated: true })).toBeUndefined();
  });
});
