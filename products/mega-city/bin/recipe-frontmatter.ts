#!/usr/bin/env tsx
/**
 * recipe-frontmatter — imprime le front-matter d'un brouillon de recette, ÉMIS par la lib YAML.
 * Appelé par `ezk-chef-extract.sh` (règle `development/yaml-emission-via-lib` : jamais de
 * concaténation de chaînes pour écrire du front-matter).
 *
 *   tsx bin/recipe-frontmatter.ts --id <id> --title <titre> --source <note> --today <AAAA-MM-JJ>
 *
 * Le cœur est pur (src/core/recipe-frontmatter.ts) ; ce script n'est que le bord I/O.
 */
import { recipeFrontMatter } from '../src/core/recipe-frontmatter.js';

const FLAGS = ['--id', '--title', '--source', '--today'] as const;
const usage = `usage : recipe-frontmatter.ts ${FLAGS.map((f) => `${f} <valeur>`).join(' ')}`;

const args = process.argv.slice(2);
const values = new Map<string, string>();
for (let i = 0; i < args.length; i += 2) {
  const value = args[i + 1];
  if (!(FLAGS as readonly string[]).includes(args[i]) || value === undefined) {
    console.error(`✗ ${usage}`);
    process.exit(2);
  }
  values.set(args[i], value);
}
const missing = FLAGS.filter((flag) => !values.has(flag));
if (missing.length > 0) {
  console.error(`✗ option manquante : ${missing.join(', ')}\n  ${usage}`);
  process.exit(2);
}

process.stdout.write(
  recipeFrontMatter({
    id: values.get('--id') as string,
    title: values.get('--title') as string,
    source: values.get('--source') as string,
    today: values.get('--today') as string,
  }),
);
