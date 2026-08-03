/**
 * fiche 0063 — ancrage projet depuis le Moniteur (geste humain).
 * Spawn les CLIs siège ; ne réécrit pas link/registry en JS dans cop1.
 */
import { existsSync } from 'node:fs';
import { basename, isAbsolute, resolve } from 'node:path';
import type { AnchorMode, AnchorRequest, ProjectAnchorPort } from '../domain/ProjectAnchorPort.js';

export const LINK_COMMAND_EXAMPLE = '["pnpm", "--dir", "products/mega-city", "supervision:link"]';
export const REGISTRY_ADD_COMMAND_EXAMPLE =
  '["pnpm", "--dir", "products/mega-city", "supervision:registry-add"]';
export const BIND_COMMAND_EXAMPLE =
  '["pnpm", "--dir", "products/mega-city", "lawgiver", "bind", "default"]';

export type AnchorResult =
  | {
      status: 200;
      mode: AnchorMode;
      projectRoot: string;
      id: string;
      daemonRestartRequired: boolean;
    }
  | { status: 400 | 409; error: string };

export interface AnchorProjectDeps {
  port: ProjectAnchorPort;
  bindConfigured: boolean;
  linkConfigured: boolean;
  registryAddConfigured: boolean;
}

export class AnchorProjectUseCase {
  constructor(private readonly deps: AnchorProjectDeps) {}

  async execute(raw: {
    projectRoot?: unknown;
    mode?: unknown;
    id?: unknown;
    method?: unknown;
  }): Promise<AnchorResult> {
    if (typeof raw.projectRoot !== 'string' || raw.projectRoot.trim().length === 0) {
      return { status: 400, error: 'projectRoot (chemin absolu) est requis' };
    }
    const rawPath = raw.projectRoot.trim();
    if (!isAbsolute(rawPath)) {
      return { status: 400, error: 'projectRoot doit être un chemin absolu' };
    }
    const projectRoot = resolve(rawPath);
    if (!existsSync(projectRoot)) {
      return { status: 400, error: `chemin introuvable : ${projectRoot}` };
    }

    const mode = raw.mode;
    if (mode !== 'method-only' && mode !== 'supervised') {
      return { status: 400, error: 'mode doit être "method-only" ou "supervised"' };
    }

    const id =
      typeof raw.id === 'string' && raw.id.trim().length > 0
        ? raw.id.trim()
        : basename(projectRoot);
    const method =
      typeof raw.method === 'string' && raw.method.trim().length > 0
        ? raw.method.trim()
        : 'mega-city';

    const request: AnchorRequest = { projectRoot, mode, id, method };

    if (mode === 'method-only') {
      if (!this.deps.bindConfigured) {
        return {
          status: 409,
          error: `Capacité « méthode seule » dormante (bind_command vide). Configurez supervision.bind_command dans cop1.config.yaml. Exemple : ${BIND_COMMAND_EXAMPLE}`,
        };
      }
      const bound = await this.deps.port.bindMethod(request.projectRoot);
      if (!bound.ok) {
        return { status: 409, error: bound.reason };
      }
      return {
        status: 200,
        mode,
        projectRoot,
        id,
        daemonRestartRequired: false,
      };
    }

    // supervised
    if (!this.deps.linkConfigured || !this.deps.registryAddConfigured) {
      return {
        status: 409,
        error: `Capacité « supervisé » dormante. Configurez supervision.link_command et supervision.registry_add_command. Exemples : link=${LINK_COMMAND_EXAMPLE} ; registry_add=${REGISTRY_ADD_COMMAND_EXAMPLE}`,
      };
    }

    const linked = await this.deps.port.linkEmitter(request.projectRoot);
    if (!linked.ok) {
      return { status: 409, error: linked.reason };
    }
    const added = await this.deps.port.addToRegistry({
      id: request.id,
      projectRoot: request.projectRoot,
      method: request.method,
    });
    if (!added.ok) {
      return { status: 409, error: added.reason };
    }

    return {
      status: 200,
      mode,
      projectRoot,
      id,
      daemonRestartRequired: true,
    };
  }
}
