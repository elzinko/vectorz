/**
 * Le contrat réel `graph-check/v1` (exemple publié par la méthode), lu comme une DONNÉE : cop1 n'importe
 * jamais le code de mega-city (frontière ADR-027 §5, `tools/boundary`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GraphCheck } from '../graphCheck.js';

const EXAMPLE = join(__dirname, '..', '..', '..', '..', '..', '..', 'mega-city', 'contracts', 'graph-check', 'v1', 'example.json');

/** Le contrat tel que le daemon le relaie (le JSON complet porte en plus `broken`, `orphans`, `pathRefs`). */
export const graphCheckExample = (): GraphCheck => JSON.parse(readFileSync(EXAMPLE, 'utf8')) as GraphCheck;
