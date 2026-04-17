import { build } from 'esbuild';
import fs from 'node:fs/promises';

import {
  ARTIFACT_FILE,
  ARTIFACT_PATH,
  STALE_ARTIFACT_FILES,
  assertOfflineHtml,
  assertParsableInlineScript,
  sha256Hex
} from './scripts/artifact-utils.mjs';

const result = await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  write: false,
  minify: true,
  legalComments: 'none',
  platform: 'browser',
  format: 'iife'
});

const js = result.outputFiles[0].text;

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'" />
  <title>Trust Wallet Backup Decryptor</title>
</head>
<body>
  <script>${js}</script>
</body>
</html>`;

assertOfflineHtml(html);
assertParsableInlineScript(html);

await fs.mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await fs.writeFile(ARTIFACT_PATH, html, 'utf8');
await Promise.all(STALE_ARTIFACT_FILES.map(file => fs.rm(file, { force: true })));

const sha256 = sha256Hex(html);
console.log(`Built: ${ARTIFACT_FILE}`);
console.log(`SHA-256: ${sha256}`);
