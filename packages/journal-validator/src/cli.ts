#!/usr/bin/env node
import type { Notice, ValidationResult, Violation } from './types.js';
import { validateRun } from './validateRun.js';

/**
 * Neutralise les caractères de contrôle (ESC ANSI compris) avant impression.
 * Le journal est une donnée externe : un "type" ou un champ hostile ne doit
 * jamais pouvoir manipuler le terminal (effacer des lignes, déplacer le
 * curseur) et rendre le rapport trompeur.
 */
function sanitizeControlChars(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: c'est le but — on neutralise les octets de contrôle 0x00-0x1f et 0x7f
  return text.replace(/[\x00-\x1f\x7f]/g, '·');
}

function formatEntry(prefix: string, entry: Violation | Notice): string {
  const code = sanitizeControlChars(entry.code);
  const message = sanitizeControlChars(entry.message);
  const location =
    entry.seq !== undefined
      ? `seq=${entry.seq}`
      : entry.line !== undefined
        ? `ligne=${entry.line}`
        : '';
  const suffix = location ? ` [${location}]` : '';
  return `${prefix} ${code}: ${message}${suffix}`;
}

export function formatReport(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.violations.length === 0) {
    lines.push('Aucune violation.');
  } else {
    lines.push(`${result.violations.length} violation(s) :`);
    for (const violation of result.violations) {
      lines.push(`  ${formatEntry('✗', violation)}`);
    }
  }

  if (result.notices.length > 0) {
    lines.push(`${result.notices.length} notice(s) :`);
    for (const notice of result.notices) {
      lines.push(`  ${formatEntry('ℹ', notice)}`);
    }
  }

  lines.push(`État final de la machine à états : ${result.state}`);
  lines.push(result.summary);

  return lines.join('\n');
}

function main(argv: string[]): number {
  const [command, runDir] = argv;

  if (command !== 'validate' || !runDir) {
    console.error('Usage: journal-validator validate <dossier-de-run>');
    return 2;
  }

  const result = validateRun(runDir);
  console.log(formatReport(result));
  return result.code;
}

process.exitCode = main(process.argv.slice(2));
