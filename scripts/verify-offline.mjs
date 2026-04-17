import fs from 'node:fs/promises';
import {
  ALL_ARTIFACT_PATHS,
  ARTIFACT_FILE,
  PAGES_ARTIFACT_FILE,
  assertInlineScriptAllowedByCsp,
  assertOfflineHtml
} from './artifact-utils.mjs';

const [localHtml, pagesHtml] = await Promise.all(
  ALL_ARTIFACT_PATHS.map(path => fs.readFile(path, 'utf8'))
);

assertOfflineHtml(localHtml);
assertOfflineHtml(pagesHtml);
assertInlineScriptAllowedByCsp(localHtml);
assertInlineScriptAllowedByCsp(pagesHtml);

if (localHtml !== pagesHtml) {
  throw new Error(`${ARTIFACT_FILE} and ${PAGES_ARTIFACT_FILE} differ`);
}

console.log('Offline invariant OK');
