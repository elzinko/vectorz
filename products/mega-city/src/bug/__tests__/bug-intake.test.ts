import { describe, expect, it } from 'vitest';
import { buildBugCard, type BugReport } from '../bug-intake.js';

const base: BugReport = {
  title: 'Le bouton X ne fait rien',
  symptom: 'Clic sur X sans effet',
  reproduced: 'oui',
};

describe('buildBugCard — les 4 cas de la DoD (fiche 0152)', () => {
  it('(a) symptôme absent → reproduced "non" + raison → fiche produite', () => {
    const r = buildBugCard({ ...base, reproduced: 'non', reason: 'symptôme non observé sur 3 essais' });
    expect(r.ok).toBe(true);
    expect(r.body).toMatch(/reproduit\*\* : non/);
    expect(r.body).toMatch(/raison/);
  });

  it('(b) harnais indispo → "hors-portée" + raison → fiche produite', () => {
    const r = buildBugCard({ ...base, reproduced: 'hors-portée', reason: 'dev server down, MCP muet' });
    expect(r.ok).toBe(true);
    expect(r.body).toMatch(/hors-portée/);
  });

  it('(c) repro "partiel" + raison → fiche produite', () => {
    const r = buildBugCard({ ...base, reproduced: 'partiel', reason: 'reproduit 1 fois sur 3' });
    expect(r.ok).toBe(true);
    expect(r.body).toMatch(/partiel/);
  });

  it('(d) reproduced ≠ oui SANS raison → refusé (raison obligatoire)', () => {
    const r = buildBugCard({ ...base, reproduced: 'non' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/raison obligatoire/);
  });
});

describe('buildBugCard — validation & rendu', () => {
  it('reproduced "oui" n’exige pas de raison', () => {
    expect(buildBugCard({ ...base, reproduced: 'oui' }).ok).toBe(true);
  });

  it('title ou symptom manquant → refusé', () => {
    expect(buildBugCard({ ...base, title: '' }).ok).toBe(false);
    expect(buildBugCard({ ...base, symptom: '' }).ok).toBe(false);
  });

  it('rend la sévérité en ligne de corps, jamais en champ front-matter', () => {
    const r = buildBugCard({ ...base, severity: 'majeure' });
    expect(r.body).toMatch(/## Sévérité/);
    expect(r.body).not.toMatch(/severity:/);
  });

  it('inclut étapes, attendu/obtenu, environnement et preuve quand fournis', () => {
    const r = buildBugCard({
      ...base,
      steps: ['ouvrir la page', 'cliquer X'],
      expected: 'action déclenchée',
      actual: 'rien',
      environment: 'chrome 120, local',
      evidence: '/tmp/shot.png',
    });
    expect(r.body).toMatch(/### Étapes/);
    expect(r.body).toMatch(/1\. ouvrir la page/);
    expect(r.body).toMatch(/attendu\*\* : action déclenchée/);
    expect(r.body).toMatch(/## Environnement/);
    expect(r.body).toMatch(/\/tmp\/shot\.png/);
  });

  it('ignore un champ optionnel vide (espaces) — pas de section fantôme', () => {
    const r = buildBugCard({ ...base, environment: '   ', severity: '  ' });
    expect(r.body).not.toMatch(/## Environnement/);
    expect(r.body).not.toMatch(/## Sévérité/);
  });
});
