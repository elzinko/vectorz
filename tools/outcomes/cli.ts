#!/usr/bin/env node
/**
 * Fiche 0044 — point d'entrée exécutable du mesureur (zéro-LLM, déterministe).
 * Usage : `pnpm outcomes:measure` — produit l'inventaire + la baseline
 * `.improvement/outcomes.jsonl` (append-only, idempotent) à la racine du repo.
 *
 * La racine est résolue via `git rev-parse --show-toplevel` (et non `process.cwd()`) :
 * le CLI fonctionne quel que soit le répertoire courant de l'exécuteur.
 */
import { execFileSync } from 'node:child_process';
import { measure } from './measure.js';
import { GhGitSource } from './sources.js';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const result = measure(new GhGitSource(root), root);
process.stdout.write(
  `${JSON.stringify({ inventory: result.inventory, ledger: result.ledger }, null, 2)}\n`,
);
