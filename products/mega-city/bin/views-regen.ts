#!/usr/bin/env tsx
/**
 * views-regen — construit les vues générées NON committées (ADR-0055, fiche 20260830194601376).
 *
 *   pnpm --dir products/mega-city views:regen
 *
 * Écrit sur disque, depuis les sources réelles (fiches, PLAN.md, récits de docs/sessions/,
 * catalogue de la méthode) :
 *   - les fichiers de données `*.data.js` de board / pilotage / runs / carte (ignorés par git) ;
 *   - `PORTFOLIO.md` (via `portfolio.sh`, ignoré par git).
 * Ouvrir `pnpm ezk:map` suffit pour VOIR les pages à jour : le serveur calcule les données à
 * chaque requête. `views:regen` sert à lire hors serveur (file://, éditeur) et à repartir propre.
 *
 * Les anciennes commandes `avancement:regen`, `plan-view:regen`, `plan-delta:regen`,
 * `pilotage:regen`, `runs:regen` et `map:data` sont des alias de celle-ci. Les vues qui RESTENT committées
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
