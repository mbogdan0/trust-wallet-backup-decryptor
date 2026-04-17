import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = join(ROOT_DIR, 'dist');

export const ARTIFACT_FILE = 'trust-wallet-backup-decryptor.html';
export const ARTIFACT_DIR = DIST_DIR;
export const ARTIFACT_PATH = join(ARTIFACT_DIR, ARTIFACT_FILE);
export const STALE_ARTIFACT_FILES = [
  join(ROOT_DIR, 'index.html'),
  join(ROOT_DIR, 'keystore-v3-decryptor.html')
];

const OFFLINE_PATTERNS = [
  { pattern: /https?:\/\//i, reason: 'HTTP URLs are not allowed in the final artifact' },
  { pattern: /<script\b[^>]*\bsrc\s*=/i, reason: 'External script tags are not allowed' },
  { pattern: /<link\b[^>]*\bhref\s*=/i, reason: 'External stylesheet links are not allowed' },
  { pattern: /<(?:img|iframe|audio|video|source)\b/i, reason: 'Embedded resource tags are not allowed' },
  { pattern: /\bfetch\s*\(/, reason: 'fetch() is not allowed in the offline artifact' },
  { pattern: /\bXMLHttpRequest\b/, reason: 'XMLHttpRequest is not allowed in the offline artifact' },
  { pattern: /\bnavigator\.sendBeacon\b/, reason: 'sendBeacon() is not allowed in the offline artifact' },
  { pattern: /\bWebSocket\b/, reason: 'WebSocket is not allowed in the offline artifact' },
  { pattern: /\bEventSource\b/, reason: 'EventSource is not allowed in the offline artifact' },
  { pattern: /\bnew\s+(?:Shared)?Worker\b/, reason: 'Web workers are not allowed in the offline artifact' },
  { pattern: /\bimportScripts\b/, reason: 'importScripts() is not allowed in the offline artifact' },
  { pattern: /\bimport\s*\(/, reason: 'Dynamic import() is not allowed in the offline artifact' }
];

export function sha256Hex(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function extractInlineScript(html) {
  const matches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one inline <script>, found ${matches.length}`);
  }

  const [, attributes, scriptContent] = matches[0];
  if (/\bsrc\s*=/i.test(attributes)) {
    throw new Error('Inline script must not use src=');
  }

  return scriptContent.trim();
}

export function assertOfflineHtml(html) {
  extractInlineScript(html);

  for (const { pattern, reason } of OFFLINE_PATTERNS) {
    if (pattern.test(html)) {
      throw new Error(reason);
    }
  }
}

export function assertParsableInlineScript(html) {
  const script = extractInlineScript(html);
  new Function(script);
}
