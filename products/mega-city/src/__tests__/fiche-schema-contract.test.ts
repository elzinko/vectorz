import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { STATUTS, STATUT_DEFS } from '../core/fiche-schema.js';

/**
 * CONTRAT du schéma des statuts (fiche 20260823121712652, critère (a)).
 *
 * En clair : la liste des statuts vit dans `src/core/fiche-schema.ts`. Les scripts bash et les
 * gabarits markdown ne peuvent pas l'importer ; ils en portent une COPIE d'habillage. Ce test lit
 * ces copies et exige qu'elles disent EXACTEMENT la même chose que le schéma. Ajouter un statut au
 * schéma sans mettre à jour un script ou un gabarit fait échouer la suite — la dérive
 * (`merged`/`split` affichés `❓`, `blocked` fantôme) ne peut plus passer en silence.
 */

const MC = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // products/mega-city
const REPO = join(MC, '..', '..'); // racine vectorz
const read = (p: string): string => readFileSync(p, 'utf8');

/** `STATUT_LABELS='idea=💡 idea|ready=🔵 ready|…'` → [{ id, label }] dans l'ordre du script. */
function parseLabels(script: string, file: string): { id: string; label: string }[] {
  const m = script.match(/^STATUT_LABELS='([^']*)'$/m);
  if (!m) throw new Error(`${file} : définition STATUT_LABELS='…' introuvable`);
  return m[1].split('|').map((pair) => {
    const i = pair.indexOf('=');
    return { id: pair.slice(0, i), label: pair.slice(i + 1) };
  });
}

const EXPECTED_LABELS = STATUT_DEFS.map((d) => ({ id: d.id, label: d.label }));

describe('contrat du schéma — scripts bash', () => {
  const scripts = [
    'products/mega-city/bin/regen-backlog.sh',
    'products/mega-city/skills/ezk-backlog/scripts/regen-backlog.sh',
    'products/mega-city/bin/portfolio.sh',
  ];
  for (const rel of scripts) {
    it(`${rel} : STATUT_LABELS ≡ FICHE_SCHEMA (mêmes statuts, mêmes libellés, même ordre)`, () => {
      expect(parseLabels(read(join(REPO, rel)), rel)).toEqual(EXPECTED_LABELS);
    });
  }

  it('regen-backlog.sh : plus de `case` figé sur les statuts (ni arme `blocked`)', () => {
    for (const rel of [
      'products/mega-city/bin/regen-backlog.sh',
      'products/mega-city/skills/ezk-backlog/scripts/regen-backlog.sh',
    ]) {
      const src = read(join(REPO, rel));
      expect(src, rel).not.toMatch(/blocked\)\s*st=/);
      expect(src, rel).not.toMatch(/shipped\)\s*st=/);
    }
  });
});

describe('contrat du schéma — gabarits et documentation', () => {
  /** Ligne `status: … # a | b | c` → la liste des valeurs annoncées en commentaire. */
  function statusComment(text: string, file: string): string[] {
    const m = text.match(/^status:[^#\n]*#\s*(.+)$/m);
    if (!m) throw new Error(`${file} : ligne « status: … # a | b | c » introuvable`);
    return m[1].split('|').map((s) => s.trim());
  }

  const docs = [
    'features/feature-template.md',
    'products/mega-city/feature-template.md',
    'products/mega-city/skills/ezk-backlog/templates/feature-template.md',
    'products/mega-city/skills/ezk-backlog/init.sh',
    'products/mega-city/skills/ezk-backlog/SKILL.md',
  ];
  for (const rel of docs) {
    it(`${rel} : le commentaire du champ status: liste exactement les statuts du schéma`, () => {
      const p = join(REPO, rel);
      expect(existsSync(p), `${rel} absent`).toBe(true);
      expect(statusComment(read(p), rel)).toEqual([...STATUTS]);
    });
  }

  it('SKILL.md : la légende « Statuts : … » reprend les libellés du schéma', () => {
    const skill = read(join(MC, 'skills/ezk-backlog/SKILL.md'));
    const legend = STATUT_DEFS.map((d) => d.label).join(' · ');
    expect(skill).toContain(`Statuts : ${legend}.`);
  });

  it('aucun gabarit ne recrée le champ retiré `ready:`', () => {
    for (const rel of [
      'features/feature-template.md',
      'products/mega-city/feature-template.md',
      'products/mega-city/skills/ezk-backlog/templates/feature-template.md',
    ]) {
      expect(read(join(REPO, rel)), rel).not.toMatch(/^ready:/m);
    }
    const init = read(join(MC, 'skills/ezk-backlog/init.sh'));
    expect(init).not.toMatch(/^ready:/m);
  });
});
