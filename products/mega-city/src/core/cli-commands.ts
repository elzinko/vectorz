/**
 * cli-commands — les COMMANDES `ezk` de la méthode et leurs liens. PUR (ADR-0003).
 *
 * Fiche 20261117114544666, ADR-0089. Une commande est une entrée du manifeste (`ezk-manifest.yml`) :
 * id `ezk <domaine> <verbe>`, ou `ezk <domaine>` quand le domaine EST la commande. Elle LANCE un
 * script (le premier mot de `run`) ; un skill l'UTILISE quand sa doc la cite en code, entre
 * backticks : `` `ezk <domaine> <verbe>` ``, éventuellement suivie d'arguments.
 * Rien n'est saisi à la main : tout est calculé depuis le manifeste et les docs des skills.
 *
 * Aucun I/O ici : lire le manifeste = `loaders/tools.ts`.
 */
import type { SkillTexts } from './tools.js';

/** Une commande `ezk`, avec ce qui la relie au reste. */
export interface CliCommand {
  /** `ezk forge integrate`, ou `ezk help` quand le domaine est la commande. */
  id: string;
  /** Le script qu'elle lance, chemin depuis `products/mega-city` (ex. `bin/ezk-graph.ts`). */
  script: string;
  /** Les skills dont la doc cite la commande en code (ids, triés). Source des liens `uses-command`. */
  usedBy: string[];
}

/** Ce qu'il faut d'une entrée du manifeste. */
export interface ManifestCommand {
  domain: string;
  verb?: string;
  run: string;
  deprecated?: string;
}

const INLINE_EZK = /`ezk ([^`\n]+)`/g;

/** Les commandes citées par un texte : un `` `ezk <mots…>` `` désigne la plus précise des commandes connues. */
function citedIn(text: string, ids: ReadonlySet<string>): Set<string> {
  const cited = new Set<string>();
  for (const match of text.matchAll(INLINE_EZK)) {
    const [domain, verb] = (match[1] ?? '').trim().split(/\s+/);
    const withVerb = `ezk ${domain} ${verb}`;
    if (verb !== undefined && ids.has(withVerb)) cited.add(withVerb);
    else if (ids.has(`ezk ${domain}`)) cited.add(`ezk ${domain}`);
  }
  return cited;
}

/**
 * Compose les commandes depuis les entrées du manifeste (anciens noms exclus), triées par id : sortie
 * stable (F4). Un script qui n'est pas un outil connu reste porté par la commande ; c'est le graphe qui
 * n'émet alors aucune arête `lance`.
 */
export function deriveCliCommands(
  entries: readonly ManifestCommand[],
  skills: readonly SkillTexts[],
): CliCommand[] {
  const scripts = new Map<string, string>();
  for (const e of entries) {
    if (e.deprecated) continue;
    const script = e.run.split(/\s+/)[0];
    if (script) scripts.set(`ezk ${e.domain}${e.verb ? ` ${e.verb}` : ''}`, script);
  }
  const ids = new Set(scripts.keys());
  const usedBy = new Map<string, Set<string>>();
  for (const { skill, texts } of skills) {
    for (const text of texts) {
      for (const id of citedIn(text, ids)) usedBy.set(id, (usedBy.get(id) ?? new Set()).add(skill));
    }
  }
  return [...scripts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, script]) => ({ id, script, usedBy: [...(usedBy.get(id) ?? [])].sort() }));
}
