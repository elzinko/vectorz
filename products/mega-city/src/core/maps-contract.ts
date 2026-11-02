/**
 * maps-contract — le format de `ezk board maps --json` (fiche 20261102123552184, ADR-086) : les
 * documents de la méthode que mission control montre dans sa vue « Cartes ». Rien que des noms : le
 * contenu sort par `ezk board maps --file <id> <nom>`, jamais par un chemin lu à part.
 */
import { z } from 'zod';

export const MAPS_SCHEMA_VERSION = 1;

export const MapsContractSchema = z.strictObject({
  schema_version: z.literal(MAPS_SCHEMA_VERSION),
  documents: z
    .array(
      z.strictObject({
        id: z.string().describe('Le dossier du document dans `diagrams/`.'),
        titre: z.string().describe('Le titre lu dans son `meta.yaml`, ou son id à défaut.'),
        type: z.enum(['html', 'svg']),
        fichier: z.string().describe('Le fichier principal du document.'),
        donnees: z
          .string()
          .nullable()
          .describe('Le fichier de données que la page charge, calculé à la demande, ou null.'),
      }),
    )
    .describe('Les documents, triés par id ; les pages portées par une autre vue en sont écartées.'),
});

export type MapsContract = z.infer<typeof MapsContractSchema>;
