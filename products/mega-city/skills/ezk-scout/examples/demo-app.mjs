#!/usr/bin/env node
// demo-app.mjs — app de DÉMONSTRATION d'ezk-scout (fiche 20260910165637000). Zéro dépendance.
//
// Elle contient des DÉFAUTS VOLONTAIRES et CONNUS : c'est la cible d'une passe de chasse aux
// bugs, pas une app à corriger. Ils rejouent les trouvailles du run samplerz du 2026-09-10
// (export qui plante sur un BPM ≤ 0 ou un dossier non inscriptible, bornes de recadrage non
// validées). `scripts/test-demo-app.sh` vérifie qu'ils sont toujours là : sans eux, l'exemple
// `demo-report.md` mentirait.
//
//   DEMO_STATE_DIR=/tmp/demo-etat PORT=4173 node demo-app.mjs
//   (PORT=0 : port libre choisi par le système, imprimé au démarrage)
//
// ÉTAT : l'app écrit ses exports sous DEMO_STATE_DIR (défaut : ~/.demo-app, donc le VRAI HOME
// de l'utilisateur). Une passe ezk-scout pointe toujours cette variable vers un dossier tmp.
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STATE = process.env.DEMO_STATE_DIR ?? join(homedir(), '.demo-app');

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
  });
}

const routes = {
  'GET /health': async () => ({ status: 200, body: { ok: true } }),

  // DÉFAUT CONNU n°1 — bpm ≤ 0 : `new Array(Infinity)` lève une RangeError → 500 au lieu de 400.
  // DÉFAUT CONNU n°2 — `dir` non inscriptible : l'erreur d'écriture remonte en 500 au lieu de 4xx.
  'POST /export': async (req) => {
    const { bpm, dir = join(STATE, 'exports') } = await readJson(req);
    const grid = new Array(Math.round(60000 / bpm)).fill(0);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'export.txt'), `bpm=${bpm} cells=${grid.length}\n`);
    return { status: 200, body: { file: join(dir, 'export.txt') } };
  },

  // DÉFAUT CONNU n°3 — aucune validation : fin avant début, valeurs négatives ou absentes → 200.
  'POST /crop': async (req) => {
    const { start, end } = await readJson(req);
    return { status: 200, body: { duration: end - start } };
  },
};

const server = createServer(async (req, res) => {
  const handler = routes[`${req.method} ${req.url}`];
  const { status, body } = handler
    ? await handler(req).catch(() => ({ status: 500, body: null })) // 500 nu : aucune explication
    : { status: 404, body: { error: 'not found' } };
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === null ? '' : JSON.stringify(body));
});

server.listen(Number(process.env.PORT ?? 4173), '127.0.0.1', () => {
  console.log(`demo-app listening on ${server.address().port} (état : ${STATE})`);
});
