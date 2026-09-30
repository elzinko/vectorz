/**
 * cycle — le « cycle d'une feature » de la carte, écrit à la main, et ce qui l'APPUIE.
 * DÉTERMINISTE et PUR (ADR-0003) — fiche 20260821163346493.
 *
 * POURQUOI ce fichier existe : tout le reste de la carte est compilé depuis les fichiers du
 * dépôt. Ce cycle en 5 temps, lui, est une LECTURE d'auteur : aucun fichier ne dit « le temps 2
 * est porté par ezk-product-build ». Le laisser dans le HTML le présentait à égalité avec le
 * prouvé. Ici il reste écrit à la main (c'est sa nature), mais chaque puce est CLASSÉE :
 *   - prouvée  : un fichier la déclare (ceremonies.yml pour l'étape ; roles: ou ceremonies.yml
 *                pour l'acteur) — et la puce dit lequel (`via`) ;
 *   - déduite  : connue du catalogue, mais aucun fichier ne la relie à ce temps.
 * Un id inconnu ne passe pas en silence : la compilation JETTE (la régénération échoue).
 * Les acteurs humains (le PO, le bot Codex) n'ont pas de fichier : toujours déduits.
 */
import type { Catalog } from '../loaders/catalog.js';
import type { MethodDoc } from './ceremonies.js';
import type { CompiledGraph } from './compiled-graph.js';

export interface CycleStepDoc {
  n: number;
  t: string;
  scrum: string;
  /** id d'un élément de ceremonies.yml : c'est ce fichier qui appuie (ou non) les puces du temps. */
  ceremonie?: string;
  p: string;
  etape: string[];
  acteurs: string[];
  humains: string[];
}

/** Une puce du cycle. `via` est présent si et seulement si `prouve` : d'où vient l'appui. */
export interface CycleChip {
  id: string;
  prouve: boolean;
  via?: string;
}

export interface CycleStep {
  n: number;
  t: string;
  scrum: string;
  p: string;
  etape: CycleChip[];
  acteurs: CycleChip[];
  humains: string[];
}

/** LE texte écrit à la main (lecture d'auteur). Le rapprocher des fichiers est le travail de `compileCycle`. */
export const CYCLE_DOC: readonly CycleStepDoc[] = [
  {
    n: 1,
    t: 'La fiche',
    scrum: 'Product Backlog',
    ceremonie: 'product-backlog',
    p: 'Le PO capture le besoin, la fiche mûrit jusqu’à « ready ».',
    etape: ['ezk-backlog'],
    acteurs: [],
    humains: ['Toi (PO)'],
  },
  {
    n: 2,
    t: 'Le tirage',
    scrum: '≈ Sprint Planning',
    ceremonie: 'planning',
    p: 'La prochaine fiche prête est tirée ; en mode auto, ezk-pm décide à ta place.',
    etape: ['ezk-product-build'],
    acteurs: ['ezk-pm'],
    humains: ['Toi (PO)'],
  },
  {
    n: 3,
    t: 'Le run',
    scrum: '≈ Sprint (une fiche)',
    ceremonie: 'sprint',
    p: 'La boucle BDD/TDD construit UNE feature en convoquant les juges.',
    etape: ['ezk-sprint'],
    acteurs: ['ezk-architect', 'ezk-dev', 'ezk-qa', 'ezk-reviewer'],
    humains: [],
  },
  {
    n: 4,
    t: 'La livraison',
    scrum: 'release gate — ≠ Sprint Review',
    ceremonie: 'review',
    p: 'Gate + revue, puis squash-merge — dans le flux nominal, par le sprint lui-même ; ezk-pr pilote le stock de PRs en attente.',
    etape: ['ezk-pr', 'ezk-codex'],
    acteurs: [],
    humains: ['Toi (PO)', 'Codex (bot)'],
  },
  {
    n: 5,
    t: 'La rétro',
    scrum: '≈ Rétrospective (à la demande)',
    ceremonie: 'retro',
    p: 'Après un ou plusieurs runs : l’équipe inspecte la méthode elle-même.',
    etape: ['ezk-retro'],
    acteurs: [],
    humains: ['Toi (PO)'],
  },
];

/**
 * Classe chaque puce du cycle contre le catalogue, le graphe compilé et ceremonies.yml.
 * `method` absent ⇒ aucune étape n'est appuyée (tout ressort déduit, rien n'est inventé).
 */
export function compileCycle(
  catalog: Catalog,
  graph: CompiledGraph,
  method: MethodDoc | undefined,
  doc: readonly CycleStepDoc[] = CYCLE_DOC,
): CycleStep[] {
  return doc.map((s) => {
    const where = `cycle : temps ${s.n}`;
    const element =
      s.ceremonie === undefined ? undefined : method?.elements.find((e) => e.id === s.ceremonie);
    if (s.ceremonie !== undefined && method && !element) {
      throw new Error(`${where} → cérémonie inconnue « ${s.ceremonie} » (ceremonies.yml)`);
    }
    const refs = element?.implemente_par ?? [];
    const skillsOfCeremony = new Set(
      refs.filter((r) => r !== 'humain' && !r.startsWith('agent:')).map((r) => r.split(':')[0]),
    );
    const agentsOfCeremony = new Set(
      refs.filter((r) => r.startsWith('agent:')).map((r) => r.slice('agent:'.length)),
    );
    const viaCeremonie = `ceremonies.yml › ${s.ceremonie}`;

    const etape = s.etape.map((id): CycleChip => {
      if (!catalog.skills.has(id)) throw new Error(`${where} → skill inconnu « ${id} »`);
      return skillsOfCeremony.has(id) ? { id, prouve: true, via: viaCeremonie } : { id, prouve: false };
    });

    const acteurs = s.acteurs.map((id): CycleChip => {
      if (!catalog.agents.has(id)) throw new Error(`${where} → agent inconnu « ${id} »`);
      // Le lien le plus direct : une commande du temps CONVOQUE ce juge (verbe du graphe compilé).
      const convoquant = s.etape.find((skill) =>
        graph.edges.some(
          (e) => e.verb === 'convoque' && e.fromKind === 'skill' && e.from === skill && e.to === id,
        ),
      );
      if (convoquant) return { id, prouve: true, via: `roles: ${convoquant}` };
      return agentsOfCeremony.has(id) ? { id, prouve: true, via: viaCeremonie } : { id, prouve: false };
    });

    return { n: s.n, t: s.t, scrum: s.scrum, p: s.p, etape, acteurs, humains: [...s.humains] };
  });
}
