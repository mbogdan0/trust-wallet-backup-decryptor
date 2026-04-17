import { build } from 'esbuild';
import fs from 'node:fs/promises';

import {
  ARTIFACT_DIR,
  ARTIFACT_FILE,
  ARTIFACT_PATH,
  STALE_ARTIFACT_FILES,
  assertInlineScriptAllowedByCsp,
  assertOfflineHtml,
  assertParsableInlineScript,
  sha256Base64,
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
const scriptSha256 = sha256Base64(js);
const csp = `default-src 'none'; script-src 'sha256-${scriptSha256}'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>Trust Wallet Backup Decryptor</title>
</head>
<body>
  <script>${js}</script>
</body>
</html>`;

assertOfflineHtml(html);
assertInlineScriptAllowedByCsp(html);
assertParsableInlineScript(html);

await fs.mkdir(ARTIFACT_DIR, { recursive: true });
await fs.writeFile(ARTIFACT_PATH, html, 'utf8');
await Promise.all(STALE_ARTIFACT_FILES.map(file => fs.rm(file, { force: true })));

const sha256 = sha256Hex(html);
console.log(`Built: ${ARTIFACT_FILE}`);
console.log(`SHA-256: ${sha256}`);
