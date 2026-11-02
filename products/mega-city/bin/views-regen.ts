#!/usr/bin/env tsx
/**
 * views-regen — construit les vues générées NON committées (ADR-0055, fiche 20260830194601376).
 *
 *   pnpm --dir products/mega-city views:regen
 *
 * Écrit sur disque, depuis les sources réelles (fiches, PLAN.md, récits de docs/sessions/,
 * catalogue de la méthode) :
 *   - le fichier de données de la carte de la méthode (`*.data.js`, ignoré par git) ;
 *   - `PORTFOLIO.md` (via `portfolio.sh`, ignoré par git).
 * Mission control montre la carte à jour sans ce script : `ezk board maps --file` calcule ses données
 * à chaque demande. `views:regen` sert à lire hors serveur (file://, éditeur) et à repartir propre.
 *
 * L'ancienne commande `map:data` est un alias de celle-ci. Les vues qui RESTENT committées
 * (`features/BACKLOG.md`, `features/PLAN.md`) gardent leur propre outil : `regen-backlog.sh`.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeDataViews } from '../src/io/derived-views.js';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz

const report = writeDataViews(repoRoot);
for (const out of report.written) console.log(`views:regen: ${out} écrit.`);
for (const out of report.unchanged) console.log(`views:regen: ${out} déjà à jour.`);

// PORTFOLIO.md : généré par le script bash (il ne vit pas en TypeScript).
execFileSync('bash', [join(megaCity, 'bin', 'portfolio.sh'), repoRoot], { stdio: 'inherit' });
