import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ARTIFACT_PATH,
  PAGES_ARTIFACT_FILE,
  PAGES_ARTIFACT_PATH,
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

  const [html, pagesHtml] = await Promise.all([
    fs.readFile(ARTIFACT_PATH, 'utf8'),
    fs.readFile(PAGES_ARTIFACT_PATH, 'utf8')
  ]);

  assertOfflineHtml(html);
  assertOfflineHtml(pagesHtml);
  assertInlineScriptAllowedByCsp(html);
  assertInlineScriptAllowedByCsp(pagesHtml);
  assertParsableInlineScript(html);
  assertParsableInlineScript(pagesHtml);

  if (html !== pagesHtml) {
    throw new Error(`${PAGES_ARTIFACT_FILE} does not match the canonical local artifact`);
  }

  return sha256Hex(html);
}

const firstHash = await buildAndHash();
const secondHash = await buildAndHash();

if (firstHash !== secondHash) {
  throw new Error(`Artifact hash changed between builds: ${firstHash} != ${secondHash}`);
}

console.log(`Artifact reproducibility OK: ${secondHash}`);
