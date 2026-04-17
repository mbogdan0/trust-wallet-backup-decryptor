import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = join(ROOT_DIR, 'dist');

export const ARTIFACT_FILE = 'index.html';
export const ARTIFACT_DIR = DIST_DIR;
export const ARTIFACT_PATH = join(ARTIFACT_DIR, ARTIFACT_FILE);
export const STALE_ARTIFACT_FILES = [
  join(ROOT_DIR, 'index.html'),
  join(ROOT_DIR, 'keystore-v3-decryptor.html'),
  join(DIST_DIR, 'trust-wallet-backup-decryptor.html')
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

export function sha256Base64(content) {
  return crypto.createHash('sha256').update(content).digest('base64');
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

  return scriptContent;
}

export function extractCspMetaContent(html) {
  const metaTags = [...html.matchAll(/<meta\b([^>]*)>/gi)];

  for (const [, attributes] of metaTags) {
    if (!/\bhttp-equiv\s*=\s*(["'])Content-Security-Policy\1/i.test(attributes)) {
      continue;
    }

    const contentMatch = attributes.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!contentMatch) {
      throw new Error('Content-Security-Policy meta tag is missing content=');
    }

    return contentMatch[2];
  }

  throw new Error('Content-Security-Policy meta tag not found');
}

export function assertInlineScriptAllowedByCsp(html) {
  const script = extractInlineScript(html);
  const csp = extractCspMetaContent(html);
  const directives = csp
    .split(';')
    .map(directive => directive.trim())
    .filter(Boolean);
  const scriptDirective = directives.find(directive => directive.toLowerCase().startsWith('script-src '));

  if (!scriptDirective) {
    throw new Error('Content-Security-Policy is missing script-src');
  }

  const sources = scriptDirective.split(/\s+/).slice(1);
  const expectedSource = `'sha256-${sha256Base64(script)}'`;

  if (sources.includes("'unsafe-inline'")) {
    throw new Error("script-src must not include 'unsafe-inline'");
  }

  if (!sources.includes(expectedSource)) {
    throw new Error(`script-src does not allow the inline script via ${expectedSource}`);
  }
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
