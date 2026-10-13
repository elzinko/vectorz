#!/usr/bin/env tsx
/**
 * `ezk adr new <slug> [--scope ombrelle|methode]` — pose le squelette d'un ADR au prochain id
 * LIBRE DES DEUX DOSSIERS (fiche 20261011142027748). Le numéro vient de `check-adr-ids.sh --next`,
 * qui scanne `docs/adr/` (ombrelle, `ADR-0NN`) ET `products/mega-city/docs/adr/` (méthode, `00NN`) :
 * l'id proposé n'existe dans aucun des deux, donc plus d'aller-retour « collision découverte au test »
 * (vécu 2026-10-10 : ADR-039 refait en 0069).
 *
 * Partie purement MÉCANIQUE (le câblage de `--next`). La décision « où vivent les ADR » est une
 * fiche sœur (20261011142027875), hors de ce périmètre : ici un défaut raisonnable (ombrelle) et un
 * drapeau `--scope` pour la méthode.
 *
 * Bord I/O mince : le calcul du prochain id reste dans check-adr-ids.sh (aucune logique dupliquée).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRootOrExit } from '../src/io/project-root.js';

const base = process.env.INIT_CWD ?? process.cwd();
const target = projectRootOrExit(base);
const root = target.root;

const rest = target.rest;
let scope: 'ombrelle' | 'methode' = 'ombrelle';
const positionals: string[] = [];
for (let i = 0; i < rest.length; i += 1) {
  const a = rest[i];
  if (a === '--scope') {
    const v = rest[++i];
    if (v !== 'ombrelle' && v !== 'methode') {
      console.error("ezk adr new : --scope attend 'ombrelle' ou 'methode'");
      process.exit(2);
    }
    scope = v;
  } else if (a === 'new') {
    // le verbe, ignoré s'il nous est passé
  } else if (a.startsWith('-')) {
    console.error(`ezk adr new : drapeau inconnu ${a}`);
    process.exit(2);
  } else {
    positionals.push(a);
  }
}
const slug = positionals[0];
if (!slug) {
  console.error('usage : ezk adr new <slug> [--scope ombrelle|methode]   (--root <projet> pour un autre dépôt)');
  process.exit(2);
}

// Le prochain id LIBRE DES DEUX DOSSIERS — calculé par check-adr-ids.sh, jamais réimplémenté ici.
const checkAdr = resolve(dirname(fileURLToPath(import.meta.url)), 'check-adr-ids.sh');
const next = spawnSync('bash', [checkAdr, root, '--next'], { encoding: 'utf8' });
if (next.status !== 0) {
  console.error(`ezk adr new : impossible d'obtenir le prochain id (check-adr-ids.sh) :\n${next.stderr ?? ''}`);
  process.exit(1);
}
const id = next.stdout.trim(); // ex. "075" (3 chiffres)
if (!/^\d{3,4}$/.test(id)) {
  console.error(`ezk adr new : id inattendu de check-adr-ids.sh : « ${id} »`);
  process.exit(1);
}

// Convention par dossier : ombrelle = docs/adr/ADR-<id>-slug.md ; méthode = …/0<id>-slug.md.
const dir = scope === 'ombrelle' ? join(root, 'docs', 'adr') : join(root, 'products', 'mega-city', 'docs', 'adr');
const fileName = scope === 'ombrelle' ? `ADR-${id}-${slug}.md` : `${id.padStart(4, '0')}-${slug}.md`;
const heading = scope === 'ombrelle' ? `ADR-${id}` : id.padStart(4, '0');
const file = join(dir, fileName);
if (existsSync(file)) {
  console.error(`ezk adr new : ${file} existe déjà — rien écrit.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const titre = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
const skeleton = `# ${heading} — ${titre}

- Statut : proposé
- Date : ${today}

## Contexte

<pourquoi cette décision se pose — le problème, les forces en présence>

## Décision

<ce qu'on décide, en une phrase claire, puis le détail>

## Conséquences

<ce que ça implique — gains, coûts, ce qu'on s'interdit désormais>
`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, skeleton, 'utf8');
console.log(`ADR ${heading} posé : ${file}`);
console.log(`(prochain id libre des deux dossiers — ni docs/adr/ ni products/mega-city/docs/adr/ ne le portaient)`);
