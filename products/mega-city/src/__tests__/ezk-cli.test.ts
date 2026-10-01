/**
 * `ezk` — le routeur mince (fiche 20260903134906920, ADR-0046). Cœur PUR : on lit un manifeste,
 * on décide quel script lancer avec quels arguments. Aucun processus lancé ici.
 */
import { describe, expect, it } from 'vitest';
import {
  MANIFEST_RELPATH,
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
internal:
  - script: bin/ezk.ts
    reason: le routeur lui-même
`);

const OWN = '/repo/vectorz';
const inside = { ownRoot: OWN, checkoutRoot: OWN };

describe('parseManifest', () => {
  it('lit les entrées et pose la règle de racine « fixed » par défaut', () => {
    expect(MANIFEST.commands).toHaveLength(5);
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

  it('commande fixe avec --root vers un autre dépôt : refusée, et dit que ce n’est pas encore possible', () => {
    const r = route(MANIFEST, ['views', 'regen'], { ownRoot: OWN, rootFlag: '/autre/projet' });
    expect(r.kind).toBe('error');
    if (r.kind !== 'error') return;
    expect(r.message).toMatch(/pas encore possible/);
    expect(r.message).not.toMatch(/\d{10,}/); // pas de numéro de fiche dans un message d'erreur
  });

  it('commande « none » (law bind) : marche de n’importe où', () => {
    const r = route(MANIFEST, ['law', 'bind', 'global', '.'], { ownRoot: OWN });
    expect(r.kind).toBe('run');
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
