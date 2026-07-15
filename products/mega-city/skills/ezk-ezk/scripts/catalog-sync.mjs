#!/usr/bin/env node
// catalog-sync.mjs — garde le catalogue skills/README.md à jour au déploiement d'un skill
// (ADR-0001 : « le script range »). Appelé best-effort par deploy.sh après le symlink.
//
// NON-DESTRUCTIF & idempotent : n'AJOUTE une ligne de tableau que si le skill est ABSENT
// du catalogue ; ne réécrit ni ne réordonne jamais les lignes existantes (les « rôle »
// rédigés à la main sont préservés). No-op silencieux si le README n'a pas de tableau
// de catalogue reconnaissable (portabilité : deploy.sh peut viser un autre dossier).
//
// usage : node catalog-sync.mjs <SKILL.md> <README.md>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const [, , skillMd, readmePath] = process.argv;
if (!skillMd || !readmePath || !existsSync(skillMd) || !existsSync(readmePath)) process.exit(0);

const src = readFileSync(skillMd, 'utf8');
const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fm) process.exit(0);
const fmLines = fm[1].split(/\r?\n/);

// --- name (slug simple) ---
let name = '';
for (const l of fmLines) {
  const m = l.match(/^name:\s*(.+)$/);
  if (m) { name = m[1].trim(); break; }
}
if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) process.exit(0);

// --- description : supporte le scalaire folded/literal multi-lignes (>-, |, …) ---
let desc = '';
for (let i = 0; i < fmLines.length; i++) {
  const m = fmLines[i].match(/^description:\s*(.*)$/);
  if (!m) continue;
  const inline = m[1].trim();
  if (inline && !/^[>|][-+]?$/.test(inline)) { desc = inline; break; }
  const buf = [];
  for (let j = i + 1; j < fmLines.length; j++) {
    if (/^\s+\S/.test(fmLines[j])) buf.push(fmLines[j].trim());
    else if (fmLines[j].trim() === '') continue;
    else break;
  }
  desc = buf.join(' ');
  break;
}
// rôle = 1re phrase de la description, bornée, échappée pour le tableau markdown
let role = (desc.split(/(?<=[.!?])\s/)[0] || desc).replace(/\s+/g, ' ').trim();
if (role.length > 140) role = `${role.slice(0, 137).replace(/\s+\S*$/, '')}…`;
role = role.replace(/\|/g, '\\|').trim() || '_(rôle à compléter)_';

// --- déjà catalogué ? (1re colonne | `name` |) → idempotent ---
const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const readme = readFileSync(readmePath, 'utf8');
if (new RegExp(`^\\|\\s*\`${esc}\`\\s*\\|`, 'm').test(readme)) process.exit(0);

// --- insère la ligne après la dernière ligne de tableau reconnue ---
const lines = readme.split('\n');
let lastRow = -1;
for (let i = 0; i < lines.length; i++) if (/^\|\s*`[a-z0-9]/.test(lines[i])) lastRow = i;
if (lastRow === -1) process.exit(0); // pas de tableau de catalogue → no-op

lines.splice(lastRow + 1, 0, `| \`${name}\` | 🆕 auto (deploy) | ${role} |`);
writeFileSync(readmePath, lines.join('\n'));
process.stderr.write(`catalog: ligne ajoutée pour '${name}' → ${readmePath} (à curer : état/rôle)\n`);
