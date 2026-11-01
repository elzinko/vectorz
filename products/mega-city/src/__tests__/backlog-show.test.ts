/**
 * Le détail d'une fiche et le contrat de `ezk backlog show --json` (fiche 20261031160441267, ADR-086).
 *
 * En clair : les cas que testait le découpeur de cop1 passent côté méthode, plus le titre qui contient
 * « : » et l'état coché des critères ; la liste sort tout en un appel ; un id inconnu est refusé net ;
 * les schémas et les exemples rangés pour les consommateurs tiennent.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  BacklogShowFicheSchema,
  BacklogShowListeSchema,
  type FicheDetail,
  buildFicheDetail,
} from '../core/fiche-detail.js';
import { backlogShowFiche, backlogShowListe } from '../io/backlog-show.js';
import {
  BACKLOG_EXAMPLE_FILE,
  BACKLOG_FICHE_EXAMPLE_FILE,
  BACKLOG_FICHE_SCHEMA_FILE,
  BACKLOG_SCHEMA_FILE,
  FIXTURE_CRLF,
  FIXTURE_DETAIL,
  FIXTURE_EN_COURS,
  makeContractFixture,
} from '../io/contract-files.js';
import { ficheFromText } from '../loaders/fiches.js';

// La fixture lance des sous-process git, et les tests de la commande lancent tsx : délai large sous
// la charge de la gate complète. La fixture est construite UNE fois pour tout le fichier.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsxCli = createRequire(import.meta.url).resolve('tsx/cli');

/** Le détail d'un texte de fiche, comme le ferait la commande (id tiré du nom de fichier). */
function detail(text: string, filename = '0123_une-fiche.md'): FicheDetail {
  const fiche = ficheFromText(filename, text, false);
  if (fiche === undefined) throw new Error(`nom de fiche invalide : ${filename}`);
  return buildFicheDetail(fiche, text, false);
}

// Le cas de référence du découpeur de cop1 (ficheDetail.test.ts), repris tel quel.
const SAMPLE = `---
id: "123"
title: "Une fiche"
priority: P1
status: ready
version: "v0.2.0"
pr:
---

# 123 — Une fiche

**En clair.** Le board doit montrer le détail.

## Contexte / Problème

Le symptôme vécu.

## Critères d'acceptation

- [ ] Premier critère
- [x] Deuxième critère fait

## Comment vérifier

\`\`\`bash
pnpm test
\`\`\`
`;

describe('le détail d’une fiche — les cas du découpeur de cop1', () => {
  it('extrait en clair, contexte, critères avec leur case, et comment vérifier', () => {
    const d = detail(SAMPLE);
    expect(d).toMatchObject({ id: '0123', title: 'Une fiche', priority: 'P1', status: 'ready', version: 'v0.2.0' });
    expect(d.enClair).toBe('Le board doit montrer le détail.');
    expect(d.contexte).toBe('Le symptôme vécu.');
    expect(d.criteres).toEqual([
      { texte: 'Premier critère', coche: false },
      { texte: 'Deuxième critère fait', coche: true },
    ]);
    expect(d.commentVerifier).toContain('pnpm test');
  });

  it('l’id vient du nom de fichier : zéros de tête et 17 chiffres intacts', () => {
    expect(detail(SAMPLE, '0029-slug.md').id).toBe('0029');
    expect(detail(SAMPLE, '20261024130842122_board-web.md').id).toBe('20261024130842122');
  });

  it('un front-matter qui n’est pas du YAML valide ne fait pas disparaître la fiche', () => {
    const broken = '---\ntitle: Self-hosting: le jour où\nstatus: idea\n---\n\n**En clair.** x';
    const d = detail(broken, '0043-self-hosting.md');
    expect(d).toMatchObject({ id: '0043', title: 'Self-hosting: le jour où', status: 'idea', enClair: 'x' });
  });

  it('une section n’est pas coupée par un `## ` écrit dans un bloc de code', () => {
    const withFence = [
      '---',
      'status: ready',
      '---',
      '## Contexte / Problème',
      '',
      'Avant le bloc.',
      '',
      '```sh',
      '## installe',
      'echo hi',
      '```',
      '',
      'Après le bloc.',
      '',
      '## Critères d’acceptation',
      '',
      '- [ ] un critère',
      '',
    ].join('\n');
    const d = detail(withFence);
    expect(d.contexte).toContain('Après le bloc.');
    expect(d.criteres).toEqual([{ texte: 'un critère', coche: false }]);
  });

  it('les fins de ligne CRLF donnent le même détail', () => {
    expect(detail(SAMPLE.replace(/\n/g, '\r\n'))).toEqual(detail(SAMPLE));
  });

  it('un titre qui contient « : » garde son statut et sa version', () => {
    const d = detail(SAMPLE.replace('title: "Une fiche"', 'title: Tour Driver.js : tracking'));
    expect(d).toMatchObject({ title: 'Tour Driver.js : tracking', status: 'ready', version: 'v0.2.0' });
  });

  it('la section « En clair » passe avant une forme en ligne ; un critère continue sur les lignes indentées', () => {
    const text = [
      '---',
      'status: idea',
      '---',
      '## En clair',
      '',
      'La section.',
      '',
      '**En clair.** Pas celle-ci.',
      '',
      '## Critères d’acceptation',
      '',
      '- [X] Un critère',
      '      sur deux lignes',
      '- [ ] Un autre',
    ].join('\n');
    const d = detail(text);
    expect(d.enClair).toContain('La section.');
    expect(d.criteres).toEqual([
      { texte: 'Un critère sur deux lignes', coche: true },
      { texte: 'Un autre', coche: false },
    ]);
  });

  it('une section absente sort vide, jamais omise', () => {
    const d = detail('---\nstatus: idea\n---\n\nRien.\n');
    expect(d).toMatchObject({ enClair: '', contexte: '', criteres: [], commentVerifier: '' });
  });
});

describe('ezk backlog show — sur la fixture', () => {
  let fixture: string;
  beforeAll(() => {
    fixture = makeContractFixture();
  });
  afterAll(() => rmSync(fixture, { recursive: true, force: true }));

  const run = (args: string[]) =>
    spawnSync(process.execPath, [tsxCli, join(megaCity, 'bin', 'backlog-show.ts'), ...args, '--root', fixture], {
      encoding: 'utf8',
    });
  const example = (rel: string) => JSON.parse(readFileSync(join(megaCity, rel), 'utf8'));

  it('sans id : toutes les fiches hors done/, triées, en un appel, avec le drapeau « en cours »', () => {
    const liste = backlogShowListe(fixture);
    expect(BacklogShowListeSchema.safeParse(liste).success).toBe(true);
    const ids = liste.fiches.map((f) => f.id);
    expect(ids).toEqual([...ids].sort());
    expect(ids).not.toContain('20990101000000004'); // rangée dans done/
    expect(liste.fiches.find((f) => f.id === FIXTURE_EN_COURS)?.enCours).toBe(true);
    expect(liste.fiches.find((f) => f.id === FIXTURE_CRLF)?.enClair).toBe('Fiche de fixture.');
  });

  it('avec un id : une fiche, même rangée dans done/', () => {
    expect(BacklogShowFicheSchema.safeParse(backlogShowFiche(fixture, FIXTURE_DETAIL)).success).toBe(true);
    expect(backlogShowFiche(fixture, '20990101000000004')?.done).toBe(true);
    expect(backlogShowFiche(fixture, '20990101999999999')).toBeUndefined();
  });

  it('la vraie commande sort les exemples rangés, avec et sans id', () => {
    const liste = run(['--json']);
    expect(liste.status, liste.stderr).toBe(0);
    expect(JSON.parse(liste.stdout)).toEqual(example(BACKLOG_EXAMPLE_FILE));
    const une = run([FIXTURE_DETAIL, '--json']);
    expect(une.status, une.stderr).toBe(0);
    expect(JSON.parse(une.stdout)).toEqual(example(BACKLOG_FICHE_EXAMPLE_FILE));
  });

  it('un id inconnu : code 1 et un message qui le nomme, jamais un JSON vide', () => {
    const r = run(['20990101999999999', '--json']);
    expect(r.status).toBe(1);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('20990101999999999');
  });

  it('un argument qui n’est pas un id : code 2 et l’usage', () => {
    const r = run(['pas-un-id']);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('usage');
  });

  it('sans --json : un résumé lisible de la fiche, critères et cases compris', () => {
    const r = run([FIXTURE_DETAIL]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('Tour Driver.js : tracking');
    expect(r.stdout).toContain('Critères (1/2 cochés)');
  });
});

describe('ezk backlog show — les fichiers rangés pour les consommateurs', () => {
  const read = (rel: string) => JSON.parse(readFileSync(join(megaCity, rel), 'utf8'));

  it('les exemples rangés respectent leur schéma ; le producteur décrit chaque champ qu’il sort', () => {
    const liste = read(BACKLOG_EXAMPLE_FILE);
    const une = read(BACKLOG_FICHE_EXAMPLE_FILE);
    expect(BacklogShowListeSchema.safeParse(liste).success).toBe(true);
    expect(BacklogShowFicheSchema.safeParse(une).success).toBe(true);
    expect(BacklogShowFicheSchema.safeParse({ ...une, inconnu: 1 }).success).toBe(false);
  });

  it('les schémas publiés tolèrent un champ ajouté', () => {
    for (const rel of [BACKLOG_SCHEMA_FILE, BACKLOG_FICHE_SCHEMA_FILE]) {
      expect(readFileSync(join(megaCity, rel), 'utf8'), rel).not.toContain('"additionalProperties": false');
    }
  });
});
