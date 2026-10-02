import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * board.html — la COQUE du board d'avancement (mise en page + script de rendu, écrite à la main).
 *
 * Les DONNÉES du board ne sont plus dans cette page : elles vivent dans `board.data.js`, non
 * committé (ADR-0055, fiche 20260830194601376). Leur fidélité au backlog est donc prouvée dans
 * `untracked-views.test.ts` (le constructeur dit vrai sur le dépôt réel). Ici on garde ce qui
 * reste propre à la coque : le rendu n'injecte jamais du texte de fiche via innerHTML, et les
 * labels du front-matter alimentent bien les filtres.
 */
import { describe, expect, it } from 'vitest';
import { buildAvancementData } from '../core/avancement-data.js';
import type { Fiche } from '../loaders/fiches.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');

describe('diagrams/avancement/board.html — la coque', () => {
  it('le rendu (cartes ET modale) n’injecte jamais du texte de fiche via innerHTML (anti-XSS)', () => {
    const html = readFileSync(boardPath, 'utf8');
    // Tout texte issu d'une fiche (front-matter OU corps .md fetché) doit être posé via
    // textContent, jamais concaténé dans innerHTML — sinon un `<img onerror=…>` s’exécuterait.
    expect(html).toMatch(/\.textContent\s*=/);
    // Chemin des cartes (données de fiche du bloc généré).
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\bf\.(title|status|type|epic|id)\b/);
    // Chemin de la modale (corps `.md` fetché) — revue 2026-08-27, le chemin le plus risqué.
    expect(html).not.toMatch(/\bbodyEl\.innerHTML\s*=/);
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\b(md|parseBlocks|renderBlocks|stripInline)\b/);
  });

  it('les pouces 👍/👎 (fiche 20260826072532622) : boutons annoncés, filtre « Revue », message sans serveur', () => {
    const html = readFileSync(boardPath, 'utf8');
    expect(html).toContain('id="f-revue"'); // le filtre validée / rejetée / non revue
    expect(html).toContain("fetch('/api/verdict'"); // la seule route d'écriture du tableau de bord
    expect(html).toContain('aria-pressed'); // l'état du pouce est annoncé, pas seulement coloré
    // Page ouverte sans `ezk dashboard` : on le dit, on ne fait pas semblant d'enregistrer.
    expect(html).toContain('pnpm ezk dashboard');
    // Le verdict, la date et les fichiers illisibles viennent de fichiers : jamais via innerHTML.
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\b(verdict|illisibles|banniere|date)\b/);
  });

  it('les labels du front-matter alimentent BoardFiche.labels et filtres.labels (filtre par tag)', () => {
    const mk = (id: string, labels: string[]): Fiche => ({
      id,
      title: 't' + id,
      type: 'feature',
      priority: 'P2',
      status: 'idea',
      milestone: '',
      product: 'mega-city',
      pr: '',
      labels,
      blocked: '',
      version: '',
      done: false,
      file: `features/${id}.md`,
    });
    const data = buildAvancementData([mk('1', ['bmad', 'x']), mk('2', ['bmad'])]);
    expect(data.actives[0].labels).toContain('bmad');
    expect(data.filtres.labels).toEqual(['bmad', 'x']); // uniq + trié, dédupliqué
  });
});
