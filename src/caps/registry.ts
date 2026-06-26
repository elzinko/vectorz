/**
 * Registre des caps — HostId → Cap (ADR-0003, point 3 : DIP).
 *
 * `bind` dépend de l'abstraction `Cap`, pas de claude-code. Ajouter un hôte =
 * un module cap + une entrée ici, sans toucher au cœur.
 */
import type { Cap, HostId } from '../domain/model.js';
import { claudeCodeCap } from './claude-code.js';

const registry = new Map<HostId, Cap>([[claudeCodeCap.host, claudeCodeCap]]);

export function capFor(host: HostId): Cap {
  const cap = registry.get(host);
  if (!cap) {
    const known = [...registry.keys()].join(', ');
    throw new Error(`Hôte inconnu: '${host}'. Hôtes supportés: ${known}.`);
  }
  return cap;
}
