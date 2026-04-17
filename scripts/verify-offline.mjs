import fs from 'node:fs/promises';
import { ARTIFACT_PATH, assertOfflineHtml } from './artifact-utils.mjs';

const html = await fs.readFile(ARTIFACT_PATH, 'utf8');
assertOfflineHtml(html);
console.log('Offline invariant OK');
