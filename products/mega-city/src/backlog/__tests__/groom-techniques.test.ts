/**
 * Le catalogue de `groom` (fiche 20260825161522791) : une DONNÉE éditable + une convention de skill.
 * Ce test garde la FORME de la donnée et les engagements écrits du skill — jamais le comportement d'un
 * LLM (ADR-0001 : aucun script ne décide dans la boucle de raffinement).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const skillDir = join(megaCity, 'skills', 'ezk-backlog');
const catalogPath = join(skillDir, 'groom-techniques.yml');

/** Les slots que le catalogue peut viser : la DoR de base, le périmètre, la structure, et `projet` (les slots de `.vectorz/dor.yml`). */
const SLOTS = ['probleme', 'valeur', 'criteres', 'dependances', 'perimetre', 'structure', 'projet'];
/** Les slots de la DoR de base : chacun doit avoir au moins une technique. */
const BASE_SLOTS = ['probleme', 'valeur', 'criteres', 'dependances'];
/** Les deux skills qu'une technique peut appeler. */
const CALLABLE = ['engineering:architecture', 'product-management:product-brainstorming'];
const KEYS = ['id', 'title', 'slot', 'ask', 'calls', 'when'];

interface Technique {
  id: string;
  title: string;
  slot: string;
  ask: string;
  calls?: string;
  when?: string;
}

const text = readFileSync(catalogPath, 'utf8');
const catalog = parseYaml(text) as { techniques?: Technique[] };
const techniques = catalog.techniques ?? [];

describe('groom-techniques.yml — le catalogue de raffinement', () => {
  it('contient 6 à 10 techniques (un petit catalogue, pas les 50 de BMAD)', () => {
    expect(techniques.length).toBeGreaterThanOrEqual(6);
    expect(techniques.length).toBeLessThanOrEqual(10);
    expect(Object.keys(catalog)).toEqual(['techniques']);
  });

  it('chaque technique a un id kebab-case unique, un titre, une consigne et un slot de la liste fermée', () => {
    const ids = new Set<string>();
    for (const t of techniques) {
      expect(t.id, JSON.stringify(t)).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(ids.has(t.id), `id en double : ${t.id}`).toBe(false);
      ids.add(t.id);
      expect(t.title?.trim(), t.id).toBeTruthy();
      expect(t.ask?.trim().length, t.id).toBeGreaterThan(30);
      expect(SLOTS, t.id).toContain(t.slot);
    }
  });

  it('aucune clé inconnue : une faute de frappe ne passe pas en silence', () => {
    for (const t of techniques) {
      for (const key of Object.keys(t)) expect(KEYS, `${t.id}.${key}`).toContain(key);
    }
  });

  it('chaque slot de la DoR de base a au moins une technique', () => {
    for (const slot of BASE_SLOTS) {
      expect(techniques.some((t) => t.slot === slot), slot).toBe(true);
    }
  });

  it('une technique de repli couvre les slots propres au projet (.vectorz/dor.yml), sans les connaître d’avance', () => {
    const repli = techniques.find((t) => t.id === 'slot-du-projet');
    expect(repli?.slot).toBe('projet');
    expect(repli?.when?.trim()).toBeTruthy();
    // Générique : elle s’appuie sur la `ask` et les `items` du slot déclaré, pas sur un slot précis.
    expect(repli?.ask).toMatch(/`ask`/);
    expect(repli?.ask).toMatch(/`items`/);
  });

  it('`calls` ne désigne que les deux skills connus ; l’architecte et le brainstorm y sont, avec leur `when`', () => {
    for (const t of techniques) {
      if (t.calls !== undefined) expect(CALLABLE, t.id).toContain(t.calls);
    }
    const archi = techniques.find((t) => t.id === 'avis-architecte');
    expect(archi?.calls).toBe('engineering:architecture');
    expect(archi?.slot).toBe('structure');
    expect(archi?.when?.trim()).toBeTruthy();
    const brainstorm = techniques.find((t) => t.id === 'brainstorm-cible');
    expect(brainstorm?.calls).toBe('product-management:product-brainstorming');
    expect(brainstorm?.when?.trim()).toBeTruthy();
  });

  it('cite son prior art BMAD en tête, vers un rapport de benchmark qui existe', () => {
    const header = text.split('\ntechniques:')[0];
    expect(header).toContain('advanced-elicitation');
    expect(header).toContain('methods.csv');
    const report = header.match(/products\/mega-city\/docs\/benchmarks\/[\w.-]+\.md/);
    expect(report, 'chemin du rapport de benchmark').not.toBeNull();
    expect(existsSync(join(megaCity, '..', '..', report?.[0] ?? '')), report?.[0]).toBe(true);
  });
});

describe('SKILL.md ezk-backlog — la boucle de groom est écrite (convention, pas un script)', () => {
  const skill = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');

  it('nomme le catalogue, qui existe à cet endroit', () => {
    expect(skill).toContain('groom-techniques.yml');
    expect(existsSync(catalogPath)).toBe(true);
  });

  it('documente les quatre paramètres qui forcent ou coupent l’architecte et le brainstorm', () => {
    for (const flag of ['--archi', '--no-archi', '--brainstorm', '--no-brainstorm']) {
      expect(skill, flag).toContain(flag);
    }
  });

  it('prévoit la sortie explicite, le mode sans opérateur et le lien vers le prior art BMAD', () => {
    expect(skill).toMatch(/sortie explicite/i);
    expect(skill).toMatch(/sans opérateur/i);
    expect(skill).toContain('advanced-elicitation');
  });

  it('sans opérateur, couvre CHAQUE slot manquant (sinon l’auto-groom ne passerait plus le gate ready)', () => {
    expect(skill).toMatch(/chaque slot manquant/i);
  });

  it('propose la technique de repli quand `ezk dor check` nomme un slot du projet', () => {
    expect(skill).toContain('slot-du-projet');
  });
});
