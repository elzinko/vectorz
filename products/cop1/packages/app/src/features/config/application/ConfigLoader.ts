import { existsSync, watch } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { totalmem } from 'node:os';
import { join } from 'node:path';
import type { Cop1Config } from '@cop1/shared-kernel';
import { ConfigSchema } from '../domain/ConfigSchema.js';
import { ConfigValidationError } from '../domain/ConfigValidationError.js';
import { readYamlFile } from '../infrastructure/YamlFileReader.js';

const CONFIG_FILENAME = 'cop1.config.yaml';
const DEBOUNCE_MS = 500;

export class ConfigLoader {
  private config: Cop1Config | null = null;
  private watcher: FSWatcher | null = null;
  private skipRamValidation: boolean;

  private totalMemGbOverride: number | undefined;

  constructor(options?: { skipRamValidation?: boolean; totalMemGbOverride?: number }) {
    this.skipRamValidation = options?.skipRamValidation ?? false;
    // Injectable pour des tests déterministes (la CI tourne sur 16 GB) — fiche 0033
    this.totalMemGbOverride = options?.totalMemGbOverride;
  }

  private detectTotalGb(): number {
    return this.totalMemGbOverride ?? Math.round((totalmem() / 1e9) * 100) / 100;
  }

  load(projectPath: string): Cop1Config {
    const configPath = join(projectPath, CONFIG_FILENAME);

    let raw: unknown = {};
    if (existsSync(configPath)) {
      raw = readYamlFile(configPath);
    }

    const result = ConfigSchema.safeParse(raw ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue ? issue.path.join('.') : 'unknown';
      const detail = issue ? issue.message : 'Unknown validation error';
      throw new ConfigValidationError(field, detail);
    }

    const totalGB = this.detectTotalGb();

    // Fiche 0033 volet 2 — les DÉFAUTS sont clampés à la RAM détectée (plancher = min
    // du schéma, 4) : une config vierge démarre sur n'importe quel poste. Seules les
    // valeurs posées PAR L'UTILISATEUR peuvent excéder la machine (et échouent alors
    // en validation stricte, volet 1).
    const rawResources = (raw as { resources?: Record<string, unknown> } | null)?.resources;
    const nightUserSet = rawResources?.ram_budget_night_gb !== undefined;
    const dayUserSet = rawResources?.ram_budget_day_gb !== undefined;
    const clampTo = Math.max(4, Math.floor(totalGB));
    if (!nightUserSet && result.data.resources.ram_budget_night_gb > clampTo) {
      result.data.resources.ram_budget_night_gb = clampTo;
    }
    if (!dayUserSet && result.data.resources.ram_budget_day_gb > clampTo) {
      result.data.resources.ram_budget_day_gb = clampTo;
    }

    if (!this.skipRamValidation) {
      if (nightUserSet && result.data.resources.ram_budget_night_gb > totalGB) {
        throw new ConfigValidationError(
          'resources.ram_budget_night_gb',
          `${result.data.resources.ram_budget_night_gb}GB exceeds total RAM (${totalGB}GB) — adjust cop1.config.yaml`,
        );
      }
      if (dayUserSet && result.data.resources.ram_budget_day_gb > totalGB) {
        throw new ConfigValidationError(
          'resources.ram_budget_day_gb',
          `${result.data.resources.ram_budget_day_gb}GB exceeds total RAM (${totalGB}GB) — adjust cop1.config.yaml`,
        );
      }
    }

    this.config = result.data;
    return this.config;
  }

  get(): Cop1Config {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }
    return this.config;
  }

  watch(projectPath: string, callback: (config: Cop1Config) => void): void {
    const configPath = join(projectPath, CONFIG_FILENAME);
    if (!existsSync(configPath)) {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.watcher = watch(configPath, () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        try {
          const newConfig = this.load(projectPath);
          callback(newConfig);
        } catch {
          // Validation error on reload — keep previous config, don't crash
        }
      }, DEBOUNCE_MS);
    });
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
