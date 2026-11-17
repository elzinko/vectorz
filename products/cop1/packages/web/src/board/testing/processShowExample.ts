/**
 * Le contrat réel `process-show/v1` (exemple publié par la méthode), lu comme une DONNÉE.
 *
 * Il est lu sur le disque, pas importé : cop1 n'importe jamais le code de mega-city (frontière
 * ADR-027 §5, `tools/boundary`). Même motif que `ezkProcessShowSource.test.ts` côté serveur.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProcessShow } from '../processShow.js';

// `__dirname` plutôt que `import.meta.url` : sous jsdom, cette URL n'est pas un chemin `file:`.
const EXAMPLE = join(__dirname, '..', '..', '..', '..', '..', '..', 'mega-city', 'contracts', 'process-show', 'v1', 'example.json');

export const processShowExample = (): ProcessShow => JSON.parse(readFileSync(EXAMPLE, 'utf8')) as ProcessShow;
