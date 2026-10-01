/**
 * Contrat du cycle de vie story ⊂ sprint ⊂ session (fiche 20260930123438875, ADR-0054).
 *
 * Même leçon que ezk-scout (0095) : une consigne de SKILL.md qu'aucun test ne garde disparaît
 * sans bruit. Ici on fige les frontières entre les trois étages — `ezk-sprint` ouvre et ferme le
 * SPRINT, `ezk-archive` ferme la SESSION, les cérémonies restent dehors — plus leur cohérence avec
 * le catalogue, la carte de méthode et l'ADR. Le mécanisme (start/close/check) a son propre DoD
 * bash : `skills/ezk-sprint/scripts/test-sprint-lifecycle.sh`, câblé dans bin/test-scripts.sh.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../loaders/catalog.js';
import { loadMethodDoc } from '../loaders/method.js';
import { subCommandsOf, validateMethod } from '../core/ceremonies.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const sprintDir = join(megaCity, 'skills', 'ezk-sprint');
const archiveDir = join(megaCity, 'skills', 'ezk-archive');
const adrPath = join(megaCity, 'docs', 'adr', '0054-cloture-sprint-vs-archive-session.md');

const read = (p: string): string => readFileSync(p, 'utf8');
/** Corps d'un SKILL.md (sans front-matter) — ce que l'agent lit. */
const body = (dir: string): string =>
  read(join(dir, 'SKILL.md')).replace(/^---\n[\s\S]*?\n---\n/, '');
/** Ligne du tableau « Usage » pour une sous-commande donnée. */
const usageRow = (text: string, verb: string): string => {
  const m = new RegExp(`^\\| \`${verb}\`[^\\n]*$`, 'm').exec(text);
  return m ? m[0] : '';
};

describe('ezk-sprint — le sprint a ses deux verbes de cycle de vie', () => {
  const catalog = loadCatalog(megaCity);
  const skill = catalog.skills.get('ezk-sprint');

  it('déclare start et close dans son argument-hint, sans casser check ni run', () => {
    expect(skill, 'skill ezk-sprint absent du catalogue').toBeDefined();
    const subs = subCommandsOf(skill?.argumentHint);
    for (const verb of ['help', 'start', 'close', 'check', 'run']) {
      expect(subs, `sous-commande « ${verb} » absente de l'argument-hint`).toContain(verb);
    }
  });

  it('n’expose aucune sous-commande de cérémonie ni de fin anormale : la rétro reste hors sprint', () => {
    const subs = subCommandsOf(skill?.argumentHint);
    for (const forbidden of ['retrospective', 'retro', 'planning', 'stop', 'archive']) {
      expect(subs, `« ${forbidden} » ne doit pas être un verbe d'ezk-sprint`).not.toContain(
        forbidden,
      );
    }
    expect(body(sprintDir)).not.toMatch(/^\| `retrospective`/m);
  });

  it('documente chaque verbe avec son contrat : check = dry-run read-only, run = cycle complet', () => {
    const text = body(sprintDir);
    const start = usageRow(text, 'start');
    const close = usageRow(text, 'close');
    const check = usageRow(text, 'check');
    const run = usageRow(text, 'run');
    expect(start, 'ligne `start` absente du tableau Usage').not.toBe('');
    expect(start).toMatch(/lot/);
    expect(close, 'ligne `close` absente du tableau Usage').not.toBe('');
    expect(close).toMatch(/incr[ée]ment/i);
    expect(close).toMatch(/session/);
    // Rétro-compat PAR VERBE (ADR-0054) : check ne s'aliase jamais vers une ouverture avec effet de bord.
    expect(check).toMatch(/start --dry-run/);
    expect(check).toMatch(/RIEN|read-only|lecture seule/i);
    // … et run ne s'aliase jamais vers la seule ouverture.
    expect(run).toMatch(/start/);
    expect(run).toMatch(/close/);
    expect(run).toMatch(/inchang/); // « la boucle 0→10 reste inchangée »
  });

  it('pose les trois étages et dit qui ferme quoi', () => {
    const text = body(sprintDir);
    expect(text).toMatch(/story ⊂ sprint ⊂ session/);
    expect(text).toMatch(/ADR-0054/);
    expect(text).toMatch(/ezk-archive/); // la session reste à ezk-archive
  });

  it('close ne touche pas la session : c’est écrit, et le DoD bash le prouve', () => {
    const text = body(sprintDir);
    expect(text).toMatch(/docs\/sessions/);
    expect(text).toMatch(/handoff/);
    expect(text).toMatch(/ne (?:touche|ferme|archive)[^.\n]*session/i);
    expect(read(join(sprintDir, 'scripts', 'test-sprint-lifecycle.sh'))).toMatch(
      /la session n'est pas touchée/,
    );
  });

  it('start refuse sur ALERT sans override journalisé et refuse un second sprint ouvert', () => {
    const text = body(sprintDir);
    expect(text).toMatch(/--override/);
    expect(text).toMatch(/journalis/);
    expect(text).toMatch(/d[ée]j[àa] ouvert/i);
  });

  it('un sprint sans livraison a une sortie écrite : close --abandon, jamais la suppression de SPRINT.md', () => {
    const text = body(sprintDir);
    expect(text).toMatch(/close --abandon "<raison>"/);
    expect(text).toMatch(/CLOSE: ABANDONED/);
    expect(text).toMatch(/Ne supprime jamais `SPRINT\.md`/);
    expect(read(adrPath)).toMatch(/close --abandon/);
  });

  it('le gabarit SPRINT.md garde les sections lues ailleurs et ajoute le lot et les incréments', () => {
    const text = body(sprintDir);
    // « Galères & gestes (labo) » est lue par ezk-archive et ezk-chef : titre exact, une seule fois.
    expect(text).toContain('## Galères & gestes (labo)');
    for (const heading of ['## Lot', '## Notes / décisions', '## Incréments scellés de la session']) {
      expect(text, `section « ${heading} » absente du gabarit SPRINT.md`).toContain(heading);
    }
  });

  it('cite son script et celui-ci est câblé dans la suite bash (pas d’orphelin)', () => {
    expect(existsSync(join(sprintDir, 'scripts', 'sprint.sh'))).toBe(true);
    expect(body(sprintDir)).toMatch(/scripts\/sprint\.sh/);
    expect(read(join(megaCity, 'bin', 'test-scripts.sh'))).toContain(
      'skills/ezk-sprint/scripts/test-sprint-lifecycle.sh',
    );
  });
});

describe('ezk-archive — inchangé, dédié à la session', () => {
  const catalog = loadCatalog(megaCity);
  const skill = catalog.skills.get('ezk-archive');

  it('garde ses verbes (help|check|run) : aucun verbe d’ouverture ni de sprint', () => {
    expect(skill?.argumentHint).toBe('[help|check|run]');
    const subs = subCommandsOf(skill?.argumentHint);
    for (const forbidden of ['start', 'open', 'retrospective']) {
      expect(subs).not.toContain(forbidden);
    }
  });

  it('dit « session », renvoie à l’ADR-0054 et distingue son `close` de celui du sprint', () => {
    const text = body(archiveDir);
    expect(text).toMatch(/ADR-0054/);
    expect(text).toMatch(/ezk-sprint close/);
    expect(text).toMatch(/ferm(?:e|er) la (?:\*\*)?session/);
    // L'ouverture de session est implicite : le handoff se reprend au premier `start`.
    expect(text).toMatch(/premier[\s>]+`?ezk-sprint start`?/);
  });

  it('ne porte aucun script de sprint : le sprint reste dans ezk-sprint', () => {
    expect(existsSync(join(archiveDir, 'scripts', 'sprint.sh'))).toBe(false);
  });
});

describe('séparation product-build / sprint préservée (garde-fou de la fiche absorbée)', () => {
  const catalog = loadCatalog(megaCity);

  it('ezk-product-build compose ezk-sprint et n’en devient jamais un mode', () => {
    expect(catalog.skills.get('ezk-product-build')?.composes).toContain('ezk-sprint');
    const subs = subCommandsOf(catalog.skills.get('ezk-sprint')?.argumentHint);
    for (const mode of ['chain', 'train', 'product', 'build']) expect(subs).not.toContain(mode);
  });
});

describe('carte de méthode — le sprint est décrit tel qu’il est maintenant', () => {
  it('le sprint est implémenté par start, close, run, check, et la session par ezk-archive', () => {
    const catalog = loadCatalog(megaCity);
    // validateMethod JETTE si une référence est fausse : c'est le garde-fou « la carte ne ment pas ».
    const doc = validateMethod(catalog, loadMethodDoc(megaCity));
    const sprint = doc.elements.find((e) => e.id === 'sprint');
    expect(sprint, 'élément « sprint » absent de ceremonies.yml').toBeDefined();
    for (const ref of [
      'ezk-sprint:start',
      'ezk-sprint:close',
      'ezk-sprint:run',
      'ezk-sprint:check',
      'ezk-archive:run',
    ]) {
      expect(sprint?.implemente_par, `« ${ref} » absent de l'élément sprint`).toContain(ref);
    }
    expect(sprint?.note ?? '').not.toMatch(/MONO-FICHE/); // l'ancienne description est périmée
  });

  it('aucun élément de la carte ne décrit encore le run comme mono-fiche : le sprint porte un lot', () => {
    // Retour Codex (PR #275) : « sprint-backlog » disait encore « un seul item (le run est mono-fiche) » à côté de
    // « sprint », qui décrit le lot. La carte interactive expose les deux ensemble : elle se contredisait.
    const doc = validateMethod(loadCatalog(megaCity), loadMethodDoc(megaCity));
    const perimes = doc.elements
      .filter((e) => /mono-fiche|mono-feature|un seul item/i.test(e.note ?? ''))
      .map((e) => e.id);
    expect(perimes, 'éléments dont la note décrit encore un run à une seule fiche').toEqual([]);
    const backlog = doc.elements.find((e) => e.id === 'sprint-backlog');
    expect(backlog, 'élément « sprint-backlog » absent de ceremonies.yml').toBeDefined();
    expect(backlog?.note ?? '', 'le sprint-backlog doit parler du lot de stories').toMatch(/\blot\b/i);
  });
});

describe('ADR-0054 — ratifié avec le POC', () => {
  const adr = read(adrPath);

  it('est Accepté, plus Proposé', () => {
    expect(adr).toMatch(/^\*\*Statut :\*\* Accepté/m);
    expect(adr).not.toMatch(/^\*\*Statut :\*\* Propos/m);
  });

  it('tranche ses deux questions ouvertes et pose la règle de nommage', () => {
    expect(adr).not.toMatch(/^\*\*À valider en panel/m);
    expect(adr).toMatch(/^## Tranché au POC/m);
    expect(adr).toMatch(/SPRINT\.md suffit/);
    expect(adr).toMatch(/ezk-backlog/); // le planning, c'est ezk-backlog
    expect(adr).toMatch(/^## Nommage/m);
  });

  it('range en « Suite » ce que le POC ne livre pas', () => {
    expect(adr).toMatch(/ezk-product-build/);
    expect(adr).toMatch(/Suite/);
  });
});
