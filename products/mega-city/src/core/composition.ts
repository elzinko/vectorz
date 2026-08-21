import type { ResolvedProfile } from '../domain/model.js';
/**
 * checkComposition — DÉTERMINISTE et PUR (ADR-0025).
 *
 * La doctrine « compose, ne réinvente pas » vivait en prose : `expandProfile`
 * ignore silencieusement les ids `composes` absents du catalogue. Ce checker
 * ferme transitivement le graphe `composes` (en lisant le CATALOGUE, pas
 * seulement le profil résolu, pour atteindre les deps de skills eux-mêmes
 * absents du profil) et signale chaque arête dont la cible n'est ni dans le
 * profil résolu, ni listée en `composesExternal`.
 *
 * Diagnostic non bloquant : aucun I/O, aucune horloge, aucune IA. Sortie
 * triée stablement (from, missing) → déterministe (ADR-0003).
 */
import type { Catalog } from '../loaders/catalog.js';

export interface CompositionWarning {
  from: string;
  missing: string;
}

const byFromThenMissing = (a: CompositionWarning, b: CompositionWarning): number =>
  a.from.localeCompare(b.from) || a.missing.localeCompare(b.missing);

export function checkComposition(
  resolved: ResolvedProfile,
  catalog: Catalog,
): CompositionWarning[] {
  const present = new Set(resolved.skills.map((s) => s.id));
  const seen = new Set<string>(); // fermeture transitive : skills déjà parcourus
  const warnings = new Map<string, CompositionWarning>(); // dédup par "from\0missing"
  const queue = [...resolved.skills.map((s) => s.id)];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);

    const skill = catalog.skills.get(id);
    if (!skill) continue;

    const external = new Set(skill.composesExternal ?? []);
    for (const required of skill.composes ?? []) {
      if (!present.has(required) && !external.has(required)) {
        warnings.set(`${id}\0${required}`, { from: id, missing: required });
      }
      queue.push(required); // continue la fermeture même si absent (deps de deps)
    }
  }

  return [...warnings.values()].sort(byFromThenMissing);
}

/**
 * checkRoles — même contrat que checkComposition, pour la relation `roles:`
 * (ADR-0020, amendement du 2026-08-20). PUR et DÉTERMINISTE.
 *
 * `composes` relie skill → skill ; `roles` relie un orchestrateur → les AGENTS
 * qu'il convoque. Sans ce contrôle, un profil peut binder `ezk-sprint` sans
 * `ezk-qa` ni `ezk-reviewer` : la boucle scrum est amputée de ses juges, en
 * silence. Pas de fermeture transitive ici — un agent ne convoque personne.
 *
 * Diagnostic NON bloquant, comme la composition : c'est un révélateur de trou
 * de profil, pas une exception.
 */
export function checkRoles(resolved: ResolvedProfile, catalog: Catalog): CompositionWarning[] {
  const agents = new Set(resolved.agents.map((a) => a.id));
  const warnings = new Map<string, CompositionWarning>();

  for (const skill of resolved.skills) {
    // relire le catalogue : le skill résolu peut être une projection sans `roles`
    for (const role of catalog.skills.get(skill.id)?.roles ?? []) {
      if (!agents.has(role)) {
        warnings.set(`${skill.id}\0${role}`, { from: skill.id, missing: role });
      }
    }
  }

  return [...warnings.values()].sort(byFromThenMissing);
}
