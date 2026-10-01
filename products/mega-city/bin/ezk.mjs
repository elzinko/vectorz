#!/usr/bin/env node
/**
 * Lanceur de « ezk » : c'est lui que le champ `bin` du paquet expose (`pnpm link --global`).
 * Il charge le routeur TypeScript avec le `tsx` des dépendances de mega-city, donc le poste
 * n'a pas besoin d'un `tsx` installé. Aucune logique de routage ici (voir ezk.ts).
 */
import { tsImport } from 'tsx/esm/api';

await tsImport('./ezk.ts', import.meta.url);
