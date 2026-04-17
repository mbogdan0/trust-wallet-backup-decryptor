import fs from 'node:fs/promises';
import { ARTIFACT_PATH, assertArtifactHtml } from './artifact-utils.mjs';

const html = await fs.readFile(ARTIFACT_PATH, 'utf8');
assertArtifactHtml(html);

console.log('Offline invariant OK');
