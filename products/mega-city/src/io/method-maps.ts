/**
 * method-maps — les cartes et les documents de la méthode (`diagrams/`), pour `ezk board open` et pour
 * `ezk board maps` (fiche 20261102123552184, ADR-086).
 *
 * Une carte est un dossier de `diagrams/` porteur d'un `.html` ou d'un `.svg`. `ezk board maps` n'en
 * publie que les DOCUMENTS : les pages interactives portées par d'autres fiches (avancement, pilotage,
 * runs, process, la loi) en sont écartées. Le contenu d'un document, et les données qu'il charge,
 * sortent par la commande : mission control ne lit jamais ces fichiers lui-même.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DiagramEntry, readMetaCategorie, readMetaTitle } from '../core/ezk-map-menu.js';
import { MAPS_SCHEMA_VERSION, type MapsContract } from '../core/maps-contract.js';
import { DATA_VIEWS } from './derived-views.js';

/** La méthode : le dépôt où vit ce code. Ses cartes sont les mêmes quel que soit le projet visé. */
const METHOD_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
export const METHOD_DIAGRAMS = join(METHOD_ROOT, 'diagrams');

/**
 * Les pages interactives portées par une fiche à elles, hors de la vue « Cartes » : avancement et
 * pilotage (vue « Pilotage »), runs (idem), process (vue « Process »), la loi (vue « Loi »).
 */
export const PAGES_PORTEES: readonly string[] = ['avancement', 'carte-la-loi', 'pilotage', 'process', 'runs'];

/** Cartes disponibles : un dossier de `diagrams/` porteur d'un `.html` ou d'un `.svg`. */
export function listDiagrams(diagramsDir: string): DiagramEntry[] {
  if (!existsSync(diagramsDir)) return [];
  return readdirSync(diagramsDir)
    .filter((d) => statSync(join(diagramsDir, d)).isDirectory())
    .map((slug) => {
      const dir = join(diagramsDir, slug);
      const files = readdirSync(dir);
      // une page interactive prime sur l'image : c'est la vue la plus riche
      const entry = files.find((f) => f.endsWith('.html')) ?? files.find((f) => f.endsWith('.svg')) ?? '';
      // titre lisible pour le menu : balayage du meta.yaml (title: ou titre:), repli slug
      const metaPath = join(dir, 'meta.yaml');
      const meta = existsSync(metaPath) ? readFileSync(metaPath, 'utf8') : '';
      const title = readMetaTitle(meta) ?? slug;
      const categorie = readMetaCategorie(meta) ?? 'autres';
      return { slug, entry, title, categorie };
    })
    .filter((d) => d.entry !== '')
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Le fichier de données qu'une page charge (vues générées, ADR-0055), ou `null`. */
function dataFileOf(slug: string, entry: string) {
  return DATA_VIEWS.find((v) => v.page === `diagrams/${slug}/${entry}`) ?? null;
}

/** La liste publiée par `ezk board maps --json`. */
export function methodMapsData(diagramsDir: string = METHOD_DIAGRAMS): MapsContract {
  return {
    schema_version: MAPS_SCHEMA_VERSION,
    documents: listDiagrams(diagramsDir)
      .filter((d) => !PAGES_PORTEES.includes(d.slug))
      .map((d) => ({
        id: d.slug,
        titre: d.title,
        type: d.entry.endsWith('.svg') ? ('svg' as const) : ('html' as const),
        fichier: d.entry,
        donnees: (() => {
          const view = dataFileOf(d.slug, d.entry);
          return view ? basename(view.out) : null;
        })(),
      })),
  };
}

/**
 * Le contenu d'un fichier d'un document : son fichier principal, lu sur le disque, ou ses données,
 * calculées à l'instant. `null` pour tout autre nom : rien d'autre n'est servi.
 */
export function methodMapFile(id: string, nom: string, diagramsDir: string = METHOD_DIAGRAMS): string | null {
  const doc = methodMapsData(diagramsDir).documents.find((d) => d.id === id);
  if (!doc) return null;
  if (nom === doc.fichier) return readFileSync(join(diagramsDir, id, doc.fichier), 'utf8');
  if (nom === doc.donnees) return dataFileOf(id, doc.fichier)?.build(METHOD_ROOT) ?? null;
  return null;
}
