import fs from 'node:fs/promises';
import { buildArtifact } from '../build.mjs';
import { ARTIFACT_PATH, assertArtifactHtml, sha256Hex } from './artifact-utils.mjs';

async function buildAndHash() {
  const { sha256: buildSha256 } = await buildArtifact();

  const html = await fs.readFile(ARTIFACT_PATH, 'utf8');
  assertArtifactHtml(html);

  const fileSha256 = sha256Hex(html);
  if (fileSha256 !== buildSha256) {
    throw new Error(`Artifact hash mismatch after build: ${fileSha256} != ${buildSha256}`);
  }

  return fileSha256;
}

const firstHash = await buildAndHash();
const secondHash = await buildAndHash();

if (firstHash !== secondHash) {
  throw new Error(`Artifact hash changed between builds: ${firstHash} != ${secondHash}`);
}

console.log(`Artifact reproducibility OK: ${secondHash}`);
