/**
 * Capture de rétro (fiche 0080) : l'extracteur du trio gabarit + extracteur + rendu.
 *
 * En clair : chaque rétro laisse une capture dans `docs/captures/`. Son en-tête YAML liste les
 * décisions. Ce test vérifie que le format se lit sans ambiguïté, que les refus nomment le champ
 * fautif, et que les vraies captures du dépôt respectent le format.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  isRetroCaptureName,
  parseRetroCapture,
  renderCaptures,
  type RetroCapture,
} from '../retro-capture.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../../..');
const capturesDir = join(repoRoot, 'docs', 'captures');
const MODEL = '2026-07-18-retro-cinq-sprints.md';

const ACTION_OK = `  - proposition: "Vérifier avant de citer"
    kind: regle
    target: global
    by: [architecture, qualite]
    status: ✅
    decision: "Adoptée, obligatoire"
    date: 2026-10-01`;

function capture(actions: string = ACTION_OK, head: Record<string, string> = {}): string {
  const fields = {
    type: 'retro',
    date: '2026-10-01',
    theme: '"Un thème"',
    scope: '"Un périmètre"',
    ...head,
  };
  const top = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `---\n${top}\nactions:\n${actions}\n---\n\n# Corps\n`;
}

const problemsOf = (md: string): string[] =>
  parseRetroCapture('x-retro.md', md).problems.map((p) => `${p.where} — ${p.message}`);

/** Le champ fautif de la première action, tel que le message le nomme (avec la proposition). */
const A0 = /actions\[0\] \(« Vérifier avant de citer »\)/.source;
const at = (field: string, rest: string): RegExp => new RegExp(`${A0}\\.${field} — ${rest}`);

describe('parseRetroCapture — une capture valide', () => {
  it('lit la méta et les actions', () => {
    const { capture: c, problems } = parseRetroCapture('x-retro.md', capture());
    expect(problems).toEqual([]);
    expect(c).toMatchObject({ date: '2026-10-01', theme: 'Un thème', scope: 'Un périmètre' });
    expect(c?.actions).toEqual([
      {
        proposition: 'Vérifier avant de citer',
        kind: 'regle',
        target: 'global',
        by: ['architecture', 'qualite'],
        status: '✅',
        decision: 'Adoptée, obligatoire',
        date: '2026-10-01',
      },
    ]);
  });

  it('accepte une feature sans cible et une action en attente sans date', () => {
    const actions = `  - proposition: "Une feature"
    kind: feature
    status: ⏳
  - proposition: "Une règle ciblée"
    kind: regle
    target: skill:ezk-dev
    status: ⏳`;
    expect(problemsOf(capture(actions))).toEqual([]);
  });

  it("accepte les cibles agent:<nom> et skill:<nom>, et un statut suivi du sélecteur U+FE0F", () => {
    const actions = `  - proposition: "Cible agent"
    kind: regle
    target: agent:ezk-reviewer
    status: "❌️"
    decision: "Écartée"
    date: 2026-10-01`;
    expect(problemsOf(capture(actions))).toEqual([]);
  });
});

describe('parseRetroCapture — les refus nomment le fichier et le champ', () => {
  it("refuse un fichier sans en-tête", () => {
    const { capture: c, problems } = parseRetroCapture('x-retro.md', '# Juste un récit\n');
    expect(c).toBeUndefined();
    expect(problems[0]).toMatchObject({ file: 'x-retro.md', where: 'en-tête' });
  });

  it("refuse un en-tête qui n'est pas du YAML", () => {
    expect(problemsOf('---\nactions: [oups\n---\n')[0]).toMatch(/^en-tête — YAML/);
  });

  it("refuse un type autre que retro, une date impossible et un thème vide", () => {
    const out = problemsOf(capture(ACTION_OK, { type: 'panel', date: '2026-13-40', theme: '""' }));
    expect(out.join('\n')).toMatch(/type — attendu « retro »/);
    expect(out.join('\n')).toMatch(/date — AAAA-MM-JJ/);
    expect(out.join('\n')).toMatch(/theme — texte non vide/);
  });

  it('refuse une rétro sans aucune action', () => {
    const md = '---\ntype: retro\ndate: 2026-10-01\ntheme: t\nscope: s\nactions: []\n---\n';
    expect(problemsOf(md).join('\n')).toMatch(/actions — au moins une/);
  });

  it('refuse un statut inconnu', () => {
    const bad = ACTION_OK.replace('status: ✅', 'status: oui');
    expect(problemsOf(capture(bad)).join('\n')).toMatch(at('status', '✅, ❌ ou ⏳'));
  });

  it('refuse un kind inconnu', () => {
    const bad = ACTION_OK.replace('kind: regle', 'kind: idee');
    expect(problemsOf(capture(bad)).join('\n')).toMatch(at('kind', 'regle, feature, action, spike ou recette'));
  });

  it('refuse une règle sans cible, ou avec une cible mal formée', () => {
    const sans = ACTION_OK.replace('    target: global\n', '');
    expect(problemsOf(capture(sans)).join('\n')).toMatch(at('target', 'une règle porte une cible'));
    for (const mauvaise of ['agent:', 'skill:Ezk Dev', 'tout-le-monde']) {
      const bad = ACTION_OK.replace('target: global', `target: "${mauvaise}"`);
      expect(problemsOf(capture(bad)).join('\n'), mauvaise).toMatch(at('target', 'global, agent:<nom> ou skill:<nom>'));
    }
  });

  it('refuse un ✅ ou un ❌ sans décision, ou sans date : la case n’est jamais pré-remplie à moitié', () => {
    const sansDecision = ACTION_OK.replace('    decision: "Adoptée, obligatoire"\n', '');
    expect(problemsOf(capture(sansDecision)).join('\n')).toMatch(at('decision', '.*✅'));
    const sansDate = ACTION_OK.replace('    date: 2026-10-01', '');
    expect(problemsOf(capture(sansDate)).join('\n')).toMatch(at('date', '.*✅'));
  });

  it('refuse un ⏳ qui porte déjà une date : une case en attente reste vide', () => {
    const pre = ACTION_OK.replace('status: ✅', 'status: ⏳');
    expect(problemsOf(capture(pre)).join('\n')).toMatch(at('date', '.*⏳'));
  });

  it('refuse un ⏳ qui porte déjà une décision : la case n’est pas à moitié pré-remplie', () => {
    const pre = `  - proposition: "Vérifier avant de citer"
    kind: regle
    target: global
    status: ⏳
    decision: "Adoptée, obligatoire"`;
    expect(problemsOf(capture(pre)).join('\n')).toMatch(at('decision', '.*⏳'));
  });

  it('numérote les actions pour retrouver la bonne', () => {
    const deux = `${ACTION_OK}\n  - proposition: "Deuxième"\n    kind: spike\n    status: bof`;
    expect(problemsOf(capture(deux)).join('\n')).toMatch(/actions\[1\] \(« Deuxième »\)\.status/);
  });
});

describe('isRetroCaptureName', () => {
  it('reconnaît une capture de rétro par son nom, pas les autres captures', () => {
    expect(isRetroCaptureName('2026-07-18-retro-cinq-sprints.md')).toBe(true);
    expect(isRetroCaptureName('2026-07-13-contrat-methode-et-versions.md')).toBe(false);
    expect(isRetroCaptureName('README.md')).toBe(false);
  });
});

describe('renderCaptures', () => {
  it('liste chaque décision avec son statut, sa nature, sa cible et sa date', () => {
    const { capture: c } = parseRetroCapture('x-retro.md', capture());
    const out = renderCaptures([c as RetroCapture]);
    expect(out).toContain('2026-10-01 — Un thème');
    expect(out).toContain('✅ regle [global] Vérifier avant de citer');
    expect(out).toContain('Adoptée, obligatoire');
  });
});

describe('les vraies captures du dépôt', () => {
  const names = existsSync(capturesDir) ? readdirSync(capturesDir).filter(isRetroCaptureName) : [];

  it('la première rétro (18 juillet) est le modèle du format cible', () => {
    expect(names).toContain(MODEL);
    const { capture: c, problems } = parseRetroCapture(MODEL, readFileSync(join(capturesDir, MODEL), 'utf8'));
    expect(problems).toEqual([]);
    expect(c?.date).toBe('2026-07-18');
    // 5 propositions + les 2 fiches demandées par le PO (0079, 0080) ; la 5e proposition est rejetée.
    expect(c?.actions).toHaveLength(7);
    expect(c?.actions.filter((a) => a.status === '✅')).toHaveLength(6);
    expect(c?.actions.filter((a) => a.status === '❌').map((a) => a.proposition)).toEqual([
      expect.stringMatching(/frigo vide/i),
    ]);
    expect(c?.actions.some((a) => a.kind === 'feature')).toBe(true);
  });

  it.each(names)('%s respecte le format', (name) => {
    const { problems } = parseRetroCapture(name, readFileSync(join(capturesDir, name), 'utf8'));
    expect(problems).toEqual([]);
  });
});
