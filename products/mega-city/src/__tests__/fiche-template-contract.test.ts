import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EVIDENCE, PRIOS, TYPES } from '../core/avancement-data.js';
import { STATUTS } from '../core/fiche-schema.js';

/**
 * CONTRAT du gabarit de fiche (fiche 20260918114726706).
 *
 * En clair : le squelette d'une fiche vit à UN seul endroit, le gabarit du skill `ezk-backlog`
 * (la RÉFÉRENCE). Le dossier `features/` de vectorz en garde un double, que `add` recopie. Ce test
 * exige que le double soit identique à la référence, qu'aucune autre copie ne traîne, et que les
 * listes de valeurs écrites en commentaire (type, priorité, preuve, statut) disent ce que dit le
 * code. Il complète `fiche-schema-contract.test.ts`, qui garde déjà la ligne `status:`.
 */

const MC = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // products/mega-city
const REPO = join(MC, '..', '..'); // racine vectorz
const read = (rel: string): string => readFileSync(join(REPO, rel), 'utf8');

const REF = 'products/mega-city/skills/ezk-backlog/templates/feature-template.md';
const LOCAL = 'features/feature-template.md';
const ORPHAN = 'products/mega-city/feature-template.md';
const INIT = 'products/mega-city/skills/ezk-backlog/init.sh';
const SKILL = 'products/mega-city/skills/ezk-backlog/SKILL.md';

/** `clé: valeur # a | b | c — explication` → ['a', 'b', 'c'] (la partie après « — » est ignorée). */
function listComment(text: string, key: string): string[] {
  const m = text.match(new RegExp(`^${key}:[^#\\n]*#\\s*([^—\\n]+)`, 'm'));
  if (!m) throw new Error(`ligne « ${key}: … # a | b | c » introuvable`);
  return m[1].split('|').map((s) => s.trim());
}

describe('contrat du gabarit de fiche — une seule source', () => {
  it('le gabarit local de vectorz est la copie exacte de la référence', () => {
    expect(existsSync(join(REPO, LOCAL)), `${LOCAL} absent`).toBe(true);
    expect(
      read(LOCAL),
      `Dérive : la référence fait foi. Rejoue « cp ${REF} ${LOCAL} ».`,
    ).toBe(read(REF));
  });

  it('aucune copie orpheline : le gabarit de products/mega-city/ est supprimé', () => {
    expect(existsSync(join(REPO, ORPHAN)), `${ORPHAN} doit rester supprimé`).toBe(false);
  });

  it("init.sh ne porte plus de squelette de fiche (le repli heredoc est supprimé)", () => {
    const init = read(INIT);
    expect(init).not.toMatch(/^## Critères d'acceptation/m);
    expect(init).not.toMatch(/^id: "0000"/m);
  });

  it("la référence suit le modèle courant : milestone, id entre guillemets, plus d'epic", () => {
    const ref = read(REF);
    expect(ref).toMatch(/^id: "0000"/m);
    expect(ref).toMatch(/^milestone:/m);
    expect(ref).not.toMatch(/^epic:/m);
  });

  it('les listes de valeurs en commentaire de la référence = les énumérations du code', () => {
    const ref = read(REF);
    expect(listComment(ref, 'type')).toEqual([...TYPES]);
    expect(listComment(ref, 'priority')).toEqual([...PRIOS]);
    expect(listComment(ref, 'evidence')).toEqual([...EVIDENCE]);
    expect(listComment(ref, 'status')).toEqual([...STATUTS]);
  });

  it("l'exemple de front-matter du SKILL ne montre plus le champ retiré epic:", () => {
    const skill = read(SKILL);
    expect(skill).not.toMatch(/^epic:/m);
    expect(skill).toMatch(/^milestone:/m);
  });
});
