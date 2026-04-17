import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ARTIFACT_PATH,
  assertInlineScriptAllowedByCsp,
  assertOfflineHtml,
  assertParsableInlineScript,
  sha256Hex
} from './artifact-utils.mjs';

const execFileAsync = promisify(execFile);

async function buildAndHash() {
  await execFileAsync(process.execPath, ['build.mjs'], {
    cwd: process.cwd()
  });

  const html = await fs.readFile(ARTIFACT_PATH, 'utf8');
  assertOfflineHtml(html);
  assertInlineScriptAllowedByCsp(html);
  assertParsableInlineScript(html);

  return sha256Hex(html);
}

const firstHash = await buildAndHash();
const secondHash = await buildAndHash();

if (firstHash !== secondHash) {
  throw new Error(`Artifact hash changed between builds: ${firstHash} != ${secondHash}`);
}

console.log(`Artifact reproducibility OK: ${secondHash}`);
