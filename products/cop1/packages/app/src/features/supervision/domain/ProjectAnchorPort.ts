/**
 * fiche 0063 — port d'ancrage projet (spawn CLI siège, jamais depuis le projet cible).
 */
export type AnchorMode = 'method-only' | 'supervised';

export interface AnchorRequest {
  projectRoot: string;
  mode: AnchorMode;
  id: string;
  method: string;
}

export type AnchorSpawnOutcome = { ok: true } | { ok: false; reason: string };

export interface ProjectAnchorPort {
  /** Spawn `bind_command` + projectRoot (mode méthode seule). */
  bindMethod(projectRoot: string): Promise<AnchorSpawnOutcome>;
  /** Spawn `link_command` + projectRoot. */
  linkEmitter(projectRoot: string): Promise<AnchorSpawnOutcome>;
  /** Spawn `registry_add_command` + id + projectRoot + method. */
  addToRegistry(args: {
    id: string;
    projectRoot: string;
    method: string;
  }): Promise<AnchorSpawnOutcome>;
}
