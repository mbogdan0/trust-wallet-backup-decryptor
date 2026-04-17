import fs from 'node:fs/promises';
import {
  ARTIFACT_PATH,
  assertInlineScriptAllowedByCsp,
  assertOfflineHtml
} from './artifact-utils.mjs';

const html = await fs.readFile(ARTIFACT_PATH, 'utf8');
assertOfflineHtml(html);
assertInlineScriptAllowedByCsp(html);

console.log('Offline invariant OK');
