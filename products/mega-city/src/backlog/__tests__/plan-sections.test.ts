import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsePlanOrder } from '../plan-order.js';
import { parsePlanSections } from '../plan-sections.js';

describe('parsePlanSections (fiche 20260825213807501 — vue Plan)', () => {
  it('groupe les entrées sous leur section, dans l’ordre du document', () => {
    const md = [
      '# PLAN',
      '## ▶️ NOW',
      '1. **0094** — brancher · `build`',
      '## ⏭️ NEXT',
      '- 0062 — onglet Projets · `ship`',
    ].join('\n');
    const sections = parsePlanSections(md);
    expect(sections.map((s) => s.label)).toEqual(['▶️ NOW', '⏭️ NEXT']);
    expect(sections[0].entries.map((e) => e.ids)).toEqual([['0094']]);
    expect(sections[1].entries.map((e) => e.ids)).toEqual([['0062']]);
  });

  it('inclut les sections à intitulé ARBITRAIRE (pas seulement NOW/NEXT/LATER)', () => {
    const md = [
      '## 🧹 Hygiène préalable',
      '- `ship` 0059 — nettoyage',
      '## ▶️ NOW bis — refonte',
      '1. 20260824061247344 — reliquat · `build`',
      '### ↪️ Après le refactoring',
      '- 20260825141012293 — cockpit · `groom`',
    ].join('\n');
    const sections = parsePlanSections(md);
    expect(sections.map((s) => s.label)).toEqual([
      '🧹 Hygiène préalable',
      '▶️ NOW bis — refonte',
      '↪️ Après le refactoring',
    ]);
    // Le niveau du titre est capté (## = 2, ### = 3).
    expect(sections.map((s) => s.level)).toEqual([2, 2, 3]);
  });

  it('capture TOUS les ids d’une ligne multi-ids (fin de la troncature de parsePlanOrder)', () => {
    const md = [
      '## ⏳ LATER',
      '- ⚠️ **Distribution** — 0087 · 0050 · 0078 · 0096 · 0186. NE PAS PUBLIER.',
    ].join('\n');
    const [later] = parsePlanSections(md);
    expect(later.entries).toHaveLength(1);
    expect(later.entries[0].ids).toEqual(['0087', '0050', '0078', '0096', '0186']);
    // Contraste explicite avec parsePlanOrder qui n’en garderait qu’un (et encore, ici zéro :
    // la ligne n’a ni id en tête ni marqueur, donc parseOrder l’ignore entièrement).
    expect(parsePlanOrder(md)).toEqual([]);
  });

  it('capte le marqueur d’action et l’état barré (curation « livré »)', () => {
    const md = [
      '## ▶️ NOW',
      '1. ~~**0181** — Opus 4.8~~ — shipped #92',
      '2. **0102** — testbed · `build`',
    ].join('\n');
    const [now] = parsePlanSections(md);
    expect(now.entries[0].struck).toBe(true);
    expect(now.entries[0].marker).toBeNull();
    expect(now.entries[1].struck).toBe(false);
    expect(now.entries[1].marker).toBe('build');
  });

  it('ignore les sous-bullets indentés (dépendances/notes) même avec id ou marqueur', () => {
    const md = [
      '## ▶️ NOW',
      '1. **0094** — entrée racine · `build`',
      '   - 0017 — dépendance (indentée)',
      '   - groom 0123 plus tard (indentée)',
    ].join('\n');
    const [now] = parsePlanSections(md);
    expect(now.entries.map((e) => e.ids)).toEqual([['0094']]);
  });

  it('ignore une puce racine sans aucun id (pure prose structurante)', () => {
    const md = ['## ▶️ NOW', '- juste une note d’organisation, aucun id ici'].join('\n');
    const [now] = parsePlanSections(md);
    expect(now.entries).toEqual([]);
  });

  it('renvoie une section à entries vide quand rien n’est parsé (le rendu décidera de l’omettre)', () => {
    const md = ['## 🎯 Product Goal', '> un blockquote, pas de liste'].join('\n');
    const [goal] = parsePlanSections(md);
    expect(goal.label).toBe('🎯 Product Goal');
    expect(goal.entries).toEqual([]);
  });

  it('dédoublonne les ids INTRA-ligne en gardant l’ordre', () => {
    const md = ['## X', '- 0094 puis encore 0094 et 0062'].join('\n');
    const [x] = parsePlanSections(md);
    expect(x.entries[0].ids).toEqual(['0094', '0062']);
  });

  it('normalise le préfixe legacy mc- vers l’id nu', () => {
    const md = ['## X', '- mc-0094 — legacy'].join('\n');
    expect(parsePlanSections(md)[0].entries[0].ids).toEqual(['0094']);
  });

  it('renvoie [] sur une entrée vide, sans throw', () => {
    expect(parsePlanSections('')).toEqual([]);
  });

  it('charge le vrai features/PLAN.md : sections réelles + 0087 capté (contraste parseOrder)', () => {
    const planPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../features/PLAN.md',
    );
    const planMd = readFileSync(planPath, 'utf8');
    const sections = parsePlanSections(planMd);
    const labels = sections.map((s) => s.label);
    // Il y a bien plusieurs sections, dont au moins deux « NOW » (NOW bis + NOW).
    expect(labels.filter((l) => /NOW/.test(l)).length).toBeGreaterThanOrEqual(2);
    // 0087 vit dans le paquet LATER « Distribution » (multi-ids, sans marqueur) :
    // parseOrder l’ignore, parseSections le CAPTE — c’est tout l’intérêt de la vue.
    const allIds = sections.flatMap((s) => s.entries.flatMap((e) => e.ids));
    expect(allIds).toContain('0087');
    expect(parsePlanOrder(planMd)).not.toContain('0087');
    // Chaque section a un label non vide.
    expect(labels.every((l) => l.length > 0)).toBe(true);
  });
});
